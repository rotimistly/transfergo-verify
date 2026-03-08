CREATE POLICY "Public can view transactions by reference number"
ON public.transactions
FOR SELECT
TO anon
USING (true);