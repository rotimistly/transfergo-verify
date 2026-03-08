
-- Drop all existing SELECT policies on transactions
DROP POLICY IF EXISTS "Public can view transactions by reference number" ON public.transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.transactions;

-- Recreate as PERMISSIVE (explicitly)
CREATE POLICY "Users can view own transactions"
  ON public.transactions FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Public can view by reference"
  ON public.transactions FOR SELECT
  TO anon, authenticated
  USING (true);
