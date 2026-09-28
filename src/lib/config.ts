// Next.js inlines NEXT_PUBLIC_* vars into client bundles via static
// textual replacement of the literal `process.env.NEXT_PUBLIC_X` pattern
// at build time -- it cannot follow a dynamic `process.env[name]` lookup,
// which always evaluates to undefined in a production build (confirmed via
// a real Amplify deployment: worked fine under `next dev`, which reads
// process.env live, but every NEXT_PUBLIC_* value was silently undefined
// once actually built and deployed). Each value must be passed in as a
// literal expression so webpack can see and replace it.
function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name} (see .env.example)`);
  }
  return value;
}

export const config = {
  apiBaseUrl: requireEnv("NEXT_PUBLIC_MTA_API_BASE_URL", process.env.NEXT_PUBLIC_MTA_API_BASE_URL),
  cognitoUserPoolId: requireEnv(
    "NEXT_PUBLIC_MTA_COGNITO_USER_POOL_ID",
    process.env.NEXT_PUBLIC_MTA_COGNITO_USER_POOL_ID,
  ),
  cognitoAppClientId: requireEnv(
    "NEXT_PUBLIC_MTA_COGNITO_APP_CLIENT_ID",
    process.env.NEXT_PUBLIC_MTA_COGNITO_APP_CLIENT_ID,
  ),
};
