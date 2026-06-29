export const toneClasses = [
  { bg: "bg-accdoo-blue", soft: "bg-accdoo-blueSoft", text: "text-accdoo-blue", ring: "ring-blue-100", dot: "bg-accdoo-blue" },
  { bg: "bg-emerald-700", soft: "bg-emerald-50", text: "text-emerald-700", ring: "ring-emerald-100", dot: "bg-emerald-600" },
  { bg: "bg-amber-700", soft: "bg-amber-50", text: "text-amber-700", ring: "ring-amber-100", dot: "bg-amber-600" },
  { bg: "bg-indigo-600", soft: "bg-indigo-50", text: "text-indigo-700", ring: "ring-indigo-100", dot: "bg-indigo-600" },
  { bg: "bg-rose-700", soft: "bg-rose-50", text: "text-rose-700", ring: "ring-rose-100", dot: "bg-rose-600" },
  { bg: "bg-cyan-700", soft: "bg-cyan-50", text: "text-cyan-700", ring: "ring-cyan-100", dot: "bg-cyan-600" },
  { bg: "bg-violet-700", soft: "bg-violet-50", text: "text-violet-700", ring: "ring-violet-100", dot: "bg-violet-600" },
  { bg: "bg-slate-600", soft: "bg-slate-100", text: "text-slate-700", ring: "ring-slate-200", dot: "bg-slate-500" },
];

export const colorPalette = [
  { value: "#0B5CAB", ...toneClasses[0] },
  { value: "#20865A", ...toneClasses[1] },
  { value: "#B77912", ...toneClasses[2] },
  { value: "#5B5BD6", ...toneClasses[3] },
  { value: "#BE3F63", ...toneClasses[4] },
  { value: "#0F7C8F", ...toneClasses[5] },
  { value: "#7A4CC2", ...toneClasses[6] },
  { value: "#475569", ...toneClasses[7] },
];

export function formatLabel(value, fallback = "-") {
  return value ? String(value).replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase()) : fallback;
}

export function formatMoney(value) {
  const number = Number(value);
  if (!Number.isFinite(number)) return "-";
  return `LKR ${number.toLocaleString("en-LK", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

export function initials(value = "", fallback = "HR") {
  return value.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join("") || fallback;
}

export function toneFromText(value = "") {
  return colorEntryFromText(value);
}

export function colorValueFromText(value = "") {
  return colorEntryFromText(value).value;
}

function colorEntryFromText(value = "") {
  let hash = 0;
  for (const char of value) hash = char.charCodeAt(0) + ((hash << 5) - hash);
  return colorPalette[Math.abs(hash) % colorPalette.length];
}

export function toneFromColor(color, fallback = "") {
  return colorPalette.find((item) => item.value.toLowerCase() === String(color || "").toLowerCase()) || toneFromText(fallback);
}

export function employmentToneKey(employee) {
  const label = employee?.employment_type_name || employee?.employment_type || "";
  return String(employee?.employment_type || label).toLowerCase().replaceAll(" ", "_");
}

export function employmentBadgeClass(employee) {
  const styles = {
    full_time: "bg-green-50 text-green-700 ring-green-100",
    part_time: "bg-amber-50 text-amber-700 ring-amber-100",
    contract: "bg-gray-100 text-gray-700 ring-gray-200",
    intern: "bg-blue-50 text-blue-700 ring-blue-100",
    temporary: "bg-violet-50 text-violet-700 ring-violet-100",
  };
  return styles[employmentToneKey(employee)] || "bg-accdoo-blueSoft text-accdoo-blue ring-blue-100";
}
