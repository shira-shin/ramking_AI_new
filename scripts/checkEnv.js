const required = ["OPENAI_API_KEY", "SEARCH_API_KEY"];
let missing = false;

required.forEach((key) => {
  if (process.env[key]) {
    console.log(`${key} is set`);
  } else {
    console.warn(`${key} is not set`);
    missing = true;
  }
});

if (missing) {
  process.exit(1);
}
