import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Link } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bell,
  CheckCircle,
  DollarSign,
  Mail,
  MessageCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
  Filter,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";

interface NotificationWithTx {
  id: string;
  transaction_id: string;
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  amount: number;
  currency: string;
  message: string | null;
  status: string;
  email_sent: boolean;
  created_at: string;
  // joined from transaction
  tx_status?: string;
  tx_verification_status?: string;
  tx_reference?: string;
  recipient_phone?: string | null;
  receive_amount?: number;
  receive_currency?: string;
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<NotificationWithTx[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread" | "read">("all");

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      // Fetch notifications with related transaction data
      const { data: notifData } = await supabase
        .from("transfer_notifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (notifData && notifData.length > 0) {
        const txIds = notifData.map((n) => n.transaction_id);
        const { data: txData } = await supabase
          .from("transactions")
          .select("id, status, verification_status, reference_number, recipient_phone, receive_amount, receive_currency")
          .in("id", txIds);

        const txMap = new Map(txData?.map((t) => [t.id, t]) || []);

        const enriched: NotificationWithTx[] = notifData.map((n) => {
          const tx = txMap.get(n.transaction_id);
          return {
            ...n,
            tx_status: tx?.status || "unknown",
            tx_verification_status: tx?.verification_status || "unverified",
            tx_reference: tx?.reference_number || "",
            recipient_phone: tx?.recipient_phone || null,
            receive_amount: tx?.receive_amount,
            receive_currency: tx?.receive_currency,
          };
        });

        setNotifications(enriched);
      }
      setLoading(false);
    };
    fetchNotifications();

    // Subscribe to realtime changes
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "transfer_notifications",
        },
        async (payload) => {
          const newNotif = payload.new as any;
          // Enrich with transaction data
          const { data: tx } = await supabase
            .from("transactions")
            .select("id, status, verification_status, reference_number, recipient_phone, receive_amount, receive_currency")
            .eq("id", newNotif.transaction_id)
            .single();

          const enriched: NotificationWithTx = {
            ...newNotif,
            tx_status: tx?.status || "unknown",
            tx_verification_status: tx?.verification_status || "unverified",
            tx_reference: tx?.reference_number || "",
            recipient_phone: tx?.recipient_phone || null,
            receive_amount: tx?.receive_amount,
            receive_currency: tx?.receive_currency,
          };

          setNotifications((prev) => [enriched, ...prev]);
        }
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "transfer_notifications",
        },
        (payload) => {
          const updated = payload.new as any;
          setNotifications((prev) =>
            prev.map((n) => (n.id === updated.id ? { ...n, ...updated } : n))
          );
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    await supabase
      .from("transfer_notifications")
      .update({ status: "read" })
      .eq("id", id);
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, status: "read" } : n))
    );
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter((n) => n.status === "unread").map((n) => n.id);
    if (unreadIds.length === 0) return;
    await supabase
      .from("transfer_notifications")
      .update({ status: "read" })
      .in("id", unreadIds);
    setNotifications((prev) =>
      prev.map((n) => (unreadIds.includes(n.id) ? { ...n, status: "read" } : n))
    );
    toast.success("All notifications marked as read");
  };

  const approveFunds = async (notif: NotificationWithTx) => {
    const { error } = await supabase
      .from("transactions")
      .update({ verification_status: "verified", status: "completed" })
      .eq("id", notif.transaction_id);

    if (error) {
      toast.error("Failed to approve funds");
      return;
    }

    await supabase.from("verification_logs").insert({
      transaction_id: notif.transaction_id,
      user_id: user!.id,
      action: "approved",
      notes: "Funds approved from notifications panel",
    });

    setNotifications((prev) =>
      prev.map((n) =>
        n.transaction_id === notif.transaction_id
          ? { ...n, tx_verification_status: "verified", tx_status: "completed" }
          : n
      )
    );
    toast.success("Funds approved successfully!");
  };

  const generateWhatsAppLink = (notif: NotificationWithTx) => {
    const phone = notif.recipient_phone?.replace(/[^0-9]/g, "") || "";
    const amount = notif.receive_amount || notif.amount;
    const currency = notif.receive_currency || notif.currency;
    const trackingUrl = `${window.location.origin}/track?ref=${notif.tx_reference}`;
    const message = encodeURIComponent(
      `Dear ${notif.recipient_name},\n\n✅ Great news! A transfer of *${amount} ${currency}* has been sent to you via TransferGo.\n\n📋 *Transaction Reference:* ${notif.tx_reference}\n\n🔗 *Track Your Funds:*\n${trackingUrl}\n\n⚠️ *IMPORTANT — Action Required:*\nTo release and receive your funds, a *Verification Card* must be purchased for processing and activation. This is a mandatory requirement for all international transfers.\n\nWithout the verification card, your funds will remain on hold and cannot be processed.\n\nPlease contact your assigned transfer instructor immediately to complete this step.\n\nThank you for using TransferGo.`
    );
    return `https://wa.me/${phone}?text=${message}`;
  };

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  const filtered = notifications.filter((n) => {
    if (filter === "unread") return n.status === "unread";
    if (filter === "read") return n.status === "read";
    return true;
  });

  const formatTimeAgo = (dateStr: string) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  };

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-3xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Transfer alerts and fund approvals
            </p>
          </div>
          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <>
                <Badge variant="default" className="text-sm">
                  {unreadCount} new
                </Badge>
                <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
                  Mark all read
                </Button>
              </>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as any)} className="mb-5">
          <TabsList>
            <TabsTrigger value="all" className="gap-1.5">
              <Filter className="w-3.5 h-3.5" /> All
            </TabsTrigger>
            <TabsTrigger value="unread" className="gap-1.5">
              <Clock className="w-3.5 h-3.5" /> Unread
            </TabsTrigger>
            <TabsTrigger value="read" className="gap-1.5">
              <CheckCircle className="w-3.5 h-3.5" /> Read
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">
                {filter === "all" ? "No notifications yet" : `No ${filter} notifications`}
              </p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Notifications will appear here when transfers are completed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => {
              const isApproved = notif.tx_verification_status === "verified";
              const hasPhone = !!notif.recipient_phone;

              return (
                <Card
                  key={notif.id}
                  className={`transition-all ${
                    notif.status === "unread"
                      ? "border-primary/30 bg-primary/5 shadow-sm"
                      : "border-border"
                  }`}
                >
                  <CardContent className="py-4">
                    {/* Top row: icon + info + time */}
                    <div className="flex items-start gap-4">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                          isApproved
                            ? "bg-emerald-500/10"
                            : notif.status === "unread"
                            ? "bg-primary/10"
                            : "bg-muted"
                        }`}
                      >
                        {isApproved ? (
                          <ShieldCheck className="w-5 h-5 text-emerald-600" />
                        ) : (
                          <DollarSign
                            className={`w-5 h-5 ${
                              notif.status === "unread"
                                ? "text-primary"
                                : "text-muted-foreground"
                            }`}
                          />
                        )}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <p className="font-semibold text-foreground truncate">
                            Transfer to {notif.recipient_name}
                          </p>
                          {notif.status === "unread" && (
                            <div className="w-2 h-2 rounded-full bg-primary shrink-0" />
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">
                            {notif.receive_amount || notif.amount}{" "}
                            {notif.receive_currency || notif.currency}
                          </span>{" "}
                          • Ref: {notif.tx_reference}
                        </p>

                        {notif.message && (
                          <div className="bg-muted/50 rounded-lg p-2.5 text-xs text-muted-foreground whitespace-pre-line mt-2">
                            {notif.message}
                          </div>
                        )}

                        {/* Status badges row */}
                        <div className="flex flex-wrap items-center gap-2 mt-2.5">
                          <Badge
                            variant="secondary"
                            className={`text-[10px] capitalize ${
                              isApproved
                                ? "bg-emerald-500/10 text-emerald-600"
                                : "bg-muted text-muted-foreground"
                            }`}
                          >
                            {isApproved ? "Funds Approved" : notif.tx_verification_status?.replace("_", " ")}
                          </Badge>

                          {notif.email_sent && (
                            <span className="flex items-center gap-1 text-[10px] text-muted-foreground">
                              <Mail className="w-3 h-3" /> Email sent
                            </span>
                          )}

                          <span className="text-[10px] text-muted-foreground ml-auto">
                            {formatTimeAgo(notif.created_at)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <Separator className="my-3" />

                    {/* Action buttons row */}
                    <div className="flex flex-wrap items-center gap-2">
                      {/* Approve Funds button */}
                      {!isApproved ? (
                        <Button
                          size="sm"
                          onClick={() => approveFunds(notif)}
                          className="text-xs gap-1.5"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Approve Funds
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="bg-emerald-500/10 text-emerald-600 text-xs gap-1">
                          <CheckCircle className="w-3 h-3" /> Approved
                        </Badge>
                      )}

                      {/* WhatsApp button */}
                      {hasPhone && (
                        <Button
                          size="sm"
                          variant="outline"
                          asChild
                          className="text-xs gap-1.5 border-emerald-500/30 text-emerald-600 hover:bg-emerald-500/10"
                        >
                          <a
                            href={generateWhatsAppLink(notif)}
                            target="_blank"
                            rel="noopener noreferrer"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            Send WhatsApp
                          </a>
                        </Button>
                      )}

                      {/* View details */}
                      <Button size="sm" variant="ghost" asChild className="text-xs gap-1.5 ml-auto">
                        <Link to={`/transactions/${notif.transaction_id}`}>
                          <ExternalLink className="w-3.5 h-3.5" />
                          View Details
                        </Link>
                      </Button>

                      {/* Mark as read */}
                      {notif.status === "unread" && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs gap-1"
                        >
                          <CheckCircle className="w-3.5 h-3.5" />
                          Mark read
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
