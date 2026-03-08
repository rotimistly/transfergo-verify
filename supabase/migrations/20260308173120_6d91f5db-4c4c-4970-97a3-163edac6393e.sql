
-- Allow users to delete their own pending transactions
CREATE POLICY "Users can delete pending transactions" ON public.transactions
  FOR DELETE TO authenticated
  USING (auth.uid() = user_id AND status = 'pending');

-- Allow deleting notifications for user's transactions
CREATE POLICY "Users can delete own notifications" ON public.transfer_notifications
  FOR DELETE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions t
      WHERE t.id = transfer_notifications.transaction_id
      AND t.user_id = auth.uid()
    )
  );
