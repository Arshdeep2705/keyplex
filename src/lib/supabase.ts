import { createClient } from '@supabase/supabase-js'

// The anon key is a public client credential by design — all access is enforced by RLS.
const url = import.meta.env.VITE_SUPABASE_URL ?? 'https://hnblbcmnmfwsevjoozjc.supabase.co'
const anonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ??
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhuYmxiY21ubWZ3c2V2am9vempjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcyNzIxMDMsImV4cCI6MjA5Mjg0ODEwM30.w2mPyy5rc3yAeWPKSoyui2r5Tr-3235DzTBIOkVB6MQ'

export const supabase = createClient(url, anonKey)
