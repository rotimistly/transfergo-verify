import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, ArrowUpRight, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Transaction = Tables<"transactions">;
type VerificationLog = Tables<"verification_logs">;

const statusIcons: Record<string, any> = {
  pending: Clock,
  processing: Clock,
  completed: CheckCircle,
  failed: XCircle,
  cancelled: XCircle,
};

const TransactionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const [tx, setTx] = useState<Transaction | null>(null);
  const [logs, setLogs] = useState<VerificationLog[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    const fetch = async () => {
      const { data } = await supabase.from("transactions").select("*").eq("id", id).single();
      if (data) setTx(data);

      const { data: logData } = await supabase
        .from("verification_logs")
        .select("*")
        .eq("transaction_id", id)
        .order("created_at", { ascending: false });
      if (logData) setLogs(logData);
    };
    fetch();
  }, [id, user]);

  const submitForVerification = async () => {
    if (!tx || !user) return;
    const { error } = await supabase
      .from("transactions")
      .update({ verification_status: "pending_review" })
      .eq("id", tx.id);

    if (!error) {
      await supabase.from("verification_logs").insert({
        transaction_id: tx.id,
        user_id: user.id,
        action: "submitted",
        notes: "Transaction submitted for billing verification",
      });
      setTx({ ...tx, verification_status: "pending_review" });
      toast.success("Submitted for verification");
    }
  };

  if (!tx) {
    return (
      <AppLayout>
        <div className="animate-fade-in text-center py-20 text-muted-foreground">Loading...</div>
      </AppLayout>
    );
  }

  const StatusIcon = statusIcons[tx.status] ?? Clock;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <Link to="/transactions" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Transactions
        </Link>

        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{tx.reference_number}</h1>
            <p className="text-muted-foreground mt-1">
              Created {new Date(tx.created_at).toLocaleString()}
            </p>
          </div>
          <Badge variant="secondary" className="text-sm capitalize">
            {tx.status}
          </Badge>
        </div>

        <div className="space-y-6">
          {/* Transfer Summary */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transfer Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Send Amount</span>
                <span className="font-medium">{tx.send_amount} {tx.send_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Exchange Rate</span>
                <span className="font-medium">1 {tx.send_currency} = {tx.exchange_rate} {tx.receive_currency}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Receive Amount</span>
                <span className="font-medium">{tx.receive_amount} {tx.receive_currency}</span>
              </div>
              <Separator />
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium">€{tx.fee}</span>
              </div>
              <div className="flex justify-between text-base font-semibold">
                <span>Total</span>
                <span className="text-primary">€{tx.total_amount}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Info */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recipient</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name</span>
                <span className="font-medium">{tx.recipient_name}</span>
              </div>
              {tx.recipient_email && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{tx.recipient_email}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Country</span>
                <span className="font-medium">{tx.recipient_country}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Payment Method</span>
                <span className="font-medium capitalize">{tx.payment_method.replace("_", " ")}</span>
              </div>
            </CardContent>
          </Card>

          {/* Verification */}
          <Card>
            <CardHeader className="pb-3 flex flex-row items-center justify-between">
              <CardTitle className="text-base">Billing Verification</CardTitle>
              <Badge
                variant="secondary"
                className={`capitalize ${
                  tx.verification_status === "verified"
                    ? "bg-success/10 text-success"
                    : tx.verification_status === "flagged"
                    ? "bg-destructive/10 text-destructive"
                    : tx.verification_status === "pending_review"
                    ? "bg-warning/10 text-warning"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {tx.verification_status.replace("_", " ")}
              </Badge>
            </CardHeader>
            <CardContent>
              {tx.verification_status === "unverified" && (
                <div className="text-center py-4">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-2 text-warning" />
                  <p className="text-sm text-muted-foreground mb-4">
                    This transaction hasn't been verified yet
                  </p>
                  <Button onClick={submitForVerification}>Submit for Verification</Button>
                </div>
              )}

              {logs.length > 0 && (
                <div className="space-y-3 mt-4">
                  <p className="text-sm font-medium text-foreground">Verification History</p>
                  {logs.map((log) => (
                    <div key={log.id} className="flex gap-3 text-sm">
                      <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                      <div>
                        <p className="font-medium capitalize text-foreground">{log.action}</p>
                        {log.notes && <p className="text-muted-foreground">{log.notes}</p>}
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(log.created_at).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
};

export default TransactionDetail;
