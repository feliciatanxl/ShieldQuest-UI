import { AvatarConfig, InventoryItem, ShieldLetter, ShieldSkillState } from '../types/game';

export const DEFAULT_AVATAR: AvatarConfig = {
  name: 'Player',
  skinTone: '#d9a47c',
  hairStyle: 'short',
  hairColor: '#4c3224',
  shirtColor: '#e2c99d',
  pantsColor: '#466a8f',
  shieldStyle: 'classic',
};

export const SKIN_TONES = [
  { label: 'Fair', color: '#f0c6a6' },
  { label: 'Warm Tan', color: '#d9a47c' },
  { label: 'Honey', color: '#c4865a' },
  { label: 'Deep Brown', color: '#8c5638' },
];

export const HAIR_COLORS = [
  { label: 'Espresso', color: '#3b251c' },
  { label: 'Chestnut', color: '#5a3a29' },
  { label: 'Jet Black', color: '#1f1d24' },
  { label: 'Auburn', color: '#8c422c' },
];

export const SHIRT_COLORS = [
  { label: 'Sand Oversized Tee', color: '#e2c99d' },
  { label: 'School PE Mint', color: '#6bb09e' },
  { label: 'Heartland Red Polo', color: '#d8705e' },
  { label: 'Poly Navy Tee', color: '#4d739e' },
  { label: 'Pagoda White Tee', color: '#ece9e1' },
];

export const PANTS_COLORS = [
  { label: 'School Bermudas', color: '#466a8f' },
  { label: 'Khaki Shorts', color: '#9c8663' },
  { label: 'Dark Chinos', color: '#3b4252' },
  { label: 'Olive Cargo', color: '#5b7252' },
];

export const SHIELD_STYLES: {
  id: AvatarConfig['shieldStyle'];
  label: string;
  accent: string;
}[] = [
  { id: 'classic', label: 'Heartland Silver', accent: '#75a3bd' },
  { id: 'verifox', label: 'VeriFox Amber', accent: '#d98c3f' },
  { id: 'beacon', label: 'Beacon Teal', accent: '#48a999' },
  { id: 'cluepaw', label: 'Cluepaw Violet', accent: '#8e74b5' },
];

export const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: 'ezlink',
    name: "Uncle's SimplyGo EZ-Link Card",
    description:
      'Teal contactless Singapore bus/MRT fare card dropped near the Blk 260 void-deck stone Xiangqi table.',
    icon: 'ezlink',
    collected: false,
  },
  {
    id: 'chope',
    name: 'Pocket Tissue ("Chope" Pack)',
    description:
      'Classic Singapore heartland pocket tissue pack used to chope seats at Kopi Corner or the void deck.',
    icon: 'chope',
    collected: false,
  },
  {
    id: 'kopi',
    name: 'Kopi-O Dabao Packet',
    description:
      'Hot Kopi-O Kosong in a clear plastic takeaway bag tied with a red raffia string from Kopi Corner.',
    icon: 'kopi',
    collected: false,
  },
  {
    id: 'notes',
    name: 'S.H.I.E.L.D. Field Observation Pad',
    description:
      'Records strictly verified observations around Blk 260 & Sunshine Minimart without jumping to assumptions.',
    icon: 'notes',
    collected: true,
    clueFact: true,
  },
  {
    id: 'receipt',
    name: 'Sunshine Minimart Receipt',
    description:
      'Itemised paper receipt showing date, time, and GST breakdown — key to distinguishing paid vs unpaid items.',
    icon: 'receipt',
    collected: true,
  },
];

export const INITIAL_SHIELD_SKILLS: Record<ShieldLetter, ShieldSkillState> = {
  S: {
    letter: 'S',
    title: 'Spot the Risk',
    competency: 'Situational awareness & factual observation',
    promptSummary: 'Distinguish verified visual clues from unsupported assumptions.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 5,
    guardianName: 'Cluepaw',
  },
  H: {
    letter: 'H',
    title: 'Hold Before Acting',
    competency: 'Self-control & safe boundary setting',
    promptSummary: 'Refuse risky lookout requests immediately without confrontation.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 1,
    guardianName: 'Shieldfin',
  },
  I: {
    letter: 'I',
    title: 'Identify the Influence',
    competency: 'Recognising peer pressure tactics',
    promptSummary: 'Name the social pressure tactic and the role requested.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 2,
    guardianName: 'ByteBuddy',
  },
  E: {
    letter: 'E',
    title: 'Evaluate Consequences',
    competency: 'Delayed consequence awareness',
    promptSummary: 'Match actions to short-term and longer-term consequences before reveal.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 4,
    guardianName: 'VeriFox',
  },
  L: {
    letter: 'L',
    title: 'Lead the Right Choice',
    competency: 'Constructive positive peer influence',
    promptSummary: 'Craft a respectful reply redirecting a friend towards a safer alternative.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 2,
    guardianName: 'Echo',
  },
  D: {
    letter: 'D',
    title: 'Defend Your Community',
    competency: 'Responsible help-seeking',
    promptSummary: 'Approach an appropriate trusted adult/staff with objective facts.',
    completed: false,
    passed: false,
    score: 0,
    maxScore: 2,
    guardianName: 'Beacon',
  },
};

import { isoToWorld } from '../game/isoGrid';

// x/y are walk targets in the unified isometric Singapore world.
export const MAP_LANDMARKS = [
  {
    id: 'busstop',
    name: 'Blk 260 Bus Stop (Stop 26019)',
    detail: 'Bus bay along Ang Mo Kio Ave 3 — Uncle Tan is looking for his missing EZ-Link card.',
    ...isoToWorld(19, 26),
    color: '#6bb09e',
  },
  {
    id: 'voiddeck',
    name: 'Blk 260 Shield View Void Deck',
    detail: 'Spacious sunlit Blk 260 void deck & heartland courtyard.',
    ...isoToWorld(22, 20),
    color: '#d89b52',
  },
  {
    id: 'minimart',
    name: 'Sunshine Minimart',
    detail: 'Anchor Quest: "The Lookout Dilemma" — practise all 6 S.H.I.E.L.D. choices.',
    ...isoToWorld(25, 25),
    color: '#e6b84c',
  },
];

/** One-time coin rewards. Each id can only be claimed once per save. */
export const REWARDS: { id: string; label: string; coins: number }[] = [
  { id: 'kopi', label: 'Pick up the Kopi-O dabao', coins: 10 },
  { id: 'chope', label: 'Find the chope tissue packet', coins: 10 },
  { id: 'ezlink-found', label: "Find Uncle Tan's EZ-Link card", coins: 20 },
  { id: 'ezlink-return', label: 'Return the card to Uncle Tan', coins: 40 },
  { id: 'skill-S', label: 'Pass S · Spot the Risk', coins: 20 },
  { id: 'skill-H', label: 'Pass H · Hold Before Acting', coins: 20 },
  { id: 'skill-I', label: 'Pass I · Identify the Influence', coins: 20 },
  { id: 'skill-E', label: 'Pass E · Evaluate Consequences', coins: 20 },
  { id: 'skill-L', label: 'Pass L · Lead the Right Choice', coins: 20 },
  { id: 'skill-D', label: 'Pass D · Defend Your Community', coins: 20 },
  { id: 'lookout', label: 'Finish the Lookout Dilemma', coins: 50 },
];

/** Clothing sold for coins in the Rewards panel; bought colours appear in the Wardrobe. */
export const SHOP_ITEMS: { id: string; kind: 'shirt' | 'pants'; label: string; color: string; price: number }[] = [
  { id: 'tee-sunset', kind: 'shirt', label: 'Sunset Orange Tee', color: '#ee8a3c', price: 30 },
  { id: 'tee-lilac', kind: 'shirt', label: 'Lilac Hawker Tee', color: '#a98bd6', price: 30 },
  { id: 'tee-lime', kind: 'shirt', label: 'Kaya Lime Tee', color: '#a9cf54', price: 40 },
  { id: 'tee-night', kind: 'shirt', label: 'Midnight Tee', color: '#34324a', price: 50 },
  { id: 'pants-denim', kind: 'pants', label: 'Denim Shorts', color: '#5b84c4', price: 30 },
  { id: 'pants-cream', kind: 'pants', label: 'Cream Shorts', color: '#e4d6b4', price: 30 },
  { id: 'pants-red', kind: 'pants', label: 'Merah Red Shorts', color: '#c4483f', price: 40 },
];
