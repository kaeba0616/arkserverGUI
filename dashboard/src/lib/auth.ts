import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

const SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "ark-dashboard-secret-change-me"
);
const COOKIE_NAME = "ark-dashboard-token";

export async function verifyPassword(password: string): Promise<boolean> {
  const hash = process.env.DASHBOARD_PASSWORD_HASH;
  if (!hash) return password === (process.env.ADMIN_PASSWORD || "admin");
  return bcrypt.compare(password, hash);
}

export async function createToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("24h")
    .setIssuedAt()
    .sign(SECRET);
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, SECRET);
    return true;
  } catch {
    return false;
  }
}

export async function getAuthToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  return cookieStore.get(COOKIE_NAME)?.value;
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  if (!token) return false;
  return verifyToken(token);
}

export function hashPassword(password: string): string {
  return bcrypt.hashSync(password, 10);
}
