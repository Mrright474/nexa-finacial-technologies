import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
