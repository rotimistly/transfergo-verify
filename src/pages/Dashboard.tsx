import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, ArrowDownRight, Clock, CheckCircle, AlertTriangle, DollarSign } from "lucide-react";
import { Link } from "react-router-dom";
import { Tables } from "@/integrations/supabase/types";
import AppLayout from "@/components/AppLayout";

type Transaction = Tables<"transactions">;

const statusColors: Record<string, string> = {
  completed: "bg-success/10 text-success",
  pending: "bg-warning/10 text-warning",
  processing: "bg-info/10 text-info",
  failed: "bg-destructive/10 text-destructive",
  cancelled: "bg-muted text-muted-foreground",
};

const Dashboard = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [stats, setStats] = useState({ total: 0, completed: 0, pending: 0, totalVolume: 0 });

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      const { data } = await supabase
        .from("transactions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(5);

      if (data) {
        setTransactions(data);
        const all = await supabase.from("transactions").select("*").eq("user_id", user.id);
        const allData = all.data ?? [];
        setStats({
          total: allData.length,
          completed: allData.filter((t) => t.status === "completed").length,
          pending: allData.filter((t) => t.status === "pending" || t.status === "processing").length,
          totalVolume: allData.reduce((sum, t) => sum + Number(t.total_amount), 0),
        });
      }
    };

    fetchData();
  }, [user]);

  const statCards = [
    { label: "Total Transactions", value: stats.total, icon: ArrowUpRight, color: "text-primary" },
    { label: "Completed", value: stats.completed, icon: CheckCircle, color: "text-success" },
    { label: "Pending", value: stats.pending, icon: Clock, color: "text-warning" },
    { label: "Total Volume", value: `€${stats.totalVolume.toLocaleString()}`, icon: DollarSign, color: "text-info" },
  ];

  return (
    <AppLayout>
      <div className="animate-fade-in">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of your transfer activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm text-muted-foreground">{stat.label}</span>
                  <stat.icon className={`w-4 h-4 ${stat.color}`} />
                </div>
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg">Recent Transactions</CardTitle>
            <Link to="/transactions" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent>
            {transactions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ArrowUpRight className="w-10 h-10 mx-auto mb-3 opacity-40" />
                <p>No transactions yet</p>
                <Link to="/transfer" className="text-primary hover:underline text-sm mt-1 inline-block">
                  Make your first transfer
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {transactions.map((tx) => (
                  <Link
                    key={tx.id}
                    to={`/transactions/${tx.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center">
                        <ArrowUpRight className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{tx.recipient_name}</p>
                        <p className="text-xs text-muted-foreground">{tx.reference_number}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {tx.send_amount} {tx.send_currency}
                      </p>
                      <Badge variant="secondary" className={`text-xs ${statusColors[tx.status] ?? ""}`}>
                        {tx.status}
                      </Badge>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default Dashboard;
