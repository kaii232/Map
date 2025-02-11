import { z } from "zod";

export const vlcFormSchema = z.object({
  class: z.string(),
  categorySources: z.string(),
  sources: z.string(),
  countries: z.string(),
});

export const smtFormSchema = z.object({
  elevation: z.number().array().length(2),
  elevAllowNull: z.boolean(),
  base: z.number().array().length(2),
  baseAllowNull: z.boolean(),
  summit: z.number().array().length(2),
  summitAllowNull: z.boolean(),
  bl: z.number().array().length(2),
  blAllowNull: z.boolean(),
  bw: z.number().array().length(2),
  bwAllowNull: z.boolean(),
  ba: z.number().array().length(2),
  baAllowNull: z.boolean(),
  class: z.string(),
  catalogs: z.string(),
  countries: z.string(),
});
