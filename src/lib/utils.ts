import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { ALL_FILTERS_CLIENT } from "./data-definitions";
import type { Range } from "./filters";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Velocities for the plate movement vectors map layer */
export const velocityStops = [0, 10, 20, 30, 40, 50, 60, 70, 80, 90, 100];

/** Conditionally adds a space before the units depending on what the unit is */
export function formatUnits(units: string | undefined) {
  if (!units) return null;
  if (["°"].includes(units)) return units; // Edit the array if other units doesn't need a space
  return " " + units;
}

/**
 * Used for displaying the message on the toast when loading data
 * On successful load of data, a message of: "Successfully loaded `length` `TOAST_MESSAGE`" is shown
 */
export const TOAST_MESSAGE: Record<keyof typeof ALL_FILTERS_CLIENT, string> = {
  flt: "faults",
  gnss: "GNSS features",
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
 * Convenience function to map a range to user defined stops for map layer style specification
 * @param range Range of data to map
 * @param stops Array containing value at each stop
 * @param base base of the interpolation. Default of `1` is linear interpolation.
 * @returns Array containing correctly formatted interpolation of range at each stop. Can be spread directly in layer specification
 */
export const getInterpolateRange = (
  range: Range,
  stops: (string | number)[],
  base: number = 1,
) => {
  let step =
    base === 1 || base === 0
      ? (range[1] - range[0]) / (stops.length - 1)
      : (range[1] - range[0]) / //step + step/base + step/base^2 + ... + step/base^(stops.length - 1) = range; step = range / [(1 - (1/base)^(stops.length - 1)) / (1 - 1/base)] <- geometric series sum
        ((1 - Math.pow(1 / base, stops.length - 1)) / (1 - 1 / base));
  let curr = range[0];
  const out: (string | number)[] = [];
  for (let i = 0, length = stops.length; i < length; i++) {
    out.push(curr);
    out.push(stops[i]);
    curr += step;
    step /= base;
  }
  return out;
};

/** Turns a camel case string into multiple words. Prefix a capital letter with a `\` to avoid splitting at that position */
export function camelCaseToWords(s: string) {
  const result = s.replace(/(?<!\\)([A-Z])/g, " $1").replace("\\", "");
  return result.charAt(0).toUpperCase() + result.slice(1);
}

export function downloadData(blob: Blob, fileName: string) {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = fileName;
  link.click();
  link.remove();
}
