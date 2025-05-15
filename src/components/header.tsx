"use client";

import { authClient } from "@/lib/auth-client";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";
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
        "block px-3 py-2 text-sm font-bold text-white transition-colors hover:text-earth hover:underline",
        active && "text-earth",
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
      <div className="flex h-9 w-16 items-center justify-center">
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

const LINKS = [
  {
    label: "Home",
    href: "/",
  },
  {
    label: "Map",
    href: "/map",
  },
  {
    label: "Publications",
    href: "/publications",
  },
];

export default function Header() {
  const [expanded, setExpanded] = useState(false);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 flex flex-col border-b border-neutral-600 bg-background text-neutral-50",
        expanded && "h-screen sm:h-auto",
      )}
    >
      <div className="mx-auto flex w-full max-w-[1400px] items-center justify-between px-4 py-2">
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
          className="size-8 justify-center p-0 sm:hidden [&_svg]:size-6"
          aria-label="Menu"
          onClick={() => setExpanded((prev) => !prev)}
        >
          {expanded ? <X /> : <Menu />}
        </Button>
        <nav className="hidden sm:block">
          <ul className="flex items-center gap-4 text-sm">
            {LINKS.map((link) => (
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
        <nav className="bg-background-secondary w-full grow px-4 py-8 sm:hidden">
          <ul className="flex flex-col gap-2">
            {LINKS.map((link) => (
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
