import { createServerFn } from "@tanstack/react-start";
import { isValidUrl } from "@/lib/utils";

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
