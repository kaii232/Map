"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ComponentProps, useState } from "react";
import { Button } from "./ui/button";
import Spinner from "./ui/spinner";

const HeaderLink = ({
  href,
  className,
  ...rest
}: ComponentProps<typeof Link>) => {
  const path = usePathname();
  const active = href === path;

  return (
    <Link
      href={href}
      className={cn(
        "block px-3 py-2 transition-colors hover:text-yellow-500 hover:underline",
        active && "text-amber-400 hover:text-yellow-500",
        className,
      )}
      {...rest}
    />
  );
};

const AdminDashboardLink = () => {
  const { data: session } = authClient.useSession();
  if (!session || session.user.role !== "admin") return null;
  return (
    <li>
      <HeaderLink href="/admin-dashboard">Admin Dashboard</HeaderLink>
    </li>
  );
};

export const AccountLink = ({ className }: { className?: string }) => {
  const { data: session, isPending } = authClient.useSession();

  if (isPending)
    return (
      <div className="flex w-16 justify-center">
        <Spinner className="size-4" />
      </div>
    );

  if (!session)
    return (
      <HeaderLink href="/login" className={className}>
        Login
      </HeaderLink>
    );

  return (
    <HeaderLink href="/account" className={className}>
      Account
    </HeaderLink>
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
          <ul className="flex items-center gap-4 text-sm">
            {links.map((link) => (
              <li key={link.href}>
                <HeaderLink href={link.href}>{link.label}</HeaderLink>
              </li>
            ))}
            <AdminDashboardLink />
            <li>
              <AccountLink />
            </li>
          </ul>
        </nav>
      </div>
      {expanded && (
        <nav className="mx-auto max-w-[1400px] py-8 sm:hidden">
          <ul className="flex flex-col gap-2">
            {links.map((link) => (
              <li key={link.href}>
                <HeaderLink href={link.href}>{link.label}</HeaderLink>
              </li>
            ))}
            <AdminDashboardLink />
            <li>
              <AccountLink />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
