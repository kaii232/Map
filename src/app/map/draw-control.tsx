import {
  MaplibreTerradrawControl,
  TerradrawControlOptions,
} from "@watergis/maplibre-gl-terradraw";
import { memo, useEffect, useRef } from "react";
import { ControlPosition, useMap } from "react-map-gl/maplibre";
import { GeoJSONStoreFeatures } from "terra-draw";

interface DrawControlProps extends TerradrawControlOptions {
  position?: ControlPosition;
  /** Callback that is invoked when an action has occurred including adding a new drawing, removing drawing, updating exitsing drawing */
  onUpdate: (features: GeoJSONStoreFeatures[]) => void;
}
/** Adds controls to draw on the map */
export const DrawControl = memo(
  ({ onUpdate, position, ...rest }: DrawControlProps) => {
    const drawControl = useRef<MaplibreTerradrawControl>(null);
    const { map } = useMap();

    useEffect(() => {
      if (!map) return;
      drawControl.current = new MaplibreTerradrawControl(rest);
      const draw = drawControl.current;
      const mapRef = map;

      mapRef.addControl(draw, position);

      const drawInstance = draw.getTerraDrawInstance();

      const onFeatureDelete = (
        event:
          | {
              feature?: GeoJSONStoreFeatures[];
              mode?: string;
            }
          | undefined,
      ) => {
        if (event && event.mode === "default") onUpdate([]);
      };

      const onChange = (ids: (string | number)[], type: string) => {
        if (type === "delete") {
          const snapshot = drawInstance.getSnapshot();
          onUpdate(snapshot);
        }
      };
      const onFinish = (
        id: string | number,
        context: { action: string; mode: string },
      ) => {
        if (context.action === "draw") {
          const snapshot = drawInstance.getSnapshot();
          onUpdate(snapshot);
        }
      };

      draw.on("feature-deleted", onFeatureDelete);
      drawInstance.on("change", onChange);
      drawInstance.on("finish", onFinish);

      return () => {
        onUpdate([]);
        draw.off("feature-deleted", onFeatureDelete);
        drawInstance.off("change", onChange);
        drawInstance.off("finish", onFinish);
        mapRef.removeControl(draw);
      };
    }, [map, onUpdate, position, rest]);

    return null;
  },
);

DrawControl.displayName = "DrawControl";

export default DrawControl;
