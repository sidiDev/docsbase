import * as React from "react";
import { Ellipsis, PlusIcon, Pencil, Trash2 } from "lucide-react";
import { useQuery, useMutation } from "convex/react";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface ChatMenuItemProps {
  chat: {
    _id: Id<"chat">;
    title: string;
  };
  docId: string;
  currentId: string | undefined;
  userExternalId: string | undefined;
}

function ChatMenuItem({
  chat,
  docId,
  currentId,
  userExternalId,
}: ChatMenuItemProps) {
  const navigate = useNavigate();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = React.useState(false);
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = React.useState(false);
  const [newTitle, setNewTitle] = React.useState(chat.title);
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const deleteChat = useMutation(api.chat.deleteChat);
  const updateChatTitle = useMutation(api.chat.updateChatTitle);

  const handleDelete = async () => {
    if (!userExternalId) return;

    try {
      await deleteChat({
        chatId: chat._id,
        externalId: userExternalId,
      });
      setIsDeleteDialogOpen(false);

      // Navigate away if currently viewing this chat
      if (currentId === chat._id) {
        navigate({ to: `/chat/${docId}` });
      }
    } catch (error) {
      console.error("Failed to delete chat:", error);
    }
  };

  const handleUpdate = async () => {
    if (!userExternalId || !newTitle.trim()) return;

    try {
      await updateChatTitle({
        chatId: chat._id,
        externalId: userExternalId,
        title: newTitle.trim(),
      });
      setIsUpdateDialogOpen(false);
    } catch (error) {
      console.error("Failed to update chat title:", error);
    }
  };

  return (
    <>
      <SidebarMenuItem className="group/item">
        <div className="flex items-center w-full gap-1 relative">
          <SidebarMenuButton
            asChild
            isActive={chat._id === currentId}
            className="flex-1 pr-8"
          >
            <Link to="/chat/$docId/$id" params={{ docId, id: chat._id }}>
              <span className="truncate">{chat.title}</span>
            </Link>
          </SidebarMenuButton>

          <DropdownMenu open={isDropdownOpen} onOpenChange={setIsDropdownOpen}>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 shrink-0 absolute right-1 opacity-0 group-hover/item:opacity-100 data-[state=open]:opacity-100 transition-opacity"
                onClick={(e) => e.stopPropagation()}
              >
                <Ellipsis className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  setNewTitle(chat.title);
                  setIsUpdateDialogOpen(true);
                }}
              >
                <Pencil className="mr-2 h-4 w-4" />
                Rename
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </SidebarMenuItem>

      {/* Delete Dialog */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Chat</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete "{chat.title}"? This action cannot
              be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsDeleteDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Update Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={setIsUpdateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rename Chat</DialogTitle>
            <DialogDescription>
              Enter a new title for this chat.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="title">Chat Title</Label>
              <Input
                id="title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Enter chat title"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    handleUpdate();
                  }
                }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsUpdateDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={!newTitle.trim()}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

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
            disabled={!selectedDoc}
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
              <ChatMenuItem
                key={index}
                chat={item}
                docId={docId}
                currentId={id}
                userExternalId={user?.id}
              />
            ))}
          </SidebarMenu>
        </SidebarGroup>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
