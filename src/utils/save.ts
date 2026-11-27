import { DEFAULT_AVATAR, INITIAL_INVENTORY, INITIAL_SHIELD_SKILLS, REWARDS, SHOP_ITEMS } from '../data/gameData';
import { AvatarConfig, InventoryItem, QuestId, ShieldLetter, ShieldSkillState } from '../types/game';
import { DistrictId, readDistrict } from '../data/districts';

/** Progress inside the street scene (owned by GameWorld). */
export interface WorldSave {
  questId: QuestId;
  ezLinkPickedUp: boolean;
  ezLinkReturned: boolean;
  kopiPickedUp: boolean;
  chopePickedUp: boolean;
  confidencePct: number;
  energyPct: number;
  player: { x: number; y: number };
  district?: DistrictId;
  worldPosition?: { x: number; y: number };
}

/** Coins plus which one-time rewards were claimed and which shop items are owned. */
export interface Wallet {
  coins: number;
  claimed: string[];
  owned: string[];
}

export const EMPTY_WALLET: Wallet = { coins: 0, claimed: [], owned: [] };

export interface SaveData {
  avatar: AvatarConfig;
  squadCode: string;
  inventory: InventoryItem[];
  skills: Record<ShieldLetter, ShieldSkillState>;
  world: WorldSave | null;
  wallet: Wallet;
  savedAt: number;
}

const KEY = 'shieldquest.save.v1';
const QUESTS: QuestId[] = ['ezlink', 'lookout', 'completed'];

const isObj = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null;
const num = (v: unknown, fallback: number) => (typeof v === 'number' && Number.isFinite(v) ? v : fallback);
const str = (v: unknown, fallback: string) => (typeof v === 'string' ? v : fallback);
const bool = (v: unknown) => v === true;

/**
 * Reads the save from localStorage. Storage is user-editable, so every field is
 * checked and merged onto defaults; anything unreadable means "no save".
 */
export function loadSave(): SaveData | null {
  let raw: unknown;
  try {
    const text = localStorage.getItem(KEY);
    if (!text) return null;
    raw = JSON.parse(text);
  } catch {
    return null;
  }
  if (!isObj(raw) || !isObj(raw.avatar)) return null;

  const a = raw.avatar;
  const avatar: AvatarConfig = {
    name: str(a.name, DEFAULT_AVATAR.name).slice(0, 14),
    skinTone: str(a.skinTone, DEFAULT_AVATAR.skinTone),
    hairStyle: (['short', 'spiky', 'bob', 'ponytail'] as const).find((s) => s === a.hairStyle) ?? DEFAULT_AVATAR.hairStyle,
    hairColor: str(a.hairColor, DEFAULT_AVATAR.hairColor),
    shirtColor: str(a.shirtColor, DEFAULT_AVATAR.shirtColor),
    pantsColor: str(a.pantsColor, DEFAULT_AVATAR.pantsColor),
    shieldStyle: (['classic', 'verifox', 'beacon', 'cluepaw'] as const).find((s) => s === a.shieldStyle) ?? DEFAULT_AVATAR.shieldStyle,
  };

  // Item text and skill definitions come from the game data; only progress flags are restored.
  const savedItems = Array.isArray(raw.inventory) ? raw.inventory.filter(isObj) : [];
  const inventory = INITIAL_INVENTORY.map((item) => {
    const s = savedItems.find((i) => i.id === item.id);
    return s ? { ...item, collected: bool(s.collected) } : item;
  });

  const savedSkills = isObj(raw.skills) ? raw.skills : {};
  const skills = Object.fromEntries(
    (Object.keys(INITIAL_SHIELD_SKILLS) as ShieldLetter[]).map((l) => {
      const base = INITIAL_SHIELD_SKILLS[l];
      const s = isObj(savedSkills[l]) ? (savedSkills[l] as Record<string, unknown>) : {};
      const score = Math.max(0, Math.min(base.maxScore, num(s.score, 0)));
      return [l, { ...base, completed: bool(s.completed), passed: bool(s.passed), score }];
    })
  ) as Record<ShieldLetter, ShieldSkillState>;

  let world: WorldSave | null = null;
  if (isObj(raw.world)) {
    const w = raw.world;
    const p = isObj(w.player) ? w.player : {};
    const worldPosition = isObj(w.worldPosition) ? w.worldPosition : null;
    world = {
      questId: QUESTS.find((q) => q === w.questId) ?? 'ezlink',
      ezLinkPickedUp: bool(w.ezLinkPickedUp),
      ezLinkReturned: bool(w.ezLinkReturned),
      kopiPickedUp: bool(w.kopiPickedUp),
      chopePickedUp: bool(w.chopePickedUp),
      confidencePct: Math.max(0, Math.min(100, num(w.confidencePct, 78))),
      energyPct: Math.max(0, Math.min(100, num(w.energyPct, 66))),
      player: { x: num(p.x, NaN), y: num(p.y, NaN) },
      district: readDistrict(w.district),
      worldPosition: worldPosition
        ? { x: num(worldPosition.x, NaN), y: num(worldPosition.y, NaN) }
        : undefined,
    };
  }

  // Only known reward/shop ids survive, so an edited save can't invent items.
  const w = isObj(raw.wallet) ? raw.wallet : {};
  const ids = (v: unknown, known: string[]) =>
    Array.isArray(v) ? known.filter((id) => v.includes(id)) : [];
  const wallet: Wallet = {
    coins: Math.max(0, Math.min(9999, Math.floor(num(w.coins, 0)))),
    claimed: ids(w.claimed, REWARDS.map((r) => r.id)),
    owned: ids(w.owned, SHOP_ITEMS.map((i) => i.id)),
  };

  return {
    avatar,
    squadCode: str(raw.squadCode, '').slice(0, 10),
    inventory,
    skills,
    world,
    wallet,
    savedAt: num(raw.savedAt, 0),
  };
}

export function writeSave(data: Omit<SaveData, 'savedAt'>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...data, savedAt: Date.now() }));
  } catch {
    // Private mode / storage full: the game still plays, it just won't resume.
  }
}
