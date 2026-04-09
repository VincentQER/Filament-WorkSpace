/**
 * @deprecated Use `npm run sync:sunlu` (scripts/sync-sunlu-from-shopify.mjs) — pulls from store.sunlu.com.
 * Legacy synthetic palette; kept only if you need to regenerate offline without hitting the store API.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");

const named = {
  White: "#FFFFFF",
  Black: "#1A1A1A",
  "Charcoal Black": "#2D2D2D",
  Grey: "#6B6B6B",
  "Light Grey": "#B5B5B5",
  Silver: "#A8A8A8",
  Red: "#C62828",
  "Dark Red": "#8B0000",
  Blue: "#1565C0",
  "Navy Blue": "#0D1B4C",
  "Light Blue": "#42A5F5",
  Azure: "#4FC3F7",
  Green: "#2E7D32",
  "Bambu Green": "#00C853",
  "Mint Green": "#69F0AE",
  Olive: "#827717",
  Yellow: "#FDD835",
  Gold: "#FFC107",
  Orange: "#EF6C00",
  "Tangerine Yellow": "#FFCA28",
  Purple: "#7B1FA2",
  Pink: "#EC407A",
  "Rose Pink": "#F48FB1",
  Brown: "#5D4037",
  Beige: "#D7CCC8",
  Cream: "#FFF8E1",
  Tan: "#BCAAA4",
  Clear: "#ECEFF1",
  Transparent: "#E8EAF0",
  Bronze: "#CD7F32",
  "Army Green": "#556B2F",
  Coral: "#FF7043",
  Lavender: "#B39DDB",
  "Ice Blue": "#B3E5FC",
  "Lime Green": "#C6FF00",
  Magenta: "#D81B60",
  Teal: "#00897B",
  Violet: "#5E35B1",
  "Sand Yellow": "#E6D690",
  "Stone Grey": "#9E9E9E",
  "Walnut Brown": "#5D4037",
  "Silk Gold": "#FFD54F",
  "Silk Silver": "#CFD8DC",
  "Silk Copper": "#B87333",
  "Silk Red": "#E53935",
  "Silk Blue": "#1E88E5",
  "Silk Green": "#43A047",
  "Silk Purple": "#8E24AA",
  "Silk Rainbow": "#9C27B0",
  "Marble White": "#FAFAFA",
  "Wood Natural": "#8D6E63",
  Glow: "#C5E1A5",
  "Glow Green": "#76FF03",
  "Glow Blue": "#536DFE",
};

function row(material, name) {
  const hex = named[name];
  if (!hex) throw new Error(`Missing hex for ${name}`);
  return { material, name, hex, source: "SUNLU retail approx." };
}

const out = [];

const basePla = [
  "White",
  "Black",
  "Charcoal Black",
  "Grey",
  "Light Grey",
  "Silver",
  "Red",
  "Dark Red",
  "Blue",
  "Navy Blue",
  "Light Blue",
  "Azure",
  "Green",
  "Mint Green",
  "Olive",
  "Yellow",
  "Gold",
  "Orange",
  "Tangerine Yellow",
  "Purple",
  "Pink",
  "Brown",
  "Beige",
  "Cream",
  "Clear",
  "Transparent",
  "Army Green",
  "Coral",
  "Lavender",
  "Teal",
  "Violet",
  "Magenta",
  "Sand Yellow",
  "Stone Grey",
  "Walnut Brown",
];

for (const name of basePla) out.push(row("PLA", name));
for (const name of basePla) out.push(row("PLA+", name));

const meta = [
  "Cotton White",
  "Mint",
  "Peach",
  "Lavender",
  "Sky Blue",
  "Lemon",
  "Blush Pink",
  "Sage Green",
  "Lilac",
  "Apricot",
  "Powder Blue",
  "Macaron Yellow",
];
const metaHex = [
  "#F5F5F5",
  "#A8E6CF",
  "#FFCCBC",
  "#E1BEE7",
  "#81D4FA",
  "#FFF9C4",
  "#F8BBD9",
  "#C5E1A5",
  "#D1C4E9",
  "#FFCC80",
  "#B3E5FC",
  "#FFF59D",
];
for (let i = 0; i < meta.length; i++) {
  named[meta[i]] = metaHex[i];
  out.push(row("PLA Meta", meta[i]));
}

const matte = ["White", "Black", "Grey", "Red", "Blue", "Green", "Orange", "Purple"];
for (const name of matte) {
  const label = `${name} Matte`;
  named[label] = named[name];
  out.push(row("PLA Matte", label));
}

const silk = [
  "Silk Gold",
  "Silk Silver",
  "Silk Copper",
  "Silk Red",
  "Silk Blue",
  "Silk Green",
  "Silk Purple",
  "Silk Rainbow",
];
for (const name of silk) out.push(row("Silk PLA", name));

named.Rainbow = "#E040FB";
out.push(row("Rainbow PLA", "Rainbow"));
out.push(row("Marble PLA", "Marble White"));
out.push(row("Wood PLA", "Wood Natural"));
named["Black CF"] = "#1A1A1A";
out.push(row("PLA CF", "Black CF"));
out.push(row("Glow PLA", "Glow"));
out.push(row("Glow PLA", "Glow Green"));
out.push(row("Glow PLA", "Glow Blue"));

const petg = [
  "White",
  "Black",
  "Grey",
  "Red",
  "Blue",
  "Green",
  "Yellow",
  "Orange",
  "Purple",
  "Clear",
  "Transparent",
  "Light Blue",
  "Navy Blue",
];
for (const name of petg) out.push(row("PETG", name));
named["Black Matte"] = "#212121";
named["Grey Matte"] = "#757575";
out.push(row("PETG HS Matte", "Black Matte"));
out.push(row("PETG HS Matte", "Grey Matte"));
out.push(row("PETG CF", "Black CF"));

const abs = ["White", "Black", "Grey", "Red", "Blue", "Green", "Yellow", "Orange", "Natural", "Silver"];
named.Natural = "#F5F5DC";
for (const name of abs) out.push(row("ABS", name));
for (const name of ["White", "Black", "Grey", "Red", "Blue"]) out.push(row("E-ABS", name));

const asa = ["White", "Black", "Grey", "Red", "Blue", "Natural"];
for (const name of asa) out.push(row("ASA", name));

const tpu = ["Black", "White", "Red", "Blue", "Green", "Clear"];
named["Clear"] = "#E0F7FA";
for (const name of tpu) out.push(row("TPU", name));

named["PVB Natural"] = "#F5F5F5";
out.push(row("PVB", "PVB Natural"));

const dest = path.join(root, "data", "sunlu-colors.json");
fs.writeFileSync(dest, JSON.stringify(out, null, 2) + "\n", "utf8");
console.log("Wrote", out.length, "rows to", dest);
