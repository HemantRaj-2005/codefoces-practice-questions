import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";

const SECRET_KEY = new TextEncoder().encode(
  process.env.SESSION_SECRET || "default_super_secret_session_key_which_is_long_and_secure_32_characters"
);
const ALGORITHM = "HS256";
const COOKIE_NAME = "admin_session";
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

export async function encrypt(payload: any) {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: ALGORITHM })
    .setIssuedAt()
    .setExpirationTime("24h")
    .sign(SECRET_KEY);
}

export async function decrypt(input: string): Promise<any> {
  try {
    const { payload } = await jwtVerify(input, SECRET_KEY, {
      algorithms: [ALGORITHM],
    });
    return payload;
  } catch (error) {
    return null;
  }
}

export async function createSession(email: string) {
  const expiresAt = new Date(Date.now() + SESSION_DURATION);
  const session = await encrypt({ email, expiresAt });
  
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, session, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    expires: expiresAt,
    path: "/",
  });
}

export async function destroySession() {
  const cookieStore = await cookies();
  cookieStore.delete(COOKIE_NAME);
}

export async function getSession(): Promise<{ email: string } | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(COOKIE_NAME)?.value;
  if (!sessionCookie) return null;
  
  const payload = await decrypt(sessionCookie);
  if (!payload) return null;
  
  // Check expiration
  if (new Date(payload.expiresAt) < new Date()) {
    return null;
  }
  
  return { email: payload.email as string };
}
export default getSession;
