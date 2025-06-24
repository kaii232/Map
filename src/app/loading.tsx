import Spinner from "@/components/ui/spinner";

/** See: https://nextjs.org/docs/app/api-reference/file-conventions/loading */
export default function LoadingScreen() {
  return (
    <main className="flex h-screen w-full items-center justify-center">
      <Spinner />
    </main>
  );
}
