export interface AuthenticatedUser {
  id: string;
  email?: string;
  role?: string;
}

export type TokenVerifier = (token: string) => Promise<AuthenticatedUser | null>;

export function extractBearerToken(authorization: string | undefined): string | null {
  if (!authorization) {
    return null;
  }
  const [scheme, token] = authorization.split(/\s+/);
  if (scheme !== "Bearer" || !token) {
    return null;
  }
  return token;
}

export function isUnauthenticated(request: { user: AuthenticatedUser | null }): boolean {
  return !request.user || !request.user.id;
}