// Create a new file named src/supabaseClient.js
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vwohkeprkstytsmcremp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ3b2hrZXBya3N0eXRzbWNyZW1wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQ4NTQwMzUsImV4cCI6MjA2MDQzMDAzNX0.WSmJqBo7K5el5hAWZYQao1uK7B3pxg5QFBoa5glJHdc';

export const supabase = createClient(supabaseUrl, supabaseKey);