import { createAuthClient } from "better-auth/react";

const authClient = createAuthClient({
  baseURL: import.meta.env.SITE_URL,
});

export default authClient;
