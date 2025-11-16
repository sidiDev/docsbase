import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { clerkClient, auth } from "@clerk/tanstack-react-start/server";

const authStateFn = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    throw redirect({
      to: "/",
    });
  }

  const user = await clerkClient().users.getUser(userId);
  return { userId, firstName: user?.firstName };
});

export const Route = createFileRoute("/_authed")({
  beforeLoad: () => authStateFn(),
  component: AuthedLayout,
});

function AuthedLayout() {
  // Simply render protected routes - auth check is done in beforeLoad
  return <Outlet />;
}
