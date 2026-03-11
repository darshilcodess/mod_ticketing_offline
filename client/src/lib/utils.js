import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merges class names intelligently, resolving Tailwind conflicts.
 * Uses clsx for conditional logic and tailwind-merge to deduplicate.
 */
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
