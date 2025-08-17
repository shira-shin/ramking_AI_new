const required = [
  'DATABASE_URL',
  'REDIS_URL',
  'NEXTAUTH_SECRET',
  'GOOGLE_CLIENT_ID',
  'GOOGLE_CLIENT_SECRET',
  'OPENAI_API_KEY',
  'SEARCH_API_KEY',
  'STRIPE_SECRET_KEY',
  'STRIPE_WEBHOOK_SECRET',
  'S3_ENDPOINT',
  'S3_ACCESS_KEY_ID',
  'S3_SECRET_ACCESS_KEY',
  'S3_BUCKET'
];

let missing = false;

for (const key of required) {
  if (process.env[key]) {
    console.log(`${key} is set`);
  } else {
    console.warn(`${key} is not set`);
    missing = true;
  }
}

if (missing) {
  process.exit(1);
}
