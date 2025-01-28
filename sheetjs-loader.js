/* eslint-disable @typescript-eslint/no-require-imports */
const { read, utils } = require("xlsx");

function loader(content) {
  const wb = read(content);
  /* pull data from first worksheet */
  const data = utils.sheet_to_json(wb.Sheets[wb.SheetNames[0]]);
  return `export default JSON.parse('${JSON.stringify(data)}')`;
}

loader.raw = true; // Ensure Webpack passes the raw file content
module.exports = loader;
