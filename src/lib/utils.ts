import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const velocityStops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];
