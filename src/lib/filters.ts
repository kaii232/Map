import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  seisInInvest,
  slab2InInvest,
  slipModelInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import { between, eq, gte, isNull, like, or, sql, SQL } from "drizzle-orm";
import { AnyPgColumn } from "drizzle-orm/pg-core";
import { z } from "zod";
import type {
  Categories,
  ClientFilterDefine,
  ClientFilterType,
  DateFilter,
  FiltersType,
  GenericFilterDefine,
  GreaterThan,
  InferFilterTypes,
  NarrowFilterType,
  Range,
  Simplify,
} from "./types";

// To add new data with and without filters follow these steps:
// 1. Define the filter using the createDataFilter helper function this object will denote (skip this step if no filter)
//    name: The label of the filter
//    type: The the type of filter it is
//    dbCol: The drizzle column that the filter will be applied on
//    nullCol: For select filters, if NULL is selected, the column that the IS NULL filter should be applied on
// 2. Update the ALL_FILTERS object with the filter defined in 1. or null if no filter
// 3. Create server action to load the data in actions.ts
// 4. Update the labels and loaders in utils.ts
// 5. Update map/page.tsx to fetch the data needed to populate the filter using the generateSQLSelect function. (skip this step if no filter)
// 6. Update map/database-map.tsx mapDataLayers to specify the layer styles
// 7. Update map/controls.tsx ColourRamps legends object if a legend is needed to display the data

// To add additional filters for data that already exists:
// 2. Update the filter object of that data

// To add new types of filter:
// 1. Define the type of the data needed to populate the filter in types.ts
// 2. Update GenericFiltersInfo (skip if does not need to be populated with data from server), FiltersType and
//    NarrowFilterType (skip if does not need to be populated with data from server) in types.ts to reflect this new filter
// 3. If the new filter does not need to be populated with data from the server, adjust FilterServerPopulated type in types.ts to reflect that
// 4. Update FilterStrategy type in this file to reflect new filter
// 5. Update FILTER_STRATEGIES in this file to deal with the new filter
// 6. Update form-generate.tsx to render the UI needed for your filter

/** Helper function to enable type safety when defining new filters */
const createDataFilter = <T extends GenericFilterDefine>(obj: {
  [P in keyof T]: T[P];
}) => obj;

const vlcFilters = createDataFilter({
  classes: {
    name: "Class",
    type: "select",
    dbCol: vlcInInvest.vlcClass,
    nullCol: vlcInInvest.vlcClass,
  },
  countries: {
    name: "Country",
    type: "select",
    dbCol: countryInInvest.countryName,
    nullCol: vlcInInvest.countryId,
  },
  sources: {
    name: "Source",
    type: "select",
    dbCol: biblInInvest.biblTitle,
    nullCol: vlcInInvest.vlcSrcId,
  },
  search: {
    name: "Volcano Name",
    type: "search",
    dbCol: vlcInInvest.vlcName,
    placeholder: "Search for volcanoes",
  },
});

const seisFilters = createDataFilter({
  depthRange: {
    dbCol: seisInInvest.seisDepth,
    name: "Depth",
    type: "range",
    units: "m",
  },
  mwRange: {
    dbCol: seisInInvest.seisMw,
    name: "Mw",
    type: "range",
  },
  dateRange: {
    dbCol: seisInInvest.seisDate,
    name: "Date",
    type: "date",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: seisInInvest.seisCatId,
    name: "Catalog",
    type: "select",
  },
});

const smtFilters = createDataFilter({
  elevRange: {
    dbCol: smtInInvest.smtElev,
    name: "Elevation",
    type: "range",
    units: "m",
  },
  baseRange: {
    dbCol: smtInInvest.smtBase,
    name: "Base",
    type: "range",
    units: "m",
  },
  summitRange: {
    dbCol: smtInInvest.smtSummit,
    name: "Summit",
    type: "range",
    units: "m",
  },
  classes: {
    dbCol: smtInInvest.smtClass,
    nullCol: smtInInvest.smtClass,
    name: "Class",
    type: "select",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: smtInInvest.smtSrcId,
    name: "Catalog",
    type: "select",
  },
});

const gnssFilters = createDataFilter({
  elevRange: {
    dbCol: gnssStnInInvest.gnssElev,
    name: "Elevation",
    type: "range",
    units: "m",
  },
  dateRange: {
    dbCol: gnssStnInInvest.gnssInstDate,
    name: "Install Date",
    type: "date",
  },
  countries: {
    dbCol: countryInInvest.countryName,
    nullCol: gnssStnInInvest.countryId,
    name: "Country",
    type: "select",
  },
  projects: {
    dbCol: gnssStnInInvest.gnssProj,
    nullCol: gnssStnInInvest.gnssProj,
    type: "select",
    name: "Project",
  },
  stations: {
    dbCol: stnTypeInInvest.stnTypeName,
    nullCol: gnssStnInInvest.stnTypeId,
    type: "select",
    name: "Station Type",
  },
});

const fltFilters = createDataFilter({
  lengthRange: {
    dbCol: fltInInvest.fltLen,
    name: "Length",
    type: "range",
    units: "km",
  },
  sliprateRange: {
    dbCol: fltInInvest.fltSliprate,
    name: "Sliprate",
    type: "range",
  },
  depthRange: {
    dbCol: fltInInvest.fltLockDepth,
    name: "Depth",
    type: "range",
    units: "m",
  },
  types: {
    dbCol: fltInInvest.fltType,
    nullCol: fltInInvest.fltType,
    type: "select",
    name: "Type",
  },
  catalogs: {
    dbCol: biblInInvest.biblTitle,
    nullCol: fltInInvest.fltSrcId,
    name: "Catalog",
    type: "select",
  },
});

const slab2Filters = createDataFilter({
  region: {
    dbCol: slab2InInvest.slabRegion,
    nullCol: slab2InInvest.slabRegion,
    name: "Region",
    type: "select",
  },
});

const slipFilters = createDataFilter({
  modelEvent: {
    dbCol: slipModelInInvest.modelEvent,
    name: "Model Event",
    nullCol: slipModelInInvest.modelEvent,
    type: "select",
  },
  slipRate: {
    dbCol: slipModelInInvest.patchSlip,
    name: "Slip Rate",
    type: "greaterThan",
    maxVal: 1,
    units: "m",
  },
});

/**
 * An object containing the filter types for all the different data types. The keys of this object is used as the keys for all other objects
 * dealing with the different data types, and its respective value defines the filters for that data type.
 * Value is `null` when there are no filters for that data type.
 * # DO NOT import this on the client!
 */
export const ALL_FILTERS = {
  smt: smtFilters,
  vlc: vlcFilters,
  gnss: gnssFilters,
  flt: fltFilters,
  seis: seisFilters,
  hf: null,
  slab2: slab2Filters,
  slip: slipFilters,
  rock: null,
};

/** Type of the data required to populate all filters */
export type PopulateFilters = {
  [P in keyof typeof ALL_FILTERS as (typeof ALL_FILTERS)[P] extends GenericFilterDefine
    ? P
    : never]: (typeof ALL_FILTERS)[P] extends GenericFilterDefine
    ? Simplify<InferFilterTypes<(typeof ALL_FILTERS)[P]>>
    : never;
};

function cleanObjectForClient() {
  const out: Record<
    string,
    Record<string, ClientFilterType<FiltersType>> | null
  > = {};
  Object.entries(ALL_FILTERS).forEach(([key, val]) => {
    if (val === null) {
      out[key] = null;
      return;
    }
    const filterObj: (typeof out)[string] = {};
    Object.entries(val).map(([clientKey, clientVal]) => {
      const obj = { ...clientVal };
      delete obj.dbCol;
      delete obj.nullCol;
      filterObj[clientKey] = obj;
    });
    out[key] = filterObj;
  });
  return out as {
    [P in keyof typeof ALL_FILTERS]: (typeof ALL_FILTERS)[P] extends GenericFilterDefine
      ? Simplify<ClientFilterDefine<(typeof ALL_FILTERS)[P]>>
      : null;
  };
}
/** `ALL_FILTERS` object with drizzle schema columns removed for the client */
export const ALL_FILTERS_CLIENT = cleanObjectForClient();

/** Default value for select filter */
export const SELECT_DEFAULT = "All";

type FilterStrategy<T extends FiltersType["type"]> = {
  /** Zod type used for data validation when submitting data to be loaded */
  getZodSchema: T extends "select" | "search"
    ? z.ZodString
    : T extends "range"
      ? z.ZodArray<z.ZodNumber, "many">
      : T extends "greaterThan"
        ? z.ZodArray<z.ZodNumber, "many">
        : T extends "date"
          ? z.ZodObject<{
              from: z.ZodDate;
              to: z.ZodDate;
            }>
          : never;
  /** Returns the default value for the filter controls */
  getDefaultVal: (
    initialData: NarrowFilterType<T>,
  ) => T extends "select"
    ? typeof SELECT_DEFAULT
    : T extends "range"
      ? Range
      : T extends "greaterThan"
        ? GreaterThan
        : T extends "date"
          ? { from: Date; to: Date }
          : T extends "search"
            ? ""
            : never;
  /** Indicates whether an allow null checkbox should be shown for this filter type */
  getAllowNull: boolean;
  /** Returns the drizzle SQL `SELECT` statements needed to retrieve values to populate this filter */
  getSQLSelect: (dbCol: AnyPgColumn) => SQL<NarrowFilterType<T>> | undefined;
  /** Returns the drizzle SQL `WHERE` statements to filter the data when loading */
  getSQLFilter: (
    key: string,
    vals: Record<
      string,
      z.infer<FilterStrategy<FiltersType["type"]>["getZodSchema"]> | boolean
    >,
    dbCol: AnyPgColumn,
    nullCol?: AnyPgColumn,
  ) => SQL | undefined;
};

/** This object defines the methods needed for each of the filter types */
export const FILTER_STRATEGIES: {
  [P in FiltersType["type"]]: FilterStrategy<P>;
} = {
  date: {
    getZodSchema: z.object({ from: z.date(), to: z.date() }).required(),
    getDefaultVal(initialData) {
      const now = Date.now();
      return {
        from: new Date(initialData[0] !== "NULL" ? initialData[0] : now),
        to: new Date(initialData[1] !== "NULL" ? initialData[1] : now),
      };
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<DateFilter>`ARRAY[MIN(${dbCol}), MAX(${dbCol})]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (typeof input !== "object" || Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(
          between(dbCol, input.from.toISOString(), input.to.toISOString()),
          isNull(dbCol),
        );
      } else {
        return between(dbCol, input.from.toISOString(), input.to.toISOString());
      }
    },
  },
  select: {
    getZodSchema: z.string(),
    getDefaultVal() {
      return SELECT_DEFAULT;
    },
    getAllowNull: false,
    getSQLSelect(dbCol) {
      return sql<Categories>`ARRAY_AGG(DISTINCT ${dbCol})`;
    },
    getSQLFilter(key, vals, dbCol, nullCol) {
      const input = vals[key];
      if (typeof input !== "string") return;
      if (input === SELECT_DEFAULT) return;
      if (input === "NULL" && nullCol) {
        return isNull(nullCol);
      } else {
        return eq(dbCol, input);
      }
    },
  },
  range: {
    getZodSchema: z.number().array().length(2),
    getDefaultVal(initialData) {
      return [Number(initialData[0]) || 0, Number(initialData[1]) || 0];
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<Range>`ARRAY[FLOOR(MIN(${dbCol})), CEIL(MAX(${dbCol}))]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (!Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(between(dbCol, input[0], input[1]), isNull(dbCol));
      } else {
        return between(dbCol, input[0], input[1]);
      }
    },
  },
  greaterThan: {
    getZodSchema: z.number().array().length(1),
    getDefaultVal(initialData) {
      return initialData.length === 1 ? initialData : [0];
    },
    getAllowNull: true,
    getSQLSelect(dbCol) {
      return sql<GreaterThan>`ARRAY[FLOOR(MIN(${dbCol}))]`;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (!Array.isArray(input)) return;
      if (vals[`${key}AllowNull`]) {
        return or(gte(dbCol, input[0]), isNull(dbCol));
      } else {
        return gte(dbCol, input[0]);
      }
    },
  },
  search: {
    getZodSchema: z.string(),
    getDefaultVal() {
      return "";
    },
    getAllowNull: false,
    getSQLSelect() {
      return undefined;
    },
    getSQLFilter(key, vals, dbCol) {
      const input = vals[key];
      if (typeof input !== "string") return;
      if (!input.trim()) return;
      if (vals[`${key}AllowNull`]) {
        return or(
          like(sql`lower(${dbCol})`, `%${input.trim().toLowerCase()}%`),
          isNull(dbCol),
        );
      } else {
        return like(sql`lower(${dbCol})`, `%${input.trim().toLowerCase()}%`);
      }
    },
  },
};

/**
 * This function creates a zod schema for input validation for the given filters
 * @param filters An object describing the type of filters
 * @returns A zodSchema for input validation
 */
export function createZodSchema(
  filters: NonNullable<
    (typeof ALL_FILTERS | typeof ALL_FILTERS_CLIENT)[keyof typeof ALL_FILTERS]
  >,
) {
  const schema: Record<
    string,
    | z.ZodArray<z.ZodNumber, "many">
    | z.ZodBoolean
    | z.ZodString
    | z.ZodObject<{
        from: z.ZodDate;
        to: z.ZodDate;
      }>
  > = {};

  Object.entries(filters).forEach(([key, val]: [string, FiltersType]) => {
    schema[key] = FILTER_STRATEGIES[val.type].getZodSchema;
    if (FILTER_STRATEGIES[val.type].getAllowNull)
      schema[`${key}AllowNull`] = z.boolean();
  });
  return schema;
}

/**
 * A function that creates an object containing the default values for the given filters
 * @param initialData Data fetched from database for populating the filter values
 * @param filters An object describing the type of filters
 * @returns An object containing the default values for each filter
 */
export function createDefaultValues<T extends keyof PopulateFilters>( // This generic doesn't actually do anything but it helps prevent some errors so it's here
  initialData: PopulateFilters[T],
  filters: NonNullable<(typeof ALL_FILTERS_CLIENT)[T]>,
) {
  const values: {
    [key: string]: boolean | string | number[] | { from: Date; to: Date };
  } = {};
  Object.keys(filters).forEach((key) => {
    values[key] = FILTER_STRATEGIES[filters[key].type].getDefaultVal(
      //@ts-expect-error Types can't be properly differentiated
      initialData[key],
    );
    if (FILTER_STRATEGIES[filters[key].type].getAllowNull)
      values[`${key}AllowNull`] = true;
  });
  return values;
}

/**
 * Convenience function to generate the SQL select statements needed to populate the filter
 * @param filter An object describing the type of filters
 * @returns An object containing the SQL select statements required for populating the filter
 */
export const generateSQLSelect = <T extends GenericFilterDefine>(filter: T) => {
  const res: Record<string, SQL> = {};
  Object.entries(filter).forEach(([key, val]) => {
    const statement = FILTER_STRATEGIES[val.type].getSQLSelect(val.dbCol);
    if (statement) res[key] = statement;
  });
  return res as {
    [P in keyof InferFilterTypes<T>]: SQL<InferFilterTypes<T>[P]>;
  };
};
