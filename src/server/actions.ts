"use server";

import { smtFormSchema } from "@/app/database/smt-filters";
import { and, between, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import { Feature, FeatureCollection } from "geojson";
import { z } from "zod";
import { db } from "./db";
import { countryInInvest, smtInInvest, smtSrcInInvest } from "./db/schema";

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
  const filters: (SQL | undefined)[] = [];
  if (values.class !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(smtInInvest.smtClass));
    }
    filters.push(eq(smtInInvest.smtClass, values.class));
  }
  if (values.catalogs !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(smtInInvest.smtSrcId));
    }
    filters.push(eq(smtSrcInInvest.smtSrcName, values.catalogs));
  }
  if (values.countries !== "All") {
    if (values.countries === "NULL") {
      filters.push(isNull(smtInInvest.countryId));
    }
    filters.push(eq(countryInInvest.countryName, values.countries));
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
  console.log(data.length);
  const dataReturn = sqlToGeojson(data);

  return dataReturn;
};
