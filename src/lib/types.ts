/** This type collapses the type and makes it nicer to look at in the editor typehints
E.g. `ComplexType<{someKey: AnotherType; someKey2: AnotherType2}>` will become: `{finalKey: finalVal; finalKey2: finalVal2}` */
export type Simplify<T> = { [K in keyof T]: T[K] } & {};

/** Contains names of all the different basemaps */
export type BasemapNames =
  | "Openstreetmap"
  | "Opentopomap"
  | "Satellite"
  | "Ocean"
  | "Openfreemap";
