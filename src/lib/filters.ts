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
import { sql, SQL } from "drizzle-orm";
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
  Range,
  Simplify,
} from "./types";

// To add new data with filters follow these steps:
// 1. Define the filter using the createDataFilter helper function this object will denote
//    name: The label of the filter
//    type: The the type of filter it is
//    dbCol: The drizzle column that the filter will be applied on
//    nullCol: For select filters, if NULL is selected, the column that the IS NULL filter should be applied on
// 2. Update the ALL_FILTERS object with the new data
// 3. Create server action to load the data in actions.ts
// 4. Update the labels and loaders in utils.ts
// 5. Update database/page.tsx to fetch the data needed to populate the filter using the generateSQLSelect function.
// 6. Update database-map.tsx mapDataLayers to specify the layer styles
// 7. Update controls.tsx ColourRamps legends object if a legend is needed to display the data

// To add additional filters for data that already exists:
// 2. Update the filter object of that data

// To add new types of filter:
// 1. Define the type of the data needed to populate the filter
// 2. Update GenericFiltersInfo, FiltersType and InferFilterTypes to reflect this new filter
// 3. Update createZodSchema and createDefaultValues in this file to deal with the new filter
// 4. Update generateFilters in actions.ts to handle the SQL filters for the new filter
// 5. Update form-generate.tsx to render the UI needed for your filter

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
    units: "Km",
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
};

/** Type of the data required to populate all filters */
export type PopulateFilters = {
  [P in keyof typeof ALL_FILTERS]: (typeof ALL_FILTERS)[P] extends GenericFilterDefine
    ? Simplify<InferFilterTypes<(typeof ALL_FILTERS)[P]>>
    : null;
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

/**
 * This function creates a zod schema for input validation for the given filters
 * @param filters An object describing the type of filters
 * @returns A zodSchema for input validation
 */
export const createZodSchema = <
  T extends NonNullable<
    (typeof ALL_FILTERS_CLIENT | typeof ALL_FILTERS)[keyof typeof ALL_FILTERS]
  >,
>(
  filters: T,
) => {
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
    if (val.type === "select") {
      schema[key] = z.string();
    } else if (val.type === "range") {
      schema[key] = z.number().array().length(2);
      schema[`${key}AllowNull`] = z.boolean();
    } else if (val.type === "date") {
      schema[key] = z.object({ from: z.date(), to: z.date() }).required();
      schema[`${key}AllowNull`] = z.boolean();
    } else if (val.type === "greaterThan") {
      schema[key] = z.number().array().length(1);
      schema[`${key}AllowNull`] = z.boolean();
    } else {
      //@ts-expect-error Nicer console error when missing zod schema for new filter type
      console.error("No zod schema defined for filter of type", val.type);
    }
  });
  return schema;
  // Uncomment the type below to get the full static typing on the output when passed a static filters object
  // However there isn't a huge upside to the static typing as we don't really need to access this object anywhere
  // So the generic object is a bit easier to work with
  //
  // as Simplify<
  //   {
  //     [P in keyof T]: T[P] extends {
  //       type: "select";
  //     }
  //       ? z.ZodString
  //       : T[P] extends { type: "range" }
  //         ? z.ZodArray<z.ZodNumber, "many">
  //         : T[P] extends { type: "greaterThan" }
  //           ? z.ZodArray<z.ZodNumber, "many">
  //           : T[P] extends { type: "date" }
  //             ? z.ZodObject<{
  //                 from: z.ZodDate;
  //                 to: z.ZodDate;
  //               }>
  //             : never;
  //   } & {
  //     [P in keyof T as T[P] extends {
  //       type: "select";
  //     }
  //       ? never
  //       : `${P & string}AllowNull`]: T[P] extends {
  //       type: "select";
  //     }
  //       ? never
  //       : z.ZodBoolean;
  //   }
  // >;
};

/**
 * A function that creates an object containing the default values for the given filters
 * @param initialData Data fetched from database for populating the filter values
 * @param filters An object describing the type of filters
 * @returns An object containing the default values for each filter
 */
export const createDefaultValues = <
  T extends NonNullable<(typeof ALL_FILTERS_CLIENT)[K]>,
  K extends keyof typeof ALL_FILTERS_CLIENT,
>(
  initialData: NonNullable<PopulateFilters[K]>,
  filters: T,
) => {
  const values: {
    [key: string]: boolean | string | number[] | { from: Date; to: Date };
  } = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key].type === "select") {
      values[key] = "All";
      return;
    }
    // Rest of the filters has allow null check box
    values[`${key}AllowNull`] = true;
    if (filters[key].type === "range") {
      values[key] = [
        (initialData[key] ? Number(initialData[key][0]) : 0) || 0,
        (initialData[key] ? Number(initialData[key][1]) : 0) || 0,
      ];
      return;
    }
    if (filters[key].type === "greaterThan") {
      values[key] = [Number(initialData[key]) || 0];
      return;
    }
    if (filters[key].type === "date") {
      const now = Date.now();
      values[key] = {
        from: new Date(
          initialData[key] && initialData[key][0] !== "NULL"
            ? initialData[key][0]
            : now,
        ),
        to: new Date(
          initialData[key] && initialData[key][1]! !== "NULL"
            ? initialData[key][1]!
            : now,
        ),
      };
      return;
    }
    console.error(
      "No default values defined for filter of type",
      filters[key].type,
    );
  });
  return values;
  // Uncomment the type below to get accurate static typing on the output when passed a filters object
  // However, the only time this function is called is in data-filter.tsx, where the ALL_FILTERS object key is dynamic
  // So the final type will be a union of the static types, which isn't so useful
  // It could be more useful to just leave it in the generic type
  //
  // as Simplify<
  //   {
  //     [P in keyof T]: T[P] extends {
  //       type: "select";
  //     }
  //       ? "All"
  //       : T[P] extends { type: "range" }
  //         ? [number, number]
  //         : T[P] extends { type: "greaterThan" }
  //           ? [number]
  //           : T[P] extends { type: "date" }
  //             ? { from: Date; to: Date }
  //             : never;
  //   } & {
  //     [P in keyof T as T[P] extends {
  //       type: "select";
  //     }
  //       ? never
  //       : `${P & string}AllowNull`]: T[P] extends {
  //       type: "select";
  //     }
  //       ? never
  //       : true;
  //   }
  // >;
};

/**
 * Convenience function to generate the SQL select statements needed to populate the filter
 * @param filter An object describing the type of filters
 * @returns An object containing the SQL select statements required for populating the filter
 */
export const generateSQLSelect = <T extends GenericFilterDefine>(filter: T) => {
  const res: Record<string, SQL> = {};
  Object.entries(filter).map(([key, val]) => {
    if (val.type === "range") {
      res[key] =
        sql<Range>`ARRAY[FLOOR(MIN(${val.dbCol})), CEIL(MAX(${val.dbCol}))]`;
    } else if (val.type === "select") {
      res[key] = sql<Categories>`ARRAY_AGG(DISTINCT ${val.dbCol})`;
    } else if (val.type === "date") {
      res[key] = sql<DateFilter>`ARRAY[MIN(${val.dbCol}), MAX(${val.dbCol})]`;
    } else if (val.type === "greaterThan") {
      // Greather than filter
      res[key] = sql<GreaterThan>`ARRAY[MIN(${val.dbCol})]`;
    } else {
      console.error(
        "No SQL generate method defined for filter of type",
        //@ts-expect-error Nicer error message when no SQL select defined
        val.type,
      );
    }
  });
  return res as {
    [P in keyof T]: SQL<InferFilterTypes<T>[P]>;
  };
};
