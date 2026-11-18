import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const vercelOrigin = "https://transfergo-verify.vercel.app";

const respond = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (character) => {
  const entities: Record<string, string> = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  };
  return entities[character] ?? character;
});

const resolveTrackingOrigin = (requestOrigin: string | null) => {
  if (!requestOrigin) return publishedOrigin;
  try {
    const parsed = new URL(requestOrigin);
    if (parsed.origin === vercelOrigin) return vercelOrigin;
  } catch {
    return vercelOrigin;
  }
  return vercelOrigin;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
  if (req.method !== "POST") return respond({ error: "Method not allowed" }, 405);

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!supabaseUrl || !serviceRoleKey) return respond({ error: "Service unavailable" }, 503);

    const authHeader = req.headers.get("Authorization");
    const token = authHeader?.match(/^Bearer\s+(.+)$/i)?.[1];
    if (!token) return respond({ error: "Unauthorized" }, 401);

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: authData, error: authError } = await supabase.auth.getUser(token);
    if (authError || !authData.user) return respond({ error: "Unauthorized" }, 401);

    const body = await req.json().catch(() => null);
    const transactionId = body?.transactionId;
    if (typeof transactionId !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(transactionId)) {
      return respond({ error: "A valid transactionId is required" }, 400);
    }

    const { data: tx, error: txError } = await supabase
      .from("transactions")
      .select("id, user_id, reference_number, recipient_name, recipient_email, sender_name, receive_amount, receive_currency, status")
      .eq("id", transactionId)
      .eq("user_id", authData.user.id)
      .maybeSingle();

    if (txError) return respond({ error: "Unable to load transaction" }, 500);
    if (!tx) return respond({ error: "Transaction not found" }, 404);

    const requestBody = body as { transactionId: string; notice?: unknown; trackingUrl?: unknown };
    const origin = resolveTrackingOrigin(req.headers.get("origin"));
    const trackingUrl = new URL("/track", origin);
    trackingUrl.searchParams.set("ref", tx.reference_number);
    const submittedTrackingUrl = typeof requestBody.trackingUrl === "string" ? new URL(requestBody.trackingUrl) : null;
    const safeTrackingUrl = submittedTrackingUrl?.origin === origin && submittedTrackingUrl.pathname === "/track" && submittedTrackingUrl.searchParams.get("ref") === tx.reference_number
      ? submittedTrackingUrl
      : trackingUrl;
    const notificationMessage = typeof requestBody.notice === "string" && requestBody.notice.length <= 4000
      ? requestBody.notice
      : `Transfer update: a request for ${tx.receive_amount} ${tx.receive_currency} was recorded from ${tx.sender_name}.\nReference: ${tx.reference_number}\nRecorded status: ${String(tx.status || "pending").replace(/_/g, " ")}\n\nView the transaction record: ${safeTrackingUrl.toString()}\n\nThis notice does not confirm that funds have arrived. Check directly with your bank or payout provider. Never pay a fee to release a transfer or share passwords, card details, or one-time sign-in codes.`;

    let emailSent = false;
    if (tx.recipient_email && resendApiKey) {
      const safeUrl = escapeHtml(safeTrackingUrl.toString());
      const safeMessage = escapeHtml(notificationMessage).replace(/\n/g, "<br>");
      const emailHtml = `<!doctype html><html><body style="margin:0;padding:24px;background:#f5f8f7;font-family:Arial,sans-serif;color:#163a35"><main style="max-width:560px;margin:0 auto;background:#fff;padding:28px;border:1px solid #dce8e5"><h1 style="font-size:22px">Transfer status update</h1><p>${safeMessage}</p><p><a href="${safeUrl}" style="display:inline-block;padding:12px 18px;background:#087f70;color:#fff;text-decoration:none">View transaction record</a></p></main></body></html>`;

      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${resendApiKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            from: "Transfer record update <onboarding@resend.dev>",
            to: [tx.recipient_email],
            subject: `Transfer status update — ${tx.reference_number}`,
            html: emailHtml,
            text: notificationMessage,
          }),
        });
        emailSent = emailResponse.ok;
        if (!emailResponse.ok) console.error("Email provider rejected the transfer notice", emailResponse.status);
      } catch (error) {
        console.error("Transfer notice email could not be sent", error);
      }
    }

    const { error: notificationError } = await supabase
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

    if (notificationError) return respond({ error: "Unable to create notification" }, 500);
    return respond({ success: true, emailSent });
  } catch (error) {
    console.error("Transfer notification request failed", error);
    return respond({ error: "Internal server error" }, 500);
  }
});
