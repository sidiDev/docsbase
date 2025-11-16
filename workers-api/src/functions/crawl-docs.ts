import { Context } from "hono";
import Firecrawl from "@mendable/firecrawl-js";
import { extractNameFromUrl, isValidUrl } from "../utils";

export const crawlDocs = async (
  c: Context<{ Bindings: CloudflareBindings }>
) => {
  try {
    const body = await c.req.json();
    const { url } = body as { url: string };

    if (!url || !isValidUrl(url)) {
      return c.json({ success: false, message: "Invalid URL" }, 400);
    }

    const env = c.env as CloudflareBindings;

    console.log(env.ENV);

    const firecrawl = new Firecrawl({
      apiKey: env.FIRECRAWL_API_KEY,
    }) as any;

    const FIRECRAWL_WEBHOOK_URL = env.FIRECRAWL_WEBHOOK_URL;

    // Start the crawl
    const { id } = await firecrawl.startCrawl(url, {
      limit: 120,
      //   crawlEntireDomain: true,
      scrapeOptions: {
        formats: ["markdown"],
      },
      maxDiscoveryDepth: 1,
      sitemap: "skip",
      webhook: {
        url: FIRECRAWL_WEBHOOK_URL as string,
        events: ["completed", "started", "page", "failed"],
        metadata: { url },
      },
    });

    const name = extractNameFromUrl(url);

    // Create SSE stream to send real-time updates
    const { readable, writable } = new TransformStream();
    const writer = writable.getWriter();
    const encoder = new TextEncoder();

    // Start streaming in the background
    (async () => {
      let isClosed = false;

      const safeEnqueue = async (data: string) => {
        if (!isClosed) {
          try {
            await writer.write(encoder.encode(data));
          } catch (error) {
            console.error("Error enqueueing data:", error);
            isClosed = true;
          }
        }
      };

      const safeClose = async () => {
        if (!isClosed) {
          isClosed = true;
          await writer.close();
        }
      };

      try {
        // Send initial data
        await safeEnqueue(
          `data: ${JSON.stringify({
            type: "started",
            data: { id, url, name },
          })}\n\n`
        );

        // Set up watcher to stream documents
        console.log("Setting up watcher for crawl ID:", id);

        const watcher = firecrawl.watcher(id, {
          kind: "crawl",
          pollInterval: 2,
          timeout: 300,
        });

        watcher.on("document", (doc: any) => {
          console.log("Watcher received document:", doc.metadata?.sourceURL);
          const now = Date.now();
          const event = {
            type: "document",
            data: {
              url: doc.metadata?.sourceURL || "",
              title: doc.metadata?.title || "Untitled",
              content: doc.markdown || "",
              createdAt: now,
              updatedAt: now,
            },
          };
          console.log("Sending document event to client");
          safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
        });

        watcher.on("done", async (data: any) => {
          const event = {
            type: "done",
            data: {
              total: data.total,
              completed: data.completed,
              creditsUsed: data.creditsUsed,
            },
          };
          await safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
          await safeClose();
        });

        watcher.on("error", async (error: any) => {
          const event = {
            type: "error",
            data: { message: error.message || "Unknown error" },
          };
          await safeEnqueue(`data: ${JSON.stringify(event)}\n\n`);
          await safeClose();
        });

        await watcher.start();
      } catch (error) {
        console.error("Watcher error:", error);
        await safeClose();
      }
    })();

    return new Response(readable, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
      },
    });
  } catch (error) {
    console.error("Crawl error:", error);
    return c.json(
      {
        success: false,
        message: error instanceof Error ? error.message : "Unknown error",
      },
      500
    );
  }
};
