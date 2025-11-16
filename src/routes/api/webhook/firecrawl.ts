import { createFileRoute } from "@tanstack/react-router";
import crypto from "crypto";
import Firecrawl from "@mendable/firecrawl-js";
import { ConvexHttpClient } from "convex/browser";
import { api } from "../../../../convex/_generated/api";
import { Index } from "@upstash/vector";
import OpenAI from "openai";

const vectorIndex = new Index({
  url: process.env.UPSTASH_VECTOR_REST_URL!,
  token: process.env.UPSTASH_VECTOR_REST_TOKEN!,
});

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export const Route = createFileRoute("/api/webhook/firecrawl")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        // Get RAW body text first (for signature verification)
        const bodyText = await request.text();

        const signature = request.headers.get("X-Firecrawl-Signature");
        const webhookSecret = process.env.FIRECRAWL_WEBHOOK_SECRET;

        if (!signature || !webhookSecret) {
          console.error("Missing signature or webhook secret");
          return new Response("Unauthorized", { status: 401 });
        }

        // Extract hash from signature header
        const [algorithm, hash] = signature.split("=");
        if (algorithm !== "sha256") {
          console.error("Invalid signature algorithm:", algorithm);
          return new Response("Invalid signature algorithm", { status: 401 });
        }

        // Compute expected signature using RAW body text
        const expectedSignature = crypto
          .createHmac("sha256", webhookSecret)
          .update(bodyText)
          .digest("hex");

        if (
          !crypto.timingSafeEqual(
            Buffer.from(hash, "hex"),
            Buffer.from(expectedSignature, "hex")
          )
        ) {
          console.error("Invalid signature");
          return new Response("Invalid signature", { status: 401 });
        }

        // Now parse the JSON after signature verification
        const event = JSON.parse(bodyText);

        console.log("WEBHOOK EVENT", event.type);

        if (event.type === "crawl.completed") {
          const firecrawl = new Firecrawl({
            apiKey: process.env.FIRECRAWL_API_KEY,
          });
          const { data } = await firecrawl.getCrawlStatus(event.id);

          const docsData = data.map((item) => ({
            url: item.metadata?.sourceURL || "",
            title: item.metadata?.title || "",
            content: item.markdown || "",
            createdAt: Date.now(),
            updatedAt: Date.now(),
          }));
          const convex = new ConvexHttpClient(
            process.env.VITE_CONVEX_URL as string
          );
          const docId = await convex.mutation(api.docs.updateDocPages, {
            crawlJobId: event.id,
            completed: true,
            pages: docsData.map((doc) => ({
              url: doc.url,
              title: doc.title,
              content: "",
              createdAt: doc.createdAt,
              updatedAt: doc.updatedAt,
            })),
          });

          const embeddingResponse = await openai.embeddings.create({
            model: "text-embedding-3-small",
            input: docsData.map((doc) => doc.content), // Array of all content
          });

          const vectors = docsData.map((doc, index) => ({
            id: `${docId}-page-${index}`, // or use doc IDs from Convex
            vector: embeddingResponse.data[index].embedding,
            metadata: {
              url: doc.url,
              title: doc.title,
              crawlJobId: event.id,
              createdAt: doc.createdAt,
            },
          }));

          // 4. Batch upsert to Upstash (ONE API CALL!)
          await vectorIndex.upsert(vectors);
        }

        console.log("crawl.completed. Document updated");

        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      },
    },
  },
});
