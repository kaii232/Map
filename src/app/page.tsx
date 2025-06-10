import Header from "@/components/header";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export default function Home() {
  return (
    <>
      <Header />
      <main className="flex h-screen w-full flex-col items-center justify-center gap-4">
        <h1 className="text-4xl font-semibold text-neutral-50">InVEST</h1>
        <Button asChild>
          <Link href="/map">View Data</Link>
        </Button>
      </main>
    </>
  );
}
