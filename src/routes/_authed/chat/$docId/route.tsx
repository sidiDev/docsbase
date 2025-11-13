import {
  createFileRoute,
  Outlet,
  useNavigate,
  useParams,
  redirect,
  useLoaderData,
} from "@tanstack/react-router";
import { AppSidebar } from "@/components/chat-app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import ChatContent from "@/components/chat-content";
import { useEffect, useState, useRef } from "react";
import { useConvex } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useMutation } from "convex/react";
import { useUser } from "@clerk/clerk-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Id } from "../../../../../convex/_generated/dataModel";
import { UIMessage } from "ai";
import { useAtom } from "jotai";
import { chatMessagesAtom } from "@/lib/atoms";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { ConvexHttpClient } from "convex/browser";

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

export const Route = createFileRoute("/_authed/chat/$docId")({
  beforeLoad: () => authStateFn(),
  loader: async ({ params, context }) => {
    console.log("Loader called", params);

    // Get messages for this chat if we have all required params
    if (params.docId && context.userId && (params as any).id) {
      try {
        const convexUrl = process.env.VITE_CONVEX_URL;
        if (!convexUrl) {
          console.error("VITE_CONVEX_URL is not set");
          return { messages: [] };
        }

        const client = new ConvexHttpClient(convexUrl);
        const messages = await client.query(api.chat.getMessages, {
          chatId: (params as any).id as Id<"chat">,
          docId: params.docId as Id<"docs">,
          externalId: context.userId,
        });

        console.log("params.docId", params.docId);

        return { messages };
      } catch (error) {
        console.error("Error fetching messages:", error);
        return { messages: [] };
      }
    }

    return { messages: [] };
  },
  component: RouteComponent,
});

function RouteComponent() {
  const params = useParams({ strict: false });
  const docId = params.docId as string;
  const id = params.id as string | undefined; // id might not exist at this route
  const loaderData = useLoaderData({ from: "/_authed/chat/$docId" });

  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [, setChatMessages] = useAtom(chatMessagesAtom);

  const convex = useConvex();
  const createChat = useMutation(api.chat.createChat);
  const createMessage = useMutation(api.chat.createMessage);
  const navigate = useNavigate();
  const { user } = useUser();

  // Use a ref to store the latest user value so it's available in closures
  const userRef = useRef(user);
  // Store the current chat ID (either from route params or newly created)
  const chatIdRef = useRef<string | undefined>(id);
  const docIdRef = useRef<string | undefined>(docId);

  const CLOUDFLARE_API_URL = (import.meta as any).env.VITE_CLOUDFLARE_API_URL!;

  const { messages, sendMessage, setMessages } = useChat({
    transport: new DefaultChatTransport({
      api: `${CLOUDFLARE_API_URL}/chat`,
    }),
    messages: loaderData.messages as UIMessage[],
    id: id,
    onData: async (data) => {
      const { title } = data.data as { title: string };
      if (title && userRef.current?.id) {
        const chatId = await createChat({
          chat: {
            externalId: userRef.current.id,
            title: title,
            docId: docId as any,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });

        chatIdRef.current = chatId as string;
        navigate({ to: `/chat/${docId}/${chatId}` });
      }
    },
    onFinish: async ({ message, messages }) => {
      if (!chatIdRef.current) return;

      const date = Date.now();
      const chatMessage = {
        role: message.role,
        id: message.id,
        parts: message.parts,
        createdAt: date,
        updatedAt: date,
        chatId: chatIdRef.current as Id<"chat">,
        docId: docIdRef.current as Id<"docs">,
        externalId: userRef.current?.id as string,
      };
      const userMessage = messages[messages.length - 2];
      await createMessage({
        message: {
          role: userMessage.role,
          id: userMessage.id,
          parts: userMessage.parts,
          createdAt: date,
          updatedAt: date,
          chatId: chatIdRef.current as Id<"chat">,
          docId: docIdRef.current as Id<"docs">,
          externalId: userRef.current?.id as string,
        },
      });
      await createMessage({ message: chatMessage });
      setIsLoading(false);
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    sendMessage({ text: prompt });
    setPrompt("");
    setIsLoading(true);
  };

  useEffect(() => {
    console.log("hello world");
  }, []);

  useEffect(() => {
    userRef.current = user;
    chatIdRef.current = id;
    docIdRef.current = docId;

    // Use loader data if available, otherwise fetch client-side
    if (loaderData?.messages && loaderData.messages.length > 0) {
      const initialMessages = loaderData.messages.map(
        (item: any) =>
          ({
            id: item.id,
            role: item.role,
            parts: item.parts,
          } as UIMessage)
      );
      console.log("initialMessages", initialMessages);
      setChatMessages(initialMessages);
      setMessages(initialMessages);
    }

    if (!id) {
      setChatMessages([]);
    }
  }, [user, id, docId, convex, loaderData]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="flex h-16 shrink-0 items-center gap-2 border-b hidden">
          <div className="flex items-center gap-2 px-3">
            <SidebarTrigger />
          </div>
        </header>
        <ChatContent
          messagesContent={<Outlet />}
          isLoading={isLoading}
          prompt={prompt}
          setPrompt={setPrompt}
          handleSubmit={handleSubmit}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
