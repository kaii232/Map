import { db } from "@/server/db";
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
import { eq, sql } from "drizzle-orm";
import DatabaseMap from "./database-map";

export const dynamic = "force-dynamic";

export default async function DatabasePage() {
  // const sources = db.$with("sources").as(
  //   db
  //     .select({
  //       vlcId: vlcInInvest.vlcId,
  //       sources: sql`string_to_table(${vlcInInvest.vlcCatSrc}, ', ')`.as(
  //         "sources",
  //       ),
  //     })
  //     .from(vlcInInvest),
  // );

  const [vlcFilters, seisFilters, smtFilters, gnssFilters, fltFilters] =
    await Promise.all([
      db
        // .with(sources)
        .select({
          classes: sql<string[]>`ARRAY_AGG(DISTINCT ${vlcInInvest.vlcClass})`,
          // categorySources: sql<string[]>`ARRAY_AGG(DISTINCT sources)`,
          countries: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${countryInInvest.countryName})`,
          sources: sql<string[]>`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
        })
        .from(vlcInInvest)
        .leftJoin(
          countryInInvest,
          eq(vlcInInvest.countryId, countryInInvest.countryId),
        )
        .leftJoin(biblInInvest, eq(vlcInInvest.vlcSrcId, biblInInvest.biblId)),
      // .leftJoin(sources, eq(sources.vlcId, vlcInInvest.vlcId)),
      db
        .select({
          depthRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisDepth}), MAX(${seisInInvest.seisDepth})]`,
          mwRange: sql<
            [number, number]
          >`ARRAY[MIN(${seisInInvest.seisMw}), MAX(${seisInInvest.seisMw})]`,
          dateRange: sql<
            [string, string]
          >`ARRAY[MIN(${seisInInvest.seisDate}), MAX(${seisInInvest.seisDate})]`,
          catalogs: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
        })
        .from(seisInInvest)
        .leftJoin(
          biblInInvest,
          eq(seisInInvest.seisCatId, biblInInvest.biblId),
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
          classes: sql<string[]>`ARRAY_AGG(DISTINCT ${smtInInvest.smtClass})`,
          catalogs: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
        })
        .from(smtInInvest)
        .leftJoin(biblInInvest, eq(smtInInvest.smtSrcId, biblInInvest.biblId)),
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
          catalogs: sql<
            string[]
          >`ARRAY_AGG(DISTINCT ${biblInInvest.biblTitle})`,
        })
        .from(fltInInvest)
        .leftJoin(biblInInvest, eq(fltInInvest.fltSrcId, biblInInvest.biblId)),
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
