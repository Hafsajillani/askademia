import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://iqqjmjkydbniwawymuih.supabase.co'
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImlxcWptamt5ZGJuaXdhd3ltdWloIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTUwMDU3NzksImV4cCI6MjA3MDU4MTc3OX0.r9x1B3aH3tyOVpOWKaR3YE2yUdbORW-5IQX9g5TXZ1E'

export const supabase = createClient(supabaseUrl, supabaseAnonKey) 