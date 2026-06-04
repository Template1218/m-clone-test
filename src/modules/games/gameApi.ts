import { api } from "../../lib/api";

export type GameProvider = {
  id: string;
  name: string;
  catalog?: string;
  raw?: any;
};

export type LiveGame = {
  id: string;
  uid: string;
  name: string;
  image: string;
  provider: string;
  providerId?: string;
  isNew?: boolean;
  fairness?: boolean;
  raw?: any;
};

const GAME_PROVIDERS: GameProvider[] = [
  { id: "all", name: "All" },
  { id: "spribe", name: "SPRIBE", catalog: "/games/silent-spribe.json" },
  { id: "smartsoft", name: "SmartSoft", catalog: "/games/silent-smartsoft.json" },
  { id: "evolution", name: "Evolution", catalog: "/games/silent-evolution.json" },
  { id: "galaxsys", name: "Galaxsys", catalog: "/games/silent-galaxsys.json" },
  { id: "inout", name: "InOut", catalog: "/games/silent-inout.json" },
];

type SilentCatalogGame = {
  gameNameEn?: string;
  gameID?: string;
  vendorCode?: number | string;
  vendorId?: number | string;
  img?: string;
  imgUrl2?: string;
};

export async function fetchGameProviders(): Promise<GameProvider[]> {
  return GAME_PROVIDERS;
}

async function fetchCatalog(provider: GameProvider): Promise<LiveGame[]> {
  if (!provider.catalog) return [];

  const res = await fetch(provider.catalog);
  if (!res.ok) throw new Error("Unable to load game catalog.");

  const catalog = (await res.json()) as SilentCatalogGame[];
  return catalog
    .map((game, index) => {
      const uid = String(game.gameID || "").trim();
      const name = String(game.gameNameEn || uid || "Untitled Game").trim();
      return {
        id: `${provider.id}:${uid || index}`,
        uid,
        name,
        image: String(game.img || game.imgUrl2 || "").trim(),
        provider: provider.name,
        providerId: provider.id,
        isNew: provider.id === "spribe",
        fairness: provider.id === "spribe" || provider.id === "smartsoft" || provider.id === "galaxsys" || provider.id === "inout",
        raw: game,
      };
    })
    .filter((game) => game.uid);
}

export async function fetchProviderGames(provider: GameProvider): Promise<LiveGame[]> {
  if (provider.id !== "all") return fetchCatalog(provider);

  const catalogs = await Promise.all(GAME_PROVIDERS.filter((item) => item.catalog).map(fetchCatalog));
  return catalogs.flat();
}

export async function ensureGameMember(user: any) {
  if (!user?.id) return;
}

export function extractLaunchUrl(result: any) {
  return (
    result?.data?.payload?.game_launch_url ||
    result?.data?.game_launch_url ||
    result?.data?.url ||
    result?.payload?.game_launch_url ||
    result?.game_launch_url ||
    result?.url ||
    ""
  );
}

export async function launchLiveGame(game: LiveGame, user: any) {
  if (!user?.id) throw new Error("Please log in to play live games.");

  const { data } = await api.post("/games/launch", {
    game_uid: game.uid,
    home_url: window.location.origin,
  });

  const url = extractLaunchUrl(data);
  if (!url) throw new Error(data?.msg || data?.message || "Game launch failed.");
  return url;
}
