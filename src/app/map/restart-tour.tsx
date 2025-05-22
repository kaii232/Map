import { TourStart, TourStep } from "@/components/tour";
import { useSetAtom } from "jotai";
import { Info } from "lucide-react";
import { memo, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useMap } from "react-map-gl/maplibre";
import { panelOpenAtom } from "./atoms";

const RestartTour = () => {
  const { map } = useMap();
  const [controlContainer, setControlContainer] = useState<Element | null>(
    null,
  );
  const setPanelOpen = useSetAtom(panelOpenAtom);

  useEffect(() => {
    if (!map) return;

    const element = document.querySelector(".maplibregl-ctrl-top-right");
    if (element) setControlContainer(element);
  }, [map]);

  if (!controlContainer) return null;

  return createPortal(
    <TourStep step={8} localAfterStep={() => setPanelOpen(true)}>
      <div className="maplibregl-ctrl maplibregl-ctrl-group">
        <TourStart
          className="text-neutral-700 disabled:pointer-events-none disabled:opacity-60"
          style={{ padding: "2.5px" }}
        >
          <Info />
        </TourStart>
      </div>
    </TourStep>,
    controlContainer,
  );
};

export default memo(RestartTour);
