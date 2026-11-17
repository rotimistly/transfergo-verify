export interface RecipientTransferNotice {
  recipientName: string;
  senderName: string;
  amount: number | string;
  currency: string;
  reference: string;
  status: string;
  origin: string;
}

export const buildTrackingUrl = (origin: string, reference: string): string => {
  const url = new URL("/track", origin);
  url.searchParams.set("ref", reference);
  return url.toString();
};

export const buildRecipientTransferNotice = ({
  recipientName,
  senderName,
  amount,
  currency,
  reference,
  status,
  origin,
}: RecipientTransferNotice): string => {
  const trackingUrl = buildTrackingUrl(origin, reference);

  return [
    `Dear ${recipientName},`,
    "",
    `Transfer update: a request for ${amount} ${currency} was recorded from ${senderName}.`,
    `Reference: ${reference}`,
    `Recorded status: ${status.replace(/_/g, " ")}`,
    "",
    `View the transaction record: ${trackingUrl}`,
    "",
    "This notice does not confirm that funds have arrived. Check directly with your bank or payout provider, and use its official contact details if you need help.",
    "Never share passwords, card details, or one-time sign-in codes through a tracking link.",
  ].join("\n");
};