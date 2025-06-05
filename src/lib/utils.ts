import {
  ActionReturn,
  LoadFlt,
  LoadGNSS,
  LoadHf,
  LoadRock,
  LoadSeis,
  LoadSlab2,
  LoadSlip,
  LoadSmt,
  LoadVlc,
} from "@/server/actions";
import { clsx, type ClassValue } from "clsx";
import { MultiPolygon, Polygon } from "geojson";
import { twMerge } from "tailwind-merge";
import { z } from "zod";
import type { ALL_FILTERS_CLIENT } from "./data-definitions";
import type { createZodSchema, Range } from "./filters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Velocities for the plate movement vectors map layer */
export const velocityStops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/**
 * Used for displaying the message on the toast when loading data
 * On successful load of data, a message of: "Successfully loaded `length` `TOAST_MESSAGE`" is shown
 */
export const TOAST_MESSAGE: Record<keyof typeof ALL_FILTERS_CLIENT, string> = {
  flt: "faults",
  gnss: "GNSS stations",
  hf: "heatflow data",
  seis: "seismicity data",
  slab2: "slab data",
  smt: "seamounts",
  vlc: "volcanoes",
  slip: "slip model data",
  rock: "rock sample data",
};

/**
 * Labels used for the data select component
 */
export const DATA_LABELS: Record<keyof typeof ALL_FILTERS_CLIENT, string> = {
  smt: "Seamounts",
  vlc: "Volcanoes",
  gnss: "GNSS Stations",
  flt: "Faults",
  seis: "Seismicity",
  hf: "Heatflow",
  slab2: "Slab",
  slip: "Slip Models",
  rock: "Rock Samples",
};

/**
 * This object contains the server actions used to load each data type
 */
export const LOADERS: Record<
  keyof typeof ALL_FILTERS_CLIENT,
  | ((
      values: z.infer<z.ZodObject<ReturnType<typeof createZodSchema>>>,
      drawing?: MultiPolygon | Polygon,
    ) => Promise<ActionReturn> | Promise<ActionReturn<unknown>>)
  | ((
      drawing?: MultiPolygon | Polygon,
    ) => Promise<ActionReturn> | Promise<ActionReturn<unknown>>)
> = {
  smt: LoadSmt,
  vlc: LoadVlc,
  gnss: LoadGNSS,
  flt: LoadFlt,
  seis: LoadSeis,
  hf: LoadHf,
  slab2: LoadSlab2,
  slip: LoadSlip,
  rock: LoadRock,
};

/** Convenience function to map a range to user defined stops for map layer style specification */
export const getInterpolateRange = (
  range: Range,
  stops: (string | number)[],
) => {
  const step = (range[1] - range[0]) / (stops.length - 1);
  const out = [];
  for (let i = 0, length = stops.length; i < length; i++) {
    out.push(range[0] + i * step);
    out.push(stops[i]);
  }
  return out;
};

/** Turns a camel case string into multiple words. Prefix a capital letter with a `\` to avoid splitting at that position */
export function camelCaseToWords(s: string) {
  const result = s.replace(/(?<!\\)([A-Z])/g, " $1").replace("\\", "");
  return result.charAt(0).toUpperCase() + result.slice(1);
}
