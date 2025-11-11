import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://gleozgewsmtvqxpnsfix.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImdsZW96Z2V3c210dnF4cG5zZml4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjE2NTAzMDIsImV4cCI6MjA3NzIyNjMwMn0.2BeT97tu2jZuFfdh6BeJV1pkha2ToxPEqp2-ngSqook';

export const supabase = createClient(supabaseUrl, supabaseKey);