import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function resolveAssetUrl(url: string) {
  if (!url) {
    return url
  }
  if (
    url.startsWith("http://") ||
    url.startsWith("https://") ||
    url.startsWith("data:") ||
    url.startsWith("blob:")
  ) {
    return url
  }
  const base = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8080"
  if (url.startsWith("/")) {
    return `${base}${url}`
  }
  return `${base}/${url}`
}
