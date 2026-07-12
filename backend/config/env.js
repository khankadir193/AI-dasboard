import dotenv from 'dotenv';

dotenv.config();

const REQUIRED_VARS = [
  'SUPABASE_URL',
  'SUPABASE_SERVICE_ROLE_KEY',
  'RAZORPAY_KEY_ID',
  'RAZORPAY_KEY_SECRET',
  'GROQ_API_KEY',
];

let hasError = false;

for (const name of REQUIRED_VARS) {
  if (process.env[name]) {
    console.log(`\u2713 ${name} loaded`);
  } else {
    console.error(`\u2717 ${name} NOT LOADED`);
    console.error(`ERROR: Missing ${name}`);
    hasError = true;
  }
}

if (hasError) {
  process.exit(1);
}
