import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function cleanEnv(val?: string): string {
  if (!val) return "";
  return val.trim().replace(/^["']|["']$/g, "");
}
