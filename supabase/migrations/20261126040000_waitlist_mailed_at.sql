-- When the wishlist welcome letter actually left for this address (null: it has not been sent).
alter table public.den_waitlist add column if not exists mailed_at timestamptz;
