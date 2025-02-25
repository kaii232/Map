import { Button } from "@/components/ui/button";
import "@watergis/maplibre-gl-terradraw/dist/maplibre-gl-terradraw.css";
import "maplibre-gl/dist/maplibre-gl.css";
import Link from "next/link";

function Home() {
  return (
    <main className="flex h-screen w-full flex-col items-center justify-center gap-4">
      <h1 className="text-4xl font-semibold">InVEST</h1>
      <Button asChild>
        <Link href="/database">View Data</Link>
      </Button>
    </main>
  );
}
export default Home;
