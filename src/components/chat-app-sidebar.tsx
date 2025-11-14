import * as React from "react";
import { GalleryVerticalEnd, HomeIcon, PlusIcon } from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useNavigate, useParams } from "@tanstack/react-router";
import Brand from "./Brand";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { useUser } from "@clerk/clerk-react";
import { Id } from "convex/_generated/dataModel";

// This is sample data.
const data = [
  {
    title: "Routing",
    url: "#",
  },
  {
    title: "Data Fetching",
    url: "#",
    isActive: true,
  },
  {
    title: "Rendering",
    url: "#",
  },
  {
    title: "Caching",
    url: "#",
  },
  {
    title: "Styling",
    url: "#",
  },
  {
    title: "Optimizing",
    url: "#",
  },
  {
    title: "Configuring",
    url: "#",
  },
  {
    title: "Testing",
    url: "#",
  },
  {
    title: "Authentication",
    url: "#",
  },
  {
    title: "Deploying",
    url: "#",
  },
  {
    title: "Upgrading",
    url: "#",
  },
  {
    title: "Examples",
    url: "#",
  },
  {
    title: "Testing",
    url: "#",
  },
  {
    title: "Authentication",
    url: "#",
  },
  {
    title: "Deploying",
    url: "#",
  },
  {
    title: "Upgrading",
    url: "#",
  },
  {
    title: "Examples",
    url: "#",
  },
  {
    title: "Testing",
    url: "#",
  },
  {
    title: "Authentication",
    url: "#",
  },
  {
    title: "Deploying",
    url: "#",
  },
  {
    title: "Upgrading",
    url: "#",
  },
  {
    title: "Examples",
    url: "#",
  },
];

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { user } = useUser();
  const params = useParams({ strict: false });
  const docId = params.docId as string;
  const id = params.id as string | undefined;
  const navigate = useNavigate();

  const docs = useQuery(
    api.docs.getDocsByExternalId,
    user?.id ? { externalId: user.id, noPages: true } : "skip"
  );

  const chats = useQuery(
    api.chat.getChats,
    user?.id && docId
      ? { externalId: user.id, docId: docId as Id<"docs"> }
      : "skip"
  );

  const selectedDoc = docs?.find((doc) => doc._id === docId) || null;

  return (
    <Sidebar {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <Brand
                href={`/chat/${selectedDoc?._id}`}
                className="justify-start"
              />
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <div className="px-2">
          <Button
            onClick={() => {
              navigate({
                to: selectedDoc
                  ? `/chat/${selectedDoc._id}`
                  : `/chat/${docs?.[0]?._id}`,
              });
            }}
            variant="outline"
            size="sm"
            className="w-full"
          >
            <PlusIcon className="size-4" />
            New chat
          </Button>
        </div>
        <Select
          value={selectedDoc?._id || ""}
          onValueChange={(value) => {
            navigate({ to: `/chat/${value}` });
          }}
        >
          <SelectTrigger className="w-full border-none shadow-none px-2">
            <SelectValue placeholder="Loading..." />
          </SelectTrigger>
          <SelectContent>
            {docs?.map((doc) => (
              <SelectItem key={doc._id} value={doc._id}>
                {doc.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <SidebarMenuItem>
          <SidebarMenuButton asChild isActive={false}>
            <Link to="/dashboard">
              <span>Dashboard</span>
            </Link>
          </SidebarMenuButton>
        </SidebarMenuItem>
        <Separator />
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarMenu>
            {chats?.map((item, index) => (
              <SidebarMenuItem key={index}>
                <SidebarMenuButton asChild isActive={item._id === id}>
                  <Link to="/chat/$docId/$id" params={{ docId, id: item._id }}>
                    <span>{item.title}</span>
                  </Link>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
