export type TimeOfDay = 'afternoon' | 'evening';

export type Direction = 'SE' | 'SW' | 'NE' | 'NW';

export type QuestId = 'ezlink' | 'lookout' | 'completed';

export type DrawerType =
  | 'backpack'
  | 'wardrobe'
  | 'map'
  | 'menu'
  | 'quest'
  | 'shield'
  | null;

export type ShieldLetter = 'S' | 'H' | 'I' | 'E' | 'L' | 'D';

export interface AvatarConfig {
  name: string;
  skinTone: string;
  hairStyle: 'short' | 'bob' | 'spiky' | 'ponytail';
  hairColor: string;
  shirtColor: string;
  pantsColor: string;
  shieldStyle: 'classic' | 'verifox' | 'beacon' | 'cluepaw';
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string;
  icon: 'ezlink' | 'receipt' | 'notes' | 'chope' | 'kopi' | 'badge';
  collected: boolean;
  clueFact?: boolean;
}

export interface ShieldSkillState {
  letter: ShieldLetter;
  title: string;
  competency: string;
  promptSummary: string;
  completed: boolean;
  passed: boolean;
  score: number;
  maxScore: number;
  guardianName: string;
}

export interface NPCEntity {
  id: 'uncle' | 'auntie' | 'jun' | 'cashier' | 'hawker' | 'commuter';
  name: string;
  role: string;
  gx: number;
  gy: number;
  dir: Direction;
  shirtColor: string;
  pantsColor: string;
  hairColor: string;
  skinTone: string;
  hasBag?: boolean;
  hasTrolley?: boolean;
  hasApron?: boolean;
  isBald?: boolean;
  speechText?: string;
  speechIcon?: 'ezlink' | 'alert' | 'shop';
}

export interface Hotspot {
  id: string;
  label: string;
  subtitle: string;
  gx: number;
  gy: number;
  radius: number;
  category: 'quest' | 'landmark' | 'clue';
}

export interface DialogueState {
  speakerId: string;
  speakerName: string;
  speakerRole: string;
  text: string;
  choices?: {
    id: string;
    label: string;
    action: () => void;
    tone?: 'safe' | 'neutral' | 'risky';
  }[];
}
