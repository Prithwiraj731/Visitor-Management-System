import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://wjxjilsgpctwzmjiufux.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_h2nxBp-cGeazAtn3sjVzHA_W1-MZ18s';

export const supabase = createClient(supabaseUrl, supabaseKey);
