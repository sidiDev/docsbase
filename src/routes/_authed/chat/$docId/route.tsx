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
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { useUser } from "@clerk/clerk-react";
import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport } from "ai";
import { Id } from "../../../../../convex/_generated/dataModel";
import { UIMessage } from "ai";
import { useAtom } from "jotai";
import { chatMessagesAtom, isStreamingInit } from "@/lib/atoms";
import { createServerFn } from "@tanstack/react-start";
import { auth, clerkClient } from "@clerk/tanstack-react-start/server";
import { ConvexHttpClient } from "convex/browser";
import Messages from "@/components/Messages";
import ThemeSwitcher from "@/components/ThemeSwitcher";

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

    const convexUrl = import.meta.env.VITE_CONVEX_URL;
    const client = new ConvexHttpClient(convexUrl);
    const doc = await client.query(api.docs.getDoc, {
      docId: params.docId as Id<"docs">,
    });

    // Get messages for this chat if we have all required params
    if (params.docId && context.userId && (params as any).id) {
      try {
        if (!convexUrl) {
          console.error("VITE_CONVEX_URL is not set");
          return { messages: [] };
        }

        const messages = await client.query(api.chat.getMessages, {
          chatId: (params as any).id as Id<"chat">,
          docId: params.docId as Id<"docs">,
          externalId: context.userId,
        });

        if (messages === null || messages.length === 0) {
          throw redirect({
            to: "/chat/$docId",
            params: {
              docId: params.docId,
            },
          });
        }

        return { messages, crawlJobId: doc?.crawlJobId || "" };
      } catch (error) {
        // Re-throw redirect errors so they propagate correctly
        if (error instanceof Response || (error as any)?.redirect) {
          throw error;
        }
        console.error("Error fetching messages:", error);
        return { messages: [], crawlJobId: doc?.crawlJobId || "" };
      }
    }

    return { messages: [], crawlJobId: doc?.crawlJobId || "" };
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
  const [chatMessages, setChatMessages] = useAtom(chatMessagesAtom);
  const [isSearchEnabled, setSearchEnabled] = useState(false);
  const [_, setStreamingInit] = useAtom(isStreamingInit);
  const createChat = useMutation(api.chat.createChat);
  const createMessage = useMutation(api.chat.createMessage);
  const navigate = useNavigate();
  const { user } = useUser();

  // Fetch messages client-side when id changes
  const fetchedMessages = useQuery(
    api.chat.getMessages,
    id && docId && user?.id
      ? {
          chatId: id,
          docId: docId as Id<"docs">,
          externalId: user.id,
        }
      : "skip"
  );

  // Use a ref to store the latest user value so it's available in closures
  const userRef = useRef(user);
  // Store the current chat ID (either from route params or newly created)
  const chatIdRef = useRef<string | undefined>(id);
  const docIdRef = useRef<string | undefined>(docId);

  // Store the chat/doc IDs at the time of sending a message (snapshot, not reactive)
  const requestChatIdRef = useRef<string | undefined>(undefined);
  const requestDocIdRef = useRef<string | undefined>(undefined);

  const CLOUDFLARE_API_URL = (import.meta as any).env.VITE_CLOUDFLARE_API_URL!;

  const { messages, sendMessage, setMessages, status, stop } = useChat({
    transport: new DefaultChatTransport({
      api: `${CLOUDFLARE_API_URL}/chat`,
      body: {
        crawlJobId: loaderData.crawlJobId,
        isSearchEnabled: isSearchEnabled,
      },
    }),
    messages: loaderData.messages as UIMessage[],
    onData: async (data) => {
      const { title } = data.data as { title: string };
      if (title && userRef.current?.id) {
        // Only create chat if we're still on the same doc/chat
        if (requestDocIdRef.current !== docIdRef.current) {
          console.log("Chat switched during streaming, aborting chat creation");
          return;
        }

        const chatId = await createChat({
          chat: {
            externalId: userRef.current.id,
            title: title,
            docId: requestDocIdRef.current as any,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          },
        });

        requestChatIdRef.current = chatId as string;
      }
    },
    onError: (error) => {
      console.error("Error during streaming:", error);
      setIsLoading(false);
      setStreamingInit(false);
    },
    onFinish: async ({ message, messages }) => {
      const finalChatId = requestChatIdRef.current;
      const finalDocId = requestDocIdRef.current;

      // Check if we're still on the same chat/doc that initiated this request
      if (!finalChatId || finalDocId !== docIdRef.current) {
        console.log("Chat switched during streaming, discarding messages");
        setIsLoading(false);
        // Reset streaming flags
        isStreamingRef.current = false;
        streamingForChatIdRef.current = undefined;
        return;
      }

      const date = Date.now();
      const chatMessage = {
        role: message.role,
        id: message.id,
        parts: message.parts,
        createdAt: date,
        updatedAt: date,
        chatId: finalChatId as Id<"chat">,
        docId: finalDocId as Id<"docs">,
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
          chatId: finalChatId as Id<"chat">,
          docId: finalDocId as Id<"docs">,
          externalId: userRef.current?.id as string,
        },
      });
      if (chatMessage.parts.length > 0) {
        await createMessage({ message: chatMessage });
      } else {
        setChatMessages((prev) => [...prev.slice(0, -1)]);
      }

      // Now that messages are saved to DB, reset streaming flags
      // This prevents the re-render flash when fetchedMessages updates
      isStreamingRef.current = false;
      streamingForChatIdRef.current = undefined;

      setIsLoading(false);
      if (messages.length == 2) {
        setTimeout(() => {
          navigate({ to: `/chat/${finalDocId}/${finalChatId}` });
        }, 1000);
      }
    },
  });

  const handleSubmit = () => {
    if (!prompt.trim()) return;

    // Capture the current chat/doc IDs at the time of sending
    requestChatIdRef.current = chatIdRef.current;
    requestDocIdRef.current = docIdRef.current;

    setChatMessages([
      ...chatMessages,
      {
        id: crypto.randomUUID(),
        role: "user",
        parts: [{ type: "text", text: prompt }],
      },
    ]);
    setStreamingInit(true);
    sendMessage({ text: prompt });
    setPrompt("");
    setIsLoading(true);
  };

  // Track if we're currently in a streaming session and which chat it belongs to
  const isStreamingRef = useRef<boolean>(false);
  const streamingForChatIdRef = useRef<string | undefined>(undefined);

  // Handle chat/doc changes
  useEffect(() => {
    userRef.current = user;
    const previousChatId = chatIdRef.current;
    const previousDocId = docIdRef.current;

    chatIdRef.current = id;
    docIdRef.current = docId;

    // If chat/doc changed during streaming, abort the stream
    if (
      isStreamingRef.current &&
      (previousChatId !== id || previousDocId !== docId)
    ) {
      console.log("Chat switched during streaming, stopping stream");
      stop();
      setIsLoading(false);
      isStreamingRef.current = false;
      streamingForChatIdRef.current = undefined;
      // Clear request refs since this stream is being abandoned
      requestChatIdRef.current = undefined;
      requestDocIdRef.current = undefined;
    }
  }, [user, id, docId, stop]);

  // Handle loading messages when fetchedMessages updates
  useEffect(() => {
    // Only load messages if we're not streaming for the CURRENT chat
    const isStreamingForCurrentChat =
      isStreamingRef.current && streamingForChatIdRef.current === id;

    if (
      id &&
      fetchedMessages &&
      fetchedMessages.length > 0 &&
      !isStreamingForCurrentChat
    ) {
      const initialMessages = fetchedMessages.map(
        (item: any) =>
          ({
            id: item.id,
            role: item.role,
            parts: item.parts,
          } as UIMessage)
      );

      // Only update if messages actually changed to prevent unnecessary re-renders
      const messagesChanged =
        chatMessages.length !== initialMessages.length ||
        chatMessages.some((msg, idx) => msg.id !== initialMessages[idx]?.id);

      if (messagesChanged) {
        setChatMessages(initialMessages);
        setMessages(initialMessages);
      }
    } else if (!id && !isStreamingForCurrentChat) {
      // Clear messages when no chat is selected
      if (chatMessages.length > 0) {
        setChatMessages([]);
        setMessages([]);
      }
    }
  }, [id, fetchedMessages]);

  // Handle streaming status changes
  useEffect(() => {
    if (status === "streaming") {
      isStreamingRef.current = true;
      streamingForChatIdRef.current = chatIdRef.current;
      // Only update messages if we're still on the same chat that initiated the request
      setStreamingInit(false);
      if (requestDocIdRef.current === docIdRef.current) {
        setChatMessages(messages);
      }
    } else if (
      (status === "ready" || status === "submitted") &&
      isStreamingRef.current
    ) {
      // Streaming just finished, update chat messages one final time if we're still on the same chat
      if (requestDocIdRef.current === docIdRef.current) {
        setChatMessages(messages);
      }
      // Don't reset streaming flags here - let onFinish do it after DB save
      // This prevents re-render flash when fetchedMessages updates
    }
  }, [status, messages]);

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <header className="fixed z-20 top-0 left-0 right-0 flex h-16 shrink-0 items-center gap-2 border-b md:hidden">
          <div className="flex items-center justify-between gap-2 px-4 w-full">
            <SidebarTrigger />
            <ThemeSwitcher />
          </div>
        </header>
        <div className="hidden absolute top-4 right-4 z-20 md:block">
          <ThemeSwitcher />
        </div>
        <ChatContent
          messagesContent={id ? <Outlet /> : <Messages />}
          isLoading={isLoading}
          prompt={prompt}
          setPrompt={setPrompt}
          handleSubmit={handleSubmit}
          stop={stop}
          isSearchEnabled={isSearchEnabled}
          setSearchEnabled={setSearchEnabled}
          setStreamingInit={setStreamingInit}
        />
      </SidebarInset>
    </SidebarProvider>
  );
}
