import Image from "next/image";
import Link from "next/link";

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neutral-700 bg-neutral-950 px-4 py-2">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between">
        <Link href="/">
          <Image
            alt="Earth Observatory of Singapore"
            src="/logo.png"
            height={36}
            width={94}
          />
          <span className="sr-only">Home</span>
        </Link>
        <nav className="hidden sm:block">
          <ul className="flex gap-4 text-sm text-neutral-50">
            <li>
              <Link
                href="/"
                className="px-3 py-2 transition-colors hover:text-yellow-500"
              >
                Home
              </Link>
            </li>
            <li>
              <Link
                href="/database"
                className="px-3 py-2 transition-colors hover:text-yellow-500"
              >
                Map
              </Link>
            </li>
            <li>
              <Link
                href="/publications"
                className="px-3 py-2 transition-colors hover:text-yellow-500"
              >
                Publications
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
