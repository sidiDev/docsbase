/// <reference types="vite/client" />

import {
  HeadContent,
  Outlet,
  Scripts,
  createRootRoute,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { TanStackDevtools } from "@tanstack/react-devtools";
import ConvexProvider from "../integrations/convex/provider";
import appCss from "../styles.css?url";
import { ThemeProvider } from "../components/ThemeProvider";
import { DefaultCatchBoundary } from "../components/DefaultCatchBoundary";
import { NotFound } from "../components/NotFound";
import { createServerFn } from "@tanstack/react-start";
import { auth } from "@clerk/tanstack-react-start/server";
import { ClerkProvider } from "@clerk/tanstack-react-start";
import type { QueryClient } from "@tanstack/react-query";
import { authQueryOptions, type AuthQueryResult } from "../lib/queries";

const fetchClerkAuth = createServerFn({ method: "GET" }).handler(async () => {
  const { userId } = await auth();

  return {
    userId,
  };
});

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient;
  user: AuthQueryResult;
}>()({
  beforeLoad: ({ context }) => {
    // we're using react-query for client-side caching to reduce client-to-server calls, see /src/router.tsx
    // better-auth's cookieCache is also enabled server-side to reduce server-to-db calls, see /src/lib/auth/auth.ts
    context.queryClient.prefetchQuery(authQueryOptions());

    // typically we don't need the user immediately in landing pages,
    // so we're only prefetching here and not awaiting.
    // for protected routes with loader data, see /(authenticated)/route.tsx
  },
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  errorComponent: (props) => {
    return (
      <RootDocument>
        <DefaultCatchBoundary {...props} />
      </RootDocument>
    );
  },
  notFoundComponent: () => <NotFound />,
  shellComponent: RootComponent,
});

function RootComponent() {
  return (
    <RootDocument>
      <Outlet />
    </RootDocument>
  );
}

function RootDocument({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <ThemeProvider>
          <ConvexProvider>
            {children}
            <TanStackDevtools
              config={{
                position: "bottom-right",
              }}
              plugins={[
                {
                  name: "Tanstack Router",
                  render: <TanStackRouterDevtoolsPanel />,
                },
              ]}
            />
          </ConvexProvider>
        </ThemeProvider>
        <Scripts />
      </body>
    </html>
  );
}
