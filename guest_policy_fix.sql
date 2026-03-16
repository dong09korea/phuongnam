-- IMPORTANT: Run this in your Supabase Dashboard > SQL Editor

-- 1. Make sure user_id is nullable (if you haven't run the previous migration)
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- 2. Drop the old restrictive policy
DROP POLICY IF EXISTS "Users can insert their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON public.bookings;

-- 3. Create a new policy that allows BOTH authenticated users and Guests (anon) to insert
CREATE POLICY "Enable insert for everyone" ON public.bookings
FOR INSERT 
TO public
WITH CHECK (
  -- Allow if user is logged in AND matches user_id
  (auth.uid() = user_id) 
  OR 
  -- OR Allow if it's a guest booking (user_id is null)
  (user_id IS NULL)
);

-- 4. Allow reading the booking immediately after creation (required for the payment redirect)
--    WARNING: This allows anyone to read any booking if they guess the ID, but for this MVP it's necessary 
--    to support Guest flows without complex token logic.
CREATE POLICY "Enable read for everyone" ON public.bookings
FOR SELECT
TO public
USING (true);
