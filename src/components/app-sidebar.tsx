import * as React from "react";
import Brand from "./Brand";
import { NavUser } from "@/components/nav-user";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Home, MessageCircle, Settings } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { useUser } from "@clerk/clerk-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Link, useLocation } from "@tanstack/react-router";

const navMain = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Chat",
    url: "/chat/id",
    icon: MessageCircle,
  },
  {
    title: "Settings",
    url: "/dashboard/settings",
    icon: Settings,
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const { pathname } = useLocation();

  // Fetch Convex user data to get custom updates
  const convexUser = useQuery(
    api.users.getUserByExternalId,
    user?.id ? { externalId: user.id } : "skip"
  );

  const doc = useQuery(
    api.docs.getSingleDocsByExternalId,
    user?.id ? { externalId: user.id } : "skip"
  );

  // Maintain stable user data state to prevent flashing
  const [userData, setUserData] = React.useState(() => ({
    name: user?.fullName || user?.firstName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl || "",
  }));

  // Update user data only when we have actual changes
  React.useEffect(() => {
    if (!user) return;

    // Build display name with priority: Convex > Clerk
    const firstName = convexUser?.firstName || user.firstName || "";
    const lastName = convexUser?.lastName || user.lastName || "";
    const displayName =
      [firstName, lastName].filter(Boolean).join(" ") ||
      user.fullName ||
      "User";

    // Build avatar with priority: Convex > Clerk
    const avatar = convexUser?.pictureUrl || user.imageUrl || "";
    const email = user.primaryEmailAddress?.emailAddress || "";

    // Only update if values actually changed
    setUserData((prev) => {
      if (
        prev.name === displayName &&
        prev.avatar === avatar &&
        prev.email === email
      ) {
        return prev; // No change, keep same reference
      }
      return { name: displayName, email, avatar };
    });
  }, [
    convexUser?.firstName,
    convexUser?.lastName,
    convexUser?.pictureUrl,
    user?.firstName,
    user?.lastName,
    user?.fullName,
    user?.imageUrl,
    user?.primaryEmailAddress?.emailAddress,
    user,
  ]);

  return (
    <Sidebar variant="floating" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Brand href="/dashboard" className="justify-start" />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {navMain.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild isActive={pathname === item.url}>
                  <Link
                    to={item.title === "Chat" ? `/chat/${doc?._id}` : item.url}
                  >
                    <item.icon />
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center gap-2">
          <ThemeSwitcher />
          <p className="text-sm">Theme</p>
        </div>
        <NavUser user={userData} />
      </SidebarFooter>
    </Sidebar>
  );
}
