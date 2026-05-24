// This file runs once at startup and crashes the process
// immediately if required config is missing.
// "Fail fast" — catch misconfigs before they cause weird runtime bugs.

require('dotenv').config();

const requiredEnvVars = [
  'DATABASE_URL',
  'PORT',
];

function validateEnv() {
  const missing = requiredEnvVars.filter(key => !process.env[key]);

  if (missing.length > 0) {
    // Kill the process with a clear, actionable message
    console.error('FATAL: Missing required environment variables:');
    missing.forEach(key => console.error(`  - ${key}`));
    console.error('Check your .env file and try again.');
    process.exit(1); // exit code 1 = failure (0 = success)
  }

  // Return a clean config object so the rest of the app
  // imports from here instead of process.env directly
  return {
    port: parseInt(process.env.PORT, 10),
    databaseUrl: process.env.DATABASE_URL,
    nodeEnv: process.env.NODE_ENV || 'development',
  };
}

// We export the result of calling it, not the function itself.
// This means validation runs the moment any file imports this.
module.exports = validateEnv();