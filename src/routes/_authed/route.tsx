import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed")({
  beforeLoad: async ({ location }) => {
    // Access Clerk auth state from window (available after Clerk loads)
    if (typeof window !== "undefined") {
      // Get the Clerk instance from the window
      let clerk = (window as any).Clerk;

      // Wait for Clerk to be loaded
      if (!clerk?.loaded) {
        // Wait a bit for Clerk to initialize
        await new Promise((resolve) => {
          const checkClerk = () => {
            const c = (window as any).Clerk;
            if (c?.loaded) {
              resolve(true);
            } else {
              setTimeout(checkClerk, 50);
            }
          };
          checkClerk();
        });
        // Re-fetch clerk after it's loaded
        clerk = (window as any).Clerk;
      }

      // Check if user has an active session (more reliable than just checking user object)
      const isSignedIn =
        clerk?.session !== null && clerk?.session !== undefined;

      if (!isSignedIn) {
        throw redirect({
          to: "/",
          search: {
            redirect: location.href,
          },
        });
      }
    }
  },
  component: AuthedLayout,
});

function AuthedLayout() {
  // Simply render protected routes - auth check is done in beforeLoad
  return <Outlet />;
}
