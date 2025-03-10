"use client";

import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { LoadHf } from "@/server/actions";
import { useAtomValue, useSetAtom } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { drawingAtom, hfDataAtom } from "./atoms";

export default function HfFormFilters() {
  const setHfData = useSetAtom(hfDataAtom);
  const drawing = useAtomValue(drawingAtom);

  const [isPending, startTransition] = useTransition();

  const submitAction = async () => {
    startTransition(async () => {
      toast("Loading data...", {
        icon: <Spinner className="size-5" />,
        duration: Infinity,
        id: "Loadhf",
      });
      const data = await LoadHf(drawing);
      toast.dismiss("Loadhf");
      if (data.success) {
        toast.success(
          `Successfully loaded ${data.data.features.length} heatflow data`,
        );
        setHfData(data.data);
      } else toast.error(data.error);
    });
  };

  return (
    <form className="space-y-6" action={submitAction}>
      <Button type="submit" disabled={isPending}>
        {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
      </Button>
    </form>
  );
}
