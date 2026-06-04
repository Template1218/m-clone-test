const SILENT_API_LAUNCH_URL = "https://silentapi.sbs/api/GetGameUrl.php";
const SILENT_API_TOKEN = "5fd878e1243de12c8ba83449da229eeb";

export type GameProvider = {
  id: string;
  name: string;
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

const SILENT_PROVIDER: GameProvider = { id: "spribe", name: "SPRIBE" };

type SilentCatalogGame = {
  gameNameEn?: string;
  gameID?: string;
  vendorCode?: number | string;
  img?: string;
};

export async function fetchGameProviders(): Promise<GameProvider[]> {
  return [SILENT_PROVIDER];
}

export async function fetchProviderGames(provider: GameProvider): Promise<LiveGame[]> {
  if (provider.id !== SILENT_PROVIDER.id) return [];

  const res = await fetch("/games/silent-spribe.json");
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
        image: String(game.img || "").trim() || "/games/Aviator.png",
        provider: provider.name,
        providerId: provider.id,
        fairness: true,
        raw: game,
      };
    })
    .filter((game) => game.uid);
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

  const res = await fetch(SILENT_API_LAUNCH_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SILENT_API_TOKEN}`,
    },
    body: JSON.stringify({
      member_account: String(user.id),
      game_uid: game.uid,
      balance: Number(user?.balance || 0),
      home_url: window.location.origin,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.msg || data?.message || "Game launch failed.");

  const url = extractLaunchUrl(data);
  if (!url) throw new Error(data?.msg || data?.message || "Game launch failed.");
  return url;
}
