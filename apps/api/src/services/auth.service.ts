import prisma from "../config/prisma";
import { comparePassword } from "../utils/password";
import { signAccessToken, signRefreshToken } from "../utils/jwt";

interface AuthErrorContext {
  userId?: string | null;
  institutionId?: string | null;
}

export class AuthError extends Error {
  statusCode: number;
  userId: string | null;
  institutionId: string | null;

  constructor(message: string, statusCode = 401, context: AuthErrorContext = {}) {
    super(message);
    this.statusCode = statusCode;
    this.userId = context.userId ?? null;
    this.institutionId = context.institutionId ?? null;
  }
}

export async function loginUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user) {
    throw new AuthError("Invalid email or password.");
  }

  const context = { userId: user.id, institutionId: user.institutionId };

  if (user.status !== "ACTIVE") {
    throw new AuthError("This account has been deactivated.", 403, context);
  }

  const passwordMatches = await comparePassword(password, user.passwordHash);

  if (!passwordMatches) {
    throw new AuthError("Invalid email or password.", 401, context);
  }

  const payload = {
    userId: user.id,
    role: user.role,
    institutionId: user.institutionId,
  };

  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  });

  return {
    accessToken,
    refreshToken,
    user: {
      id: user.id,
      email: user.email,
      role: user.role,
      institutionId: user.institutionId,
    },
  };
}