"use server";

import { ALL_FILTERS } from "@/lib/data-definitions";
import {
  createZodSchema,
  FILTER_STRATEGIES,
  GenericFilterDefine,
  Range,
} from "@/lib/filters";
import { UnionToIntersection } from "@/lib/types";
import { and, eq, getTableColumns, inArray, type SQL, sql } from "drizzle-orm";
import { AnyPgColumn, PgSelect } from "drizzle-orm/pg-core";
import { Feature, FeatureCollection, MultiPolygon, Polygon } from "geojson";
import { json2csv } from "json-2-csv";
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

type DrizzleSelect = Record<string, AnyPgColumn | SQL>;
type SQLFilters = (SQL | undefined)[];

export type ActionReturn<
  K = { geojson: FeatureCollection; units?: Record<string, string> },
  T = unknown,
> =
  | {
      success: true;
      data: K;
      metadata?: T;
    }
  | { success: false; error: string };

const sqlToGeojson = (
  input: ({
    id: number | null;
    geojson: string;
    geometry: string;
    [key: string]: unknown;
  } | null)[],
  excludeKey?: string[],
): FeatureCollection => {
  const features: Feature[] = [];
  const added: Record<string | number, boolean> = {};
  for (let i = 0; i < input.length; i++) {
    const currentVal = input[i];
    if (!currentVal || !currentVal.id || added[currentVal.id]) continue; // Do not add null rows or duplicate rows again
    added[currentVal.id] = true;
    const { geojson, id, geometry, ...properties } = currentVal;
    if (excludeKey) excludeKey.map((key) => delete properties[key]);
    features.push({
      type: "Feature",
      id: id,
      properties,
      geometry: JSON.parse(geojson),
    });
  }
  return {
    type: "FeatureCollection",
    features: features,
  };
};

/** Helper function to enable type safety when defining units */
const defineUnits = <T extends Record<string, unknown>>(
  units: Partial<Record<keyof UnionToIntersection<T>, string>>,
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
  const output: SQLFilters = [];
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

/** Object to spread for the longitude and latitude units */
const LNG_LAT_UNITS = {
  longitude: "°",
  latitude: "°",
};

const retrieveSmt = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: smtInInvest.smtId,
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
      geometry: sql.raw(smtInInvest.smtGeom.name).mapWith(String),
    })
    .from(smtInInvest)
    .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId))
    .$dynamic();
};

const retrieveVlc = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: vlcInInvest.vlcId,
      country: countryInInvest.countryName,
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
    .$dynamic();
};

const retrieveGnss = (
  gnssSelect: DrizzleSelect,
  vectorSelect: DrizzleSelect,
  ellipseSelect: DrizzleSelect,
) => {
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
  return db
    .select({
      gnss: {
        ...gnssSelect,
        id: gnssStnInInvest.gnssId,
        country: countryInInvest.countryName,
        type: stnTypeInInvest.stnTypeName,
        geojson: sql<string>`ST_ASGEOJSON(${gnssStnInInvest.gnssGeom})`,
        geometry: sql.raw(gnssStnInInvest.gnssGeom.name).mapWith(String),
      },
      vector: {
        ...vectorSelect,
        id: gnssStnInInvest.gnssId,
        source: biblInInvest.biblTitle,
        geojson: sql<string>`ST_ASGEOJSON(ST_MAKELINE(${gnssStnInInvest.gnssGeom},${ellipses.projected}))`,
        geometry: sql<string>`ST_MAKELINE(${gnssStnInInvest.gnssGeom},${ellipses.projected})`,
      },
      ellipse: {
        ...ellipseSelect,
        id: gnssStnInInvest.gnssId, // Since the ID of ellipse and vector and point is the same, hovering over any sets the feature state of the vectors to hover also.
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
    .$dynamic();
};

const retrieveFlt = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: fltInInvest.fltId,
      catalog: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${fltInInvest.fltGeom})`,
      geometry: sql.raw(fltInInvest.fltGeom.name).mapWith(String),
    })
    .from(fltInInvest)
    .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId))
    .$dynamic();
};

const retrieveSeis = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: seisInInvest.seisId,
      catalog: biblInInvest.biblTitle,
      range: sql<Range>`ARRAY[FLOOR(MIN(${seisInInvest.seisDepth}) OVER()), CEIL(MAX(${seisInInvest.seisDepth}) OVER())]`,
      geojson: sql<string>`ST_ASGEOJSON(${seisInInvest.seisGeom})`,
      geometry: sql.raw(seisInInvest.seisGeom.name).mapWith(String),
    })
    .from(seisInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, seisInInvest.seisCatId))
    .$dynamic();
};

const retrieveHf = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: heatflowInInvest.hfId,
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${heatflowInInvest.hfGeom})`,
      geometry: sql.raw(heatflowInInvest.hfGeom.name).mapWith(String),
    })
    .from(heatflowInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, heatflowInInvest.hfSrcId))
    .$dynamic();
};

const retrieveSlab2 = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: slab2InInvest.slabId,
      country: countryInInvest.countryName,
      range:
        sql`ARRAY[FLOOR(MIN(${slab2InInvest.slabDepth}) OVER()), CEIL(MAX(${slab2InInvest.slabDepth}) OVER())]`.mapWith(
          (val: [string, string]) => val.map(Number),
        ), // It is a string array as slapDepth is numeric type
      geojson: sql<string>`ST_ASGEOJSON(${slab2InInvest.slabGeom})`,
      geometry: sql.raw(slab2InInvest.slabGeom.name).mapWith(String),
    })
    .from(slab2InInvest)
    .leftJoin(
      countryInInvest,
      eq(countryInInvest.countryId, slab2InInvest.slabCountryId),
    )
    .$dynamic();
};

const retrieveSlip = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: slipModelInInvest.patchId,
      modelId: slipModelInInvest.modelId,
      range: sql<Range>`ARRAY[FLOOR(MIN(${slipModelInInvest.patchSlip}) OVER()), CEIL(MAX(${slipModelInInvest.patchSlip}) OVER())]`,
      geojson: sql<string>`ST_ASGEOJSON(${slipModelInInvest.patchGeom})`,
      geometry: sql.raw(slipModelInInvest.patchGeom.name).mapWith(String),
    })
    .from(slipModelInInvest)
    .leftJoin(
      biblInInvest,
      eq(slipModelInInvest.modelSrcId, biblInInvest.biblId),
    )
    .$dynamic();
};
const retrieveRock = (select: DrizzleSelect) => {
  return db
    .select({
      ...select,
      id: rockSampleInInvest.rockSampleId,
      source: biblInInvest.biblTitle,
      geojson: sql<string>`ST_ASGEOJSON(${rockSampleInInvest.rockGeom})`,
      geometry: sql.raw(rockSampleInInvest.rockGeom.name).mapWith(String),
    })
    .from(rockSampleInInvest)
    .leftJoin(biblInInvest, eq(biblInInvest.biblId, rockSampleInInvest.srcId))
    .$dynamic();
};

/**
 * Processes the data that is retrieved from the database
 * @param db The drizzle query to select the data
 * @param filters Filters for the data
 * @param range Default range for the data used for the colour ramps. Leave as `undefined` if data has no colour ramp
 * @param expandNestedData Set to `true` if the query select contains nested data like GNSS
 * @param asCSV Set to `true` to return data as a csv
 */
const processSQLData = async (
  db: PgSelect,
  filters: SQLFilters,
  range?: Range,
  expandNestedData: boolean = false,
  asCSV: boolean = false,
): Promise<
  string | { geojson: FeatureCollection; range?: Range | Range[] }
> => {
  const data = await db.where(and(...filters));
  // Handle no rows returned
  if (!data.length) {
    if (asCSV) return "";
    return { geojson: sqlToGeojson([]) };
  }

  // For CSV download
  if (asCSV) {
    if (expandNestedData) {
      return json2csv(data, {
        expandNestedObjects: true, // Set to true
        emptyFieldValue: "",
      });
    }
    return json2csv(data, {
      expandNestedObjects: false,
      emptyFieldValue: "",
    });
  }

  // Normal data return
  if (!expandNestedData) {
    const typedData = data as {
      geojson: string;
      geometry: string;
      id: number;
      range: typeof range extends undefined ? undefined : Range;
      [key: string]: unknown;
    }[];
    return {
      geojson: sqlToGeojson(typedData, range ? ["range"] : undefined),
      range: range ? (typedData[0].range ?? range) : range,
    };
  }

  // Nested data return, e.g. GNSS SQL return structure
  const geojsonArray = Object.keys(data[0]).map((key) =>
    sqlToGeojson(
      data.map((val) => val[key]),
      range ? ["range"] : undefined,
    ),
  );
  // Combines all the feature arrays into one
  const allFeatures = geojsonArray.flatMap((val) => val.features);
  return {
    geojson: {
      type: "FeatureCollection",
      features: allFeatures,
    },
    range: range
      ? Object.keys(data[0]).map((key) => data[0][key].range ?? range)
      : undefined,
  };
};

type Loaders = {
  [P in keyof typeof ALL_FILTERS]: {
    /** Whether this data type has filters. Needed to distinguish between the getFilters types */
    filter: (typeof ALL_FILTERS)[P] extends null ? false : true;
    /** Returns the dynamic drizzle query (See: https://orm.drizzle.team/docs/dynamic-query-building) based on whether the user is downloading data or not, and the units for this data type.  */
    getData: (download: boolean) => {
      units: Record<string, string>;
      dataQuery: PgSelect;
    };
    /** Returns the drizzle SQL filters based on the user's values */
    getFilters: Loaders[P]["filter"] extends false
      ? (drawing: Polygon | MultiPolygon | undefined) => Promise<SQLFilters>
      : (
          values: z.infer<z.ZodObject<ReturnType<typeof createZodSchema>>>,
          drawing: Polygon | MultiPolygon | undefined,
        ) => Promise<SQLFilters>;
    /** Returns the drizzle SQL filter to filter based on IDs within a cluster */
    getClusterFilters: (ids: number[]) => SQL;
    /** Default range for this data type used for the colour ramp */
    range?: Range;
    /** Whether the structure of the data returned from drizzle is nested.
     * E.g. {
     *        rect: { id: number, col: string},
     *        circ: { id: number, col: string}
     *      } (nested)
     *      vs
     *      {
     *        rectId: number,
     *        rectCol: string,
     *        circId: number,
     *        circCol: string
     *      } (not nested)
     * */
    expandNestedData?: true;
  };
};

/** This object defines how data is loaded for each data type*/
const LOADERS_DEFINITION: Loaders = {
  smt: {
    filter: true,
    getData(download) {
      const {
        smtLoaddate,
        ccLoadId,
        smtSrcId,
        smtId,
        smtGeom,
        ...downloadCols
      } = getTableColumns(smtInInvest);
      const smtSelect = download
        ? downloadCols
        : {
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
          };
      const dataQuery = retrieveSmt(smtSelect);
      const units = defineUnits<typeof smtSelect>({
        elevation: "m",
        base: "m",
        summit: "m",
        bw: "km",
        ba: "km",
        bl: "km²",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.smt,
        values,
        true,
        smtInInvest.smtGeom,
        drawing,
      );
    },
    getClusterFilters(ids) {
      return inArray(smtInInvest.smtId, ids);
    },
  },
  flt: {
    filter: true,
    getData(download) {
      const {
        fltId,
        ccLoadId,
        fltSrcId,
        fltGeom,
        fltLoaddate,
        ...downloadCols
      } = getTableColumns(fltInInvest);

      const fltSelect = download
        ? downloadCols
        : {
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
            comment: fltInInvest.fltCmt,
            lockingDepth: fltInInvest.fltLockDepth,
          };
      const dataQuery = retrieveFlt(fltSelect);
      const units = defineUnits<typeof fltSelect>({
        length: "km",
        sliprate: "mm/yr",
        strikeSlip: "mm/yr",
        verticalSeparation: "mm/yr",
        horizontalSeparation: "mm/yr",
        dip: "°",
        rake: "°",
        lockingDepth: "km",
      });
      return { dataQuery, units };
    },
    getClusterFilters(ids) {
      return inArray(fltInInvest.fltId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.flt,
        values,
        true,
        fltInInvest.fltGeom,
        drawing,
      );
    },
  },
  gnss: {
    filter: true,
    expandNestedData: true,
    getData(download) {
      const {
        gnssId,
        gnssLoaddate,
        ccLoadId,
        countryId,
        stnTypeId,
        gnssGeom,
        ...gnssDownloadCols
      } = getTableColumns(gnssStnInInvest);
      const {
        vectorId,
        ccLoadId: vectorCCLoad,
        vectorBiblId,
        vectorLoaddate,
        ...vectorDownloadCols
      } = getTableColumns(gnssVectorInInvest);

      const gnssSelect = download
        ? gnssDownloadCols
        : {
            name: gnssStnInInvest.gnssName,
            project: gnssStnInInvest.gnssProj,
            elevation: gnssStnInInvest.gnssElev,
            installDate: gnssStnInInvest.gnssInstDate,
            decomDate: gnssStnInInvest.gnssDecomDate,
            longitude: gnssStnInInvest.gnssLon,
            latitude: gnssStnInInvest.gnssLat,
          };
      const vectorSelect = download
        ? vectorDownloadCols
        : {
            easting: gnssVectorInInvest.vectorEasting,
            northing: gnssVectorInInvest.vectorNorthing,
            vertical: gnssVectorInInvest.vectorVertical,
            timePeriod: gnssVectorInInvest.vectorTimePeriod,
          };
      const ellipseSelect = {
        eastingUncertainty: gnssVectorInInvest.vectorEastingUnc,
        northingUncertainty: gnssVectorInInvest.vectorNorthingUnc,
        verticalUncertainty: gnssVectorInInvest.vectorVerticalUnc,
      };
      const dataQuery = retrieveGnss(gnssSelect, vectorSelect, ellipseSelect);
      const units = defineUnits<
        typeof gnssSelect & typeof vectorSelect & typeof ellipseSelect
      >({
        elevation: "m",
        easting: "m/yr",
        northing: "m/yr",
        vertical: "m/yr",
        eastingUncertainty: "m/yr",
        northingUncertainty: "m/yr",
        verticalUncertainty: "m/yr",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(gnssStnInInvest.gnssId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.gnss,
        values,
        false,
        gnssStnInInvest.gnssGeom,
        drawing,
      );
    },
  },
  hf: {
    filter: false,
    getData(download) {
      const { hfId, ccLoadId, hfSrcId, hfLoaddate, hfGeom, ...downloadCols } =
        getTableColumns(heatflowInInvest);
      const hfSelect = download
        ? downloadCols
        : {
            name: heatflowInInvest.hfName,
            elevation: heatflowInInvest.hfElev,
            qval: heatflowInInvest.hfQval,
            reference: heatflowInInvest.hfRef,
            longitude: heatflowInInvest.hfLon,
            latitude: heatflowInInvest.hfLat,
          };

      const dataQuery = retrieveHf(hfSelect);
      const units = defineUnits<typeof hfSelect>({
        elevation: "m",
        qval: "W/m²",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(heatflowInInvest.hfId, ids);
    },
    getFilters(drawing) {
      return generateFilters(
        ALL_FILTERS.hf,
        {},
        true,
        heatflowInInvest.hfGeom,
        drawing,
      );
    },
  },
  vlc: {
    filter: true,
    getData(download) {
      const {
        vlcId,
        vlcSrcId,
        countryId,
        ccLoadId,
        vlcLoaddate,
        vlcGeom,
        ...downloadCols
      } = getTableColumns(vlcInInvest);

      const vlcSelect = download
        ? downloadCols
        : {
            name: vlcInInvest.vlcName,
            elevation: vlcInInvest.vlcElev,
            class: vlcInInvest.vlcClass,
            categorySource: vlcInInvest.vlcCatSrc,
            gvpId: vlcInInvest.gvpId,
            wovodat: vlcInInvest.vlcWovodatUrl,
            gvp: vlcInInvest.vlcGvpUrl,
            longitude: vlcInInvest.vlcLon,
            latitude: vlcInInvest.vlcLat,
            timePeriod: vlcInInvest.vlcTimePeriod,
          };
      const dataQuery = retrieveVlc(vlcSelect);
      const units = defineUnits<typeof vlcSelect>({
        elevation: "m",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(vlcInInvest.vlcId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.vlc,
        values,
        true,
        vlcInInvest.vlcGeom,
        drawing,
      );
    },
  },
  seis: {
    filter: true,
    range: [0, 1024],
    getData(download) {
      const { seisId, ccLoadId, seisLoaddate, seisGeom, ...downloadCols } =
        getTableColumns(seisInInvest);

      const seisSelect = download
        ? downloadCols
        : {
            depth: seisInInvest.seisDepth,
            mw: seisInInvest.seisMw,
            ms: seisInInvest.seisMs,
            mb: seisInInvest.seisMb,
            date: seisInInvest.seisDate,
            longitude: seisInInvest.seisLon,
            latitude: seisInInvest.seisLat,
          };
      const dataQuery = retrieveSeis(seisSelect);
      const units = defineUnits<typeof seisSelect>({
        depth: "km",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(seisInInvest.seisId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.seis,
        values,
        true,
        seisInInvest.seisGeom,
        drawing,
      );
    },
  },
  slab2: {
    filter: true,
    range: [0, 800],
    getData(download) {
      const {
        slabId,
        ccLoadId,
        slabCountryId,
        slabSrcId,
        slabGeom,
        slabLoaddate,
        ...downloadCols
      } = getTableColumns(slab2InInvest);

      const slab2Select = download
        ? downloadCols
        : {
            depth: sql.raw(`${slab2InInvest.slabDepth.name}`).mapWith(Number), //Convenient way to map string to number
            region: slab2InInvest.slabRegion,
            layer: slab2InInvest.slabLayer,
          };
      const dataQuery = retrieveSlab2(slab2Select);
      const units = defineUnits<typeof slab2Select>({
        depth: "km",
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(slab2InInvest.slabId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.slab2,
        values,
        false,
        slab2InInvest.slabGeom,
        drawing,
      );
    },
  },
  slip: {
    filter: true,
    range: [0, 1],
    getData(download) {
      const {
        modelId,
        patchId,
        ccLoadId,
        modelSrcId,
        patchGeom,
        ...downloadCols
      } = getTableColumns(slipModelInInvest);

      const slipSelect = download
        ? downloadCols
        : {
            depth: slipModelInInvest.patchDepth,
            strike: slipModelInInvest.patchStrike,
            rake: slipModelInInvest.patchRake,
            dip: slipModelInInvest.patchDip,
            slip: slipModelInInvest.patchSlip,
            modelEvent: biblInInvest.biblTitle,
            longitude: slipModelInInvest.patchLon,
            latitude: slipModelInInvest.patchLat,
          };
      const dataQuery = retrieveSlip(slipSelect);
      const units = defineUnits<typeof slipSelect>({
        depth: "km",
        strike: "°",
        rake: "°",
        dip: "°",
        slip: "m",
        ...LNG_LAT_UNITS,
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(slipModelInInvest.patchId, ids);
    },
    getFilters(values, drawing) {
      return generateFilters(
        ALL_FILTERS.slip,
        values,
        true,
        slipModelInInvest.patchGeom,
        drawing,
      );
    },
  },
  rock: {
    filter: false,
    getData(download) {
      const {
        rockSampleId,
        ccLoadId,
        srcId,
        rockGeom,
        rockLoaddate,
        ...downloadCols
      } = getTableColumns(rockSampleInInvest);
      const rockSelect = download
        ? downloadCols
        : {
            name: rockSampleInInvest.rockSampleName,
            mineral: rockSampleInInvest.rockMineral,
            "si\\O₂": rockSampleInInvest.rockSio2Wt, // Backslash so the camelCaseToWords function does not split it into Si O₂
            "na₂\\O": rockSampleInInvest.rockNa2OWt,
            "k₂\\O": rockSampleInInvest.rockK2OWt,
            geologicAge: rockSampleInInvest.rockGeologicalAge,
          };
      const dataQuery = retrieveRock(rockSelect);
      const units = defineUnits<typeof rockSelect>({
        "si\\O₂": "wt%",
        "na₂\\O": "wt%",
        "k₂\\O": "wt%",
      });
      return { units, dataQuery };
    },
    getClusterFilters(ids) {
      return inArray(rockSampleInInvest.rockSampleId, ids);
    },
    getFilters(drawing) {
      return generateFilters(
        ALL_FILTERS.rock,
        {},
        true,
        rockSampleInInvest.rockGeom,
        drawing,
      );
    },
  },
};

export type LoaderFilter =
  | {
      filter: true;
      values: z.infer<z.ZodObject<ReturnType<typeof createZodSchema>>>;
      drawing?: Polygon | MultiPolygon;
    }
  | {
      filter: false;
      values?: undefined;
      drawing?: Polygon | MultiPolygon;
    };

type LoaderDownload =
  | {
      type: "full";
      format: "csv" | "geojson";
    }
  | {
      type: "cluster";
      format: "csv" | "geojson";
      downloadIds: number[];
    };

export type LoaderType =
  | {
      data: LoaderFilter;
      downloadOpts?: Extract<LoaderDownload, { type: "full" }>;
    }
  | {
      data?: undefined; // Not needed if downloading a cluster, it's here for the discriminated union
      downloadOpts: Extract<LoaderDownload, { type: "cluster" }>;
    };

type LoaderReturn<T extends LoaderType> = ActionReturn<
  T["downloadOpts"] extends { format: "csv" }
    ? string
    : { geojson: FeatureCollection; units?: Record<string, string> },
  Range | Range[]
>;

/** Function that loads the data */
export const LoadData = async <T extends LoaderType>(
  dataKey: keyof typeof ALL_FILTERS,
  params: T,
): Promise<LoaderReturn<T>> => {
  // Validate values
  if (params.data?.filter && ALL_FILTERS[dataKey]) {
    const schema = z.object(createZodSchema(ALL_FILTERS[dataKey]));
    const { success } = schema.safeParse(params.data.values);
    if (!success)
      return { success: false, error: "Values do not follow schema" };
  }
  const loader = LOADERS_DEFINITION[dataKey];

  // Gets the appropriate filters for tha data
  const filters =
    params.downloadOpts && params.downloadOpts.type === "cluster"
      ? [loader.getClusterFilters(params.downloadOpts.downloadIds)]
      : loader.filter
        ? params.data?.filter
          ? await loader.getFilters(params.data.values, params.data.drawing)
          : []
        : await loader.getFilters(params.data?.drawing);

  const { units, dataQuery } = loader.getData(!!params.downloadOpts);

  const queryResponse = await processSQLData(
    dataQuery,
    filters,
    loader.range,
    loader.expandNestedData,
    params.downloadOpts?.format === "csv",
  );

  // Standard and ranged data
  if (typeof queryResponse === "object") {
    return {
      success: true,
      data: {
        geojson: queryResponse.geojson,
        units,
      },
      metadata: queryResponse.range,
    } as LoaderReturn<T>;
  }

  // CSV response
  return {
    success: true,
    data: queryResponse,
  } as LoaderReturn<T>;
};
