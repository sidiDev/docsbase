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
import { Home, Inbox, Search, Sparkles } from "lucide-react";
import ThemeSwitcher from "./ThemeSwitcher";
import { useUser } from "@clerk/clerk-react";

const navMain = [
  {
    title: "Home",
    url: "/dashboard",
    icon: Home,
    isActive: true,
  },
  {
    title: "Search",
    url: "#",
    icon: Search,
  },
  {
    title: "Ask AI",
    url: "#",
    icon: Sparkles,
  },
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
    badge: "10",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();

  const userData = {
    name: user?.fullName || user?.firstName || "User",
    email: user?.primaryEmailAddress?.emailAddress || "",
    avatar: user?.imageUrl || "",
  };

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
                <SidebarMenuButton asChild isActive={item.isActive}>
                  <a href={item.url}>
                    <item.icon />
                    <span>{item.title}</span>
                  </a>
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
