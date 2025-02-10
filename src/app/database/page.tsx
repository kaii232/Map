import { db } from "@/server/db";
import {
  countryInInvest,
  fltInInvest,
  fltSrcInInvest,
  gnssStnInInvest,
  seisCatInInvest,
  seisInInvest,
  smtInInvest,
  smtSrcInInvest,
  stnTypeInInvest,
  vlcInInvest,
  vlcSrcInInvest,
} from "@/server/db/schema";
import { eq, or, sql } from "drizzle-orm";
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

  const [vlcFilters, seisFilters, smtFilters, gnssFilters, fltFilters] =
    await Promise.all([
      // db
      //   .select({
      //     id: vlcInInvest.vlcId,
      //     name: vlcInInvest.vlcName,
      //     elevation: vlcInInvest.vlcElev,
      //     class: vlcInInvest.vlcClass,
      //     categorySource: vlcInInvest.vlcCatSrc,
      //     country: countryInInvest.countryName,
      //     geojson: sql<string>`ST_ASGEOJSON(${vlcInInvest.vlcGeom})`,
      //   })
      //   .from(vlcInInvest)
      //   .leftJoin(
      //     countryInInvest,
      //     or(
      //       eq(vlcInInvest.countryId1, countryInInvest.countryId),
      //       eq(vlcInInvest.countryId2, countryInInvest.countryId),
      //     ),
      //   ),
      // db
      //   .select({
      //     id: smtInInvest.smtId,
      //     name: smtInInvest.smtName,
      //     class: smtInInvest.smtClass,
      //     elevation: smtInInvest.smtElev,
      //     base: smtInInvest.smtBase,
      //     summit: smtInInvest.smtSummit,
      //     bw: smtInInvest.smtBw,
      //     ba: smtInInvest.smtBa,
      //     bl: smtInInvest.smtBl,
      //     country: countryInInvest.countryName,
      //     geojson: sql<string>`ST_ASGEOJSON(${smtInInvest.smtGeom})`,
      //   })
      //   .from(smtInInvest)
      //   .leftJoin(
      //     countryInInvest,
      //     eq(smtInInvest.countryId, countryInInvest.countryId),
      //   ),
      // db
      //   .select({
      //     id: gnssStnInInvest.gnssId,
      //     name: gnssStnInInvest.gnssName,
      //     project: gnssStnInInvest.gnssProj,
      //     type: stnTypeInInvest.stnTypeName,
      //     elevation: gnssStnInInvest.gnssElev,
      //     country: countryInInvest.countryName,
      //     installDate: gnssStnInInvest.gnssInstDate,
      //     decomDate: gnssStnInInvest.gnssDecomDate,
      //     geojson: sql<string>`ST_ASGEOJSON(${gnssStnInInvest.gnssGeom})`,
      //   })
      //   .from(gnssStnInInvest)
      //   .leftJoin(
      //     countryInInvest,
      //     eq(gnssStnInInvest.countryId, countryInInvest.countryId),
      //   )
      //   .leftJoin(
      //     stnTypeInInvest,
      //     eq(stnTypeInInvest.stnTypeId, gnssStnInInvest.stnTypeId),
      //   ),
      db
        .with(sources)
        .select({
          classes: sql<string[]>`ARRAY_AGG(DISTINCT ${vlcInInvest.vlcClass})`,
          countries: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
          categorySources: sql<string[]>`ARRAY_AGG(DISTINCT sources)`,
          sources: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${vlcSrcInInvest.vlcSrcName})`,
        })
        .from(vlcInInvest)
        .leftJoin(
          countryInInvest,
          or(
            eq(vlcInInvest.countryId1, countryInInvest.countryId),
            eq(vlcInInvest.countryId2, countryInInvest.countryId),
          ),
        )
        .leftJoin(
          vlcSrcInInvest,
          eq(vlcInInvest.vlcSrcId, vlcSrcInInvest.vlcSrcId),
        )
        .leftJoin(sources, eq(sources.vlcId, vlcInInvest.vlcId)),
      db
        .select({
          depthRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisDepth}), MAX(${seisInInvest.seisDepth})]`,
          mwRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisMw}), MAX(${seisInInvest.seisMw})]`,
          msRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisMs}), MAX(${seisInInvest.seisMs})]`,
          mbRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisMb}), MAX(${seisInInvest.seisMb})]`,
          dateRange: sql<
            [string, string]
          >`ARRAY[MIN(${seisInInvest.seisDate}), MAX(${seisInInvest.seisDate})]`,
          catalogs: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${seisCatInInvest.seisCatName})`,
        })
        .from(seisInInvest)
        .leftJoin(
          seisCatInInvest,
          eq(seisInInvest.seisCatId, seisCatInInvest.seisCatId),
        ),
      db
        .select({
          elevRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtElev}), MAX(${smtInInvest.smtElev})]`,
          baseRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtBase}), MAX(${smtInInvest.smtBase})]`,
          summitRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtSummit}), MAX(${smtInInvest.smtSummit})]`,
          blRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtBl}), MAX(${smtInInvest.smtBl})]`,
          bwRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtBw}), MAX(${smtInInvest.smtBw})]`,
          baRange: sql<
            [number, number]
          >`ARRAY[MIN(${smtInInvest.smtBa}), MAX(${smtInInvest.smtBa})]`,
          classes: sql<string[]>`ARRAY_AGG(DISTINCT ${smtInInvest.smtClass})`,
          catalogs: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${smtSrcInInvest.smtSrcName})`,
          countries: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
        })
        .from(smtInInvest)
        .leftJoin(
          countryInInvest,
          eq(smtInInvest.countryId, countryInInvest.countryId),
        )
        .leftJoin(
          smtSrcInInvest,
          eq(smtInInvest.smtSrcId, smtSrcInInvest.smtSrcId),
        ),
      db
        .select({
          elevRange: sql<
            [number, number]
          >`ARRAY[MIN(${gnssStnInInvest.gnssElev}), MAX(${gnssStnInInvest.gnssElev})]`,
          dateRange: sql<
            [string, string]
          >`ARRAY[MIN(${gnssStnInInvest.gnssInstDate}), MAX(${gnssStnInInvest.gnssInstDate})]`,
          projects: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${gnssStnInInvest.gnssProj})`,
          stations: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${stnTypeInInvest.stnTypeName})`,
          countries: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
        })
        .from(gnssStnInInvest)
        .leftJoin(
          countryInInvest,
          eq(gnssStnInInvest.countryId, countryInInvest.countryId),
        )
        .leftJoin(
          stnTypeInInvest,
          eq(gnssStnInInvest.stnTypeId, stnTypeInInvest.stnTypeId),
        ),

      db
        .select({
          lengthRange: sql<
            [number, number]
          >`ARRAY[MIN(${fltInInvest.fltLen}), MAX(${fltInInvest.fltLen})]`,
          sliprateRange: sql<
            [number, number]
          >`ARRAY[MIN(${fltInInvest.fltSliprate}), MAX(${fltInInvest.fltSliprate})]`,
          depthRange: sql<
            [number, number]
          >`ARRAY[MIN(${fltInInvest.fltLockDepth}), MAX(${fltInInvest.fltLockDepth})]`,
          types: sql<string[]>`ARRAY_AGG(DISTINCT ${fltInInvest.fltType})`,
          catalogs: sql<string[]>`ARRAY_AGG(DISTINCT ${fltSrcInInvest.fltSrc})`,
        })
        .from(fltInInvest)
        .leftJoin(
          fltSrcInInvest,
          eq(fltInInvest.fltSrcId, fltSrcInInvest.fltSrcId),
        ),
    ]);

  return (
    <main className="h-screen w-full">
      <DatabaseMap
        filters={{
          flt: fltFilters[0],
          gnss: gnssFilters[0],
          smt: smtFilters[0],
          vlc: vlcFilters[0],
          seis: seisFilters[0],
        }}
      />
    </main>
  );
}
