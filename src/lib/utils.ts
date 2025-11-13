import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const isValidUrl = (urlString: string): boolean => {
  if (!urlString.trim()) return false;

  const urlRegex =
    /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  return urlRegex.test(urlString);
};

export function extractNameFromUrl(url: string): string {
  const urlObj = new URL(url);
  let hostname = urlObj.hostname;

  // Remove common prefixes
  hostname = hostname.replace(/^(www|docs|api|blog|app|dev)\./i, "");

  // Get the first part of the domain (before TLD)
  const domainParts = hostname.split(".");
  const mainDomain = domainParts[0];

  // Capitalize first letter
  return mainDomain.charAt(0).toUpperCase() + mainDomain.slice(1);
}
