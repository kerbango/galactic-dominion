// Shared guard for backend ticks that run both on a schedule AND as admin-only
// manual operations. Scheduled automations fire with no user context
// (auth.me() → null), so those runs are allowed through and must use
// asServiceRole for all data access. Manual invocations carry a real user,
// who must be an admin — otherwise 403.
//
// Returns { ok: true } to proceed, or { ok: false, response } to return.
export async function authorizeTick(base44) {
  let user = null;
  try {
    user = await base44.auth.me();
  } catch {
    user = null;
  }
  if (user && user.role !== 'admin') {
    return { ok: false, response: Response.json({ error: 'Forbidden' }, { status: 403 }) };
  }
  return { ok: true };
}