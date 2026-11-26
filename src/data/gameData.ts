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
  { label: 'Sand Tee', color: '#e2c99d' },
  { label: 'Kopitiam Mint', color: '#6bb09e' },
  { label: 'HDB Coral', color: '#d8705e' },
  { label: 'Sky Blue', color: '#6594c0' },
  { label: 'Amber Gold', color: '#e0a94f' },
];

export const PANTS_COLORS = [
  { label: 'Denim Blue', color: '#466a8f' },
  { label: 'Khaki', color: '#9c8663' },
  { label: 'Charcoal', color: '#3b4252' },
  { label: 'Olive', color: '#5b7252' },
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
    name: "Uncle's EZ-Link Card",
    description:
      'A teal-green SimplyGo EZ-Link bus card dropped near the void deck stone table.',
    icon: 'ezlink',
    collected: false,
  },
  {
    id: 'notes',
    name: 'Field Observation Pad',
    description:
      'Records objective, factual clues spotted around Block 260 & Sunshine Minimart without jumping to conclusions.',
    icon: 'notes',
    collected: true,
    clueFact: true,
  },
  {
    id: 'receipt',
    name: 'Minimart Notice',
    description:
      'Sunshine Minimart community poster: "Think before you act — S.H.I.E.L.D. keeps our neighbourhood safe."',
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

export const MAP_LANDMARKS = [
  {
    id: 'busstop',
    name: 'Blk 260 Bus Stop (Stop 26019)',
    detail: 'ShieldBus 88 sheltered walkway — Uncle Tan is looking for his missing EZ-Link card.',
    gx: 5.8,
    gy: 7.4,
    color: '#6bb09e',
  },
  {
    id: 'voiddeck',
    name: 'Blk 260 Shield View Void Deck',
    detail: 'RC Notice Board, silver letterboxes, chope-d Xiangqi stone table & community cats.',
    gx: 9.8,
    gy: 4.5,
    color: '#d89b52',
  },
  {
    id: 'minimart',
    name: 'Sunshine Minimart',
    detail: 'Anchor Quest: "The Lookout Dilemma" — practise all 6 S.H.I.E.L.D. choices.',
    gx: 15.8,
    gy: 4.5,
    color: '#e6b84c',
  },
  {
    id: 'footpath',
    name: 'Heartland Linkway Footpath',
    detail: 'Say hello to Auntie Mei walking past Blk 260 on her marketing trip.',
    gx: 8.8,
    gy: 8.6,
    color: '#7da1c4',
  },
];

export interface SingaporeLandmarkMeta {
  id: string;
  gameName: string;
  inspiredBy: string;
  district: string;
  status: 'Open Pilot' | 'Skyline Vista' | 'Future District';
  accent: string;
  summary: string;
}

export const SINGAPORE_WORLD_LANDMARKS: SingaporeLandmarkMeta[] = [
  {
    id: 'blk260',
    gameName: 'Blk 260 Shield View & Sunshine Minimart',
    inspiredBy: 'Singapore HDB Heartland Void Deck',
    district: 'Heartland Pilot District',
    status: 'Open Pilot',
    accent: '#f3c46b',
    summary: 'Active playable zone: Sheltered walkway, RC notice board, stone Xiangqi table & shop-theft pilot.',
  },
  {
    id: 'baycrest',
    gameName: 'Baycrest SkyDeck Towers',
    inspiredBy: 'Marina Bay Skyline (MBS-style)',
    district: 'Baycrest Waterfront',
    status: 'Skyline Vista',
    accent: '#76b9d0',
    summary: 'Three iconic waterfront towers crowned by a boat-shaped skybridge visible across the bay.',
  },
  {
    id: 'lionwheel',
    gameName: 'Lion City Observation Wheel',
    inspiredBy: 'Giant Waterfront Ferris Wheel',
    district: 'Baycrest Waterfront',
    status: 'Skyline Vista',
    accent: '#e8a85c',
    summary: 'Slowly turning waterfront wheel overlooking the ShieldQuest heartland promenade.',
  },
  {
    id: 'glowtree',
    gameName: 'GlowTree Supertree Grove',
    inspiredBy: 'Botanical Supertree Gardens',
    district: 'Emerald Bay Gardens',
    status: 'Skyline Vista',
    accent: '#b68ce0',
    summary: 'Glowing twilight bio-canopies visible past the Blk 260 park horizon.',
  },
  {
    id: 'duriandome',
    gameName: 'Durian Dome Arts',
    inspiredBy: 'Spiky Twin Waterfront Theatres',
    district: 'Baycrest Cultural Link',
    status: 'Skyline Vista',
    accent: '#d8b76e',
    summary: 'Twin spiky-roofed concert domes along the waterfront horizon.',
  },
  {
    id: 'dragonpark',
    gameName: 'Emerald Dragon Playground & Shiok Hawker',
    inspiredBy: 'Heritage Heartland Playground & Hawker',
    district: 'Heartland East',
    status: 'Future District',
    accent: '#6dc48c',
    summary: 'Planned Stage 2 community zone for e-commerce & peer-safety scenarios.',
  },
];
