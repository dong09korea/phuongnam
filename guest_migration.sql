-- Allow guest bookings by making user_id nullable
ALTER TABLE public.bookings ALTER COLUMN user_id DROP NOT NULL;

-- Optional: Add a payment_method column
ALTER TABLE public.bookings ADD COLUMN payment_method text default 'online'; -- 'online' or 'pay_later'
