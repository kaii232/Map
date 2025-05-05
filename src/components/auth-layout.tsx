import Image from "next/image";
import Link from "next/link";

export default function AuthLayout({
  header,
  description,
  children,
}: {
  header: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <main className="flex h-svh w-full flex-col items-center justify-center gap-6 bg-neutral-900 p-4">
      <Link href="/">
        <Image
          src="/logo.png"
          alt="Earth Observatory Singapore"
          width={124}
          height={48}
        />
      </Link>
      <div className="flex w-full max-w-md flex-col gap-6 rounded-2xl border border-neutral-600 bg-neutral-950 p-8 text-neutral-300">
        <div className="space-y-2">
          <h1 className="text-2xl font-semibold leading-none tracking-tight text-neutral-50">
            {header}
          </h1>
          <p className="text-sm text-neutral-400">{description}</p>
        </div>
        <div>{children}</div>
      </div>
    </main>
  );
}
