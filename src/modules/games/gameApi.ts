const GAME_API_URL = "https://qmikiecjseufxefwwoab.supabase.co/functions/v1/game-api";
const GAME_API_KEY = "c6332d146de5773c9cc23c3266c4873ca35ce09032c74d01f3289db127cbc230";

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

type GameApiPayload = Record<string, any>;

async function callGameApi(payload: GameApiPayload) {
  const res = await fetch(GAME_API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_key: GAME_API_KEY,
      ...payload,
    }),
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(data?.msg || data?.message || "Game API request failed");
  }
  return data;
}

function unwrapList(data: any): any[] {
  const candidates = [
    data?.data?.payload,
    data?.data?.providers,
    data?.data?.games,
    data?.data?.list,
    data?.payload,
    data?.providers,
    data?.games,
    data?.list,
    data?.data,
  ];
  const found = candidates.find(Array.isArray);
  return found || [];
}

function pickFirst(item: any, keys: string[], fallback = "") {
  for (const key of keys) {
    const value = item?.[key];
    if (value !== undefined && value !== null && String(value).trim()) return String(value).trim();
  }
  return fallback;
}

function pickImage(item: any) {
  return pickFirst(item, [
    "image",
    "image_url",
    "imageUrl",
    "img",
    "icon",
    "icon_url",
    "thumbnail",
    "thumbnail_url",
    "game_image",
  ], "/games/Aviator.png");
}

export async function fetchGameProviders(): Promise<GameProvider[]> {
  const data = await callGameApi({ action: "provider_list" });
  return unwrapList(data).map((provider: any, index: number) => {
    const id = pickFirst(provider, ["id", "provider_id", "providerId", "provider_code", "code", "uid"], String(index));
    const name = pickFirst(provider, ["name", "provider_name", "providerName", "title"], id);
    return { id, name, raw: provider };
  }).filter((provider) => provider.name);
}

export async function fetchProviderGames(provider: GameProvider): Promise<LiveGame[]> {
  const providerKeys = {
    provider_id: provider.id,
    provider: provider.id,
    provider_code: provider.id,
  };
  const data = await callGameApi({ action: "game_list", ...providerKeys });
  return unwrapList(data).map((game: any, index: number) => {
    const uid = pickFirst(game, ["game_uid", "gameUid", "game_code", "gameCode", "code", "uid", "id"], `${provider.id}-${index}`);
    const name = pickFirst(game, ["name", "game_name", "gameName", "title"], uid);
    return {
      id: `${provider.id}:${uid}`,
      uid,
      name,
      image: pickImage(game),
      provider: pickFirst(game, ["provider_name", "providerName", "provider"], provider.name),
      providerId: provider.id,
      isNew: Boolean(game?.is_new || game?.isNew || game?.new),
      fairness: true,
      raw: game,
    };
  }).filter((game) => game.uid && game.name);
}

export async function ensureGameMember(user: any) {
  if (!user?.id) return;
  try {
    await callGameApi({
      action: "create_member",
      member_id: String(user.id),
      username: String(user.displayName || user.phoneNumber || user.email || user.id),
    });
  } catch {
    // Some providers return an error when the member already exists. Launch can still proceed.
  }
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

  await ensureGameMember(user);
  const result = await callGameApi({
    action: "game_launch",
    member_id: String(user.id),
    game_uid: game.uid,
    credit_amount: String(Number(user?.balance || 0)),
    return_url: window.location.origin,
    platform: window.matchMedia("(max-width: 768px)").matches ? "mobile" : "desktop",
    language: "en",
  });

  const url = extractLaunchUrl(result);
  if (!url) throw new Error(result?.msg || result?.message || "Game launch failed.");
  return url;
}
