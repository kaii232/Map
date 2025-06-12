"use server";

import { ALL_FILTERS } from "@/lib/data-definitions";
import {
  createZodSchema,
  FILTER_STRATEGIES,
  GenericFilterDefine,
  Range,
} from "@/lib/filters";
import { and, eq, type SQL, sql } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
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
  gnssVectorInInvest,
  heatflowInInvest,
  rockSampleInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "./db/schema";

type ActionSuccess<T = undefined> = T extends undefined
  ? {
      success: true;
      data: { geojson: FeatureCollection; units?: Record<string, string> };
    }
  : {
      success: true;
      data: { geojson: FeatureCollection; units?: Record<string, string> };
      metadata: T;
    };

export type ActionReturn<T = undefined> =
  | ActionSuccess<T>
  | { success: false; error: string };

const sqlToGeojson = (
  input: ({
    id: number | null;
    geojson: string;
    [key: string]: unknown;
  } | null)[],
  excludeKey?: string[],
): FeatureCollection => {
  const features: Feature[] = [];
  const added: Record<string | number, boolean> = {};
  for (let i = 0; i < input.length; i++) {
    if (!input[i] || !input[i]!.id || added[input[i]!.id!]) continue; // Do not add duplicate rows again
    const currentVal = input[i]!;
    added[currentVal.id!] = true;
    const properties: GeoJsonProperties = { ...currentVal };
    delete properties.geojson;
    delete properties.id;
    if (excludeKey) excludeKey.map((key) => delete properties[key]);
    features.push({
      type: "Feature",
      id: currentVal.id!,
      properties,
      geometry: JSON.parse(currentVal.geojson),
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

/** Helper function to enable type safety when defining units */
const defineUnits = <T extends Record<string, unknown>[]>(
  units: Partial<Record<keyof T[number], string>>,
) => units;

/** Restricts data if the user is not logged in */
const isLoggedIn = async () => {
  const session = await auth.api.getSession({
    headers: await headers(),
  });
  return !!session;
};

/** Generates the drizzle sql filters based on the values and filters */
const generateFilters = async (
  /** Object containing the filters for the data */
  filters: GenericFilterDefine | null,
  /** Values to filter the data with */
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
  /** Set to `true` if there is sensitive data to restrict from users who are not logged in */
  shouldRestrict: boolean,
  /** Geometry column of the data for filtering by location */
  geomCol: AnyPgColumn,
  /** Geojson geometry of the polygon to filter data by location */
  drawing: MultiPolygon | Polygon | undefined,
) => {
  const output: (SQL | undefined)[] = [];
  if (shouldRestrict && !(await isLoggedIn())) {
    output.push(eq(biblInInvest.biblIsRestricted, false));
  }
  if (drawing) {
    output.push(
      sql`ST_INTERSECTS(${geomCol},ST_GeomFromGeoJSON(${JSON.stringify(drawing)}))`,
    );
  }
  if (!filters) return output;
  Object.entries(filters).map(([key, filter]) => {
    output.push(
      FILTER_STRATEGIES[filter.type].getSQLFilter(
        key,
        values,
        filter.dbCol,
        filter.type === "select" ? filter.nullCol : undefined,
      ),
    );
  });

  return output;
};

const lngLatUnits = {
  longitude: "°",
  latitude: "°",
};

const smtFormSchema = z.object(createZodSchema(ALL_FILTERS.smt));

export const LoadSmt = async (
  values: z.infer<typeof smtFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = smtFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.smt,
    values,
    true,
    smtInInvest.smtGeom,
    drawing,
  );

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
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
      geometry: sql.raw(smtInInvest.smtGeom.name).mapWith(String),
    })
    .from(smtInInvest)
    .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data);
  const units = defineUnits<typeof data>({
    elevation: "m",
    base: "m",
    summit: "m",
    bw: "km",
    ba: "km",
    bl: "km²",
    ...lngLatUnits,
  });

  return {
    success: true,
    data: {
      geojson,
      units,
    },
  };
};

const vlcFormSchema = z.object(createZodSchema(ALL_FILTERS.vlc));

export const LoadVlc = async (
  values: z.infer<typeof vlcFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = vlcFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.vlc,
    values,
    true,
    vlcInInvest.vlcGeom,
    drawing,
  );

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
      timePeriod: vlcInInvest.vlcTimePeriod,
      catalog: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${vlcInInvest.vlcGeom})`,
      geometry: sql.raw(vlcInInvest.vlcGeom.name).mapWith(String),
    })
    .from(vlcInInvest)
    .leftJoin(
      countryInInvest,
      eq(vlcInInvest.countryId, countryInInvest.countryId),
    )
    .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data);
  const units = defineUnits<typeof data>({
    elevation: "m",
    ...lngLatUnits,
  });

  return {
    success: true,
    data: { geojson, units },
  };
};

const gnssFormSchema = z.object(createZodSchema(ALL_FILTERS.gnss));
export const LoadGNSS = async (
  values: z.infer<typeof gnssFormSchema>,
  drawing?: Polygon | MultiPolygon,
): Promise<ActionReturn> => {
  const { success } = gnssFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.gnss,
    values,
    false,
    gnssStnInInvest.gnssGeom,
    drawing,
  );

  const endPoint = db
    .select({
      vectorId: gnssVectorInInvest.vectorId,
      eastingUncertainty: gnssVectorInInvest.vectorEastingUnc,
      northingUncertainty: gnssVectorInInvest.vectorNorthingUnc,
      projected: sql<string>`ST_PROJECT(
                              ST_POINT(${gnssStnInInvest.gnssLon}, ${gnssStnInInvest.gnssLat}), 
                              SQRT(POWER(${gnssVectorInInvest.vectorEasting},2) + POWER(${gnssVectorInInvest.vectorNorthing},2)) * 5000,
                              ATAN2(${gnssVectorInInvest.vectorEasting}, ${gnssVectorInInvest.vectorNorthing})
                            )::geometry`.as("projected"),
    })
    .from(gnssStnInInvest)
    .leftJoin(
      gnssVectorInInvest,
      eq(gnssVectorInInvest.vectorGnssId, gnssStnInInvest.gnssId),
    )
    .as("end_point");
  const ellipses = db
    .select({
      vectorId: endPoint.vectorId,
      projected: endPoint.projected,
      ellipse: sql<string>`ST_Translate(
                              ST_Scale(
                                ST_Buffer(
                                    ST_SetSRID(ST_Point(0,0), 4326), 
                                    0.2
                                  ), 
                                ABS(${endPoint.eastingUncertainty}), ABS(${endPoint.northingUncertainty})
                              ),
                              ST_X(${endPoint.projected}), 
                              ST_Y(${endPoint.projected})
                            )`.as("ellipse"),
    })
    .from(endPoint)
    .as("ellipses");
  const data = await db
    .select({
      gnss: {
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
        geometry: sql.raw(gnssStnInInvest.gnssGeom.name).mapWith(String),
      },
      vector: {
        id: gnssVectorInInvest.vectorId,
        source: biblInInvest.biblTitle,
        easting: gnssVectorInInvest.vectorEasting,
        northing: gnssVectorInInvest.vectorNorthing,
        vertical: gnssVectorInInvest.vectorVertical,
        timePeriod: gnssVectorInInvest.vectorTimePeriod,
        geojson: sql<string>`ST_ASGEOJSON(ST_MAKELINE(${gnssStnInInvest.gnssGeom},${ellipses.projected}))`,
        geometry: sql<string>`ST_MAKELINE(${gnssStnInInvest.gnssGeom},${ellipses.projected})`,
      },
      ellipse: {
        id: gnssVectorInInvest.vectorId,
        eastingUncertainty: gnssVectorInInvest.vectorEastingUnc,
        northingUncertainty: gnssVectorInInvest.vectorNorthingUnc,
        verticalUncertainty: gnssVectorInInvest.vectorVerticalUnc,
        geojson: sql<string>`ST_ASGEOJSON(${ellipses.ellipse})`,
        geometry: ellipses.ellipse,
      },
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
    .leftJoin(
      gnssVectorInInvest,
      eq(gnssVectorInInvest.vectorGnssId, gnssStnInInvest.gnssId),
    )
    .leftJoin(ellipses, eq(gnssVectorInInvest.vectorId, ellipses.vectorId))
    .leftJoin(
      biblInInvest,
      eq(biblInInvest.biblId, gnssVectorInInvest.vectorBiblId),
    )
    .where(and(...filters));
  const geojson = sqlToGeojson(data.map((val) => val.gnss));
  const vectorUnc = sqlToGeojson(data.map((val) => val.ellipse));
  const vectorLine = sqlToGeojson(data.map((val) => val.vector));
  const units = defineUnits<
    ((typeof data)[number]["gnss"] &
      (typeof data)[number]["vector"] &
      (typeof data)[number]["ellipse"])[]
  >({
    elevation: "m",
    easting: "m/yr",
    northing: "m/yr",
    vertical: "m/yr",
    eastingUncertainty: "m/yr",
    northingUncertainty: "m/yr",
    verticalUncertainty: "m/yr",
    ...lngLatUnits,
  });
  // Adds the GNSS vectors into the geojson
  geojson.features = geojson.features.concat(vectorLine.features);
  geojson.features = geojson.features.concat(vectorUnc.features);

  return {
    success: true,
    data: { geojson, units },
  };
};

const fltFormSchema = z.object(createZodSchema(ALL_FILTERS.flt));
export const LoadFlt = async (
  values: z.infer<typeof fltFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const { success } = fltFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.flt,
    values,
    true,
    fltInInvest.fltGeom,
    drawing,
  );

  const data = await db
    .select({
      id: fltInInvest.fltId,
      name: fltInInvest.fltName,
      segmentName: fltInInvest.fltSegName,
      type: fltInInvest.fltType,
      length: fltInInvest.fltLen,
      sliprate: fltInInvest.fltSliprate,
      strikeSlip: fltInInvest.fltSs,
      verticalSeparation: fltInInvest.fltVertSep,
      horizontalSeparation: fltInInvest.fltHorzSep,
      dip: fltInInvest.fltDip,
      rake: fltInInvest.fltRake,
      maxm: fltInInvest.fltMaxm,
      cmt: fltInInvest.fltCmt,
      lockingDepth: fltInInvest.fltLockDepth,
      catalog: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${fltInInvest.fltGeom})`,
      geometry: sql.raw(fltInInvest.fltGeom.name).mapWith(String),
    })
    .from(fltInInvest)
    .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data);
  const units = defineUnits<typeof data>({
    length: "km",
    sliprate: "mm/yr",
    strikeSlip: "mm/yr",
    verticalSeparation: "mm/yr",
    horizontalSeparation: "mm/yr",
    dip: "°",
    rake: "°",
    lockingDepth: "km",
  });

  return {
    success: true,
    data: {
      geojson,
      units,
    },
  };
};

const seisFormSchema = z.object(createZodSchema(ALL_FILTERS.seis));
export const LoadSeis = async (
  values: z.infer<typeof seisFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn<Range>> => {
  const { success } = seisFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.seis,
    values,
    true,
    seisInInvest.seisGeom,
    drawing,
  );

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
      range: sql<Range>`ARRAY[FLOOR(MIN(${seisInInvest.seisDepth}) OVER()), CEIL(MAX(${seisInInvest.seisDepth}) OVER())]`,
      geojson: sql<string>`ST_ASGEOJSON(${seisInInvest.seisGeom})`,
      geometry: sql.raw(seisInInvest.seisGeom.name).mapWith(String),
    })
    .from(seisInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, seisInInvest.seisCatId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data, ["range"]);
  const units = defineUnits<typeof data>({
    depth: "km",
    ...lngLatUnits,
  });
  const range: Range = data.length ? data[0].range : [0, 1024];

  return {
    success: true,
    data: { geojson, units },
    metadata: range,
  };
};

export const LoadHf = async (
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const filters = await generateFilters(
    ALL_FILTERS.hf,
    {},
    true,
    heatflowInInvest.hfGeom,
    drawing,
  );

  const data = await db
    .select({
      id: heatflowInInvest.hfId,
      name: heatflowInInvest.hfName,
      elevation: heatflowInInvest.hfElev,
      qval: heatflowInInvest.hfQval,
      reference: heatflowInInvest.hfRef,
      longitude: heatflowInInvest.hfLon,
      latitude: heatflowInInvest.hfLat,
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${heatflowInInvest.hfGeom})`,
      geometry: sql.raw(heatflowInInvest.hfGeom.name).mapWith(String),
    })
    .from(heatflowInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, heatflowInInvest.hfSrcId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data, ["range"]);
  const units = defineUnits<typeof data>({
    elevation: "m",
    qval: "W/m²",
    ...lngLatUnits,
  });

  return {
    success: true,
    data: { geojson, units },
  };
};

const slab2FormSchema = z.object(createZodSchema(ALL_FILTERS.slab2));
export const LoadSlab2 = async (
  values: z.infer<typeof slab2FormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn<Range>> => {
  const { success } = slab2FormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.slab2,
    values,
    false,
    slab2InInvest.slabGeom,
    drawing,
  );

  const data = await db
    .select({
      id: slab2InInvest.slabId,
      depth: sql.raw(`${slab2InInvest.slabDepth.name}`).mapWith(Number), //Convenient way to map string to number
      region: slab2InInvest.slabRegion,
      layer: slab2InInvest.slabLayer,
      country: countryInInvest.countryName,
      range: sql<
        [string, string]
      >`ARRAY[FLOOR(MIN(${slab2InInvest.slabDepth}) OVER()), CEIL(MAX(${slab2InInvest.slabDepth}) OVER())]`, // It is a string array as slapDepth is numeric type
      geojson: sql<string>`ST_ASGEOJSON(${slab2InInvest.slabGeom})`,
      geometry: sql.raw(slab2InInvest.slabGeom.name).mapWith(String),
    })
    .from(slab2InInvest)
    .leftJoin(
      countryInInvest,
      eq(countryInInvest.countryId, slab2InInvest.slabCountryId),
    )
    .where(and(...filters));
  const geojson = sqlToGeojson(data, ["range"]);
  const units = defineUnits<typeof data>({ depth: "km" });
  const range: Range = data.length
    ? (data[0].range.map(Number) as Range)
    : [0, 800];

  return {
    success: true,
    data: { geojson, units },
    metadata: range,
  };
};

const slipFormSchema = z.object(createZodSchema(ALL_FILTERS.slip));
export const LoadSlip = async (
  values: z.infer<typeof slipFormSchema>,
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn<Range>> => {
  const { success } = slipFormSchema.safeParse(values);
  if (!success) return { success: false, error: "Values do not follow schema" };
  const filters = await generateFilters(
    ALL_FILTERS.slip,
    values,
    true,
    slipModelInInvest.patchGeom,
    drawing,
  );

  const data = await db
    .select({
      id: slipModelInInvest.patchId,
      modelId: slipModelInInvest.modelId,
      depth: slipModelInInvest.patchDepth,
      strike: slipModelInInvest.patchStrike,
      rake: slipModelInInvest.patchRake,
      dip: slipModelInInvest.patchDip,
      slip: slipModelInInvest.patchSlip,
      modelEvent: biblInInvest.biblTitle,
      longitude: slipModelInInvest.patchLon,
      latitude: slipModelInInvest.patchLat,
      range: sql<Range>`ARRAY[FLOOR(MIN(${slipModelInInvest.patchSlip}) OVER()), CEIL(MAX(${slipModelInInvest.patchSlip}) OVER())]`,
      geojson: sql<string>`ST_ASGEOJSON(${slipModelInInvest.patchGeom})`,
      geometry: sql.raw(slipModelInInvest.patchGeom.name).mapWith(String),
    })
    .from(slipModelInInvest)
    .leftJoin(
      biblInInvest,
      eq(slipModelInInvest.modelSrcId, biblInInvest.biblId),
    )
    .where(and(...filters));
  const range: Range = data.length ? data[0].range : [0, 1]; // Range needs to be strictly ascending or error is thrown
  const geojson = sqlToGeojson(data, ["range"]);
  const units = defineUnits<typeof data>({
    depth: "km",
    strike: "°",
    rake: "°",
    dip: "°",
    slip: "m",
    ...lngLatUnits,
  });

  return {
    success: true,
    data: {
      geojson,
      units,
    },
    metadata: range,
  };
};

export const LoadRock = async (
  drawing?: MultiPolygon | Polygon,
): Promise<ActionReturn> => {
  const filters = await generateFilters(
    ALL_FILTERS.rock,
    {},
    true,
    rockSampleInInvest.rockGeom,
    drawing,
  );

  const data = await db
    .select({
      id: rockSampleInInvest.rockSampleId,
      name: rockSampleInInvest.rockSampleName,
      locationComment: rockSampleInInvest.rockLocCmt,
      rockName: rockSampleInInvest.rockName,
      mineral: rockSampleInInvest.rockMineral,
      "si\\O₂": rockSampleInInvest.rockSio2, // Backslash so the camelCaseToWords function does not split it into Si O₂
      "na₂\\O": rockSampleInInvest.rockNa2O,
      "k₂\\O": rockSampleInInvest.rockK2O,
      ageKa: rockSampleInInvest.rockAgeKa,
      ageMa: rockSampleInInvest.rockAgeMa,
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${rockSampleInInvest.rockGeom})`,
      geometry: sql.raw(rockSampleInInvest.rockGeom.name).mapWith(String),
    })
    .from(rockSampleInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, rockSampleInInvest.srcId))
    .where(and(...filters));
  const geojson = sqlToGeojson(data);
  const units = defineUnits<typeof data>({
    "si\\O₂": "wt%",
    "na₂\\O": "wt%",
    "k₂\\O": "wt%",
    ageKa: "Ka",
    ageMa: "Ma",
  });

  return {
    success: true,
    data: {
      geojson,
      units,
    },
  };
};
