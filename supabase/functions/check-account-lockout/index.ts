import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface LockoutCheckRequest {
  email: string;
}

interface FailedLoginRequest {
  email: string;
  ipAddress?: string;
  userAgent?: string;
  location?: string;
}

interface ClearAttemptsRequest {
  email: string;
}

interface IpCheckRequest {
  ipAddress: string;
}

interface IpUnblockRequest {
  ipAddress: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    
    const url = new URL(req.url);
    const action = url.searchParams.get('action') || 'check';
    
    const body = await req.json();
    
    console.log(`Account lockout action: ${action}`, { email: body.email, ipAddress: body.ipAddress });

    // Check if IP is blocked
    if (action === 'check-ip') {
      const { ipAddress } = body as IpCheckRequest;
      
      if (!ipAddress) {
        return new Response(
          JSON.stringify({ error: 'IP address is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('check_ip_block', {
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('Error checking IP block:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to check IP status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const blockInfo = data?.[0] || { is_blocked: false, blocked_until: null, reason: null };
      
      console.log('IP block check result:', blockInfo);

      return new Response(
        JSON.stringify({
          isBlocked: blockInfo.is_blocked,
          blockedUntil: blockInfo.blocked_until,
          reason: blockInfo.reason,
          remainingMinutes: blockInfo.is_blocked 
            ? Math.ceil((new Date(blockInfo.blocked_until).getTime() - Date.now()) / 60000)
            : 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Unblock an IP
    if (action === 'unblock-ip') {
      const { ipAddress } = body as IpUnblockRequest;
      
      if (!ipAddress) {
        return new Response(
          JSON.stringify({ error: 'IP address is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.rpc('clear_ip_block', {
        p_ip_address: ipAddress
      });

      if (error) {
        console.error('Error unblocking IP:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to unblock IP' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Unblocked IP: ${ipAddress}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'check') {
      // Check if account is locked
      const { email } = body as LockoutCheckRequest;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { data, error } = await supabase.rpc('check_account_lockout', {
        p_email: email.toLowerCase()
      });

      if (error) {
        console.error('Error checking lockout:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to check account status' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const lockoutInfo = data?.[0] || { is_locked: false, locked_until: null, reason: null };
      
      console.log('Lockout check result:', lockoutInfo);

      return new Response(
        JSON.stringify({
          isLocked: lockoutInfo.is_locked,
          lockedUntil: lockoutInfo.locked_until,
          reason: lockoutInfo.reason,
          remainingMinutes: lockoutInfo.is_locked 
            ? Math.ceil((new Date(lockoutInfo.locked_until).getTime() - Date.now()) / 60000)
            : 0
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'record-failure') {
      // Record a failed login attempt
      const { email, ipAddress, userAgent, location } = body as FailedLoginRequest;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Record account-based failure
      const { data, error } = await supabase.rpc('record_failed_login', {
        p_email: email.toLowerCase(),
        p_ip_address: ipAddress || null,
        p_user_agent: userAgent || null,
        p_location: location || null
      });

      if (error) {
        console.error('Error recording failed login:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to record login attempt' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const result = data?.[0] || { should_lock: false, attempt_count: 0, unique_ips: 0 };
      
      console.log('Failed login recorded:', result);

      // Also check IP-based blocking
      let ipBlocked = false;
      if (ipAddress) {
        const { data: ipData, error: ipError } = await supabase.rpc('record_ip_failure', {
          p_ip_address: ipAddress,
          p_email: email.toLowerCase()
        });

        if (!ipError && ipData?.[0]?.should_block) {
          ipBlocked = true;
          console.log(`IP ${ipAddress} has been blocked after ${ipData[0].attempt_count} failed attempts targeting ${ipData[0].unique_emails} accounts`);
          
          // Send IP block notification to admin (could be enhanced)
          try {
            const resendApiKey = Deno.env.get('RESEND_API_KEY');
            if (resendApiKey) {
              // Get admin emails for notification
              const { data: admins } = await supabase
                .from('user_roles')
                .select('user_id')
                .eq('role', 'admin');
              
              if (admins && admins.length > 0) {
                const { data: adminProfiles } = await supabase
                  .from('profiles')
                  .select('email')
                  .in('user_id', admins.map(a => a.user_id));
                
                const adminEmails = adminProfiles?.map(p => p.email) || [];
                
                if (adminEmails.length > 0) {
                  await fetch('https://api.resend.com/emails', {
                    method: 'POST',
                    headers: {
                      'Content-Type': 'application/json',
                      'Authorization': `Bearer ${resendApiKey}`,
                    },
                    body: JSON.stringify({
                      from: 'NEXA Security <security@resend.dev>',
                      to: adminEmails,
                      subject: '⚠️ IP Address Blocked - Potential Attack Detected',
                      html: `
                        <!DOCTYPE html>
                        <html>
                        <head>
                          <meta charset="utf-8">
                          <meta name="viewport" content="width=device-width, initial-scale=1.0">
                        </head>
                        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a;">
                          <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
                            <div style="text-align: center; margin-bottom: 24px;">
                              <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #f59e0b, #d97706); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                                <span style="font-size: 32px;">🛡️</span>
                              </div>
                              <h1 style="color: #f59e0b; margin: 0; font-size: 24px;">IP Address Blocked</h1>
                            </div>
                            
                            <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid rgba(245, 158, 11, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                              <p style="color: #fcd34d; margin: 0 0 12px 0; font-size: 16px;">
                                <strong>Attack Detection Alert:</strong> An IP address has been automatically blocked due to suspicious activity.
                              </p>
                              <ul style="color: #d1d5db; margin: 0; padding-left: 20px;">
                                <li style="margin-bottom: 8px;"><strong>IP Address:</strong> ${ipAddress}</li>
                                <li style="margin-bottom: 8px;"><strong>Failed attempts:</strong> ${ipData[0].attempt_count}</li>
                                <li style="margin-bottom: 8px;"><strong>Unique accounts targeted:</strong> ${ipData[0].unique_emails}</li>
                                <li><strong>Block duration:</strong> 1 hour</li>
                              </ul>
                            </div>
                            
                            <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                              This is an automated security notification from NEXA Financial Technologies.
                              <br>You can manage blocked IPs in the admin security dashboard.
                            </p>
                          </div>
                        </body>
                        </html>
                      `,
                    }),
                  });
                  console.log('Admin notification sent for IP block');
                }
              }
            }
          } catch (emailError) {
            console.error('Error sending IP block notification:', emailError);
          }
        }
      }

      // If account was just locked, send notification email
      if (result.should_lock) {
        console.log(`Account ${email} has been locked after ${result.attempt_count} failed attempts from ${result.unique_ips} IPs`);
        
        // Send lockout notification email
        try {
          const resendApiKey = Deno.env.get('RESEND_API_KEY');
          if (resendApiKey) {
            const emailResponse = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${resendApiKey}`,
              },
              body: JSON.stringify({
                from: 'NEXA Security <security@resend.dev>',
                to: [email],
                subject: '🔒 Account Temporarily Locked - NEXA',
                html: `
                  <!DOCTYPE html>
                  <html>
                  <head>
                    <meta charset="utf-8">
                    <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  </head>
                  <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background-color: #0a0a0a;">
                    <div style="max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 32px; border: 1px solid #333;">
                      <div style="text-align: center; margin-bottom: 24px;">
                        <div style="width: 64px; height: 64px; background: linear-gradient(135deg, #ef4444, #dc2626); border-radius: 50%; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
                          <span style="font-size: 32px;">🔒</span>
                        </div>
                        <h1 style="color: #ef4444; margin: 0; font-size: 24px;">Account Temporarily Locked</h1>
                      </div>
                      
                      <div style="background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <p style="color: #fca5a5; margin: 0 0 12px 0; font-size: 16px;">
                          <strong>Security Alert:</strong> Your account has been temporarily locked due to multiple failed login attempts.
                        </p>
                        <ul style="color: #d1d5db; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 8px;"><strong>Failed attempts:</strong> ${result.attempt_count}</li>
                          <li style="margin-bottom: 8px;"><strong>Different locations:</strong> ${result.unique_ips}</li>
                          <li><strong>Lock duration:</strong> 30 minutes</li>
                        </ul>
                      </div>
                      
                      <div style="background: rgba(59, 130, 246, 0.1); border: 1px solid rgba(59, 130, 246, 0.3); border-radius: 12px; padding: 20px; margin-bottom: 24px;">
                        <h3 style="color: #60a5fa; margin: 0 0 12px 0;">What should you do?</h3>
                        <ul style="color: #d1d5db; margin: 0; padding-left: 20px;">
                          <li style="margin-bottom: 8px;">Wait 30 minutes before trying again</li>
                          <li style="margin-bottom: 8px;">If this wasn't you, change your password immediately</li>
                          <li style="margin-bottom: 8px;">Enable two-factor authentication for added security</li>
                          <li>Contact support if you need immediate assistance</li>
                        </ul>
                      </div>
                      
                      <p style="color: #9ca3af; font-size: 12px; text-align: center; margin: 0;">
                        This is an automated security notification from NEXA Financial Technologies.
                        <br>If you did not attempt to log in, please secure your account immediately.
                      </p>
                    </div>
                  </body>
                  </html>
                `,
              }),
            });
            
            if (!emailResponse.ok) {
              console.error('Failed to send lockout email:', await emailResponse.text());
            } else {
              console.log('Lockout notification email sent successfully');
            }
          }
        } catch (emailError) {
          console.error('Error sending lockout email:', emailError);
        }
      }

      return new Response(
        JSON.stringify({
          locked: result.should_lock,
          attemptCount: result.attempt_count,
          uniqueIps: result.unique_ips,
          remainingAttempts: Math.max(0, 5 - result.attempt_count),
          ipBlocked
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (action === 'clear') {
      // Clear failed attempts after successful login
      const { email } = body as ClearAttemptsRequest;
      
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email is required' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      const { error } = await supabase.rpc('clear_failed_attempts', {
        p_email: email.toLowerCase()
      });

      if (error) {
        console.error('Error clearing failed attempts:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to clear attempts' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      console.log(`Cleared failed attempts for ${email}`);

      return new Response(
        JSON.stringify({ success: true }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action. Use: check, check-ip, record-failure, clear, or unblock-ip' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in check-account-lockout function:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
