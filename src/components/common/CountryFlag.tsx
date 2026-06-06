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

function WorldGamesIcon({ className = "w-3.5 h-3.5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 680 680" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <clipPath id="country-world-games-clip">
          <circle cx="340" cy="340" r="240" />
        </clipPath>
      </defs>
      <circle cx="340" cy="340" r="240" fill="#2196F3" />
      <g clipPath="url(#country-world-games-clip)" fill="#4CAF50">
        <path d="M160 220Q180 200 200 215Q220 230 215 270Q210 310 195 340Q185 370 175 400Q160 430 155 400Q145 370 148 340Q150 300 148 270Q145 245 160 220Z" />
        <path d="M300 200Q330 190 350 200Q365 215 360 240Q355 260 345 265Q360 270 365 300Q370 340 360 380Q348 420 335 440Q320 420 310 380Q300 340 305 300Q310 270 320 260Q308 250 305 230Q300 215 300 200Z" />
        <path d="M380 190Q430 178 480 185Q520 192 530 220Q535 245 515 260Q490 270 460 268Q435 265 415 255Q395 245 380 225Q370 205 380 190Z" />
        <path d="M410 310Q450 300 485 315Q520 330 535 365Q548 395 525 425Q500 458 462 468Q430 476 405 455Q385 438 395 405Q405 375 430 360Q400 345 410 310Z" />
        <path d="M225 470Q250 455 280 465Q305 475 315 505Q325 535 300 555Q270 580 238 565Q210 552 210 520Q210 490 225 470Z" />
      </g>
      <circle cx="340" cy="340" r="240" fill="none" stroke="#90CAF9" strokeWidth="18" opacity="0.65" />
    </svg>
  );
}

function isWorldCountry(country?: string | null) {
  const key = String(country || "").trim().toLowerCase();
  return key === "world" || key === "international";
}

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
    if (isWorldCountry(props.country)) {
      return <WorldGamesIcon className={props.className || "w-3.5 h-3.5"} />;
    }
    return <Globe className={props.className || "w-3.5 h-3.5"} />;
  }

  return <FlagComp className={props.className || "w-3.5 h-3.5 rounded-sm"} title={`${props.titlePrefix ? props.titlePrefix + ": " : ""}${props.country || ""}`} />;
}
