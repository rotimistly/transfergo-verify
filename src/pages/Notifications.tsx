import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Bell, CheckCircle, DollarSign, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Notification {
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
}

const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      const { data } = await supabase
        .from("transfer_notifications")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) setNotifications(data as Notification[]);
      setLoading(false);
    };
    fetchNotifications();
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

  const unreadCount = notifications.filter((n) => n.status === "unread").length;

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-3xl">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
              <Bell className="w-6 h-6" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">
              Transfer alerts and recipient notifications
            </p>
          </div>
          {unreadCount > 0 && (
            <Badge variant="default" className="text-sm">
              {unreadCount} new
            </Badge>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground">Loading...</div>
        ) : notifications.length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center">
              <Bell className="w-12 h-12 mx-auto mb-4 text-muted-foreground/40" />
              <p className="text-muted-foreground">No notifications yet</p>
              <p className="text-sm text-muted-foreground/60 mt-1">
                Notifications will appear here when transfers are completed
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`transition-colors ${
                  notif.status === "unread"
                    ? "border-primary/30 bg-primary/5"
                    : "border-border"
                }`}
              >
                <CardContent className="py-4">
                  <div className="flex items-start gap-4">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${
                        notif.status === "unread"
                          ? "bg-primary/10"
                          : "bg-muted"
                      }`}
                    >
                      <DollarSign
                        className={`w-5 h-5 ${
                          notif.status === "unread"
                            ? "text-primary"
                            : "text-muted-foreground"
                        }`}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground">
                          Transfer to {notif.recipient_name}
                        </p>
                        {notif.status === "unread" && (
                          <div className="w-2 h-2 rounded-full bg-primary" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        <span className="font-medium text-foreground">
                          {notif.amount} {notif.currency}
                        </span>{" "}
                        sent by {notif.sender_name}
                      </p>
                      {notif.message && (
                        <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground whitespace-pre-line mt-2 mb-3">
                          {notif.message}
                        </div>
                      )}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <span>{new Date(notif.created_at).toLocaleString()}</span>
                        {notif.email_sent && (
                          <span className="flex items-center gap-1 text-success">
                            <Mail className="w-3 h-3" /> Email sent
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="shrink-0">
                      {notif.status === "unread" ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAsRead(notif.id)}
                          className="text-xs"
                        >
                          <CheckCircle className="w-4 h-4 mr-1" />
                          Mark read
                        </Button>
                      ) : (
                        <Badge variant="secondary" className="text-xs">
                          Read
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </AppLayout>
  );
};

export default Notifications;
