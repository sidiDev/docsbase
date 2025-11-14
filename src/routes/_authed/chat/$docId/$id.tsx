import { createFileRoute } from "@tanstack/react-router";
import Messages from "@/components/Messages";
// Initial chat messages

export const Route = createFileRoute("/_authed/chat/$docId/$id")({
  component: RouteComponent,
});

function RouteComponent() {
  return <Messages />;
}
