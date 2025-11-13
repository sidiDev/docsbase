import { Context } from "hono";
import { stream } from "hono/streaming";
import {
  streamText,
  tool,
  UIMessage,
  convertToModelMessages,
  createUIMessageStream,
  createUIMessageStreamResponse,
  generateText,
} from "ai";
import { createAnthropic } from "@ai-sdk/anthropic";

export const chat = async (c: Context<{ Bindings: CloudflareBindings }>) => {
  const body = await c.req.json();
  const { messages }: { messages: UIMessage[] } = body;

  const env = c.env as CloudflareBindings;

  const anthropic = createAnthropic({
    apiKey: env.ANTHROPIC_API_KEY,
  });

  let title = "";

  if (messages.length === 1) {
    const { text } = await generateText({
      model: anthropic("claude-3-5-haiku-latest"),
      system:
        "generate a title based on the following conversation. Please keep it short and concise. PLEASE DO NOT INCLUDE ANY OTHER INFORMATION, CONTEXT, OR EXPLANATION. DO NOT ENCLOSE THE RESPONSE IN QUOTES OR MARKDOWN FORMATTING. DO NOT INCLUDE THE PROMPT OR PREFACE THE RESPONSE.",
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
        model: anthropic("claude-3-5-haiku-latest"),
        system: "You are a helpful assistant.",
        messages: convertToModelMessages(messages),
      });
      writer.merge(result.toUIMessageStream());
    },
  });

  return createUIMessageStreamResponse({ stream });
};
