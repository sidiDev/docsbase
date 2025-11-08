import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/onboarding")({
  component: RouteComponent,
});

function RouteComponent() {
  return <div>Hello "/_authed/onboarding"!</div>;
}
