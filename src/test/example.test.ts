import { describe, it, expect } from "vitest";
import { buildRecipientTransferNotice, buildTrackingUrl } from "@/lib/transfer-notifications";

describe("recipient transfer notices", () => {
  it("builds a tracking link on the app origin with the transaction reference", () => {
    expect(buildTrackingUrl("https://transfergo-verify.vercel.app", "TG-51A81379"))
      .toBe("https://transfergo-verify.vercel.app/track?ref=TG-51A81379");
  });

  it("does not use the unverified transfergo.com host", () => {
    expect(buildTrackingUrl(
      "https://781da02b-b1f2-4480-81ce-7025321212b3.transfergo.com",
      "TG-51A81379",
    )).toBe("https://transfergo-verify.vercel.app/track?ref=TG-51A81379");
  });

  it("uses the Vercel tracking page instead of a Lovable preview host", () => {
    expect(buildTrackingUrl(
      "https://id-preview--781da02b-b1f2-4480-81ce-7025321212b3.lovable.app",
      "TG-51A81379",
    )).toBe("https://transfergo-verify.vercel.app/track?ref=TG-51A81379");
  });

  it("keeps tracking links on the configured Vercel app origin", () => {
    expect(buildTrackingUrl("https://transfergo-verify.vercel.app", "TG-51A81379"))
      .toBe("https://transfergo-verify.vercel.app/track?ref=TG-51A81379");
  });

  it("reports a recorded status without claiming delivery or demanding payment", () => {
    const notice = buildRecipientTransferNotice({
      recipientName: "Alex",
      senderName: "Sam",
      amount: "50.00",
      currency: "USD",
      reference: "TG-51A81379",
      status: "pending_review",
      origin: "https://transfer-wise-trust.lovable.app",
    });

    expect(notice).toContain("Recorded status: pending review");
    expect(notice).toContain("does not confirm that funds have arrived");
    expect(notice).not.toMatch(/purchase|verification card|funds have been sent/i);
  });
});
