import { createFileRoute, useLoaderData } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";

const authStateFn = createServerFn({ method: "GET" }).handler(async () => {
  const { isAuthenticated, userId } = await auth();

  if (!isAuthenticated) {
    return { userId: null };
  }

  const user = await clerkClient().users.getUser(userId);
  return { userId, firstName: user?.firstName };
});
export const Route = createFileRoute("/")({
  beforeLoad: () => authStateFn(),
  loader: async ({ params, context }) => {
    return { userId: context?.userId };
  },
  component: App,
});

/**
 * Render the app's main layout with navigation and hero sections.
 *
 * Reads the route loader's `userId` and passes it to the Navbar and Hero components.
 *
 * @returns The rendered React element: a `<main>` containing `Navbar` and `Hero`, each receiving the loader-provided `userId`.
 */
function App() {
  const { userId } = useLoaderData({ from: "/" });

  return (
    <main>
      <Navbar userId={userId} />
      <Hero userId={userId} />
    </main>
  );
}