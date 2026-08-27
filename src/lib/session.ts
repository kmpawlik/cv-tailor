export type SessionData = { authed?: boolean };

export async function getSession() {
  return { authed: true, save: async () => {}, destroy: () => {} };
}

export async function requireAuth() {
  return { authed: true };
}
