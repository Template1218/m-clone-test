import { Globe } from "lucide-react";
import isoCountries from "i18n-iso-countries";
import en from "i18n-iso-countries/langs/en.json";
import * as Flags from "country-flag-icons/react/3x2";

let registered = false;
function ensureIsoRegistered() {
  if (registered) return;
  isoCountries.registerLocale(en as any);
  registered = true;
}

const MANUAL: Record<string, string | null> = {
  england: "GB",
  scotland: "GB",
  wales: "GB",
  "northern ireland": "GB",
  world: null,
  international: null,
};

function toAlpha2(countryName?: string | null): string | null {
  const raw = String(countryName || "").trim();
  if (!raw) return null;
  const key = raw.toLowerCase();
  if (Object.prototype.hasOwnProperty.call(MANUAL, key)) return MANUAL[key];
  ensureIsoRegistered();
  const alpha2 = isoCountries.getAlpha2Code(raw, "en");
  return alpha2 ? String(alpha2).toUpperCase() : null;
}

export function CountryFlag(props: { country?: string | null; className?: string; titlePrefix?: string }) {
  const code = toAlpha2(props.country);
  const FlagComp = code ? (Flags as any)[code] : null;

  if (!code || !FlagComp) {
    if (String(props.country || "").trim().toLowerCase() === "world" || String(props.country || "").trim().toLowerCase() === "international") {
      return <Globe className={props.className || "w-3.5 h-3.5"} />;
    }
    return <Globe className={props.className || "w-3.5 h-3.5"} />;
  }

  return <FlagComp className={props.className || "w-3.5 h-3.5 rounded-sm"} title={`${props.titlePrefix ? props.titlePrefix + ": " : ""}${props.country || ""}`} />;
}

