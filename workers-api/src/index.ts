import { Hono } from "hono";
import { chat } from "./functions/chat";
import { crawlDocs } from "./functions/crawl-docs";

const app = new Hono<{ Bindings: CloudflareBindings }>();

app.use("*", async (c, next) => {
  const originUrl =
    c.env.ENV == "development"
      ? "http://localhost:3000"
      : "https://docsbase.dev";

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
  return c.json(null, 200, {
    "Access-Control-Allow-Origin":
      c.env.ENV == "development"
        ? "http://localhost:3000"
        : "https://docsbase.dev",
    "Access-Control-Allow-Methods": "POST, OPTIONS, GET",
    "Access-Control-Allow-Headers": "*",
    "Access-Control-Max-Age": "86400",
  });
});

app.post("/chat", chat);
app.post("/crawl-docs", crawlDocs);

app.get("/message", (c) => {
  return c.text("Hello Hono!");
});

export default app;
