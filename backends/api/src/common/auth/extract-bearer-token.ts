export function extractBearerToken(
  authorizationHeader: string | string[] | undefined
): string | null {
  const header = Array.isArray(authorizationHeader) ? authorizationHeader[0] : authorizationHeader;

  if (!header) {
    return null;
  }

  const [type, token] = header.split(' ');

  if (type !== 'Bearer' || !token) {
    return null;
  }

  return token;
}
