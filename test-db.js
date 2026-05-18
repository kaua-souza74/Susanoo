const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = "https://dgbubqnzzttdkmlnifsa.supabase.co";
const supabaseKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnYnVicW56enR0ZGttbG5pZnNhIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkwNjAyOTUsImV4cCI6MjA5NDYzNjI5NX0.R5fDsiMT1KsZKy4nblBfCE4p-6tumpHu453mzHjYhaY";

const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data, error } = await supabase.from('profiles').select('*');
  if (error) {
    console.error("Error fetching profiles:", error);
  } else {
    console.log("Profiles found in database:");
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
