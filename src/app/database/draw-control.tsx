import { MaplibreTerradrawControl } from "@watergis/maplibre-gl-terradraw";
import { memo, useEffect, useRef } from "react";
import type { ControlPosition } from "react-map-gl/maplibre";
import { useMap } from "react-map-gl/maplibre";
import { GeoJSONStoreFeatures } from "terra-draw";

type DrawControlProps = ConstructorParameters<
  typeof MaplibreTerradrawControl
>[0] & {
  position?: ControlPosition;
  onUpdate: (features: GeoJSONStoreFeatures[]) => void;
};
export const DrawControl = memo((props: DrawControlProps) => {
  const drawControl = useRef<MaplibreTerradrawControl>(
    new MaplibreTerradrawControl(props),
  );
  const { map } = useMap();

  useEffect(() => {
    if (!map) return;
    drawControl.current = new MaplibreTerradrawControl(props);
    const draw = drawControl.current;
    const mapRef = map;

    mapRef.addControl(draw);

    const drawInstance = draw.getTerraDrawInstance();

    const onFeatureDelete = () => {
      props.onUpdate([]);
    };

    const onChange = (ids: (string | number)[], type: string) => {
      if (type === "delete") {
        const snapshot = drawInstance.getSnapshot();
        props.onUpdate(snapshot);
      }
    };
    const onFinish = (
      id: string | number,
      context: { action: string; mode: string },
    ) => {
      if (context.action === "draw") {
        const snapshot = drawInstance.getSnapshot();
        props.onUpdate(snapshot);
      }
    };

    draw.on("feature-deleted", onFeatureDelete);
    drawInstance.on("change", onChange);
    drawInstance.on("finish", onFinish);

    return () => {
      draw.off("feature-deleted", onFeatureDelete);
      drawInstance.off("change", onChange);
      drawInstance.off("finish", onFinish);
      mapRef.removeControl(draw);
    };
  }, [map, props]);

  return null;
});

DrawControl.displayName = "DrawControl";

export default DrawControl;
