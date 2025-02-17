import { z } from "zod";

export type FiltersType = {
  name: string;
  type: "select" | "range" | "date";
  key: string;
}[];

type Range = [number, number];
type Categories = string[] | null;

export const vlcFilters: FiltersType = [
  {
    name: "Class",
    type: "select",
    key: "classes",
  },
  {
    name: "Country",
    type: "select",
    key: "countries",
  },
  {
    name: "Source",
    type: "select",
    key: "sources",
  },
];

const createZodSchema = (input: FiltersType) => {
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
  for (let i = 0; i < input.length; i++) {
    if (input[i].type === "select") {
      schema[input[i].key] = z.string();
    } else if (input[i].type === "range") {
      schema[input[i].key] = z.number().array().length(2);
      schema[`${input[i].key}AllowNull`] = z.boolean();
    } else {
      schema[input[i].key] = z
        .object({ from: z.date(), to: z.date() })
        .required();
      schema[`${input[i].key}AllowNull`] = z.boolean();
    }
  }
  return schema;
};

export const createDefaultValues = (
  filters: Record<string, Range | Categories | [string, string]>,
  input: FiltersType,
) => {
  const values: {
    [key: string]:
      | boolean
      | string
      | [number, number]
      | { from: Date; to: Date };
  } = {};
  for (let i = 0; i < input.length; i++) {
    if (input[i].type === "select") {
      values[input[i].key] = "All";
    } else if (input[i].type === "range") {
      values[input[i].key] = [
        (filters[input[i].key]![0] as number) || 0,
        (filters[input[i].key]![1] as number) || 0,
      ];
      values[`${input[i].key}AllowNull`] = true;
    } else {
      values[input[i].key] = {
        from: new Date(filters[input[i].key] ? filters[input[i].key]![0] : 0),
        to: new Date(filters[input[i].key] ? filters[input[i].key]![1] : 0),
      };
      values[`${input[i].key}AllowNull`] = true;
    }
  }
  return values;
};

export const vlcFormSchema = z.object(createZodSchema(vlcFilters));
