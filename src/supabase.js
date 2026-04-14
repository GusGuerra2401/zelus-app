import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://cofrhfbkmmisxmsyqccq.supabase.co'
const supabaseKey = 'sb_publishable_8CpGxsZuz38OL5gk35CIWg_mlhpmorm'

export const supabase = createClient(supabaseUrl, supabaseKey)