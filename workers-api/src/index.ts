import { Hono } from "hono";
import { chat } from "./functions/chat";
import { crawlDocs } from "./functions/crawl-docs";

const app = new Hono<{ Bindings: CloudflareBindings }>();

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type",
};

app.use("*", async (c, next) => {
  const originUrl = "*";

  // Add CORS headers to every response
  c.res.headers.set("Access-Control-Allow-Origin", originUrl);
  c.res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS, GET");
  c.res.headers.set("Access-Control-Allow-Headers", "*");
  c.res.headers.set("Access-Control-Max-Age", "86400");

  // Handle OPTIONS request
  if (c.req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: c.res.headers,
    });
  }
  await next();
});

app.options("*", (c) => {
  return c.json(null, 200, corsHeaders);
});

app.post("/chat", chat);
app.post("/crawl-docs", crawlDocs);

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

export default app;
