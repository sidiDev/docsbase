import {
  MutationCache,
  QueryClient,
  notifyManager,
} from "@tanstack/react-query";
import { createRouter as createTanStackRouter } from "@tanstack/react-router";
import { ConvexQueryClient } from "@convex-dev/react-query";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { routeTree } from "./routeTree.gen";
import { ClerkProvider, useAuth } from "@clerk/clerk-react";
import { AutumnWrapper } from "./lib/autumn";
import * as Sentry from "@sentry/tanstackstart-react";

export function getRouter() {
  if (typeof document !== "undefined") {
    notifyManager.setScheduler(window.requestAnimationFrame);
  }

  const CONVEX_URL = (import.meta as any).env.VITE_CONVEX_URL!;

  if (!CONVEX_URL) {
    console.error("missing envar CONVEX_URL");
  }
  const convexQueryClient = new ConvexQueryClient(CONVEX_URL);

  const queryClient: QueryClient = new QueryClient({
    defaultOptions: {
      queries: {
        queryKeyHashFn: convexQueryClient.hashFn(),
        queryFn: convexQueryClient.queryFn(),
      },
    },
    mutationCache: new MutationCache({
      onError: () => {
        //  toast(error.message, { className: "bg-red-500 text-white" });
      },
    }),
  });
  convexQueryClient.connect(queryClient);

  const router = createTanStackRouter({
    routeTree,
    defaultPreload: "intent",
    defaultErrorComponent: () => "Error!",
    defaultNotFoundComponent: () => "Not found!",
    context: { queryClient } as any,
    Wrap: ({ children }) => (
      <ClerkProvider
        publishableKey={(import.meta as any).env.VITE_CLERK_PUBLISHABLE_KEY!}
      >
        <ConvexProviderWithClerk
          client={convexQueryClient.convexClient}
          useAuth={useAuth}
        >
          <AutumnWrapper>{children}</AutumnWrapper>
        </ConvexProviderWithClerk>
      </ClerkProvider>
    ),
  });

  if (!router.isServer) {
    Sentry.init({
      dsn: "https://5ceff1e511e1aba1df2f925bb07f1e46@o4508194135146496.ingest.de.sentry.io/4510373993119824",

      // Adds request headers and IP for users, for more info visit:
      // https://docs.sentry.io/platforms/javascript/guides/tanstackstart-react/configuration/options/#sendDefaultPii
      sendDefaultPii: true,
    });
  }

  return router;
}

// Export as createRouter for backwards compatibility
export const createRouter = getRouter;

declare module "@tanstack/react-router" {
  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
