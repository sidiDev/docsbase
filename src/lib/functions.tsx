import { createServerFn } from "@tanstack/react-start";
import { extractNameFromUrl, isValidUrl } from "@/lib/utils";
import Firecrawl from "@mendable/firecrawl-js";

// POST request
export const validateUrl = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data?: { url: string } }) => {
    const url = data?.url;

    if (!url || !isValidUrl(url)) {
      return { success: false, message: "Invalid URL" };
    }

    // 1. Extract base URL (e.g., https://wrapifai.com/tools/ -> https://wrapifai.com)
    const urlObj = new URL(url);
    const baseUrl = urlObj.origin;

    // 2. Check if the URL is accessible
    try {
      const response = await fetch(baseUrl, {
        method: "HEAD",
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (!response.ok) {
        return {
          success: false,
          message: `URL is not accessible (Status: ${response.status})`,
        };
      }
    } catch (error) {
      return {
        success: false,
        message: "Unable to reach the URL. Please check if it's accessible.",
      };
    }

    return { success: true, data: { url, baseUrl } };
  }
);

export const crawlDocs = createServerFn({ method: "POST" }).handler(
  async ({ data }: { data?: { url: string } }) => {
    const firecrawl = new Firecrawl({ apiKey: process.env.FIRECRAWL_API_KEY });
    // const FIRECRAWL_WEBHOOK_URL = process.env.FIRECRAWL_WEBHOOK_URL;
    const FIRECRAWL_WEBHOOK_URL =
      "https://ae31f18ba981.ngrok-free.app/api/webhook/firecrawl";

    const { id } = await firecrawl.startCrawl(data?.url as string, {
      limit: 100,
      crawlEntireDomain: true,
      scrapeOptions: {
        formats: ["markdown"],
      },
      webhook: {
        url: FIRECRAWL_WEBHOOK_URL as string,
        events: ["completed", "started", "page", "failed"],
        metadata: {
          url: data?.url as string,
        },
      },
    });

    const watcher = firecrawl.watcher(id, {
      kind: "crawl",
      pollInterval: 2,
      timeout: 120,
    });

    watcher.on("document", (doc) => {
      console.log("DOC", doc);
    });

    const name = extractNameFromUrl(data?.url as string);

    return { success: true, data: { id, url: data?.url, name } };
  }
);
