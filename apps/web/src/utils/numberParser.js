/**
 * Parses numeric UI input, including currencies, spaces and European/US formats.
 */
export const parseValue = (value) => {
  if (value == null || value === "") return 0;
  if (typeof value === "number") return value;
  if (typeof value !== "string") return 0;

  let cleanStr = value.replace(/\s+/g, "").replace(/−|\u2212/g, "-");
  cleanStr = cleanStr.replace(/[^\d.,-]/g, "");

  const lastCommaIndex = cleanStr.lastIndexOf(",");
  const lastDotIndex = cleanStr.lastIndexOf(".");

  if (lastCommaIndex > -1 && lastDotIndex > -1) {
    if (lastCommaIndex > lastDotIndex) {
      cleanStr = cleanStr.replace(/\./g, "");
      cleanStr = cleanStr.replace(",", ".");
    } else {
      cleanStr = cleanStr.replace(/,/g, "");
    }
  } else if (lastCommaIndex > -1) {
    cleanStr = cleanStr.replace(/,/g, ".");
  }

  const parts = cleanStr.split(".");
  if (parts.length > 2) {
    cleanStr = parts[0] + "." + parts.slice(1).join("");
  }

  const parsed = parseFloat(cleanStr);
  return Number.isNaN(parsed) ? 0 : parsed;
};
