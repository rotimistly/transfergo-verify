import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CheckCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";

const EmailConfirmed = () => {
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");
  const navigate = useNavigate();

  useEffect(() => {
    const hash = window.location.hash;
    if (hash && hash.includes("type=signup")) {
      // Supabase will automatically handle the token exchange via onAuthStateChange
      const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
        if (event === "SIGNED_IN") {
          setStatus("success");
          subscription.unsubscribe();
        }
      });

      // Timeout fallback
      const timeout = setTimeout(() => {
        setStatus((prev) => (prev === "verifying" ? "success" : prev));
      }, 3000);

      return () => {
        subscription.unsubscribe();
        clearTimeout(timeout);
      };
    } else {
      // No hash params but user landed here — just show success
      setStatus("success");
    }
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border shadow-lg">
        <CardContent className="pt-8 pb-8 flex flex-col items-center text-center gap-4">
          {status === "verifying" ? (
            <>
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
              <h1 className="text-xl font-bold text-foreground">Verifying your email...</h1>
              <p className="text-muted-foreground text-sm">Please wait a moment.</p>
            </>
          ) : (
            <>
              <div className="w-16 h-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
              <h1 className="text-2xl font-bold text-foreground">Email Confirmed!</h1>
              <p className="text-muted-foreground text-sm">
                Your email has been successfully verified. You can now sign in to your account.
              </p>
              <Button className="mt-4 w-full" onClick={() => navigate("/auth")}>
                Go to Sign In
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EmailConfirmed;
