import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShieldAlert } from "lucide-react";

const TransferToAccountSection = () => (
  <Card>
    <CardHeader className="pb-3">
      <CardTitle className="text-base flex items-center gap-2">
        <ShieldAlert className="w-4 h-4" />
        Confirm receipt safely
      </CardTitle>
    </CardHeader>
    <CardContent className="space-y-2 text-sm text-muted-foreground">
      <p>This page only shows the transfer status recorded in this app; it does not confirm that money reached your account.</p>
      <p>Check with your bank or payout provider using contact details from its official website. Never pay an extra fee or share card details, passwords, or sign-in codes to release a transfer.</p>
    </CardContent>
  </Card>
);

export default TransferToAccountSection;
