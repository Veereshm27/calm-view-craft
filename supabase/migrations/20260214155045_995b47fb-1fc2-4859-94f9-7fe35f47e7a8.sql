
-- Fix 3: Create a public view for doctors that excludes sensitive contact info
CREATE VIEW public.doctors_public
WITH (security_invoker = on) AS
SELECT id, name, specialty, bio, image_url, hospital, available_days,
       experience_years, rating, total_reviews, consultation_fee,
       created_at, updated_at
FROM public.doctors;

-- Drop the permissive public SELECT policy on base table
DROP POLICY IF EXISTS "Doctors are publicly viewable" ON public.doctors;

-- Deny direct SELECT on base doctors table
CREATE POLICY "No direct select on doctors"
ON public.doctors FOR SELECT
USING (false);
