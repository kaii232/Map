"use client";

import { Input } from "@/components/ui/input";
import useDebouncedFunction from "@/lib/use-debounced-function";
import { Search } from "lucide-react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export default function PapersSearch() {
  const searchParams = useSearchParams();
  const path = usePathname();
  const { replace } = useRouter();
  const debounce = useDebouncedFunction();
  const handleSearch = (search: string) => {
    const params = new URLSearchParams(searchParams);
    if (search.trim()) {
      params.set("query", search.trim());
      params.delete("page");
    } else {
      params.delete("query");
    }
    replace(`${path}?${params.toString()}`);
  };

  return (
    <Input
      placeholder="Search for a publication..."
      defaultValue={searchParams.get("query") ?? ""}
      onChange={(e) => debounce(() => handleSearch(e.target.value), 300)}
      left={<Search />}
    />
  );
}
