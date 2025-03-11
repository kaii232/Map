"use client";

import DownloadButton from "@/components/download-button";
import { Button } from "@/components/ui/button";
import Spinner from "@/components/ui/spinner";
import { LoadHf } from "@/server/actions";
import { useAtom, useAtomValue } from "jotai";
import { useTransition } from "react";
import { toast } from "sonner";
import { drawingAtom, hfDataAtom } from "./atoms";

export default function HfFormFilters() {
  const [hfData, setHfData] = useAtom(hfDataAtom);
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
      <div>
        <Button type="submit" disabled={isPending} className="mb-2 w-full">
          {isPending ? "Loading" : drawing ? "Load data within area" : "Load"}
        </Button>
        <DownloadButton
          className="w-full"
          data={hfData}
          fileName="hf_invest.csv"
        />
      </div>
    </form>
  );
}
