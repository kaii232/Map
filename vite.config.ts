import react from "@vitejs/plugin-react-swc";
import { parse } from "csv-parse/sync";
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
      name: "vite-csv",
      transform(_, id) {
        if (!id.endsWith(".csv")) return;
        const file = parse(readFileSync(id), {
          columns: true,
          cast: (value, context) => {
            if (context.quoting || context.header || context.column === "date")
              return value;
            else return parseFloat(value);
          },
        });
        return `export default ${JSON.stringify(file)}`;
      },
    },
    {
      name: "vite-sheet",
      transform(_, id) {
        if (!id.endsWith(".xlsx")) return;
        const wb = read(readFileSync(id));
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
