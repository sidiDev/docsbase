import { createServerOnlyFn } from "@tanstack/react-start";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { reactStartCookies } from "better-auth/react-start";
import { convex } from "@convex-dev/better-auth/plugins";
import { convexClient } from "@convex-dev/better-auth/client/plugins";

const getAuthConfig = createServerOnlyFn(() =>
  betterAuth({
    baseURL: process.env.SITE_URL!,
    telemetry: {
      enabled: false,
    },
    // database: drizzleAdapter(db, {
    //   provider: "pg",
    // }),

    // https://www.better-auth.com/docs/integrations/tanstack#usage-tips
    plugins: [reactStartCookies(), convexClient()],

    // https://www.better-auth.com/docs/concepts/session-management#session-caching
    // session: {
    //   cookieCache: {
    //     enabled: true,
    //     maxAge: 5 * 60, // 5 minutes
    //   },
    // },

    // https://www.better-auth.com/docs/concepts/oauth
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },
  })
);

export const auth = getAuthConfig();
