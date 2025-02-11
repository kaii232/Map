type Range = [number, number];
type Categories = string[] | null;

export type VlcFilters = {
  classes: Categories;
  countries: Categories;
  categorySources: Categories;
  sources: Categories;
};

export type SeisFilters = {
  depthRange: Range;
  mwRange: Range;
  msRange: Range;
  mbRange: Range;
  dateRange: [string, string];
  catalogs: Categories;
};

export type SmtFilters = {
  elevRange: Range;
  baseRange: Range;
  summitRange: Range;
  blRange: Range;
  bwRange: Range;
  baRange: Range;
  classes: Categories;
  catalogs: Categories;
  countries: Categories;
};

export type GnssFilters = {
  elevRange: Range;
  dateRange: [string, string];
  projects: Categories;
  stations: Categories;
  countries: Categories;
};

export type FltFilters = {
  lengthRange: Range;
  sliprateRange: Range;
  depthRange: Range;
  types: Categories;
  catalogs: Categories;
};
