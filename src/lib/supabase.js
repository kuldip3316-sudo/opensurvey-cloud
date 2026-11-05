import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://cxqjtzfghighnoaskgbc.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImN4cWp0emZnaGlnaG5vYXNrZ2JjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODk2MzI3MzEsImV4cCI6MjEwNTIwODczMX0.lB_46QcLv4mhAupuvcsE1aLB1DuanhkK4_4U3bMvcBM';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
