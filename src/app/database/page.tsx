import { db } from "@/server/db";
import {
  countryInInvest,
  gnssStnInInvest,
  smtInInvest,
  stnTypeInInvest,
  vlcInInvest,
} from "@/server/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { Feature, FeatureCollection } from "geojson";
import DatabaseMap from "./database-map";

export default async function DatabasePage() {
  const sources = db.$with("sources").as(
    db
      .select({
        vlcId: vlcInInvest.vlcId,
        sources: sql`string_to_table(${vlcInInvest.vlcCatSrc}, ', ')`.as(
          "sources",
        ),
      })
      .from(vlcInInvest),
  );

  const [
    volcanoes,
    seamounts,
    gnss,
    // vlcFilters,
    // seisFilters,
    // smtFilters,
    // gnssFilters,
  ] = await Promise.all([
    db
      .select({
        id: vlcInInvest.vlcId,
        name: vlcInInvest.vlcName,
        elevation: vlcInInvest.vlcElev,
        class: vlcInInvest.vlcClass,
        categorySource: vlcInInvest.vlcCatSrc,
        country: countryInInvest.countryName,
        geojson: sql<string>`ST_ASGEOJSON(${vlcInInvest.vlcGeom})`,
      })
      .from(vlcInInvest)
      .leftJoin(
        countryInInvest,
        or(
          eq(vlcInInvest.countryId1, countryInInvest.countryId),
          eq(vlcInInvest.countryId2, countryInInvest.countryId),
        ),
      ),
    db
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
        country: countryInInvest.countryName,
        geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
      })
      .from(smtInInvest)
      .leftJoin(
        countryInInvest,
        eq(smtInInvest.countryId, countryInInvest.countryId),
      ),
    db
      .select({
        id: gnssStnInInvest.gnssId,
        name: gnssStnInInvest.gnssName,
        project: gnssStnInInvest.gnssProj,
        type: stnTypeInInvest.stnTypeName,
        elevation: gnssStnInInvest.gnssElev,
        country: countryInInvest.countryName,
        installDate: gnssStnInInvest.gnssInstDate,
        decomDate: gnssStnInInvest.gnssDecomDate,
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
      ),
    // db
    //   .with(sources)
    //   .select({
    //     classes: sql<string[]>`ARRAY_AGG(DISTINCT ${vlcInInvest.vlcClass})`,
    //     countries: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
    //     categorySources: sql<string[]>`ARRAY_AGG(DISTINCT sources)`,
    //     sources: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${vlcSrcInInvest.vlcSrcName})`,
    //   })
    //   .from(vlcInInvest)
    //   .leftJoin(
    //     countryInInvest,
    //     or(
    //       eq(vlcInInvest.countryId1, countryInInvest.countryId),
    //       eq(vlcInInvest.countryId2, countryInInvest.countryId),
    //     ),
    //   )
    //   .leftJoin(
    //     vlcSrcInInvest,
    //     eq(vlcInInvest.vlcSrcId, vlcSrcInInvest.vlcSrcId),
    //   )
    //   .leftJoin(sources, eq(sources.vlcId, vlcInInvest.vlcId)),
    // db
    //   .select({
    //     depthRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${seisInInvest.seisDepth}), MAX(${seisInInvest.seisDepth})]`,
    //     mwRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${seisInInvest.seisMw}), MAX(${seisInInvest.seisMw})]`,
    //     msRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${seisInInvest.seisMs}), MAX(${seisInInvest.seisMs})]`,
    //     mbRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${seisInInvest.seisMb}), MAX(${seisInInvest.seisMb})]`,
    //     dateRange: sql<
    //       [Date, Date]
    //     >`ARRAY[MIN(${seisInInvest.seisDate}), MAX(${seisInInvest.seisDate})]`,
    //     catalogs: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${seisCatInInvest.seisCatName})`,
    //     countries: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
    //   })
    //   .from(seisInInvest)
    //   .leftJoin(
    //     countryInInvest,
    //     or(
    //       eq(seisInInvest.countryId1, countryInInvest.countryId),
    //       eq(seisInInvest.countryId2, countryInInvest.countryId),
    //     ),
    //   )
    //   .leftJoin(
    //     seisCatInInvest,
    //     eq(seisInInvest.seisCatId, seisCatInInvest.seisCatId),
    //   ),
    // db
    //   .select({
    //     elevRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtElev}), MAX(${smtInInvest.smtElev})]`,
    //     baseRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtBase}), MAX(${smtInInvest.smtBase})]`,
    //     summitRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtSummit}), MAX(${smtInInvest.smtSummit})]`,
    //     blRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtBl}), MAX(${smtInInvest.smtBl})]`,
    //     bwRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtBw}), MAX(${smtInInvest.smtBw})]`,
    //     baRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${smtInInvest.smtBa}), MAX(${smtInInvest.smtBa})]`,
    //     classes: sql<string[]>`ARRAY_AGG(DISTINCT ${smtInInvest.smtClass})`,
    //     catalogs: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${smtSrcInInvest.smtSrcName})`,
    //     countries: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
    //   })
    //   .from(smtInInvest)
    //   .leftJoin(
    //     countryInInvest,
    //     eq(smtInInvest.countryId, countryInInvest.countryId),
    //   )
    //   .leftJoin(
    //     smtSrcInInvest,
    //     eq(smtInInvest.smtSrcId, smtSrcInInvest.smtSrcId),
    //   ),
    // db
    //   .select({
    //     elevRange: sql<
    //       [number, number]
    //     >`ARRAY[MIN(${gnssStnInInvest.gnssElev}), MAX(${gnssStnInInvest.gnssElev})]`,
    //     dateRange: sql<
    //       [Date, Date]
    //     >`ARRAY[MIN(${gnssStnInInvest.gnssInstDate}), MAX(${gnssStnInInvest.gnssInstDate})]`,
    //     projects: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${gnssStnInInvest.gnssProj})`,
    //     stations: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${stnTypeInInvest.stnTypeName})`,
    //     countries: sql<
    //       string[]
    //     >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
    //   })
    //   .from(gnssStnInInvest)
    //   .leftJoin(
    //     countryInInvest,
    //     eq(gnssStnInInvest.countryId, countryInInvest.countryId),
    //   )
    //   .leftJoin(
    //     stnTypeInInvest,
    //     eq(gnssStnInInvest.stnTypeId, stnTypeInInvest.stnTypeId),
    //   ),
  ]);

  const sqlToGeojson = (
    input: {
      id: number;
      geojson: string;
      [key: string]: string | number | null | Date;
    }[],
  ): FeatureCollection => {
    const features: Feature[] = [];
    for (let i = 0; i < input.length; i++) {
      features.push({
        type: "Feature",
        id: input[i].id,
        properties: {
          ...input[i],
          geojson: undefined,
          id: undefined,
        },
        geometry: JSON.parse(input[i].geojson),
      });
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  const vlcGeojson = sqlToGeojson(volcanoes);
  const smtGeojson = sqlToGeojson(seamounts);
  const gnssGeojson = sqlToGeojson(gnss);

  return (
    <main className="h-screen w-full">
      <DatabaseMap vlc={vlcGeojson} smt={smtGeojson} gnss={gnssGeojson} />
    </main>
  );
}
