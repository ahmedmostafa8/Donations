import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://losrkolyoygxmdlxnwjo.supabase.co'
const supabaseAnonKey = 'ps_publishable_EgN5HrxLMUfT7O6K6Gm_SQ_jr2huP10'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
