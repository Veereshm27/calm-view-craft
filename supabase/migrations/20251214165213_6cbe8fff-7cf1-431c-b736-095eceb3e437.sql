-- Create doctors table
CREATE TABLE public.doctors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  specialty TEXT NOT NULL,
  bio TEXT,
  image_url TEXT,
  experience_years INTEGER DEFAULT 0,
  hospital TEXT,
  rating DECIMAL(2,1) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  available_days TEXT[] DEFAULT '{}',
  consultation_fee DECIMAL(10,2),
  phone TEXT,
  email TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create doctor reviews table
CREATE TABLE public.doctor_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id UUID REFERENCES public.doctors(id) ON DELETE CASCADE NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.doctors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_reviews ENABLE ROW LEVEL SECURITY;

-- Doctors are publicly viewable
CREATE POLICY "Doctors are publicly viewable" ON public.doctors
FOR SELECT USING (true);

-- Reviews policies
CREATE POLICY "Reviews are publicly viewable" ON public.doctor_reviews
FOR SELECT USING (true);

CREATE POLICY "Users can insert their own reviews" ON public.doctor_reviews
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own reviews" ON public.doctor_reviews
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own reviews" ON public.doctor_reviews
FOR DELETE USING (auth.uid() = user_id);

-- Add trigger for updated_at on doctors
CREATE TRIGGER update_doctors_updated_at
BEFORE UPDATE ON public.doctors
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Insert sample doctors
INSERT INTO public.doctors (name, specialty, bio, experience_years, hospital, rating, total_reviews, available_days, consultation_fee, phone, email) VALUES
('Dr. Sarah Johnson', 'Cardiologist', 'Board-certified cardiologist with expertise in preventive cardiology and heart failure management.', 15, 'City Medical Center', 4.8, 124, ARRAY['Monday', 'Tuesday', 'Thursday'], 150.00, '(555) 123-4567', 'sarah.johnson@hospital.com'),
('Dr. Michael Chen', 'Dermatologist', 'Specialized in medical and cosmetic dermatology with a focus on skin cancer prevention.', 12, 'Westside Clinic', 4.9, 89, ARRAY['Monday', 'Wednesday', 'Friday'], 120.00, '(555) 234-5678', 'michael.chen@hospital.com'),
('Dr. Emily Rodriguez', 'Pediatrician', 'Dedicated pediatrician committed to providing comprehensive care for children from birth to adolescence.', 10, 'Children''s Hospital', 4.7, 156, ARRAY['Tuesday', 'Wednesday', 'Thursday', 'Friday'], 100.00, '(555) 345-6789', 'emily.rodriguez@hospital.com'),
('Dr. James Wilson', 'Orthopedic Surgeon', 'Expert in sports medicine and joint replacement surgery with minimally invasive techniques.', 20, 'Sports Medicine Institute', 4.6, 78, ARRAY['Monday', 'Thursday'], 200.00, '(555) 456-7890', 'james.wilson@hospital.com'),
('Dr. Lisa Park', 'Neurologist', 'Specializing in headache disorders, epilepsy, and neurodegenerative diseases.', 8, 'Neuroscience Center', 4.8, 92, ARRAY['Tuesday', 'Wednesday', 'Friday'], 175.00, '(555) 567-8901', 'lisa.park@hospital.com'),
('Dr. Robert Davis', 'General Practitioner', 'Family medicine physician providing comprehensive primary care for patients of all ages.', 18, 'Community Health Center', 4.5, 210, ARRAY['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'], 80.00, '(555) 678-9012', 'robert.davis@hospital.com');