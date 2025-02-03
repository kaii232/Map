import { db } from "@/server/db";
import { countryInInvest, vlcInInvest } from "@/server/db/schema";
import { eq, or, sql } from "drizzle-orm";
import { Feature, FeatureCollection } from "geojson";
import DatabaseMap from "./database-map";

export default async function DatabasePage() {
  const volcanoes = await db
    .select({
      vlcId: vlcInInvest.vlcId,
      name: vlcInInvest.vlcName,
      elevation: vlcInInvest.vlcElev,
      class: vlcInInvest.vlcClass,
      categorySource: vlcInInvest.vlcCatSrc,
      country: countryInInvest.countryName,
      geojson: sql<string>`ST_ASGEOJSON("vlc_geom")`,
    })
    .from(vlcInInvest)
    .leftJoin(
      countryInInvest,
      or(
        eq(vlcInInvest.countryId1, countryInInvest.countryId),
        eq(vlcInInvest.countryId2, countryInInvest.countryId),
      ),
    );

  const vlcToGeojson = (
    input: {
      vlcId: number;
      name: string | null;
      elevation: number | null;
      class: string | null;
      categorySource: string | null;
      country: string | null;
      geojson: string;
    }[],
  ): FeatureCollection => {
    const features: Feature[] = [];
    for (let i = 0; i < input.length; i++) {
      features.push({
        type: "Feature",
        id: input[i].vlcId,
        properties: {
          ...input[i],
          geojson: undefined,
          vlcId: undefined,
        },
        geometry: JSON.parse(input[i].geojson),
      });
    }
    return {
      type: "FeatureCollection",
      features: features,
    };
  };

  const vlcGeojson = vlcToGeojson(volcanoes);

  return (
    <main className="h-screen w-full">
      <DatabaseMap vlc={vlcGeojson} />
    </main>
  );
}
