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

    const notificationMessage = `Dear ${tx.recipient_name},\n\nGreat news! A transfer of ${tx.receive_amount} ${tx.receive_currency} has been successfully sent to you by ${tx.sender_name}.\n\nTransaction Reference: ${tx.reference_number}\n\nTo withdraw or receive your funds:\n• If you wish to receive the funds directly into your bank account or as a cash deposit, please follow your assigned instructor's guidance.\n• A verification card must be purchased for approval and processing of the funds to your account or cash deposit location.\n• Without completing the card verification process, the funds cannot be released.\n\nPlease contact your instructor for further details on completing this process.\n\nThank you for using TransferGo.\n\nBest regards,\nTransferGo Team`;

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
        email_sent: !!tx.recipient_email,
      });

    if (notifError) {
      console.error("Notification insert error:", notifError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Notification sent successfully",
        emailSent: !!tx.recipient_email,
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
