"use server";

import { ALL_FILTERS, createZodSchema } from "@/lib/filters";
import { GenericFilterDefine, Range } from "@/lib/types";
import { and, between, eq, gte, isNull, or, type SQL, sql } from "drizzle-orm";
import {
  Feature,
  FeatureCollection,
  GeoJsonProperties,
  MultiPolygon,
  Polygon,
} from "geojson";
import { headers } from "next/headers";
import { z } from "zod";
import { auth } from "./auth";
import { db } from "./db";
import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  heatflowInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "./db/schema";

const sqlToGeojson = (
  input: {
    id: number;
    geojson: string;
    [key: string]: unknown;
  }[],
  excludeKey?: string,
): FeatureCollection => {
  const features: Feature[] = [];
  for (let i = 0; i < input.length; i++) {
    const properties: GeoJsonProperties = { ...input[i] };
    delete properties.geojson;
    delete properties.id;
    if (excludeKey) delete properties[excludeKey];
    features.push({
      type: "Feature",
      id: input[i].id,
      properties,
      geometry: JSON.parse(input[i].geojson),
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

/** Mutates `filters` array in place and adds filter that restricts data if the user is not logged in */
const restrictData = async (filters: (SQL | undefined)[]) => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  if (!session) filters.push(eq(biblInInvest.biblIsRestricted, false));
};

type ActionSuccess<T = undefined> = T extends undefined
  ? { success: true; data: FeatureCollection }
  : { success: true; data: FeatureCollection; metadata: T };

export type ActionReturn<T = undefined> =
  | ActionSuccess<T>
  | { success: false; error: string };

const generateFilters = (
  filters: GenericFilterDefine,
  values: {
    [x: string]:
      | string
      | boolean
      | number[]
      | {
          from: Date;
          to: Date;
        };
  },
) => {
  const output: (SQL | undefined)[] = [];
  Object.entries(filters).map(([key, filter]) => {
    if (filter.type === "select") {
      if (values[key] !== "All") {
        if (values[key] === "NULL" && filter.nullCol) {
          output.push(isNull(filter.nullCol));
        } else {
          output.push(eq(filter.dbCol, values[key]));
        }
      }
    }
    if (filter.type === "range" && Array.isArray(values[key])) {
      if (values[`${key}AllowNull`]) {
        output.push(
          or(
            between(filter.dbCol, values[key][0], values[key][1]),
            isNull(filter.dbCol),
          ),
        );
      } else {
        output.push(between(filter.dbCol, values[key][0], values[key][1]));
      }
    }
    if (filter.type === "greaterThan" && Array.isArray(values[key])) {
      if (values[`${key}AllowNull`]) {
        output.push(
          or(gte(filter.dbCol, values[key][0]), isNull(filter.dbCol)),
        );
      } else {
        output.push(gte(filter.dbCol, values[key][0]));
      }
    }
    if (
      filter.type === "date" &&
      typeof values[key] === "object" &&
      !Array.isArray(values[key])
    ) {
      if (values[`${key}AllowNull`]) {
        output.push(
          or(
            between(
              filter.dbCol,
              values[key].from.toISOString(),
              values[key].to.toISOString(),
            ),
            isNull(filter.dbCol),
          ),
        );
      } else {
        output.push(
          between(
            filter.dbCol,
            values[key].from.toISOString(),
            values[key].to.toISOString(),
          ),
        );
      }
    }
  });
  return output;
};

const smtFormSchema = z.object(createZodSchema(ALL_FILTERS.smt));

export const LoadSmt = async (
  values: z.infer<typeof smtFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = smtFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.smt, values);
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${smtInInvest.smtGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }
  await restrictData(filters);

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
      longitude: smtInInvest.smtLon,
      latitude: smtInInvest.smtLat,
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
    })
    .from(smtInInvest)
    .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

const vlcFormSchema = z.object(createZodSchema(ALL_FILTERS.vlc));

export const LoadVlc = async (
  values: z.infer<typeof vlcFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = vlcFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.vlc, values);
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${vlcInInvest.vlcGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }
  await restrictData(filters);

  const data = await db
    .select({
      id: vlcInInvest.vlcId,
      name: vlcInInvest.vlcName,
      elevation: vlcInInvest.vlcElev,
      class: vlcInInvest.vlcClass,
      categorySource: vlcInInvest.vlcCatSrc,
      country: countryInInvest.countryName,
      gvpId: vlcInInvest.gvpId,
      wovodat: vlcInInvest.vlcWovodatUrl,
      gvp: vlcInInvest.vlcGvpUrl,
      longitude: vlcInInvest.vlcLon,
      latitude: vlcInInvest.vlcLat,
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

const gnssFormSchema = z.object(createZodSchema(ALL_FILTERS.gnss));
export const LoadGNSS = async (
  values: z.infer<typeof gnssFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = gnssFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.gnss, values);
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
      longitude: gnssStnInInvest.gnssLon,
      latitude: gnssStnInInvest.gnssLat,
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

const fltFormSchema = z.object(createZodSchema(ALL_FILTERS.flt));
export const LoadFlt = async (
  values: z.infer<typeof fltFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const { success } = fltFormSchema.safeParse(values);
  console.log(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.flt, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${fltInInvest.fltGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  await restrictData(filters);

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

const seisFormSchema = z.object(createZodSchema(ALL_FILTERS.seis));
export const LoadSeis = async (
  values: z.infer<typeof seisFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const { success } = seisFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.seis, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${seisInInvest.seisGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  await restrictData(filters);

  const data = await db
    .select({
      id: seisInInvest.seisId,
      depth: seisInInvest.seisDepth,
      mw: seisInInvest.seisMw,
      ms: seisInInvest.seisMs,
      mb: seisInInvest.seisMb,
      catalog: biblInInvest.biblTitle,
      date: seisInInvest.seisDate,
      longitude: seisInInvest.seisLon,
      latitude: seisInInvest.seisLat,
      geojson: sql<string>`ST_ASGEOJSON(${seisInInvest.seisGeom})`,
    })
    .from(seisInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, seisInInvest.seisCatId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

export const LoadHf = async (
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const filters = [];
  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${heatflowInInvest.hfGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }
  await restrictData(filters);

  const data = await db
    .select({
      id: heatflowInInvest.hfId,
      name: heatflowInInvest.hfName,
      elevation: heatflowInInvest.hfElev,
      qval: heatflowInInvest.hfQval,
      reference: heatflowInInvest.hfRef,
      longitude: heatflowInInvest.hfLon,
      latitude: heatflowInInvest.hfLat,
      geojson: sql<string>`ST_ASGEOJSON(${heatflowInInvest.hfGeom})`,
    })
    .from(heatflowInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, heatflowInInvest.hfSrcId))
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

const slab2FormSchema = z.object(createZodSchema(ALL_FILTERS.slab2));
export const LoadSlab2 = async (
  values: z.infer<typeof slab2FormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const { success } = slab2FormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.slab2, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${slab2InInvest.slabGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  const data = await db
    .select({
      id: slab2InInvest.slabId,
      depth: sql.raw(`${slab2InInvest.slabDepth.name}`).mapWith(Number),
      region: slab2InInvest.slabRegion,
      layer: slab2InInvest.slabLayer,
      country: countryInInvest.countryName,
      geojson: sql<string>`ST_ASGEOJSON(${slab2InInvest.slabGeom})`,
    })
    .from(slab2InInvest)
    .leftJoin(
      countryInInvest,
      eq(countryInInvest.countryId, slab2InInvest.slabCountryId),
    )
    .where(and(...filters));
  const dataReturn = sqlToGeojson(data);

  return { success: true, data: dataReturn };
};

const slipFormSchema = z.object(createZodSchema(ALL_FILTERS.slip));
export const LoadSlip = async (
  values: z.infer<typeof slipFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn<Range>> => {
  const { success } = slipFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = generateFilters(ALL_FILTERS.slip, values);

  if (drawing) {
    filters.push(
      sql`ST_INTERSECTS(${slipModelInInvest.patchGeom},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }

  await restrictData(filters);

  const data = await db
    .select({
      id: slipModelInInvest.patchId,
      model_id: slipModelInInvest.modelId,
      depth: slipModelInInvest.patchDepth,
      strike: slipModelInInvest.patchStrike,
      rake: slipModelInInvest.patchRake,
      dip: slipModelInInvest.patchDip,
      slip: slipModelInInvest.patchSlip,
      model_event: biblInInvest.biblTitle,
      longitude: slipModelInInvest.patchLon,
      latitude: slipModelInInvest.patchLat,
      range: sql<Range>`ARRAY[FLOOR(MIN(${slipModelInInvest.patchSlip}) OVER()), CEIL(MAX(${slipModelInInvest.patchSlip}) OVER())]`,
      geojson: sql<string>`ST_ASGEOJSON(${slipModelInInvest.patchGeom})`,
    })
    .from(slipModelInInvest)
    .leftJoin(
      biblInInvest,
      eq(slipModelInInvest.modelSrcId, biblInInvest.biblId),
    )
    .where(and(...filters));
  const range: Range = data.length ? data[0].range : [0, 0];
  const dataReturn = sqlToGeojson(data, "range");

  return { success: true, data: dataReturn, metadata: range };
};
