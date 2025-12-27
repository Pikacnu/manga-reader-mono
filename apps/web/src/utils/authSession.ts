import { auth } from '@/src/utils/auth';
export async function getSession(
  request: Request,
): Promise<ReturnType<typeof auth.api.getSession> | null> {
  const authObject = await auth.api.getSession({
    headers: request.headers,
  });
  if (!authObject || !authObject.user || !authObject.session) {
    return null;
  }
  return authObject;
}
