import react from "@vitejs/plugin-react-swc";
import { readFileSync } from "fs";
import path from "path";
import { defineConfig } from "vite";
import { read, utils } from "xlsx";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    {
      name: "geojson-as-json",
      transform(code, id) {
        if (id.endsWith(".geojson")) {
          return { code: `export default ${code}`, map: null };
        }
      },
    },
    {
      // this plugin handles ?sheetjs tags
      name: "vite-sheet",
      transform(_, id) {
        if (!id.match(/\?sheetjs$/)) return;
        const wb = read(readFileSync(id.replace(/\?sheetjs$/, "")));
        const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
        return `export default JSON.parse('${JSON.stringify(data).replace(/\\/g, "\\\\")}')`;
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
