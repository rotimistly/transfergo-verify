
-- Drop the restrictive public policy and user view policy
DROP POLICY IF EXISTS "Public can view transactions by reference number" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

-- Recreate as PERMISSIVE policies (default) so ANY one passing is enough
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view transactions by reference number"
  ON public.transactions FOR SELECT
  TO anon, authenticated
  USING (true);
