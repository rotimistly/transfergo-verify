import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Shield, CheckCircle, Clock, AlertTriangle, ArrowUpRight } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";

type Transaction = Tables<"transactions">;

const Verification = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [tab, setTab] = useState("pending_review");

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      if (data) setTransactions(data);
    };
    fetch();
  }, [user]);

  const markVerified = async (txId: string) => {
    if (!user) return;
    const { error } = await supabase
      .from("transactions")
      .update({ verification_status: "verified", status: "completed" })
      .eq("id", txId);

    if (!error) {
      await supabase.from("verification_logs").insert({
        transaction_id: txId,
        user_id: user.id,
        action: "approved",
        notes: "Billing verified by user",
      });
      setTransactions((prev) =>
        prev.map((t) => (t.id === txId ? { ...t, verification_status: "verified" } : t))
      );
      toast.success("Transaction verified");
    }
  };

  const filtered = transactions.filter((tx) =>
    tab === "all" ? true : tx.verification_status === tab
  );

  const counts = {
    all: transactions.length,
    pending_review: transactions.filter((t) => t.verification_status === "pending_review").length,
    verified: transactions.filter((t) => t.verification_status === "verified").length,
    flagged: transactions.filter((t) => t.verification_status === "flagged").length,
  };

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Billing Verification</h1>
          <p className="text-muted-foreground mt-1">Review and verify transaction billing status</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.pending_review}</p>
                <p className="text-xs text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.verified}</p>
                <p className="text-xs text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-destructive" />
              </div>
              <div>
                <p className="text-2xl font-bold">{counts.flagged}</p>
                <p className="text-xs text-muted-foreground">Flagged</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader className="pb-3">
            <Tabs value={tab} onValueChange={setTab}>
              <TabsList>
                <TabsTrigger value="pending_review">Pending ({counts.pending_review})</TabsTrigger>
                <TabsTrigger value="verified">Verified ({counts.verified})</TabsTrigger>
                <TabsTrigger value="flagged">Flagged ({counts.flagged})</TabsTrigger>
                <TabsTrigger value="all">All ({counts.all})</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {filtered.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Shield className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No transactions in this category</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filtered.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-4 rounded-lg border border-border"
                  >
                    <Link to={`/transactions/${tx.id}`} className="flex items-center gap-3 flex-1">
                      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{tx.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">
                          {tx.reference_number} · €{tx.total_amount}
                        </p>
                      </div>
                    </Link>
                    <div className="flex items-center gap-3">
                      <Badge
                        variant="secondary"
                        className={`text-xs capitalize ${
                          tx.verification_status === "verified"
                            ? "bg-success/10 text-success"
                            : tx.verification_status === "flagged"
                            ? "bg-destructive/10 text-destructive"
                            : "bg-warning/10 text-warning"
                        }`}
                      >
                        {tx.verification_status.replace("_", " ")}
                      </Badge>
                      {tx.verification_status === "pending_review" && (
                        <Button size="sm" onClick={() => markVerified(tx.id)}>
                          Verify
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Verification;
