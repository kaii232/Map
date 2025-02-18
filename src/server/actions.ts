"use server";

import {
  fltFormSchema,
  gnssFormSchema,
  seisFormSchema,
  smtFormSchema,
  vlcFormSchema,
} from "@/app/database/form-schema";
import { and, between, eq, isNull, or, type SQL, sql } from "drizzle-orm";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { z } from "zod";
import { db } from "./db";
import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  seisInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
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

type ReturnType =
  | { success: false; error: string }
  | { success: true; data: FeatureCollection };

export const LoadSmt = async (
  values: z.infer<typeof smtFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
  const { success } = smtFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.class !== "All") {
    if (values.class === "NULL") {
      filters.push(isNull(smtInInvest.smtClass));
    } else {
      filters.push(eq(smtInInvest.smtClass, values.class));
    }
  }
  if (values.catalogs !== "All") {
    if (values.catalogs === "NULL") {
      filters.push(isNull(smtInInvest.smtSrcId));
    } else {
      filters.push(eq(biblInInvest.biblTitle, values.catalogs));
    }
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
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${smtInInvest.smtGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
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
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
    })
    .from(smtInInvest)
    .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadVlc = async (
  values: z.infer<typeof vlcFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
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
  if (values.sources !== "All") {
    if (values.sources === "NULL") {
      filters.push(isNull(vlcInInvest.vlcSrcId));
    } else {
      filters.push(eq(biblInInvest.biblTitle, values.sources));
    }
  }
  if (values.countries !== "All") {
    if (values.countries === "NULL") {
      filters.push(isNull(vlcInInvest.countryId));
    } else {
      filters.push(eq(countryInInvest.countryName, values.countries));
    }
  }
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${vlcInInvest.vlcGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
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
      eq(vlcInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadGNSS = async (
  values: z.infer<typeof gnssFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ReturnType> => {
  const { success } = gnssFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.projects !== "All") {
    if (values.projects === "NULL") {
      filters.push(isNull(gnssStnInInvest.gnssProj));
    } else filters.push(eq(gnssStnInInvest.gnssProj, values.projects));
  }
  if (values.stations !== "All") {
    if (values.stations === "NULL") {
      filters.push(isNull(gnssStnInInvest.stnTypeId));
    } else filters.push(eq(stnTypeInInvest.stnTypeName, values.stations));
  }
  if (values.countries !== "All") {
    if (values.countries === "NULL") {
      filters.push(isNull(gnssStnInInvest.countryId));
    } else filters.push(eq(countryInInvest.countryName, values.countries));
  }

  if (values.elevAllowNull) {
    filters.push(
      or(
        between(
          gnssStnInInvest.gnssElev,
          values.elevation[0],
          values.elevation[1],
        ),
        isNull(gnssStnInInvest.gnssElev),
      ),
    );
  } else {
    filters.push(
      between(
        gnssStnInInvest.gnssElev,
        values.elevation[0],
        values.elevation[1],
      ),
    );
  }
  if (values.dateAllowNull) {
    filters.push(
      or(
        between(gnssStnInInvest.gnssInstDate, values.date.from, values.date.to),
        isNull(gnssStnInInvest.gnssInstDate),
      ),
    );
  } else {
    filters.push(
      between(gnssStnInInvest.gnssInstDate, values.date.from, values.date.to),
    );
  }
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${gnssStnInInvest.gnssGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: gnssStnInInvest.gnssId,
      name: gnssStnInInvest.gnssName,
      project: gnssStnInInvest.gnssProj,
      type: stnTypeInInvest.stnTypeName,
      elevation: gnssStnInInvest.gnssElev,
      country: countryInInvest.countryName,
      installDate: gnssStnInInvest.gnssInstDate,
      decomDate: gnssStnInInvest.gnssDecomDate,
      geojson: sql<string>`ST_ASGEOJSON(${gnssStnInInvest.gnssGeom})`,
    })
    .from(gnssStnInInvest)
    .leftJoin(
      countryInInvest,
      eq(gnssStnInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(
      stnTypeInInvest,
      eq(stnTypeInInvest.stnTypeId, gnssStnInInvest.stnTypeId),
    )
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadFlt = async (
  values: z.infer<typeof fltFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ReturnType> => {
  const { success } = fltFormSchema.safeParse(values);
  console.log(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.types !== "All") {
    if (values.types === "NULL") {
      filters.push(isNull(fltInInvest.fltType));
    } else filters.push(eq(fltInInvest.fltType, values.types));
  }
  if (values.catalogs !== "All") {
    if (values.catalogs === "NULL") {
      filters.push(isNull(fltInInvest.fltSrcId));
    } else filters.push(eq(biblInInvest.biblTitle, values.catalogs));
  }

  if (values.lengthAllowNull) {
    filters.push(
      or(
        between(fltInInvest.fltLen, values.length[0], values.length[1]),
        isNull(fltInInvest.fltLen),
      ),
    );
  } else {
    filters.push(
      between(fltInInvest.fltLen, values.length[0], values.length[1]),
    );
  }
  if (values.sliprateAllowNull) {
    filters.push(
      or(
        between(
          fltInInvest.fltSliprate,
          values.sliprate[0],
          values.sliprate[1],
        ),
        isNull(fltInInvest.fltSliprate),
      ),
    );
  } else {
    filters.push(
      between(fltInInvest.fltSliprate, values.sliprate[0], values.sliprate[1]),
    );
  }
  if (values.depthAllowNull) {
    filters.push(
      or(
        between(fltInInvest.fltLockDepth, values.depth[0], values.depth[1]),
        isNull(fltInInvest.fltLockDepth),
      ),
    );
  } else {
    filters.push(
      between(fltInInvest.fltLockDepth, values.depth[0], values.depth[1]),
    );
  }

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${fltInInvest.fltGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: fltInInvest.fltId,
      name: fltInInvest.fltName,
      segmentName: fltInInvest.fltSegName,
      type: fltInInvest.fltType,
      length: fltInInvest.fltLen,
      sliprate: fltInInvest.fltSliprate,
      ss: fltInInvest.fltSs,
      verticalSeparation: fltInInvest.fltVertSep,
      horizontalSeparation: fltInInvest.fltHorzSep,
      dip: fltInInvest.fltDip,
      rake: fltInInvest.fltRake,
      maxm: fltInInvest.fltMaxm,
      cmt: fltInInvest.fltCmt,
      lockdepth: fltInInvest.fltLockDepth,
      catalog: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${fltInInvest.fltGeom})`,
    })
    .from(fltInInvest)
    .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadSeis = async (
  values: z.infer<typeof seisFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ReturnType> => {
  const { success } = seisFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters: (SQL | undefined)[] = [];
  if (values.catalogs !== "All") {
    if (values.catalogs === "NULL") {
      filters.push(isNull(seisInInvest.seisCatId));
    } else filters.push(eq(biblInInvest.biblTitle, values.catalogs));
  }

  if (values.depthAllowNull) {
    filters.push(
      or(
        between(seisInInvest.seisDepth, values.depth[0], values.depth[1]),
        isNull(seisInInvest.seisDepth),
      ),
    );
  } else {
    filters.push(
      between(seisInInvest.seisDepth, values.depth[0], values.depth[1]),
    );
  }

  if (values.mwAllowNull) {
    filters.push(
      or(
        between(seisInInvest.seisMw, values.mw[0], values.mw[1]),
        isNull(seisInInvest.seisMw),
      ),
    );
  } else {
    filters.push(between(seisInInvest.seisMw, values.mw[0], values.mw[1]));
  }

  if (values.dateAllowNull) {
    filters.push(
      or(
        between(seisInInvest.seisDate, values.date.from, values.date.to),
        isNull(seisInInvest.seisDate),
      ),
    );
  } else {
    filters.push(
      between(seisInInvest.seisDate, values.date.from, values.date.to),
    );
  }

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${seisInInvest.seisGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: seisInInvest.seisId,
      depth: seisInInvest.seisDepth,
      mw: seisInInvest.seisMw,
      ms: seisInInvest.seisMs,
      mb: seisInInvest.seisMb,
      catalog: biblInInvest.biblTitle,
      date: seisInInvest.seisDate,
      geojson: sql<string>`ST_ASGEOJSON(${seisInInvest.seisGeom})`,
    })
    .from(seisInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, seisInInvest.seisCatId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};
