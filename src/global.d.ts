declare module "*.geojson" {
  export default value;
}
declare module "*.xlsx" {
  export default value;
}
declare module "*.csv" {
  const value: Record<string, string | number>[];
  export default value;
}
