
-- Notifications table for in-app transfer notifications
CREATE TABLE public.transfer_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id uuid REFERENCES public.transactions(id) ON DELETE CASCADE NOT NULL,
  recipient_email text NOT NULL,
  recipient_name text NOT NULL,
  sender_name text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  message text,
  status text NOT NULL DEFAULT 'unread',
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.transfer_notifications ENABLE ROW LEVEL SECURITY;

-- Users can create notifications for their own transactions
CREATE POLICY "Users can create notifications" ON public.transfer_notifications
  FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transfer_notifications.transaction_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can view notifications related to their transactions
CREATE POLICY "Users can view own notifications" ON public.transfer_notifications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transfer_notifications.transaction_id
      AND t.user_id = auth.uid()
    )
  );

-- Users can update notifications for their transactions
CREATE POLICY "Users can update own notifications" ON public.transfer_notifications
  FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transfer_notifications.transaction_id
      AND t.user_id = auth.uid()
    )
  );
