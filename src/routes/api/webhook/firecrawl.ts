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
          try {
            console.log(`Processing crawl ${event.id}...`);

            const firecrawl = new Firecrawl({
              apiKey: process.env.FIRECRAWL_API_KEY,
            });
            const { data } = await firecrawl.getCrawlStatus(event.id);
            console.log(`Got ${data.length} pages from Firecrawl`);

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

            // Chunk documents to avoid token limits
            const MAX_CHUNK_SIZE = 6000; // ~1500 tokens per chunk (safe margin)
            const allChunks: { content: string; metadata: any }[] = [];

            docsData.forEach((doc, docIndex) => {
              const content = doc.content;

              // If content is short enough, use as single chunk
              if (content.length <= MAX_CHUNK_SIZE) {
                allChunks.push({
                  content: content,
                  metadata: {
                    docId: docId,
                    url: doc.url,
                    title: doc.title,
                    crawlJobId: event.id,
                    createdAt: doc.createdAt,
                    pageIndex: docIndex,
                    chunkIndex: 0,
                    totalChunks: 1,
                  },
                });
              } else {
                // Split into overlapping chunks
                const overlap = 200; // Small overlap to maintain context
                let chunkIndex = 0;

                for (
                  let i = 0;
                  i < content.length;
                  i += MAX_CHUNK_SIZE - overlap
                ) {
                  const chunk = content.slice(i, i + MAX_CHUNK_SIZE);

                  allChunks.push({
                    content: chunk,
                    metadata: {
                      docId: docId,
                      url: doc.url,
                      title: doc.title,
                      crawlJobId: event.id,
                      createdAt: doc.createdAt,
                      pageIndex: docIndex,
                      chunkIndex: chunkIndex++,
                      totalChunks: Math.ceil(
                        content.length / (MAX_CHUNK_SIZE - overlap)
                      ),
                    },
                  });
                }
              }
            });

            console.log(
              `Processing ${allChunks.length} chunks for embedding...`
            );

            // Process embeddings in batches to avoid API limits
            const BATCH_SIZE = 100; // OpenAI recommends max 2048 for text-embedding-3-small
            const vectors: { id: string; vector: number[]; metadata: any }[] =
              [];

            for (let i = 0; i < allChunks.length; i += BATCH_SIZE) {
              const batch = allChunks.slice(i, i + BATCH_SIZE);
              console.log(
                `Processing batch ${Math.floor(i / BATCH_SIZE) + 1}/${Math.ceil(
                  allChunks.length / BATCH_SIZE
                )}...`
              );

              const embeddingResponse = await openai.embeddings.create({
                model: "text-embedding-3-small",
                input: batch.map((chunk) => chunk.content),
              });

              batch.forEach((chunk, batchIndex) => {
                vectors.push({
                  id: `${docId}-p${chunk.metadata.pageIndex}-c${chunk.metadata.chunkIndex}`, // Unique ID per chunk
                  vector: embeddingResponse.data[batchIndex].embedding,
                  metadata: {
                    ...chunk.metadata,
                    content: chunk.content.slice(0, 1500), // Snippet for display
                  },
                });
              });
            }

            console.log(`Upserting ${vectors.length} vectors to Upstash...`);

            // Upsert in batches to avoid Upstash limits
            const UPSERT_BATCH_SIZE = 100;
            for (let i = 0; i < vectors.length; i += UPSERT_BATCH_SIZE) {
              const batch = vectors.slice(i, i + UPSERT_BATCH_SIZE);
              await vectorIndex.upsert(batch);
              console.log(
                `Upserted batch ${
                  Math.floor(i / UPSERT_BATCH_SIZE) + 1
                }/${Math.ceil(vectors.length / UPSERT_BATCH_SIZE)}`
              );
            }

            console.log(
              `✅ Successfully stored ${vectors.length} vectors for doc ${docId}`
            );

            // Return success response AFTER all operations complete
            return new Response(
              JSON.stringify({
                success: true,
                message: `Processed ${vectors.length} vectors for doc ${docId}`,
                docId: docId,
                vectorCount: vectors.length,
              }),
              {
                status: 200,
                headers: { "Content-Type": "application/json" },
              }
            );
          } catch (error) {
            console.error("❌ Webhook processing failed:", error);
            console.error("Error details:", {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
            });

            return new Response(
              JSON.stringify({ success: false, error: String(error) }),
              { status: 500, headers: { "Content-Type": "application/json" } }
            );
          }
        } else {
          console.log(
            `Received webhook event: ${event.type} (no action taken)`
          );

          // Return response for non-crawl.completed events
          return new Response(
            JSON.stringify({
              success: true,
              message: `Event ${event.type} acknowledged`,
            }),
            {
              status: 200,
              headers: { "Content-Type": "application/json" },
            }
          );
        }

        // This should never be reached due to the returns above
        return new Response(
          JSON.stringify({ success: false, error: "Unexpected code path" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      },
    },
  },
});
