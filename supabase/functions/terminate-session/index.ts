import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Helper function to log admin actions
async function logAuditEvent(
  supabaseAdmin: any,
  adminUserId: string,
  actionType: string,
  targetUserId?: string,
  targetSessionId?: string,
  details?: Record<string, any>,
  ipAddress?: string
) {
  try {
    const { error } = await supabaseAdmin
      .from('audit_logs')
      .insert({
        admin_user_id: adminUserId,
        action_type: actionType,
        target_user_id: targetUserId || null,
        target_session_id: targetSessionId || null,
        details: details || null,
        ip_address: ipAddress || null,
      });
    
    if (error) {
      console.error('Failed to log audit event:', error);
    } else {
      console.log(`Audit logged: ${actionType} by ${adminUserId}`);
    }
  } catch (err) {
    console.error('Audit logging error:', err);
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    // Create regular client to verify admin status
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get client IP address
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 
                     req.headers.get('x-real-ip') || 
                     'unknown';

    const supabase = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } }
    });

    // Get the requesting user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.error('Auth error:', userError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is admin using the has_role function
    const { data: isAdmin, error: roleError } = await supabaseAdmin.rpc('has_role', {
      _user_id: user.id,
      _role: 'admin'
    });

    if (roleError || !isAdmin) {
      console.error('Role check error:', roleError);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { action, userId, sessionId } = await req.json();
    console.log(`Admin ${user.email} performing action: ${action} for user: ${userId}`);

    if (action === 'terminate_session') {
      // Terminate a specific session
      if (!sessionId) {
        return new Response(
          JSON.stringify({ error: 'Session ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get session info before deleting
      const { data: sessionInfo } = await supabaseAdmin
        .from('user_sessions')
        .select('*')
        .eq('id', sessionId)
        .single();

      // Delete the session record from our tracking table
      const { error: deleteError } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('id', sessionId);

      if (deleteError) {
        console.error('Delete session error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to terminate session' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Log the action
      await logAuditEvent(
        supabaseAdmin,
        user.id,
        'terminate_session',
        sessionInfo?.user_id,
        sessionId,
        { 
          device_info: sessionInfo?.device_info,
          session_ip: sessionInfo?.ip_address 
        },
        clientIp
      );

      console.log(`Session ${sessionId} terminated successfully`);
      return new Response(
        JSON.stringify({ success: true, message: 'Session terminated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'terminate_all_sessions') {
      // Terminate all sessions for a user
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get session count before deleting
      const { data: sessionsCount } = await supabaseAdmin
        .from('user_sessions')
        .select('id')
        .eq('user_id', userId);

      // Delete all session records for this user
      const { error: deleteError } = await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      if (deleteError) {
        console.error('Delete all sessions error:', deleteError);
        return new Response(
          JSON.stringify({ error: 'Failed to terminate sessions' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Sign out all sessions for this user using admin API
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, 'global');
      
      if (signOutError) {
        console.error('Sign out error:', signOutError);
        // Still return success as we deleted session records
      }

      // Log the action
      await logAuditEvent(
        supabaseAdmin,
        user.id,
        'terminate_all_sessions',
        userId,
        undefined,
        { sessions_terminated: sessionsCount?.length || 0 },
        clientIp
      );

      console.log(`All sessions for user ${userId} terminated successfully`);
      return new Response(
        JSON.stringify({ success: true, message: 'All sessions terminated' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'force_signout') {
      // Force sign out a specific user
      if (!userId) {
        return new Response(
          JSON.stringify({ error: 'User ID required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get user info for audit log
      const { data: targetUserInfo } = await supabaseAdmin
        .from('profiles')
        .select('email, first_name, last_name')
        .eq('user_id', userId)
        .single();

      // Sign out all sessions for this user
      const { error: signOutError } = await supabaseAdmin.auth.admin.signOut(userId, 'global');
      
      if (signOutError) {
        console.error('Force sign out error:', signOutError);
        return new Response(
          JSON.stringify({ error: 'Failed to force sign out user' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Also clear their session records
      await supabaseAdmin
        .from('user_sessions')
        .delete()
        .eq('user_id', userId);

      // Log the action
      await logAuditEvent(
        supabaseAdmin,
        user.id,
        'force_signout',
        userId,
        undefined,
        { 
          target_email: targetUserInfo?.email,
          target_name: `${targetUserInfo?.first_name || ''} ${targetUserInfo?.last_name || ''}`.trim()
        },
        clientIp
      );

      console.log(`User ${userId} forcefully signed out`);
      return new Response(
        JSON.stringify({ success: true, message: 'User signed out from all devices' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
