import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowRight, ArrowDownUp, MessageCircle } from "lucide-react";

const currencies = ["EUR", "USD", "GBP", "PLN", "TRY", "INR", "PHP", "UAH"];
const countries = ["United States", "United Kingdom", "Poland", "Turkey", "India", "Philippines", "Ukraine", "Germany", "France"];

// Mock exchange rates
const rates: Record<string, Record<string, number>> = {
  EUR: { USD: 1.08, GBP: 0.86, PLN: 4.32, TRY: 32.1, INR: 90.2, PHP: 61.5, UAH: 40.2, EUR: 1 },
  USD: { EUR: 0.93, GBP: 0.79, PLN: 4.0, TRY: 29.7, INR: 83.5, PHP: 56.9, UAH: 37.2, USD: 1 },
  GBP: { EUR: 1.16, USD: 1.26, PLN: 5.02, TRY: 37.3, INR: 105.0, PHP: 71.8, UAH: 46.8, GBP: 1 },
};

const NewTransfer = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [whatsappLink, setWhatsappLink] = useState<string | null>(null);
  const [form, setForm] = useState({
    recipientName: "",
    recipientEmail: "",
    recipientPhone: "",
    recipientCountry: "",
    sendAmount: "",
    sendCurrency: "EUR",
    receiveCurrency: "USD",
    paymentMethod: "bank_transfer",
    notifyMethod: "email" as "email" | "whatsapp" | "both",
  });

  const exchangeRate = rates[form.sendCurrency]?.[form.receiveCurrency] ?? 1;
  const sendNum = parseFloat(form.sendAmount) || 0;
  const fee = sendNum > 0 ? Math.max(0.99, sendNum * 0.005) : 0;
  const receiveAmount = sendNum * exchangeRate;
  const totalAmount = sendNum + fee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setLoading(true);

    try {
      const { data, error } = await supabase.from("transactions").insert({
        user_id: user.id,
        sender_name: user.user_metadata?.full_name || user.email || "User",
        recipient_name: form.recipientName,
        recipient_email: form.recipientEmail || null,
        recipient_country: form.recipientCountry,
        send_amount: sendNum,
        send_currency: form.sendCurrency,
        receive_amount: parseFloat(receiveAmount.toFixed(2)),
        receive_currency: form.receiveCurrency,
        exchange_rate: exchangeRate,
        fee: parseFloat(fee.toFixed(2)),
        total_amount: parseFloat(totalAmount.toFixed(2)),
        payment_method: form.paymentMethod,
      }).select().single();

      if (error) throw error;

      // Send notification to recipient
      try {
        await supabase.functions.invoke("send-transfer-notification", {
          body: { transactionId: data.id },
        });
      } catch (notifErr) {
        console.error("Notification error:", notifErr);
      }

      toast.success("Transfer created successfully!");
      navigate(`/transactions/${data.id}`);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const update = (key: string, value: string) => setForm((f) => ({ ...f, [key]: value }));

  return (
    <AppLayout>
      <div className="animate-fade-in max-w-2xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">New Transfer</h1>
          <p className="text-muted-foreground mt-1">Send money to anyone, anywhere</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Amount Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Transfer Amount</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>You send</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="1"
                    value={form.sendAmount}
                    onChange={(e) => update("sendAmount", e.target.value)}
                    placeholder="0.00"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.sendCurrency} onValueChange={(v) => update("sendCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
                  <ArrowDownUp className="w-3 h-3" />
                  1 {form.sendCurrency} = {exchangeRate.toFixed(4)} {form.receiveCurrency}
                </div>
                <div className="flex-1 h-px bg-border" />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-2">
                  <Label>They receive</Label>
                  <Input
                    type="text"
                    value={receiveAmount.toFixed(2)}
                    disabled
                    className="bg-muted"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select value={form.receiveCurrency} onValueChange={(v) => update("receiveCurrency", v)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {currencies.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between text-sm pt-2 border-t border-border">
                <span className="text-muted-foreground">Fee</span>
                <span className="font-medium text-foreground">€{fee.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-semibold">
                <span className="text-foreground">Total</span>
                <span className="text-primary">€{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Recipient Card */}
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Recipient Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Recipient Name</Label>
                <Input
                  value={form.recipientName}
                  onChange={(e) => update("recipientName", e.target.value)}
                  placeholder="Full name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label>Email (optional)</Label>
                <Input
                  type="email"
                  value={form.recipientEmail}
                  onChange={(e) => update("recipientEmail", e.target.value)}
                  placeholder="recipient@email.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Country</Label>
                <Select value={form.recipientCountry} onValueChange={(v) => update("recipientCountry", v)}>
                  <SelectTrigger><SelectValue placeholder="Select country" /></SelectTrigger>
                  <SelectContent>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Payment Method</Label>
                <Select value={form.paymentMethod} onValueChange={(v) => update("paymentMethod", v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="card">Debit/Credit Card</SelectItem>
                    <SelectItem value="wallet">Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Button type="submit" size="lg" className="w-full" disabled={loading}>
            {loading ? "Processing..." : "Send Transfer"}
            <ArrowRight className="ml-2 w-4 h-4" />
          </Button>
        </form>
      </div>
    </AppLayout>
  );
};

export default NewTransfer;
