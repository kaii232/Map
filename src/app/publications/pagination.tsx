"use client";

import { Button } from "@/components/ui/button";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function PrevButton({
  hasPrevPage,
  pageNum,
}: {
  hasPrevPage: boolean;
  pageNum: number;
}) {
  const searchParams = useSearchParams();
  const path = usePathname();
  const { replace } = useRouter();
  const handlePrevPage = () => {
    const params = new URLSearchParams(searchParams);
    if (pageNum > 1) params.set("page", `${pageNum - 1}`);
    else params.delete("page");
    replace(`${path}?${params.toString()}`);
  };

  return (
    <Button variant="ghost" disabled={!hasPrevPage} onClick={handlePrevPage}>
      Previous
    </Button>
  );
}

export function NextButton({
  hasNextPage,
  pageNum,
}: {
  hasNextPage: boolean;
  pageNum: number;
}) {
  const searchParams = useSearchParams();
  const path = usePathname();
  const { replace } = useRouter();
  const handleNextPage = () => {
    const params = new URLSearchParams(searchParams);
    params.set("page", `${pageNum + 1}`);
    replace(`${path}?${params.toString()}`);
  };

  return (
    <Button variant="ghost" disabled={!hasNextPage} onClick={handleNextPage}>
      Next
    </Button>
  );
}
