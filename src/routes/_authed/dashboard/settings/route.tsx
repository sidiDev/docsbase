import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { Separator } from "@/components/ui/separator";
import { SidebarMenuButton } from "@/components/ui/sidebar";
import { useLocation } from "@tanstack/react-router";

export const Route = createFileRoute("/_authed/dashboard/settings")({
  component: RouteComponent,
});

const settingsMenu = [
  {
    title: "General",
    url: "/dashboard/settings",
  },
  {
    title: "Billing",
    url: "/dashboard/settings/billing",
  },
];

function RouteComponent() {
  const location = useLocation();

  return (
    <div className="py-4">
      <h1 className="text-xl font-bold mb-6">Settings</h1>
      <Separator />
      <div className="flex mt-6 gap-6 xl:gap-24">
        <div className="flex flex-col gap-2 text-sm max-w-[150px] flex-1">
          {settingsMenu.map((item) => (
            <SidebarMenuButton
              className="w-full"
              asChild
              isActive={location.pathname === item.url}
            >
              <Link to={item.url}>{item.title}</Link>
            </SidebarMenuButton>
          ))}
        </div>
        <Outlet />
      </div>
    </div>
  );
}
