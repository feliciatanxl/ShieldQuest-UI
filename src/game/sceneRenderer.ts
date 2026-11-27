import { AvatarConfig, Direction, NPCEntity, TimeOfDay } from '../types/game';
import { drawCharacter, getPlayerSheet, getSheet, loadImage } from './sprites';
import {
  ART_SCALE,
  HALF_H,
  HALF_W,
  isoToWorld,
  MAP_COLS,
  MAP_ROWS,
  TILE_H,
  TILE_W,
  worldToIso,
} from './isoGrid';
import {
  ISO_AUNTIE_PATH,
  ISO_ITEM_POS,
  ISO_MINIMART_ZONE,
  ISO_PLAYER_START,
  ISO_UNCLE_POS,
  isTileWalkable,
  isWorldPointWalkable,
  TILES,
  WORLD_PROPS,
} from '../data/singaporeWorld';
import { SCENE_HEIGHT, SCENE_WIDTH } from '../data/worldMap';

export const CANVAS_W = SCENE_WIDTH;
export const CANVAS_H = SCENE_HEIGHT;

export type Pt = { x: number; y: number };

export const PLAYER_START: Pt = ISO_PLAYER_START;
export const UNCLE_POS: Pt = ISO_UNCLE_POS;
export const AUNTIE_PATH: [Pt, Pt] = ISO_AUNTIE_PATH;
export const ITEM_POS = ISO_ITEM_POS;
export const MINIMART_ZONE = ISO_MINIMART_ZONE;

export function isWalkable(x: number, y: number): boolean {
  return isWorldPointWalkable(x, y);
}

/** Facing for a movement vector in screen space (8-way). */
export function directionFor(dx: number, dy: number): Direction {
  const dirs: Direction[] = ['east', 'south-east', 'south', 'south-west', 'west', 'north-west', 'north', 'north-east'];
  const a = Math.atan2(dy, dx);
  return dirs[(Math.round(a / (Math.PI / 4)) + 8) % 8];
}

// ---------- Asset Manifest & Image Cache ----------

interface TileManifestEntry {
  day: string;
  night: string;
  w: number;
  h: number;
}

interface PropManifestEntry extends TileManifestEntry {
  ax: number;
  ay: number;
}

interface IsoManifest {
  tiles: Record<string, TileManifestEntry>;
  props: Record<string, PropManifestEntry>;
}

let manifest: IsoManifest | null = null;
let manifestLoading = false;

function ensureManifest() {
  if (manifest || manifestLoading) return;
  manifestLoading = true;
  fetch('/assets/iso/manifest.json')
    .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`HTTP ${r.status}`))))
    .then((data: IsoManifest) => {
      manifest = data;
      // Preload day tiles and props immediately
      for (const t of Object.values(data.tiles)) prepareImage(t.day);
      for (const p of Object.values(data.props)) prepareImage(p.day);
    })
    .catch(console.error);
}
ensureManifest();

const images = new Map<string, HTMLImageElement>();
const loading = new Set<string>();
function prepareImage(path: string): HTMLImageElement | undefined {
  if (!loading.has(path)) {
    loading.add(path);
    loadImage(path).then((img) => images.set(path, img)).catch(console.error);
  }
  return images.get(path);
}

const ITEM_SPRITE_PATH: Record<keyof typeof ITEM_POS, string> = {
  ezlink: '/assets/ui/item-ezlink.png',
  kopi: '/assets/ui/item-kopi.png',
  chope: '/assets/ui/item-chope.png',
};
Object.values(ITEM_SPRITE_PATH).forEach(prepareImage);

// ---------- Topological Isometric Depth Sort ----------

interface RenderItem {
  cMin: number;
  cMax: number;
  rMin: number;
  rMax: number;
  tieDepth: number;
  draw: () => void;
}

function sortIsoItems(items: RenderItem[]): RenderItem[] {
  const n = items.length;
  if (n <= 1) return items;

  // Sort by depth baseline first so tie-breaks are naturally ordered
  items.sort((a, b) => a.tieDepth - b.tieDepth);

  const adj: number[][] = Array.from({ length: n }, () => []);
  const indeg = new Int32Array(n);

  for (let i = 0; i < n; i++) {
    const a = items[i];
    for (let j = i + 1; j < n; j++) {
      const b = items[j];
      const aBehindB =
        (a.cMax <= b.cMin + 0.04 && a.rMin < b.rMax - 0.04) ||
        (a.rMax <= b.rMin + 0.04 && a.cMin < b.cMax - 0.04);
      const bBehindA =
        (b.cMax <= a.cMin + 0.04 && b.rMin < a.rMax - 0.04) ||
        (b.rMax <= a.rMin + 0.04 && b.cMin < a.cMax - 0.04);

      if (aBehindB && !bBehindA) {
        adj[i].push(j);
        indeg[j]++;
      } else if (bBehindA && !aBehindB) {
        adj[j].push(i);
        indeg[i]++;
      }
    }
  }

  const queue: number[] = [];
  for (let i = 0; i < n; i++) {
    if (indeg[i] === 0) queue.push(i);
  }

  const out: RenderItem[] = [];
  let head = 0;
  while (head < queue.length) {
    const u = queue[head++];
    out.push(items[u]);
    for (const v of adj[u]) {
      if (--indeg[v] === 0) queue.push(v);
    }
  }

  if (out.length < n) {
    // Fallback if any rare overlap caused a cycle
    const seen = new Set(out);
    for (const item of items) {
      if (!seen.has(item)) out.push(item);
    }
  }
  return out;
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
  hoveredTile?: { col: number; row: number } | null;
  speech: { npcId: string; text: string; icon?: 'ezlink' | 'alert' | 'shop' } | null;
  walkTargetMarker: (Pt & { createdAt: number }) | null;
  viewX?: [number, number];
}

const INK = '#231a16';
const DEBUG = typeof location !== 'undefined' && location.search.includes('debug');

// Persistent SBS Bus 88 simulation along Ang Mo Kio Ave 3 (row 29.0, SE-bound)
const busSim = {
  col: 9,
  speed: 2.2,
  stopTimer: 0,
  stoppedThisPass: false,
  wheelPhase: 0,
  lastTime: -1,
};

function stepBusSimulation(time: number, playerCol: number, playerRow: number) {
  if (busSim.lastTime < 0) busSim.lastTime = time;
  const dt = Math.max(0, Math.min(0.05, time - busSim.lastTime));
  busSim.lastTime = time;

  // Yield at West (col 21..22) or East (col 33..34) zebra crossing if player is crossing
  const playerOnRoad = playerRow >= 27.0 && playerRow <= 32.5;
  const yieldWest = playerOnRoad && playerCol >= 20.2 && playerCol <= 22.8 && busSim.col >= 16.0 && busSim.col <= 19.4;
  const yieldEast = playerOnRoad && playerCol >= 32.2 && playerCol <= 34.8 && busSim.col >= 28.0 && busSim.col <= 31.4;

  // Stop smoothly at Blk 260 Bus Stop 26019 (col 15.8..16.8) once per pass
  if (busSim.stopTimer > 0) {
    busSim.stopTimer = Math.max(0, busSim.stopTimer - dt);
  } else if (!busSim.stoppedThisPass && busSim.col >= 15.8 && busSim.col <= 16.8 && !yieldWest && !yieldEast) {
    busSim.stopTimer = 3.2;
    busSim.stoppedThisPass = true;
  }

  const targetSpeed = busSim.stopTimer > 0 || yieldWest || yieldEast ? 0 : 2.3;
  busSim.speed += (targetSpeed - busSim.speed) * Math.min(1, dt * 4.5);
  if (targetSpeed === 0 && busSim.speed < 0.04) busSim.speed = 0;

  busSim.col += busSim.speed * dt;
  busSim.wheelPhase += busSim.speed * dt * 9.0;

  if (busSim.col > 48.5) {
    busSim.col = 3.0;
    busSim.stoppedThisPass = false;
  }
}

export function renderScene(ctx: CanvasRenderingContext2D, s: RenderState) {
  ensureManifest();
  const night = s.timeOfDay === 'evening';
  const mode = night ? 'night' : 'day';
  ctx.imageSmoothingEnabled = false;

  // Cosy background outside the isometric diamond world
  ctx.fillStyle = night ? '#1b2030' : '#647338';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  ctx.save();
  ctx.translate(-s.camera.x, -s.camera.y);

  // Visible tile range from camera viewport corners + generous margin for tall props
  const corners = [
    worldToIso(s.camera.x - 160, s.camera.y - 120),
    worldToIso(s.camera.x + CANVAS_W + 160, s.camera.y - 120),
    worldToIso(s.camera.x - 160, s.camera.y + CANVAS_H + 220),
    worldToIso(s.camera.x + CANVAS_W + 160, s.camera.y + CANVAS_H + 220),
  ];
  const minCol = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.col))) - 2);
  const maxCol = Math.min(MAP_COLS - 1, Math.ceil(Math.max(...corners.map((c) => c.col))) + 2);
  const minRow = Math.max(0, Math.floor(Math.min(...corners.map((c) => c.row))) - 2);
  const maxRow = Math.min(MAP_ROWS - 1, Math.ceil(Math.max(...corners.map((c) => c.row))) + 2);

  // 1. Ground Tile Pass
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      const tileId = TILES[row][col];
      const pt = isoToWorld(col, row);
      if (
        pt.x + HALF_W < s.camera.x ||
        pt.x - HALF_W > s.camera.x + CANVAS_W ||
        pt.y + HALF_H < s.camera.y ||
        pt.y - HALF_H > s.camera.y + CANVAS_H
      ) {
        continue;
      }
      const entry = manifest?.tiles[tileId];
      const img = entry ? (prepareImage(entry[mode]) ?? prepareImage(entry.day)) : undefined;
      if (img) {
        ctx.drawImage(img, Math.round(pt.x - HALF_W), Math.round(pt.y - HALF_H), TILE_W, TILE_H);
      } else {
        drawFallbackDiamond(ctx, pt.x, pt.y, night ? '#2c3340' : '#7f8c46');
      }
    }
  }

  // 2. Ground hover tile highlight (Habbo-style walkable cursor) + walk ripple + pixel pickups
  if (s.hoveredTile && isTileWalkable(s.hoveredTile.col, s.hoveredTile.row)) {
    const hp = isoToWorld(s.hoveredTile.col, s.hoveredTile.row);
    drawIsoHoverTile(ctx, hp.x, hp.y);
  }
  if (s.walkTargetMarker) drawWalkMarker(ctx, s.walkTargetMarker, s.time);
  for (const item of s.items) drawPickup(ctx, ITEM_POS[item.kind], item.kind, s.time);

  // 3. Depth-Sorted Actor, Prop & Canopy Pass
  const renderItems: RenderItem[] = [];
  const p = s.player;
  const pIso = worldToIso(p.x, p.y);
  stepBusSimulation(s.time, pIso.col, pIso.row);

  for (const prop of WORLD_PROPS) {
    if (
      prop.col + prop.footCols < minCol - 2 ||
      prop.col > maxCol + 2 ||
      prop.row + prop.footRows < minRow - 2 ||
      prop.row > maxRow + 2
    ) {
      continue;
    }
    const meta = manifest?.props[prop.id];
    const img = meta ? (prepareImage(meta[mode]) ?? prepareImage(meta.day)) : undefined;
    if (!meta || !img) continue;
    const anchor = isoToWorld(prop.col, prop.row);
    const drawX = Math.round(anchor.x - meta.ax * ART_SCALE);
    const drawY = Math.round(anchor.y - meta.ay * ART_SCALE);
    const drawW = meta.w * ART_SCALE;
    const drawH = meta.h * ART_SCALE;
    if (
      drawX + drawW < s.camera.x &&
      !prop.flipX ||
      (!prop.flipX && drawX > s.camera.x + CANVAS_W) ||
      drawY + drawH < s.camera.y ||
      drawY > s.camera.y + CANVAS_H
    ) {
      continue;
    }
    const isOverhead = prop.layer === 'overhead';
    const cMin = prop.col - 0.48;
    const cMax = prop.col + prop.footCols - 0.52;
    const rMin = prop.row - 0.48;
    const rMax = prop.row + prop.footRows - 0.52;
    renderItems.push({
      cMin,
      cMax,
      rMin,
      rMax,
      tieDepth: cMax + rMax + (isOverhead ? 0.65 : 0),
      draw: () => {
        if (prop.solid) {
          drawPropShadow(ctx, prop.col, prop.row, prop.footCols, prop.footRows);
        }
        if (prop.flipX) {
          ctx.save();
          ctx.translate(Math.round(anchor.x), 0);
          ctx.scale(-1, 1);
          ctx.drawImage(img, -meta.ax * ART_SCALE, drawY, drawW, drawH);
          ctx.restore();
        } else {
          ctx.drawImage(img, drawX, drawY, drawW, drawH);
        }
      },
    });
  }

  // Living Singapore street traffic: SBS Bus 88 with 4-frame spinning wheels & bus-stop pauses
  const busFrame = Math.floor(busSim.wheelPhase) % 4;
  const busMeta = manifest?.props[`sg_bus_f${busFrame}`] ?? manifest?.props.sg_bus;
  const busImg = busMeta ? (prepareImage(busMeta[mode]) ?? prepareImage(busMeta.day)) : undefined;
  if (busMeta && busImg) {
    const busRow = 29.0;
    const busAnchor = isoToWorld(busSim.col, busRow);
    const bounce = busSim.speed > 0.45 ? (Math.floor(busSim.wheelPhase * 1.5) % 2 === 0 ? -1 : 0) : 0;
    const drawX = Math.round(busAnchor.x - busMeta.ax * ART_SCALE);
    const drawY = Math.round(busAnchor.y - busMeta.ay * ART_SCALE + bounce);
    const drawW = busMeta.w * ART_SCALE;
    const drawH = busMeta.h * ART_SCALE;
    if (
      drawX + drawW >= s.camera.x &&
      drawX <= s.camera.x + CANVAS_W &&
      drawY + drawH >= s.camera.y &&
      drawY <= s.camera.y + CANVAS_H
    ) {
      const cMin = busSim.col - 0.48;
      const cMax = busSim.col + 4 - 0.52;
      const rMin = busRow - 0.48;
      const rMax = busRow + 1 - 0.52;
      renderItems.push({
        cMin,
        cMax,
        rMin,
        rMax,
        tieDepth: cMax + rMax,
        draw: () => {
          drawPropShadow(ctx, busSim.col, busRow, 4, 1);
          ctx.drawImage(busImg, drawX, drawY, drawW, drawH);
          // Blinking amber hazard/stop indicator while halted at Bus Stop 26019
          if (busSim.stopTimer > 0 && Math.floor(s.time * 4) % 2 === 0) {
            ctx.fillStyle = '#ffbf3f';
            ctx.fillRect(drawX + drawW - 22, drawY + drawH - 22, 5, 4);
          }
        },
      });
    }
  }

  for (const npc of s.npcs) {
    if (
      npc.x + 64 < s.camera.x ||
      npc.x - 64 > s.camera.x + CANVAS_W ||
      npc.y + 32 < s.camera.y ||
      npc.y - 160 > s.camera.y + CANVAS_H
    ) {
      continue;
    }
    const iso = worldToIso(npc.x, npc.y);
    renderItems.push({
      cMin: iso.col - 0.24,
      cMax: iso.col + 0.24,
      rMin: iso.row - 0.24,
      rMax: iso.row + 0.24,
      tieDepth: iso.col + iso.row,
      draw: () => {
        const sheet = getSheet(npc.id);
        if (!sheet) return;
        drawShadow(ctx, npc.x, npc.y);
        if (s.hoveredTarget === npc.worldKey) drawHoverRing(ctx, npc.x, npc.y);
        if (night) ctx.filter = 'brightness(0.84) saturate(0.92)';
        drawCharacter(ctx, sheet, npc.x, npc.y, npc.dir, npc.walking ? s.time * 9 : null, 2, s.time);
        ctx.filter = 'none';
      },
    });
  }

  renderItems.push({
    cMin: pIso.col - 0.24,
    cMax: pIso.col + 0.24,
    rMin: pIso.row - 0.24,
    rMax: pIso.row + 0.24,
    tieDepth: pIso.col + pIso.row,
    draw: () => {
      const sheet = getPlayerSheet(p.avatar);
      if (!sheet) return;
      drawShadow(ctx, p.x, p.y);
      if (night) ctx.filter = 'brightness(0.86) saturate(0.94)';
      drawCharacter(ctx, sheet, p.x, p.y, p.dir, p.isMoving ? p.walkPhase : null, 2, s.time);
      ctx.filter = 'none';
    },
  });

  for (const item of sortIsoItems(renderItems)) {
    item.draw();
  }

  // 4. Night Ambient Light Pools
  if (night) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (const prop of WORLD_PROPS) {
      if (!prop.light) continue;
      if (
        prop.col + prop.footCols < minCol - 2 ||
        prop.col > maxCol + 2 ||
        prop.row + prop.footRows < minRow - 2 ||
        prop.row > maxRow + 2
      ) {
        continue;
      }
      const center = isoToWorld(prop.col + (prop.footCols - 1) * 0.5, prop.row + (prop.footRows - 1) * 0.5);
      const radius = prop.id === 'sunhub_atrium' ? 165 : 135;
      const grad = ctx.createRadialGradient(center.x, center.y - 16, 8, center.x, center.y - 16, radius);
      grad.addColorStop(0, 'rgba(255, 214, 120, 0.22)');
      grad.addColorStop(1, 'rgba(255, 214, 120, 0)');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(center.x, center.y - 16, radius, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // 6. Living heartland birds (tiny white pigeons drifting over park & Blk 260)
  drawHeartlandBirds(ctx, s.camera, s.time, night);

  // 7. Player marker + NPC speech bubble + optional debug grid
  drawPlayerMarker(ctx, p.x, p.y - 132 + Math.sin(s.time * 4) * 3);

  if (s.speech) {
    const npc = s.npcs.find((n) => n.worldKey === `block260:${s.speech!.npcId}`);
    if (npc) {
      drawSpeechBubble(
        ctx,
        npc,
        s.speech.text,
        s.speech.icon,
        night,
        s.viewX ?? [s.camera.x, s.camera.x + CANVAS_W],
      );
    }
  }

  if (DEBUG) drawDebug(ctx, minCol, maxCol, minRow, maxRow);
  ctx.restore();
}

function drawFallbackDiamond(ctx: CanvasRenderingContext2D, cx: number, cy: number, color: string) {
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, cy - HALF_H);
  ctx.lineTo(cx + HALF_W, cy);
  ctx.lineTo(cx, cy + HALF_H);
  ctx.lineTo(cx - HALF_W, cy);
  ctx.closePath();
  ctx.fill();
}

function drawIsoHoverTile(ctx: CanvasRenderingContext2D, cx: number, cy: number) {
  ctx.save();
  ctx.fillStyle = 'rgba(255, 232, 130, 0.22)';
  ctx.strokeStyle = 'rgba(255, 232, 130, 0.85)';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, cy - HALF_H + 1);
  ctx.lineTo(cx + HALF_W - 2, cy);
  ctx.lineTo(cx, cy + HALF_H - 1);
  ctx.lineTo(cx - HALF_W + 2, cy);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawShadow(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.fillStyle = 'rgba(20, 14, 12, 0.28)';
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 24, 9, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPropShadow(ctx: CanvasRenderingContext2D, col: number, row: number, fc: number, fr: number) {
  const ox = 8;
  const oy = 5;
  const p0 = isoToWorld(col - 0.45, row - 0.45);
  const p1 = isoToWorld(col + fc - 0.55, row - 0.45);
  const p2 = isoToWorld(col + fc - 0.55, row + fr - 0.55);
  const p3 = isoToWorld(col - 0.45, row + fr - 0.55);
  ctx.fillStyle = 'rgba(20, 16, 14, 0.18)';
  ctx.beginPath();
  ctx.moveTo(p0.x + ox, p0.y + oy);
  ctx.lineTo(p1.x + ox, p1.y + oy);
  ctx.lineTo(p2.x + ox, p2.y + oy);
  ctx.lineTo(p3.x + ox, p3.y + oy);
  ctx.closePath();
  ctx.fill();
}

function drawHeartlandBirds(ctx: CanvasRenderingContext2D, camera: Pt, time: number, night: boolean) {
  if (night) return;
  const flocks = [
    { cx: 15, cy: 20, r: 3.5, speed: 0.42 },
    { cx: 22, cy: 24, r: 3.2, speed: 0.35 },
    { cx: 31, cy: 24, r: 3.5, speed: 0.38 },
  ];
  ctx.fillStyle = '#f8f6f0';
  for (let i = 0; i < flocks.length; i++) {
    const f = flocks[i];
    for (let b = 0; b < 3; b++) {
      const ang = time * f.speed + b * 0.8 + i * 2.1;
      const pos = isoToWorld(f.cx + Math.cos(ang) * f.r, f.cy + Math.sin(ang) * (f.r * 0.65));
      if (pos.x < camera.x - 40 || pos.x > camera.x + CANVAS_W + 40 || pos.y < camera.y - 40 || pos.y > camera.y + CANVAS_H + 40) continue;
      const flap = Math.sin(time * 11 + b * 2) > 0 ? 1 : 0;
      const bx = Math.round(pos.x);
      const by = Math.round(pos.y - 120 - b * 8);
      ctx.fillRect(bx - 3, by - flap, 2, 2);
      ctx.fillRect(bx - 1, by, 2, 2);
      ctx.fillRect(bx + 1, by - flap, 2, 2);
    }
  }
}

function drawHoverRing(ctx: CanvasRenderingContext2D, x: number, y: number) {
  ctx.strokeStyle = '#ffe066';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(x, y - 2, 32, 12, 0, 0, Math.PI * 2);
  ctx.stroke();
}

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
  const bob = Math.round(Math.sin(time * 3) * 3);

  ctx.fillStyle = 'rgba(20, 14, 12, 0.28)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 1, 18, 7, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 24, 10, 0, 0, Math.PI * 2);
  ctx.stroke();

  const img = prepareImage(ITEM_SPRITE_PATH[kind]);
  if (img) {
    const size = 36;
    ctx.drawImage(img, Math.round(p.x - size / 2), Math.round(p.y - size + 2 + bob), size, size);
  } else {
    ctx.fillStyle = '#5eb8a8';
    ctx.fillRect(p.x - 12, p.y - 20 + bob, 24, 16);
  }

  // Pixel sparkle
  ctx.fillStyle = `rgba(255, 248, 200, ${pulse})`;
  const sx = Math.round(p.x + 17);
  const sy = Math.round(p.y - 28 + bob);
  ctx.fillRect(sx - 1, sy - 6, 2, 12);
  ctx.fillRect(sx - 6, sy - 1, 12, 2);
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  npc: NPCEntity,
  text: string,
  icon: 'ezlink' | 'alert' | 'shop' | undefined,
  night: boolean,
  [viewL, viewR]: [number, number],
) {
  const boxW = 252;
  const boxH = 70;
  const tipX = npc.x - 8;
  const left = Math.round(Math.max(viewL + 8, Math.min(viewR - boxW - 8, tipX - boxW / 2)));
  const top = Math.round(npc.y - 150 - boxH);
  const fill = night ? '#dcd6ea' : '#f5efe6';
  const P = 2;

  pxBox(ctx, left, top, boxW, boxH, P * 2, INK);
  pxBox(ctx, left + P * 2, top + P * 2, boxW - P * 4, boxH - P * 4, P * 2, fill);
  ctx.fillStyle = night ? '#bdb5d1' : '#e2d6c2';
  ctx.fillRect(left + P * 3, top + boxH - P * 4, boxW - P * 6, P);

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

function pxBox(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, notch: number, color: string) {
  ctx.fillStyle = color;
  ctx.fillRect(x + notch, y, w - notch * 2, h);
  ctx.fillRect(x, y + notch, w, h - notch * 2);
}

function drawDebug(ctx: CanvasRenderingContext2D, minCol: number, maxCol: number, minRow: number, maxRow: number) {
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      const pt = isoToWorld(c, r);
      drawFallbackDiamond(
        ctx,
        pt.x,
        pt.y,
        isTileWalkable(c, r) ? 'rgba(0, 255, 120, 0.22)' : 'rgba(255, 60, 60, 0.25)',
      );
    }
  }
  ctx.strokeStyle = '#ff00ff';
  ctx.lineWidth = 2;
  const z = MINIMART_ZONE;
  ctx.strokeRect(z.x0, z.y0, z.x1 - z.x0, z.y1 - z.y0);
}
