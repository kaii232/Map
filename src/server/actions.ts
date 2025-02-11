"use server";

import { smtFormSchema, vlcFormSchema } from "@/app/database/form-schema";
import {
  and,
  between,
  eq,
  ilike,
  isNull,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { Feature, FeatureCollection } from "geojson";
import { z } from "zod";
import { db } from "./db";
import {
  countryInInvest,
  smtInInvest,
  smtSrcInInvest,
  vlcInInvest,
  vlcSrcInInvest,
} from "./db/schema";

const sqlToGeojson = (
  input: {
    id: number;
    geojson: string;
    [key: string]: string | number | null | Date;
  }[],
): FeatureCollection => {
  const features: Feature[] = [];
  for (let i = 0; i < input.length; i++) {
    features.push({
      type: "Feature",
      id: input[i].id,
      properties: {
        ...input[i],
        geojson: undefined,
        id: undefined,
      },
      geometry: JSON.parse(input[i].geojson),
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

export const LoadSmt = async (values: z.infer<typeof smtFormSchema>) => {
  const { success } = smtFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.class !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(smtInInvest.smtClass));
    } else filters.push(eq(smtInInvest.smtClass, values.class));
  }
  if (values.catalogs !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(smtInInvest.smtSrcId));
    } else filters.push(eq(smtSrcInInvest.smtSrcName, values.catalogs));
  }
  if (values.countries !== "All") {
    if (values.countries === "NULL") {
      filters.push(isNull(smtInInvest.countryId));
    } else filters.push(eq(countryInInvest.countryName, values.countries));
  }

  if (values.elevAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtElev, values.elevation[0], values.elevation[1]),
        isNull(smtInInvest.smtElev),
      ),
    );
  } else {
    filters.push(
      between(smtInInvest.smtElev, values.elevation[0], values.elevation[1]),
    );
  }
  if (values.baseAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtBase, values.base[0], values.base[1]),
        isNull(smtInInvest.smtBase),
      ),
    );
  } else {
    filters.push(between(smtInInvest.smtBase, values.base[0], values.base[1]));
  }
  if (values.summitAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtSummit, values.summit[0], values.summit[1]),
        isNull(smtInInvest.smtSummit),
      ),
    );
  } else {
    filters.push(
      between(smtInInvest.smtSummit, values.summit[0], values.summit[1]),
    );
  }
  if (values.blAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtBl, values.bl[0], values.bl[1]),
        isNull(smtInInvest.smtBl),
      ),
    );
  } else {
    filters.push(between(smtInInvest.smtBl, values.bl[0], values.elevation[1]));
  }
  if (values.bwAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtBw, values.bw[0], values.bw[1]),
        isNull(smtInInvest.smtBw),
      ),
    );
  } else {
    filters.push(between(smtInInvest.smtBw, values.bw[0], values.bw[1]));
  }
  if (values.baAllowNull) {
    filters.push(
      or(
        between(smtInInvest.smtBa, values.ba[0], values.ba[1]),
        isNull(smtInInvest.smtBa),
      ),
    );
  } else {
    filters.push(between(smtInInvest.smtBa, values.ba[0], values.ba[1]));
  }

  const data = await db
    .select({
      id: smtInInvest.smtId,
      name: smtInInvest.smtName,
      class: smtInInvest.smtClass,
      elevation: smtInInvest.smtElev,
      base: smtInInvest.smtBase,
      summit: smtInInvest.smtSummit,
      bw: smtInInvest.smtBw,
      ba: smtInInvest.smtBa,
      bl: smtInInvest.smtBl,
      country: countryInInvest.countryName,
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
    })
    .from(smtInInvest)
    .leftJoin(
      countryInInvest,
      eq(smtInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(smtSrcInInvest, eq(smtInInvest.smtSrcId, smtSrcInInvest.smtSrcId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadVlc = async (values: z.infer<typeof vlcFormSchema>) => {
  const { success } = vlcFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.class !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(vlcInInvest.vlcClass));
    } else {
      filters.push(eq(vlcInInvest.vlcClass, values.class));
    }
  }

  if (values.categorySources !== "All") {
    if (values.categorySources === "NULL") {
      filters.push(isNull(vlcInInvest.vlcCatSrc));
    } else {
      filters.push(ilike(vlcInInvest.vlcCatSrc, `%${values.categorySources}%`));
    }
  }
  if (values.sources !== "All") {
    if (values.sources === "NULL") {
      filters.push(isNull(vlcInInvest.vlcSrcId));
    } else {
      filters.push(eq(vlcSrcInInvest.vlcSrcName, values.sources));
    }
  }
  if (values.countries !== "All") {
    if (values.countries === "NULL") {
      filters.push(
        or(isNull(vlcInInvest.countryId1), isNull(vlcInInvest.countryId2)),
      );
    } else {
      filters.push(eq(countryInInvest.countryName, values.countries));
    }
  }

  const data = await db
    .select({
      id: vlcInInvest.vlcId,
      name: vlcInInvest.vlcName,
      elevation: vlcInInvest.vlcElev,
      class: vlcInInvest.vlcClass,
      categorySource: vlcInInvest.vlcCatSrc,
      country: countryInInvest.countryName,
      geojson: sql<string>`ST_ASGEOJSON(${vlcInInvest.vlcGeom})`,
    })
    .from(vlcInInvest)
    .leftJoin(
      countryInInvest,
      or(
        eq(vlcInInvest.countryId1, countryInInvest.countryId),
        eq(vlcInInvest.countryId2, countryInInvest.countryId),
      ),
    )
    .leftJoin(vlcSrcInInvest, eq(vlcInInvest.vlcSrcId, vlcSrcInInvest.vlcSrcId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};
