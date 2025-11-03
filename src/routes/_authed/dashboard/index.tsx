import { Link, Outlet, createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/")({
  component: DashboardComponent,
});

function DashboardComponent() {
  const { user } = Route.useRouteContext();

  console.log(user);

  return <div>Dashboard</div>;
}
