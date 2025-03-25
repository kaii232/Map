"use client";

import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, useState } from "react";
import { Button } from "./ui/button";

const HeaderLink = ({ href, ...rest }: ComponentProps<typeof Link>) => {
  const path = usePathname();
  const active = href === path;

  return (
    <Link
      href={href}
      className={`px-3 py-2 transition-colors hover:underline ${active ? "text-amber-400 hover:text-yellow-500" : "hover:text-yellow-500"}`}
      {...rest}
    />
  );
};

const links = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Map",
    href: "/database",
  },
  {
    label: "Publications",
    href: "/publications",
  },
];

export default function Header() {
  const [expanded, setExpanded] = useState(false);

  return (
    <header className="sticky top-0 z-50 border-b border-neutral-600 bg-neutral-950 px-4 py-2 text-neutral-50">
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
        <Button
          variant="ghost"
          className="size-8 justify-center p-0 sm:hidden"
          aria-label="Menu"
          onClick={() => setExpanded((prev) => !prev)}
        >
          <Menu />
        </Button>
        <nav className="hidden sm:block">
          <ul className="flex gap-4 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <HeaderLink href={link.href}>{link.label}</HeaderLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      {expanded && (
        <nav className="mx-auto max-w-[1400px] py-8 sm:hidden">
          <ul className="flex flex-col gap-4">
            {links.map((link) => (
              <li key={link.href}>
                <HeaderLink href={link.href}>{link.label}</HeaderLink>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
