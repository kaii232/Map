import {
  biblInInvest,
  countryInInvest,
  fltInInvest,
  gnssStnInInvest,
  seisInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import { z } from "zod";
import type {
  Categories,
  DateFilter,
  FilterDefine,
  GenericFiltersInfo,
  Range,
} from "./types";

export type VlcFilters = {
  classes: Categories;
  countries: Categories;
  sources: Categories;
};

export const vlcFilters: FilterDefine<VlcFilters> = {
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
};

export type SeisFilters = {
  depthRange: Range;
  mwRange: Range;
  dateRange: DateFilter;
  catalogs: Categories;
};

export const seisFilters: FilterDefine<SeisFilters> = {
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
};

export type SmtFilters = {
  elevRange: Range;
  baseRange: Range;
  summitRange: Range;
  classes: Categories;
  catalogs: Categories;
};
export const smtFilters: FilterDefine<SmtFilters> = {
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
};

export type GnssFilters = {
  elevRange: Range;
  dateRange: DateFilter;
  projects: Categories;
  stations: Categories;
  countries: Categories;
};
export const gnssFilters: FilterDefine<GnssFilters> = {
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
};

export type FltFilters = {
  lengthRange: Range;
  sliprateRange: Range;
  depthRange: Range;
  types: Categories;
  catalogs: Categories;
};

export const fltFilters: FilterDefine<FltFilters> = {
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
};

const createZodSchema = <T extends GenericFiltersInfo>(
  filters: FilterDefine<T>,
) => {
  const schema: Record<
    string,
    | z.ZodArray<z.ZodNumber, "many">
    | z.ZodBoolean
    | z.ZodString
    | z.ZodObject<
        {
          from: z.ZodDate;
          to: z.ZodDate;
        },
        "strip",
        z.ZodTypeAny,
        {
          from: Date;
          to: Date;
        },
        {
          from: Date;
          to: Date;
        }
      >
  > = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key].type === "select") {
      schema[key] = z.string();
    } else if (filters[key].type === "range") {
      schema[key] = z.number().array().length(2);
      schema[`${key}AllowNull`] = z.boolean();
    } else {
      schema[key] = z.object({ from: z.date(), to: z.date() }).required();
      schema[`${key}AllowNull`] = z.boolean();
    }
  });
  return schema;
};

export const createDefaultValues = (
  initialData: GenericFiltersInfo,
  filters: FilterDefine<GenericFiltersInfo>,
) => {
  const values: {
    [key: string]:
      | boolean
      | string
      | [number, number]
      | { from: Date; to: Date };
  } = {};
  Object.keys(filters).forEach((key) => {
    if (filters[key].type === "select") {
      values[key] = "All";
    } else if (filters[key].type === "range") {
      values[key] = [
        (initialData[key]![0] as number) || 0,
        (initialData[key]![1] as number) || 0,
      ];
      values[`${key}AllowNull`] = true;
    } else {
      values[key] = {
        from: new Date(
          initialData[key] && initialData[key][0] !== "NULL"
            ? initialData[key][0]
            : 0,
        ),
        to: new Date(
          initialData[key] && initialData[key][0] !== "NULL"
            ? initialData[key][1]
            : 0,
        ),
      };
      values[`${key}AllowNull`] = true;
    }
  });
  return values;
};

export const vlcFormSchema = z.object(createZodSchema(vlcFilters));
export const gnssFormSchema = z.object(createZodSchema(gnssFilters));
export const seisFormSchema = z.object(createZodSchema(seisFilters));
export const smtFormSchema = z.object(createZodSchema(smtFilters));
export const fltFormSchema = z.object(createZodSchema(fltFilters));
