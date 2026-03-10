import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Banknote } from "lucide-react";
import { countries } from "@/lib/constants";

const TransferToAccountSection = () => {
  const [submitted, setSubmitted] = useState(false);
  const [country, setCountry] = useState("");
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankName, setBankName] = useState("");
  const [routingNumber, setRoutingNumber] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (country && accountName && accountNumber && bankName) {
      setSubmitted(true);
    }
  };

  if (submitted) {
    return (
      <Card className="border-2 border-destructive/40 bg-destructive/5">
        <CardContent className="py-8 text-center">
          <AlertTriangle className="w-14 h-14 mx-auto mb-4 text-destructive" />
          <h3 className="text-lg font-bold text-foreground mb-2">
            Card Has Not Been Purchased Yet
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Your transfer cannot be processed at this time. The <span className="font-semibold text-foreground">Verification Card</span> required for activation of cash flow has not been purchased yet.
          </p>
          <div className="bg-background rounded-lg p-4 border border-border text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What to do next:</p>
            <p className="text-sm text-muted-foreground">
              Please contact your <span className="font-semibold text-foreground">Delivery Manager</span> in charge to purchase the required verification card and activate your cash flow.
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              Once the card is purchased and verified, your funds will be released to your personal account within 24 hours.
            </p>
          </div>
          <Button
            variant="outline"
            className="mt-4"
            onClick={() => setSubmitted(false)}
          >
            Try Again
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <Banknote className="w-4 h-4" />
          Transfer to Personal Account
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="country">Country</Label>
            <Select value={country} onValueChange={setCountry}>
              <SelectTrigger>
                <SelectValue placeholder="Select your country" />
              </SelectTrigger>
              <SelectContent>
                {countries.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountName">Account Holder Name</Label>
            <Input
              id="accountName"
              placeholder="Full name on account"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name</Label>
            <Input
              id="bankName"
              placeholder="Enter your bank name"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number</Label>
            <Input
              id="accountNumber"
              placeholder="Enter your account number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="routingNumber">Routing / Sort Code (Optional)</Label>
            <Input
              id="routingNumber"
              placeholder="Enter routing or sort code"
              value={routingNumber}
              onChange={(e) => setRoutingNumber(e.target.value)}
            />
          </div>

          <Button type="submit" className="w-full">
            Send to My Account
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default TransferToAccountSection;
