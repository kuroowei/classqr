const REQUIRED_VARS = ["DATABASE_URL", "JWT_SECRET", "JWT_REFRESH_SECRET"];
const SECRET_VARS = ["JWT_SECRET", "JWT_REFRESH_SECRET"];

export function validateEnv(): void {
  const missing = REQUIRED_VARS.filter((name) => !process.env[name]);

  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
  }

  const isProduction = process.env.NODE_ENV === "production";
  const weak = SECRET_VARS.filter((name) => (process.env[name] ?? "").length < 32);

  if (weak.length > 0) {
    const message = `${weak.join(", ")} should be at least 32 characters long.`;

    if (isProduction) {
      throw new Error(message);
    }

    console.warn(`Warning: ${message}`);
  }

  if (isProduction && process.env.JWT_SECRET === process.env.JWT_REFRESH_SECRET) {
    throw new Error("JWT_SECRET and JWT_REFRESH_SECRET must be different.");
  }
}