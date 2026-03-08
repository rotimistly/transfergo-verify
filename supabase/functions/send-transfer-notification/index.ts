import { createClient } from "https://esm.sh/@supabase/supabase-js@2.98.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { transactionId } = await req.json();

    if (!transactionId) {
      return new Response(
        JSON.stringify({ error: "transactionId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch transaction details
    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("*")
      .eq("id", transactionId)
      .single();

    if (txError || !tx) {
      return new Response(
        JSON.stringify({ error: "Transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const notificationMessage = `Dear ${tx.recipient_name},

Great news! A transfer of ${tx.receive_amount} ${tx.receive_currency} has been successfully sent to you by ${tx.sender_name}.

Transaction Reference: ${tx.reference_number}

To withdraw or receive your funds:
• If you wish to receive the funds directly into your bank account or as a cash deposit, please follow your assigned instructor's guidance.
• A verification card must be purchased for approval and processing of the funds to your account or cash deposit location.
• Without completing the card verification process, the funds cannot be released.

Please contact your instructor for further details on completing this process.

Thank you for using TransferGo.

Best regards,
TransferGo Team`;

    let emailSent = false;

    // Send real email via Resend if recipient has an email
    if (tx.recipient_email && resendApiKey) {
      try {
        const emailHtml = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#ffffff;font-family:'Segoe UI',Arial,sans-serif;">
  <div style="max-width:600px;margin:0 auto;padding:40px 20px;">
    <div style="text-align:center;margin-bottom:32px;">
      <div style="display:inline-block;background:#0d9488;color:#fff;font-weight:bold;font-size:20px;padding:10px 20px;border-radius:10px;">TransferGo</div>
    </div>
    <div style="background:#f8fafa;border-radius:12px;padding:32px;border:1px solid #e2e8f0;">
      <h1 style="color:#0f172a;font-size:22px;margin:0 0 8px;">You've received money! 💰</h1>
      <p style="color:#64748b;font-size:14px;margin:0 0 24px;">A transfer has been sent to you</p>
      
      <div style="background:#ffffff;border-radius:10px;padding:24px;border:1px solid #e2e8f0;margin-bottom:24px;">
        <div style="text-align:center;">
          <p style="color:#64748b;font-size:13px;margin:0 0 4px;">Amount Received</p>
          <p style="color:#0d9488;font-size:36px;font-weight:bold;margin:0;">${tx.receive_amount} ${tx.receive_currency}</p>
          <p style="color:#64748b;font-size:13px;margin:8px 0 0;">From: <strong style="color:#0f172a;">${tx.sender_name}</strong></p>
        </div>
      </div>

      <div style="background:#ffffff;border-radius:10px;padding:20px;border:1px solid #e2e8f0;margin-bottom:24px;">
        <p style="color:#0f172a;font-size:14px;font-weight:600;margin:0 0 12px;">Transaction Details</p>
        <table style="width:100%;font-size:13px;">
          <tr><td style="color:#64748b;padding:4px 0;">Reference</td><td style="color:#0f172a;text-align:right;padding:4px 0;font-weight:500;">${tx.reference_number}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0;">Recipient</td><td style="color:#0f172a;text-align:right;padding:4px 0;font-weight:500;">${tx.recipient_name}</td></tr>
          <tr><td style="color:#64748b;padding:4px 0;">Status</td><td style="text-align:right;padding:4px 0;"><span style="background:#dcfce7;color:#16a34a;padding:2px 10px;border-radius:99px;font-size:12px;font-weight:500;">Completed</span></td></tr>
        </table>
      </div>

      <div style="background:#fffbeb;border-radius:10px;padding:20px;border:1px solid #fde68a;margin-bottom:24px;">
        <p style="color:#92400e;font-size:14px;font-weight:600;margin:0 0 10px;">⚠️ Important — How to Receive Your Funds</p>
        <ul style="color:#92400e;font-size:13px;margin:0;padding-left:18px;line-height:1.8;">
          <li>To receive funds directly to your bank account or as a cash deposit, follow your assigned instructor's guidance.</li>
          <li>A <strong>verification card</strong> must be purchased for approval and processing of the funds.</li>
          <li>Without completing the card verification process, the funds <strong>cannot be released</strong>.</li>
        </ul>
        <p style="color:#92400e;font-size:13px;margin:12px 0 0;">Please contact your instructor for further details.</p>
      </div>

      <p style="color:#94a3b8;font-size:12px;text-align:center;margin:0;">
        This email was sent by TransferGo. If you have questions, contact your assigned instructor.
      </p>
    </div>
  </div>
</body>
</html>`;

        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "TransferGo <onboarding@resend.dev>",
            to: [tx.recipient_email],
            subject: `You've received ${tx.receive_amount} ${tx.receive_currency} from ${tx.sender_name}`,
            html: emailHtml,
            text: notificationMessage,
          }),
        });

        if (resendRes.ok) {
          emailSent = true;
          console.log("Email sent successfully to", tx.recipient_email);
        } else {
          const errBody = await resendRes.text();
          console.error(`Resend API error [${resendRes.status}]:`, errBody);
        }
      } catch (emailErr) {
        console.error("Email sending error:", emailErr);
      }
    }

    // Create in-app notification
    const { error: notifError } = await supabase
      .from("transfer_notifications")
      .insert({
        transaction_id: tx.id,
        recipient_email: tx.recipient_email || "",
        recipient_name: tx.recipient_name,
        sender_name: tx.sender_name,
        amount: tx.receive_amount,
        currency: tx.receive_currency,
        message: notificationMessage,
        email_sent: emailSent,
      });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        emailSent,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
