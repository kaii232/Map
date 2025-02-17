import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { memo, useMemo } from "react";
import type { ControlPosition } from "react-map-gl/maplibre";
import { useControl } from "react-map-gl/maplibre";
import { GeoJSONStoreFeatures } from "terra-draw";

type DrawControlProps = ConstructorParameters<
  typeof MaplibreTerradrawControl
>[0] & {
  position?: ControlPosition;
  onUpdate: (features: GeoJSONStoreFeatures[]) => void;
};
export const DrawControl = memo((props: DrawControlProps) => {
  const drawControl = useMemo(
    () => new MaplibreTerradrawControl(props),
    [props],
  );

  useControl<MaplibreTerradrawControl>(
    () => drawControl,
    () => {
      const drawInstance = drawControl.getTerraDrawInstance();
      drawInstance.on("change", (ids: (string | number)[], type: string) => {
        if (type === "delete") {
          const snapshot = drawInstance.getSnapshot();
          props.onUpdate(snapshot);
        }
      });
      drawInstance.on("finish", () => {
        const snapshot = drawInstance.getSnapshot();
        props.onUpdate(snapshot);
      });
    },
    () => {},
    {
      position: props.position,
    },
  );

  return null;
});

DrawControl.displayName = "DrawControl";

export default DrawControl;
