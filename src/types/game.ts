export type TimeOfDay = 'afternoon' | 'evening';

export type Direction =
  | 'south'
  | 'south-east'
  | 'east'
  | 'north-east'
  | 'north'
  | 'north-west'
  | 'west'
  | 'south-west';

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

/** A character placed in the street scene. x/y are feet position in 1280x720 canvas pixels. */
export interface NPCEntity {
  id: 'uncle' | 'auntie' | 'cashier' | 'student';
  name: string;
  role: string;
  x: number;
  y: number;
  dir: Direction;
  walking?: boolean;
}
