-- Create health_metrics table for tracking vitals
CREATE TABLE public.health_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  metric_type TEXT NOT NULL, -- 'blood_pressure', 'weight', 'heart_rate', 'blood_sugar', 'temperature'
  value NUMERIC NOT NULL,
  secondary_value NUMERIC, -- For blood pressure (diastolic)
  unit TEXT NOT NULL,
  notes TEXT,
  recorded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own metrics"
ON public.health_metrics FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own metrics"
ON public.health_metrics FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own metrics"
ON public.health_metrics FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own metrics"
ON public.health_metrics FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_health_metrics_user_date ON public.health_metrics(user_id, recorded_at DESC);