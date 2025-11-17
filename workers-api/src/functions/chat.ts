import { Context } from "hono";
import {
  streamText,
  tool,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
  embed,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";
import { Index } from "@upstash/vector";

export const chat = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const body = await c.req.json();
  const {
    messages,
    crawlJobId,
    isSearchEnabled,
  }: { messages: UIMessage[]; crawlJobId: string; isSearchEnabled: boolean } =
    body;

  const env = c.env as CloudflareBindings;

  const index = new Index({
    url: env.UPSTASH_VECTOR_REST_URL,
    token: env.UPSTASH_VECTOR_REST_TOKEN,
  });

  // Get the latest user message for RAG
  const modelMessages = convertToModelMessages(messages);
  const latestMessage = modelMessages[modelMessages.length - 1];
  const userQuery =
    typeof latestMessage.content === "string"
      ? latestMessage.content
      : latestMessage.content
          .map((c: any) => (c.type === "text" ? c.text : ""))
          .join(" ");

  // Generate embedding for the user's message using OpenAI
  const embeddingResponse = await fetch(
    "https://api.openai.com/v1/embeddings",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "text-embedding-3-small",
        input: userQuery,
      }),
    }
  );

  const embeddingData = (await embeddingResponse.json()) as {
    data: { embedding: number[] }[];
  };

  const embedding = embeddingData.data[0].embedding;

  // Search Upstash Vector for relevant documents filtered by crawlJobId
  // Increased topK to 10 since chunks are now larger and more comprehensive
  const searchResults = await index.query({
    vector: embedding,
    topK: 10,
    includeMetadata: true,
    filter: `crawlJobId = '${crawlJobId}'`,
  });

  console.log(
    `Vector search returned ${searchResults.length} results for crawlJobId: ${crawlJobId}`
  );
  if (searchResults.length === 0) {
    console.warn(`⚠️ No vectors found for crawlJobId: ${crawlJobId}`);
  }

  const anthropic = createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  const webSearchTool = anthropic.tools.webSearch_20250305({
    maxUses: 5,
  });

  // Extract relevant context from search results
  const context = searchResults
    .map((result, idx) => {
      const metadata = result.metadata as {
        content?: string;
        url?: string;
        title?: string;
      };
      const contentLength = metadata.content?.length || 0;
      console.log(
        `Result ${idx + 1}: ${
          metadata.title
        } (${contentLength} chars) - Score: ${result.score}`
      );
      return `[${idx + 1}] ${metadata.title ? `**${metadata.title}**\n` : ""}${
        metadata.content || ""
      }${metadata.url ? `\n(Source: ${metadata.url})` : ""}`;
    })
    .join("\n\n");

  const totalContextLength = context.length;
  console.log(
    `Total context length: ${totalContextLength} chars from ${searchResults.length} chunks`
  );

  const systemPrompt = context
    ? `You are a helpful assistant that answers questions based on the provided documentation context.

Here is the relevant context from the documentation:

${context}

Please answer the user's question using the context above. If the answer cannot be found in the context, say so.`
    : "You are a helpful assistant.";

  let title = "";

  if (messages.length === 1) {
    const { text } = await generateText({
      model: anthropic("claude-3-5-haiku-latest"),
      system: `generate a title based on the following conversation. Please keep it short and concise. PLEASE DO NOT INCLUDE ANY OTHER INFORMATION, CONTEXT, OR EXPLANATION. DO NOT ENCLOSE THE RESPONSE IN QUOTES OR MARKDOWN FORMATTING. DO NOT INCLUDE THE PROMPT OR PREFACE THE RESPONSE. Here is the relevant context from the documentation:

${context}`,
      messages: convertToModelMessages(messages),
    });
    title = text;
  }
  const stream = createUIMessageStream<any>({
    execute: async ({ writer }) => {
      if (messages.length === 1) {
        writer.write({
          type: "data-notification",
          data: {
            title: title,
          },
        });
      }

      const result = streamText({
        model: anthropic("claude-haiku-4-5"),
        system: systemPrompt,
        messages: convertToModelMessages(messages),
        ...(isSearchEnabled && {
          toolChoice: "required",
          tools: {
            web_search: webSearchTool,
          },
        }),
      });
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
};
