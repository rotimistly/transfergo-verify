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
    let active = true;

    const run = async () => {
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
      const tokenHash = url.searchParams.get("token_hash") || hashParams.get("token_hash");
      const type = (url.searchParams.get("type") || hashParams.get("type") || "signup") as any;
      const code = url.searchParams.get("code");

      try {
        if (tokenHash) {
          await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        } else if (code) {
          await supabase.auth.exchangeCodeForSession(code);
        }
      } catch {
        // Link may already be consumed; fall through to success state
      }

      if (!active) return;
      setStatus("success");
    };

    run();
    return () => {
      active = false;
    };
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
