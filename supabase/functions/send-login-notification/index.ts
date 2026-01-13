import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

    // Check if this device has been seen before
    const deviceFingerprint = `${browser}-${os}`;
    const { data: existingLogins } = await supabase
      .from("login_activity")
      .select("id, device_info")
      .eq("user_id", userId)
      .limit(50);

    const isNewDevice = !existingLogins?.some(
      login => login.device_info === deviceFingerprint
    );

    // Record the login activity
    await supabase.from("login_activity").insert({
      user_id: userId,
      device_info: deviceFingerprint,
      browser,
      os,
      ip_address: ipAddress || "Unknown",
      is_new_device: isNewDevice,
    });

    // Only send email notification for new devices and if RESEND_API_KEY is configured
    if (isNewDevice && resendApiKey) {
      const emailHtml = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #0a0a0a; }
            .container { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
            .card { background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%); border-radius: 16px; padding: 40px; border: 1px solid #333; }
            .logo { font-size: 28px; font-weight: bold; color: #d4af37; margin-bottom: 30px; }
            .alert-icon { font-size: 48px; margin-bottom: 20px; }
            h1 { color: #ffffff; font-size: 24px; margin-bottom: 20px; }
            p { color: #a0a0a0; line-height: 1.6; margin-bottom: 15px; }
            .details { background: rgba(255,255,255,0.05); border-radius: 12px; padding: 20px; margin: 25px 0; }
            .detail-row { padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.1); }
            .detail-row:last-child { border-bottom: none; }
            .detail-label { color: #888; }
            .detail-value { color: #fff; font-weight: 500; }
            .warning { background: rgba(212, 175, 55, 0.1); border: 1px solid rgba(212, 175, 55, 0.3); border-radius: 8px; padding: 15px; margin-top: 25px; }
            .warning p { color: #d4af37; margin: 0; font-size: 14px; }
            .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="card">
              <div class="logo">NEXA</div>
              <div class="alert-icon">🔐</div>
              <h1>New Device Login Detected</h1>
              <p>We noticed a login to your NEXA account from a new device. Here are the details:</p>
              
              <div class="details">
                <div class="detail-row">
                  <span class="detail-label">Browser: </span>
                  <span class="detail-value">${browser}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Operating System: </span>
                  <span class="detail-value">${os}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Time: </span>
                  <span class="detail-value">${new Date(timestamp).toLocaleString()}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">IP Address: </span>
                  <span class="detail-value">${ipAddress || 'Unknown'}</span>
                </div>
              </div>
              
              <div class="warning">
                <p>⚠️ If this wasn't you, please secure your account immediately by changing your password and enabling two-factor authentication.</p>
              </div>
            </div>
            <div class="footer">
              <p>This is an automated security notification from NEXA.</p>
            </div>
          </div>
        </body>
        </html>
      `;

      // Send email using Resend REST API directly
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${resendApiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: "NEXA Security <security@resend.dev>",
          to: [email],
          subject: "New Device Login Detected - NEXA",
          html: emailHtml,
        }),
      });

      if (resendResponse.ok) {
        console.log("Login notification email sent to:", email);
      } else {
        console.error("Failed to send email:", await resendResponse.text());
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        isNewDevice,
        emailSent: isNewDevice && !!resendApiKey 
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
