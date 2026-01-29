import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface LoginNotificationRequest {
  userId: string;
  email: string;
  deviceInfo: string;
  browser: string;
  os: string;
  ipAddress?: string;
  timestamp: string;
}

interface SuspiciousActivity {
  isNewDevice: boolean;
  isNewIpAddress: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  reasons: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, email, deviceInfo, browser, os, ipAddress, timestamp }: LoginNotificationRequest = await req.json();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Check for suspicious activity
    const deviceFingerprint = `${browser}-${os}`;
    const { data: existingLogins } = await supabase
      .from("login_activity")
      .select("id, device_info, ip_address, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(100);

    // Analyze login patterns
    const isNewDevice = !existingLogins?.some(
      login => login.device_info === deviceFingerprint
    );
    
    const isNewIpAddress = ipAddress ? !existingLogins?.some(
      login => login.ip_address === ipAddress
    ) : false;

    // Calculate risk level based on suspicious indicators
    const suspiciousActivity: SuspiciousActivity = {
      isNewDevice,
      isNewIpAddress,
      riskLevel: 'low',
      reasons: [],
    };

    if (isNewDevice) {
      suspiciousActivity.reasons.push('Login from a new device');
    }
    if (isNewIpAddress && ipAddress) {
      suspiciousActivity.reasons.push('Login from a new IP address/location');
    }

    // Determine risk level
    if (isNewDevice && isNewIpAddress) {
      suspiciousActivity.riskLevel = 'high';
    } else if (isNewDevice || isNewIpAddress) {
      suspiciousActivity.riskLevel = 'medium';
    }

    // Check for rapid logins from different IPs (potential credential stuffing)
    const recentLogins = existingLogins?.filter(login => {
      const loginTime = new Date(login.created_at).getTime();
      const now = new Date().getTime();
      return (now - loginTime) < 3600000; // Last hour
    }) || [];

    const uniqueRecentIps = new Set(recentLogins.map(l => l.ip_address));
    if (uniqueRecentIps.size >= 3) {
      suspiciousActivity.riskLevel = 'high';
      suspiciousActivity.reasons.push('Multiple login attempts from different locations in short time');
    }

    // Record the login activity
    const { error: insertError } = await supabase.from("login_activity").insert({
      user_id: userId,
      device_info: deviceFingerprint,
      browser,
      os,
      ip_address: ipAddress || "Unknown",
      is_new_device: isNewDevice,
    });

    if (insertError) {
      console.error("Failed to insert login activity:", insertError);
    }

    // Send email notification for suspicious activity
    const shouldSendEmail = (isNewDevice || isNewIpAddress) && resendApiKey;
    
    if (shouldSendEmail) {
      const riskColors = {
        low: '#4ade80',
        medium: '#fbbf24',
        high: '#ef4444',
      };

      const riskLabels = {
        low: 'Low Risk',
        medium: 'Medium Risk - Please Verify',
        high: 'High Risk - Action Required',
      };

      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333; }
            .logo { font-size: 28px; font-weight: bold; color: #d4af37; margin-bottom: 30px; }
            .alert-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; margin-bottom: 20px; background: ${riskColors[suspiciousActivity.riskLevel]}20; color: ${riskColors[suspiciousActivity.riskLevel]}; border: 1px solid ${riskColors[suspiciousActivity.riskLevel]}40; }
            .alert-icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
            p { color: #a0a0a0; line-height: 1.6; margin-bottom: 15px; }
            .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 25px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); display: flex; justify-content: space-between; }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #888; }
            .detail-value { color: #fff; font-weight: 500; }
            .reasons { background: rgba(255,255,255,0.03); border-radius: 8px; padding: 15px; margin: 20px 0; }
            .reason-item { color: ${riskColors[suspiciousActivity.riskLevel]}; padding: 5px 0; font-size: 14px; }
            .warning { background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 15px; margin-top: 25px; }
            .warning p { color: #d4af37; margin: 0; font-size: 14px; }
            .danger-warning { background: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
            .danger-warning p { color: #ef4444; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">NEXA</div>
              <div class="alert-badge">${riskLabels[suspiciousActivity.riskLevel]}</div>
              <div class="alert-icon">${suspiciousActivity.riskLevel === 'high' ? '🚨' : suspiciousActivity.riskLevel === 'medium' ? '⚠️' : '🔐'}</div>
              <h1>${suspiciousActivity.riskLevel === 'high' ? 'Suspicious Login Alert' : 'Security Notice: New Login Detected'}</h1>
              <p>We detected activity on your NEXA account that we wanted to bring to your attention:</p>
              
              <div class="reasons">
                ${suspiciousActivity.reasons.map(reason => `<div class="reason-item">• ${reason}</div>`).join('')}
              </div>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Browser</span>
                  <span class="detail-value">${browser}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Operating System</span>
                  <span class="detail-value">${os}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time</span>
                  <span class="detail-value">${new Date(timestamp).toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'long' })}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">IP Address</span>
                  <span class="detail-value">${ipAddress || 'Unknown'}</span>
                </div>
              </div>
              
              <div class="warning ${suspiciousActivity.riskLevel === 'high' ? 'danger-warning' : ''}">
                <p>${suspiciousActivity.riskLevel === 'high' 
                  ? '🚨 This login has multiple risk indicators. If this wasn\'t you, immediately change your password and contact support.' 
                  : '⚠️ If this wasn\'t you, please secure your account by changing your password and enabling two-factor authentication.'}</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated security notification from NEXA Financial Technologies.</p>
              <p style="margin-top: 10px; font-size: 11px; color: #555;">
                You received this email because security alerts are enabled for your account.
              </p>
            </div>
          </div>
        </body>
        </html>
      `;

      const subject = suspiciousActivity.riskLevel === 'high' 
        ? '🚨 Suspicious Login Alert - NEXA' 
        : suspiciousActivity.riskLevel === 'medium'
          ? '⚠️ New Login from Unknown Device/Location - NEXA'
          : 'Security Notice: New Device Login - NEXA';

      // Send email using Resend REST API
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "NEXA Security <security@resend.dev>",
          to: [email],
          subject,
          html: emailHtml,
        }),
      });

      if (resendResponse.ok) {
        console.log(`Security notification email sent to ${email} (Risk: ${suspiciousActivity.riskLevel})`);
      } else {
        console.error("Failed to send email:", await resendResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        suspiciousActivity,
        emailSent: shouldSendEmail,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-login-notification:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);