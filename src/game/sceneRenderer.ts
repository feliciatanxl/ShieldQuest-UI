import { AvatarConfig, Direction, NPCEntity, TimeOfDay } from '../types/game';
import { drawCharacter, getPlayerSheet, getSheet, loadImage } from './sprites';
import { districtArt } from '../data/districts';
import {
  DISTRICTS, DISTRICT_ORIGINS, NEIGHBOURHOOD_PATHS, NORTH_LINK_GARDEN, SCENE_HEIGHT, SCENE_WIDTH,
  VERGE_TREES, worldPoint,
} from '../data/worldMap';
import { expansionForeground } from './expansionGeometry';

// The street scene is one 640x360 PixelLab painting shown at 2x on a 1280x720 canvas.
export const CANVAS_W = SCENE_WIDTH;
export const CANVAS_H = SCENE_HEIGHT;
const ART_SCALE = 2;

export type Pt = { x: number; y: number };

// ---------- Scene layout (1280x720 canvas pixels, feet positions) ----------

export const PLAYER_START: Pt = { x: 470, y: 485 };
export const UNCLE_POS: Pt = { x: 560, y: 455 };
export const AUNTIE_PATH: [Pt, Pt] = [
  { x: 540, y: 535 },
  { x: 740, y: 605 },
];
export const ITEM_POS = {
  ezlink: { x: 790, y: 478 },
  chope: { x: 965, y: 470 },
  kopi: { x: 480, y: 330 },
};
/**
 * Props painted into the background that characters can stand behind. The outline is
 * traced from the art; anyone whose feet are above `frontY` is drawn behind the prop.
 */
const FOREGROUND_PROPS: { outline: Pt[]; frontY: number }[] = [
  {
    // Roof above the north linkway. Walkers on its far side pass under the roof.
    outline: [
      { x: 257, y: 158 }, { x: 314, y: 109 }, { x: 586, y: 0 },
      { x: 644, y: 0 }, { x: 644, y: 103 }, { x: 355, y: 215 }, { x: 258, y: 184 },
    ],
    frontY: 171,
  },
  {
    // Minimart snack rack (bottom right)
    outline: [
      { x: 1203, y: 600 },
      { x: 1212, y: 574 },
      { x: 1236, y: 558 },
      { x: 1250, y: 548 },
      { x: 1280, y: 546 },
      { x: 1280, y: 700 },
      { x: 1250, y: 680 },
      { x: 1220, y: 668 },
      { x: 1203, y: 668 },
    ],
    frontY: 660,
  },
];

/** Walking into this box (the Sunshine Minimart shop front) opens the Lookout Dilemma. */
export const MINIMART_ZONE = { x0: 1050, y0: 590, x1: 1210, y1: 650 };

const WALK_AREA: Pt[] = [
  { x: 590, y: 120 },
  { x: 655, y: 120 },
  { x: 655, y: 330 },
  { x: 712, y: 356 },
  { x: 835, y: 346 },
  { x: 860, y: 336 },
  { x: 1005, y: 372 },
  { x: 1010, y: 470 },
  { x: 1060, y: 600 },
  { x: 1205, y: 650 },
  { x: 1205, y: 705 },
  { x: 1070, y: 705 },
  { x: 1045, y: 640 },
  { x: 860, y: 622 },
  { x: 420, y: 568 },
  { x: 300, y: 540 },
  { x: 245, y: 515 },
  { x: 232, y: 468 },
  { x: 300, y: 420 },
  { x: 292, y: 372 },
  { x: 440, y: 250 },
];

// Ellipses (cx, cy, rx, ry) and boxes the player cannot stand in.
const BLOCK_ELLIPSES: [number, number, number, number][] = [
  [275, 346, 16, 10], // shelter posts
  [382, 398, 16, 10],
  [468, 248, 14, 9],
  [575, 300, 14, 9],
  [628, 396, 34, 20], // recycling bin
  [875, 445, 72, 40], // stone table + stools
  [262, 505, 14, 9], // night lamp posts (harmless by day)
  [760, 565, 14, 9],
];
const BLOCK_BOXES: [number, number, number, number][] = [
  [648, 330, 716, 446], // mosaic pillar (left)
  [972, 470, 1132, 612], // minimart pillar, bin, drink crates
];

function insidePolygon(x: number, y: number, poly: Pt[]) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[i];
    const b = poly[j];
    if (a.y > y !== b.y > y && x < ((b.x - a.x) * (y - a.y)) / (b.y - a.y) + a.x) inside = !inside;
  }
  return inside;
}

export function isWalkable(x: number, y: number): boolean {
  if (!insidePolygon(x, y, WALK_AREA)) return false;
  for (const [cx, cy, rx, ry] of BLOCK_ELLIPSES) {
    if (((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 < 1) return false;
  }
  for (const [x0, y0, x1, y1] of BLOCK_BOXES) {
    if (x >= x0 && x <= x1 && y >= y0 && y <= y1) return false;
  }
  return true;
}

/** Facing for a movement vector in screen space (8-way). */
export function directionFor(dx: number, dy: number): Direction {
  const dirs: Direction[] = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
  const a = Math.atan2(dy, dx);
  return dirs[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

// ---------- Background ----------

const backgrounds = new Map<string, HTMLImageElement>();
const loading = new Set<string>();
function prepareImage(path: string) {
  if (!loading.has(path)) {
    loading.add(path);
    loadImage(path).then((img) => backgrounds.set(path, img)).catch(console.error);
  }
  return backgrounds.get(path);
}
for (const district of DISTRICTS) {
  prepareImage(districtArt(district, false));
}

const patterns = new WeakMap<HTMLImageElement, CanvasPattern>();
function groundPattern(ctx: CanvasRenderingContext2D, src: string, fallback: string) {
  const image = prepareImage(src);
  if (!image) return fallback;
  let pattern = patterns.get(image);
  if (!pattern) {
    pattern = ctx.createPattern(image, 'repeat') ?? undefined;
    if (pattern) {
      pattern.setTransform(new DOMMatrix().scale(ART_SCALE));
      patterns.set(image, pattern);
    }
  }
  return pattern ?? fallback;
}

function drawConnectingPaths(ctx: CanvasRenderingContext2D, camera: Pt, night: boolean) {
  const mode = night ? 'night' : 'day';
  ctx.fillStyle = groundPattern(ctx, `/assets/expansion/verge-${mode}.png`, night ? '#30343b' : '#737449');
  ctx.fillRect(camera.x, camera.y, CANVAS_W, CANVAS_H);
  const paving = groundPattern(ctx, `/assets/expansion/linkway-${mode}.png`, night ? '#56505b' : '#b7a484');
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  for (const path of NEIGHBOURHOOD_PATHS) {
    ctx.beginPath();
    path.points.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
    ctx.lineWidth = path.radius * 2 + 8;
    ctx.strokeStyle = night ? '#3a383b' : '#938772';
    ctx.stroke();
    ctx.lineWidth = path.radius * 2;
    ctx.strokeStyle = paving;
    ctx.stroke();
  }
  const garden = prepareImage(`/assets/expansion/north-link-garden-${mode}.png`);
  if (garden) {
    ctx.drawImage(garden, NORTH_LINK_GARDEN.x, NORTH_LINK_GARDEN.y,
      garden.width * ART_SCALE, garden.height * ART_SCALE);
  }
}

// ---------- Render ----------

export interface RenderState {
  camera: Pt;
  time: number;
  timeOfDay: TimeOfDay;
  player: Pt & { dir: Direction; isMoving: boolean; walkPhase: number; avatar: AvatarConfig };
  npcs: (NPCEntity & { worldKey: string })[];
  items: { kind: keyof typeof ITEM_POS }[];
  hoveredTarget: string | null;
  speech: { npcId: string; text: string; icon?: 'ezlink' | 'alert' | 'shop' } | null;
  walkTargetMarker: (Pt & { createdAt: number }) | null;
  /** Visible horizontal slice of the canvas (phones crop the 16:9 scene). */
  viewX?: [number, number];
}

const INK = '#231a16';
const DEBUG = typeof location !== 'undefined' && location.search.includes('debug');

export function renderScene(ctx: CanvasRenderingContext2D, s: RenderState) {
  const night = s.timeOfDay === 'evening';
  ctx.imageSmoothingEnabled = false;

  ctx.save();
  ctx.translate(-s.camera.x, -s.camera.y);
  drawConnectingPaths(ctx, s.camera, night);
  const scenes = [];
  for (const district of DISTRICTS) {
    const origin = DISTRICT_ORIGINS[district];
    const image = prepareImage(districtArt(district, night)) ?? backgrounds.get(districtArt(district, !night));
    if (!image || origin.x + CANVAS_W < s.camera.x || origin.x > s.camera.x + CANVAS_W
      || origin.y + CANVAS_H < s.camera.y || origin.y > s.camera.y + CANVAS_H) continue;
    ctx.drawImage(image, origin.x, origin.y, CANVAS_W, CANVAS_H);
    scenes.push({ district, origin, image });
  }

  if (s.walkTargetMarker) drawWalkMarker(ctx, s.walkTargetMarker, s.time);
  for (const item of s.items) drawPickup(ctx, worldPoint('block260', ITEM_POS[item.kind]), item.kind, s.time);

  // Depth sort: lower on screen = closer to camera = drawn later.
  type Actor = { y: number; draw: () => void };
  const actors: Actor[] = s.npcs.map((npc) => ({
    y: npc.y,
    draw: () => {
      const sheet = getSheet(npc.id);
      if (!sheet) return;
      drawShadow(ctx, npc.x, npc.y);
      if (s.hoveredTarget === npc.worldKey) drawHoverRing(ctx, npc.x, npc.y);
      drawCharacter(ctx, sheet, npc.x, npc.y, npc.dir, npc.walking ? s.time * 9 : null);
    },
  }));
  const tree = prepareImage('/assets/expansion/linkway-tree.png');
  if (tree) {
    const size = tree.width * ART_SCALE;
    for (const [i, root] of VERGE_TREES.entries()) {
      if (root.x + size / 2 < s.camera.x || root.x - size / 2 > s.camera.x + CANVAS_W
        || root.y < s.camera.y || root.y - size > s.camera.y + CANVAS_H) continue;
      actors.push({
        y: root.y,
        draw: () => {
          ctx.save();
          if (night) ctx.filter = 'brightness(0.53) saturate(0.77)';
          ctx.translate(root.x, root.y);
          if (i % 2) ctx.scale(-1, 1);
          ctx.drawImage(tree, -size / 2, -size, size, size);
          ctx.restore();
        },
      });
    }
  }
  const p = s.player;
  actors.push({
    y: p.y,
    draw: () => {
      const sheet = getPlayerSheet(p.avatar);
      if (!sheet) return;
      drawShadow(ctx, p.x, p.y);
      drawCharacter(ctx, sheet, p.x, p.y, p.dir, p.isMoving ? p.walkPhase : null);
    },
  });

  // Painted props that stand in front of characters: redraw their shape from the
  // background, sorted by their front edge like any other actor.
  for (const { district, origin, image } of scenes) {
    for (const fg of district === 'block260' ? FOREGROUND_PROPS : expansionForeground(district)) {
      actors.push({
        y: fg.frontY + origin.y,
        draw: () => {
          ctx.save();
          ctx.filter = 'none';
          ctx.translate(origin.x, origin.y);
          ctx.beginPath();
          fg.outline.forEach((pt, i) => (i ? ctx.lineTo(pt.x, pt.y) : ctx.moveTo(pt.x, pt.y)));
          ctx.closePath();
          ctx.clip();
          ctx.drawImage(image, 0, 0, CANVAS_W, CANVAS_H);
          ctx.restore();
        },
      });
    }
  }

  // Dim sprites to sit in the night painting's lighting.
  if (night) ctx.filter = 'brightness(0.82) saturate(0.9)';
  actors.sort((a, b) => a.y - b.y).forEach((a) => a.draw());
  ctx.filter = 'none';

  drawPlayerMarker(ctx, p.x, p.y - 132 + Math.sin(s.time * 4) * 3);

  if (s.speech) {
    const npc = s.npcs.find((n) => n.worldKey === `block260:${s.speech!.npcId}`);
    if (npc) drawSpeechBubble(ctx, npc, s.speech.text, s.speech.icon, night, s.viewX ?? [0, CANVAS_W]);
  }

  if (DEBUG) {
    ctx.save();
    ctx.translate(DISTRICT_ORIGINS.block260.x, DISTRICT_ORIGINS.block260.y);
    drawDebug(ctx);
    ctx.restore();
  }
  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'rgba(20, 14, 12, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 26, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawHoverRing(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 32, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
}

/** Green "you are here" arrow above the player, as in the concept art. */
function drawPlayerMarker(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = '#4fc76a';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(x - 12, y - 10);
  ctx.lineTo(x + 12, y - 10);
  ctx.lineTo(x, y + 6);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.fillStyle = '#9af0a8';
  ctx.fillRect(x - 6, y - 7, 8, 3);
}

function drawWalkMarker(ctx: CanvasRenderingContext2D, m: Pt & { createdAt: number }, time: number) {
  const age = time - m.createdAt;
  if (age > 1.2) return;
  const r = 10 + age * 18;
  ctx.strokeStyle = `rgba(255, 224, 102, ${1 - age / 1.2})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(m.x, m.y, r, r * 0.45, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawPickup(ctx: CanvasRenderingContext2D, p: Pt, kind: keyof typeof ITEM_POS, time: number) {
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  const bob = Math.sin(time * 3) * 2;
  ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 22, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Sparkle
  ctx.fillStyle = `rgba(255, 248, 200, ${pulse})`;
  const sx = p.x + 16;
  const sy = p.y - 26 + bob;
  ctx.fillRect(sx - 1, sy - 6, 2, 12);
  ctx.fillRect(sx - 6, sy - 1, 12, 2);

  ctx.save();
  ctx.translate(p.x, p.y - 8 + bob);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  if (kind === 'ezlink') {
    ctx.rotate(-0.25);
    ctx.fillStyle = '#5eb8a8';
    ctx.fillRect(-14, -9, 28, 18);
    ctx.strokeRect(-14, -9, 28, 18);
    ctx.fillStyle = '#8ee0cf';
    ctx.fillRect(-12, -7, 24, 4);
    ctx.fillStyle = '#f5d76e';
    ctx.fillRect(-9, 0, 7, 5);
  } else if (kind === 'kopi') {
    ctx.fillStyle = '#7a4a2c';
    ctx.fillRect(-8, -16, 16, 18);
    ctx.strokeRect(-8, -16, 16, 18);
    ctx.fillStyle = '#d1433b';
    ctx.fillRect(-8, -16, 16, 4);
    ctx.strokeStyle = '#f4eee4';
    ctx.beginPath();
    ctx.arc(0, -18, 6, Math.PI, 0);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#f7f4ec';
    ctx.fillRect(-11, -7, 22, 13);
    ctx.strokeRect(-11, -7, 22, 13);
    ctx.fillStyle = '#4f82b8';
    ctx.fillRect(-10, -2, 20, 4);
  }
  ctx.restore();
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  npc: NPCEntity,
  text: string,
  icon: 'ezlink' | 'alert' | 'shop' | undefined,
  night: boolean,
  [viewL, viewR]: [number, number]
) {
  const boxW = 252;
  const boxH = 70;
  const tipX = npc.x - 8;
  const left = Math.round(Math.max(viewL + 8, Math.min(viewR - boxW - 8, tipX - boxW / 2)));
  const top = npc.y - 150 - boxH;
  const fill = night ? '#dcd6ea' : '#f5efe6';
  const P = 2; // one art pixel on the 2x canvas

  // Notched pixel frame: ink body, then fill inset by 2 art pixels
  pxBox(ctx, left, top, boxW, boxH, P * 2, INK);
  pxBox(ctx, left + P * 2, top + P * 2, boxW - P * 4, boxH - P * 4, P * 2, fill);
  ctx.fillStyle = night ? '#bdb5d1' : '#e2d6c2'; // bottom shade row
  ctx.fillRect(left + P * 3, top + boxH - P * 4, boxW - P * 6, P);

  // Stepped tail
  for (let i = 0; i < 5; i++) {
    const half = (5 - i) * P * 1.5;
    ctx.fillStyle = INK;
    ctx.fillRect(Math.round(tipX - half - P), top + boxH - P * 2 + i * P * 2, Math.round(half * 2 + P * 2), P * 2);
    ctx.fillStyle = fill;
    ctx.fillRect(Math.round(tipX - half + P), top + boxH - P * 2 + i * P * 2, Math.max(0, Math.round(half * 2 - P * 2)), P * 2);
  }

  if (icon === 'ezlink') {
    const x = left + 14;
    const y = top + 20;
    pxBox(ctx, x, y, 44, 30, P, INK);
    ctx.fillStyle = '#5eb8a8';
    ctx.fillRect(x + P, y + P, 44 - P * 2, 30 - P * 2);
    ctx.fillStyle = '#8ee0cf';
    ctx.fillRect(x + P, y + P, 44 - P * 2, 6);
    ctx.fillStyle = '#f5d76e';
    ctx.fillRect(x + 6, y + 13, 10, 8);
    ctx.fillStyle = '#1b4740';
    ctx.fillRect(x + 20, y + 14, 18, P * 2);
    ctx.fillRect(x + 20, y + 20, 12, P * 2);
  } else {
    const x = left + 18;
    const y = top + 18;
    pxBox(ctx, x, y, 34, 34, P * 2, INK);
    ctx.fillStyle = '#e6b84c';
    ctx.fillRect(x + P * 2, y + P * 2, 34 - P * 4, 34 - P * 4);
    ctx.fillStyle = INK;
    ctx.fillRect(x + 15, y + 8, 4, 12);
    ctx.fillRect(x + 15, y + 23, 4, 4);
  }

  ctx.fillStyle = INK;
  ctx.font = '23px "VT323", monospace';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const lines: string[] = [];
  let cur = '';
  for (const w of text.split(' ')) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > boxW - 84 && cur) {
      lines.push(cur);
      cur = w;
    } else cur = test;
  }
  if (cur) lines.push(cur);
  const startY = top + (lines.length <= 2 ? 14 : 6);
  lines.slice(0, 3).forEach((ln, i) => ctx.fillText(ln, left + 68, startY + i * 20));
}

/** Filled rectangle with square-notched corners, like a pixel-art panel. */
function pxBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, notch: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x + notch, y, w - notch * 2, h);
  ctx.fillRect(x, y + notch, w, h - notch * 2);
}

function drawDebug(ctx: CanvasRenderingContext2D) {
  ctx.fillStyle = 'rgba(0, 255, 120, 0.25)';
  for (let y = 0; y < CANVAS_H; y += 8) {
    for (let x = 0; x < CANVAS_W; x += 8) {
      if (isWalkable(x, y)) ctx.fillRect(x, y, 8, 8);
    }
  }
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  const z = MINIMART_ZONE;
  ctx.strokeRect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0);
}
