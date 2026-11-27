import { AvatarConfig, Direction } from '../types/game';

// PixelLab sprite sheets: row 0 = 8 idle rotations, then one row per walk direction.
interface SheetMeta {
  spritesheet: {
    cell_size: { width: number; height: number };
    rows: { row: number; type: string; frame_count: number; direction?: string; directions?: string[] }[];
  };
}

export interface Sheet {
  img: CanvasImageSource;
  cell: number;
  idle: Partial<Record<Direction, number>>; // column in row 0
  walk: Partial<Record<Direction, { row: number; frames: number }>>;
}

const sheets = new Map<string, Sheet>();
const pending = new Set<string>();
const listeners = new Set<() => void>();

/** Re-render hook for React components that draw sprites outside the game loop. */
export function onSpritesLoaded(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getSheet(key: string): Sheet | null {
  const s = sheets.get(key);
  if (s) return s;
  if (!pending.has(key)) {
    pending.add(key);
    loadSheet(key)
      .then((sheet) => {
        sheets.set(key, sheet);
        listeners.forEach((fn) => fn());
      })
      .catch((err) => console.error(`Sprite sheet "${key}" failed to load`, err));
  }
  return null;
}

async function loadSheet(key: string): Promise<Sheet> {
  const base = `/assets/chars/${key}`;
  const [meta, img] = await Promise.all([
    fetch(`${base}.json`).then((r) => {
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json() as Promise<SheetMeta>;
    }),
    loadImage(`${base}.png`),
  ]);
  const sheet: Sheet = { img, cell: meta.spritesheet.cell_size.width, idle: {}, walk: {} };
  for (const row of meta.spritesheet.rows) {
    if (row.type === 'rotations' && row.directions) {
      row.directions.forEach((d, i) => (sheet.idle[d as Direction] = i));
    } else if (row.direction) {
      sheet.walk[row.direction as Direction] = { row: row.row, frames: row.frame_count };
    }
  }
  return sheet;
}

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Image failed: ${src}`));
    img.src = src;
  });
}

const MIRROR_DIR: Partial<Record<Direction, Direction>> = {
  'south-west': 'south-east',
  'south-east': 'south-west',
  'north-east': 'north-west',
  'north-west': 'north-east',
  west: 'east',
  east: 'west',
};

/**
 * Draws a character with feet at (x, y).
 * - Uses native walk frames when available (and mirrors diagonal/horizontal rows if missing).
 * - For idle-only NPC sheets, synthesizes a crisp integer-pixel leg stride + bounce when walking.
 * - Adds a subtle 1px breathing pulse while standing idle when `idleTime > 0`.
 */
export function drawCharacter(
  ctx: CanvasRenderingContext2D,
  sheet: Sheet,
  x: number,
  y: number,
  dir: Direction,
  walkPhase: number | null,
  scale = 2,
  idleTime = 0,
) {
  const c = sheet.cell;
  const w = c * scale;
  const dx = Math.round(x - w / 2);
  const dy = Math.round(y - w + 2 * scale);

  if (walkPhase !== null) {
    const nativeWalk = sheet.walk[dir];
    if (nativeWalk) {
      const sx = (Math.floor(walkPhase) % nativeWalk.frames) * c;
      const sy = nativeWalk.row * c;
      ctx.drawImage(sheet.img, sx, sy, c, c, dx, dy, w, w);
      return;
    }

    const mirrorDir = MIRROR_DIR[dir];
    const mirrorWalk = mirrorDir ? sheet.walk[mirrorDir] : undefined;
    if (mirrorWalk) {
      const sx = (Math.floor(walkPhase) % mirrorWalk.frames) * c;
      const sy = mirrorWalk.row * c;
      ctx.save();
      ctx.translate(Math.round(x), dy);
      ctx.scale(-1, 1);
      ctx.drawImage(sheet.img, sx, sy, c, c, -w / 2, 0, w, w);
      ctx.restore();
      return;
    }

    // Crisp multi-part leg stride synthesis for single-row NPC sheets (uncle, cashier, student)
    const sx = (sheet.idle[dir] ?? sheet.idle.south ?? 0) * c;
    const stride = Math.sin(walkPhase * 0.85);
    const bob = Math.round(-Math.abs(stride) * 1.2) * scale;
    const splitY = 43; // hip/shorts seam on 64x64 PixelLab character frames
    const legH = c - splitY;
    const shiftL = Math.round(stride * 2) * scale;
    const shiftR = -shiftL;
    const liftL = Math.round(Math.max(0, stride) * 1.6) * scale;
    const liftR = Math.round(Math.max(0, -stride) * 1.6) * scale;

    // Left & right legs with alternating stride and foot lift (+2px overlap prevents any waist seam)
    ctx.drawImage(sheet.img, sx, splitY - 2, 32, legH + 2, dx + shiftL, dy + (splitY - 2) * scale - liftL, 32 * scale, (legH + 2) * scale);
    ctx.drawImage(sheet.img, sx + 32, splitY - 2, 32, legH + 2, dx + 32 * scale + shiftR, dy + (splitY - 2) * scale - liftR, 32 * scale, (legH + 2) * scale);
    // Upper torso & head
    ctx.drawImage(sheet.img, sx, 0, c, splitY + 1, dx, dy + bob, w, (splitY + 1) * scale);
    return;
  }

  const sx = (sheet.idle[dir] ?? sheet.idle.south ?? 0) * c;
  if (idleTime > 0) {
    const breath = Math.sin(idleTime * 2.4 + x * 0.03) > 0.65 ? -scale : 0;
    const splitY = 39;
    ctx.drawImage(sheet.img, sx, splitY - 2, c, c - (splitY - 2), dx, dy + (splitY - 2) * scale, w, (c - (splitY - 2)) * scale);
    ctx.drawImage(sheet.img, sx, 0, c, splitY + 1, dx, dy + breath, w, (splitY + 1) * scale);
    return;
  }

  ctx.drawImage(sheet.img, sx, 0, c, c, dx, dy, w, w);
}

// ---------- Player recolouring ----------
// The four player bases share one outfit (mustard tee, navy shorts, brown hair), so avatar
// colours are applied by swapping hue bands and keeping each pixel's relative shading.

type Part = 'skin' | 'hair' | 'shirt' | 'pants';

// shortcut: HSL bands tuned by eye on the PixelLab player sheets; regenerate sprites -> retune.
function classify(h: number, s: number, l: number): Part | null {
  if (h >= 24 && h <= 42 && s >= 0.55 && l >= 0.36 && l <= 0.62) return 'shirt';
  if (h >= 210 && h <= 250 && s >= 0.15 && l >= 0.1 && l <= 0.37) return 'pants';
  if ((h <= 24 || h >= 350) && s >= 0.3 && l >= 0.48) return 'skin';
  if ((h <= 22 || h >= 280) && s >= 0.2 && l >= 0.1 && l < 0.37) return 'hair';
  return null;
}

// Lightness of each part's main tone in the base sprites.
const REF_L: Record<Part, number> = { skin: 0.72, hair: 0.29, shirt: 0.54, pants: 0.33 };

const recolored = new Map<string, HTMLCanvasElement>();

export function playerSheetKey(avatar: AvatarConfig) {
  return `player-${avatar.hairStyle}`;
}

/** Player sheet with the avatar's colours applied (cached per colour combo). */
export function getPlayerSheet(avatar: AvatarConfig): Sheet | null {
  const base = getSheet(playerSheetKey(avatar));
  if (!base) return null;
  const id = [avatar.hairStyle, avatar.skinTone, avatar.hairColor, avatar.shirtColor, avatar.pantsColor].join('|');
  let canvas = recolored.get(id);
  if (!canvas) {
    canvas = recolorSheet(base.img as HTMLImageElement, {
      skin: avatar.skinTone,
      hair: avatar.hairColor,
      shirt: avatar.shirtColor,
      pants: avatar.pantsColor,
    });
    recolored.set(id, canvas);
  }
  return { ...base, img: canvas };
}

function recolorSheet(img: HTMLImageElement, colors: Record<Part, string>): HTMLCanvasElement {
  const canvas = document.createElement('canvas');
  canvas.width = img.width;
  canvas.height = img.height;
  const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
  ctx.drawImage(img, 0, 0);
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const px = data.data;
  const targets = Object.fromEntries(
    (Object.keys(colors) as Part[]).map((p) => [p, rgbToHsl(...hexToRgb(colors[p]))])
  ) as Record<Part, [number, number, number]>;

  for (let i = 0; i < px.length; i += 4) {
    if (px[i + 3] === 0) continue;
    const [h, s, l] = rgbToHsl(px[i], px[i + 1], px[i + 2]);
    const part = classify(h, s, l);
    if (!part) continue;
    const [th, ts, tl] = targets[part];
    const nl = Math.min(0.97, Math.max(0.03, tl + (l - REF_L[part])));
    const [r, g, b] = hslToRgb(th, ts, nl);
    px[i] = r;
    px[i + 1] = g;
    px[i + 2] = b;
  }
  ctx.putImageData(data, 0, 0);
  return canvas;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function rgbToHsl(r: number, g: number, b: number): [number, number, number] {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  let h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  h *= 60;
  return [h, s, l];
}

function hslToRgb(h: number, s: number, l: number): [number, number, number] {
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  const [r, g, b] =
    h < 60 ? [c, x, 0] : h < 120 ? [x, c, 0] : h < 180 ? [0, c, x] : h < 240 ? [0, x, c] : h < 300 ? [x, 0, c] : [c, 0, x];
  return [Math.round((r + m) * 255), Math.round((g + m) * 255), Math.round((b + m) * 255)];
}
