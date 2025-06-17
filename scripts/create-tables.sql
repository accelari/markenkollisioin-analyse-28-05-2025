-- Create cases table for storing trademark analysis cases
CREATE TABLE IF NOT EXISTS cases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  -- Case basic info
  case_number VARCHAR(20) UNIQUE NOT NULL,
  status VARCHAR(50) DEFAULT 'analysis_complete',
  
  -- Trademark information
  auftragsmarke TEXT NOT NULL,
  gegenmarke TEXT NOT NULL,
  
  -- Analysis results
  claude_analysis TEXT,
  deepseek_analysis TEXT,
  gemini_analysis TEXT,
  openai_analysis TEXT,
  final_analysis TEXT,
  
  -- Recommendation
  recommendation VARCHAR(100),
  confidence_level INTEGER,
  
  -- Client information (optional for now)
  client_email VARCHAR(255),
  client_name VARCHAR(255),
  
  -- Opposition details
  opposition_prepared BOOLEAN DEFAULT FALSE,
  opposition_email_sent BOOLEAN DEFAULT FALSE,
  opposition_deadline DATE,
  
  -- Metadata
  analysis_date TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_cases_case_number ON cases(case_number);
CREATE INDEX IF NOT EXISTS idx_cases_status ON cases(status);
CREATE INDEX IF NOT EXISTS idx_cases_created_at ON cases(created_at);

-- Create function to generate case numbers
CREATE OR REPLACE FUNCTION generate_case_number()
RETURNS TEXT AS $$
DECLARE
  year_part TEXT;
  sequence_part TEXT;
  case_number TEXT;
BEGIN
  year_part := EXTRACT(YEAR FROM NOW())::TEXT;
  
  -- Get next sequence number for this year
  SELECT LPAD((COUNT(*) + 1)::TEXT, 4, '0') INTO sequence_part
  FROM cases 
  WHERE EXTRACT(YEAR FROM created_at) = EXTRACT(YEAR FROM NOW());
  
  case_number := 'MRA-' || year_part || '-' || sequence_part;
  
  RETURN case_number;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-generate case numbers
CREATE OR REPLACE FUNCTION set_case_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.case_number IS NULL OR NEW.case_number = '' THEN
    NEW.case_number := generate_case_number();
  END IF;
  NEW.updated_at := NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_set_case_number
  BEFORE INSERT OR UPDATE ON cases
  FOR EACH ROW
  EXECUTE FUNCTION set_case_number();
