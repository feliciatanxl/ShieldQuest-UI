import { AvatarConfig, Direction, NPCEntity, TimeOfDay } from '../types/game';

export const CANVAS_W = 1280;
export const CANVAS_H = 720;

export const TILE_W = 72;
export const TILE_H = 36;
export const HALF_W = TILE_W / 2;
export const HALF_H = TILE_H / 2;
export const ORIGIN_X = 635;
export const ORIGIN_Y = 230;

export function isoToScreen(gx: number, gy: number, z = 0): { x: number; y: number } {
  return {
    x: ORIGIN_X + (gx - gy) * HALF_W,
    y: ORIGIN_Y + (gx + gy) * HALF_H - z,
  };
}

export function screenToIso(sx: number, sy: number): { gx: number; gy: number } {
  const dx = sx - ORIGIN_X;
  const dy = sy - ORIGIN_Y;
  const gx = (dx / HALF_W + dy / HALF_H) / 2;
  const gy = (dy / HALF_H - dx / HALF_W) / 2;
  return { gx, gy };
}

export interface RenderState {
  time: number; // animation clock in seconds
  timeOfDay: TimeOfDay;
  player: {
    gx: number;
    gy: number;
    dir: Direction;
    isMoving: boolean;
    walkPhase: number;
    avatar: AvatarConfig;
  };
  npcs: NPCEntity[];
  ezLinkFound: boolean;
  ezLinkPickedUp: boolean;
  hoveredTarget: string | null;
  activeSpeechBubble: {
    npcId: string;
    text: string;
    icon?: 'ezlink' | 'alert' | 'shop';
  } | null;
  walkTargetMarker: { gx: number; gy: number; createdAt: number } | null;
}

const INK = '#231a16';

function drawIsoPoly(
  ctx: CanvasRenderingContext2D,
  pts: { x: number; y: number }[],
  fill: string,
  stroke?: string,
  lineWidth = 1.5
) {
  ctx.beginPath();
  ctx.moveTo(pts[0].x, pts[0].y);
  for (let i = 1; i < pts.length; i++) {
    ctx.lineTo(pts[i].x, pts[i].y);
  }
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  if (stroke) {
    ctx.strokeStyle = stroke;
    ctx.lineWidth = lineWidth;
    ctx.lineJoin = 'round';
    ctx.stroke();
  }
}

function drawIsoQuad(
  ctx: CanvasRenderingContext2D,
  gx1: number,
  gy1: number,
  gx2: number,
  gy2: number,
  z = 0,
  fill: string,
  stroke?: string,
  lineWidth = 1.5
) {
  const p1 = isoToScreen(gx1, gy1, z);
  const p2 = isoToScreen(gx2, gy1, z);
  const p3 = isoToScreen(gx2, gy2, z);
  const p4 = isoToScreen(gx1, gy2, z);
  drawIsoPoly(ctx, [p1, p2, p3, p4], fill, stroke, lineWidth);
}

function drawIsoBox(
  ctx: CanvasRenderingContext2D,
  gx1: number,
  gy1: number,
  gx2: number,
  gy2: number,
  zBottom: number,
  height: number,
  topColor: string,
  leftColor: string, // faces +gy (down-left)
  rightColor: string, // faces +gx (down-right)
  outline = INK,
  lineWidth = 2
) {
  const p10 = isoToScreen(gx1, gy2, zBottom);
  const p11 = isoToScreen(gx2, gy2, zBottom);
  const p01 = isoToScreen(gx2, gy1, zBottom);

  const t00 = isoToScreen(gx1, gy1, zBottom + height);
  const t10 = isoToScreen(gx1, gy2, zBottom + height);
  const t11 = isoToScreen(gx2, gy2, zBottom + height);
  const t01 = isoToScreen(gx2, gy1, zBottom + height);

  // Left visible face (+gy, facing down-left)
  drawIsoPoly(ctx, [t10, t11, p11, p10], leftColor, outline, lineWidth);
  // Right visible face (+gx, facing down-right)
  drawIsoPoly(ctx, [t11, t01, p01, p11], rightColor, outline, lineWidth);
  // Top face
  drawIsoPoly(ctx, [t00, t01, t11, t10], topColor, outline, lineWidth);
}

function drawGroundAndRoads(ctx: CanvasRenderingContext2D, isEvening: boolean) {
  // Base grass / terrain fill
  ctx.fillStyle = isEvening ? '#425b3b' : '#6f9653';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Textured grass patches on top-left & left garden bed
  drawIsoQuad(ctx, -10, -4, 4.5, 11, 0, isEvening ? '#476340' : '#769f58');
  // Slight lighter lawn streaks
  for (let i = -3; i < 8; i += 2) {
    drawIsoQuad(
      ctx,
      -5,
      i,
      1.8,
      i + 0.9,
      0,
      isEvening ? 'rgba(110,145,88,0.18)' : 'rgba(154,196,112,0.3)'
    );
  }

  // Asphalt Road (gy >= 10.6)
  drawIsoQuad(
    ctx,
    -8,
    10.7,
    22,
    22,
    0,
    isEvening ? '#393f4b' : '#4a4e57',
    INK,
    2
  );

  // Road curb & gutter along gy = 10.4 .. 10.7
  drawIsoQuad(
    ctx,
    -6,
    10.4,
    20,
    10.72,
    0,
    isEvening ? '#6d6f74' : '#969692',
    INK,
    1.5
  );

  // Double Yellow Road Lines & Bus Bay Markings
  const lineColor = isEvening ? '#bfa042' : '#e6be4c';
  drawIsoQuad(ctx, -3, 10.85, 16, 10.97, 0, lineColor);
  drawIsoQuad(ctx, -3, 11.06, 16, 11.18, 0, lineColor);

  // Bus Bay Box outline
  const b1 = isoToScreen(4.0, 11.55);
  const b2 = isoToScreen(11.0, 11.55);
  const b3 = isoToScreen(11.0, 14.3);
  const b4 = isoToScreen(4.0, 14.3);
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 4;
  ctx.setLineDash([16, 12]);
  ctx.beginPath();
  ctx.moveTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(b3.x, b3.y);
  ctx.lineTo(b4.x, b4.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Isometric "BUS" road text
  const busAnchor = isoToScreen(6.8, 13.0);
  ctx.save();
  ctx.translate(busAnchor.x, busAnchor.y);
  ctx.transform(0.89, 0.445, -0.89, 0.445, 0, 0); // 2:1 isometric plane matrix!
  ctx.fillStyle = isEvening ? 'rgba(208, 169, 66, 0.85)' : 'rgba(235, 195, 76, 0.9)';
  ctx.font = 'bold 48px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUS', 0, 0);
  ctx.restore();

  // Storm drain grate near curb
  const drain1 = isoToScreen(8.2, 10.95);
  const drain2 = isoToScreen(9.1, 10.95);
  const drain3 = isoToScreen(9.1, 11.35);
  const drain4 = isoToScreen(8.2, 11.35);
  drawIsoPoly(ctx, [drain1, drain2, drain3, drain4], '#2b2f38', INK, 1.5);
  for (let d = 8.35; d < 9.0; d += 0.18) {
    const g1 = isoToScreen(d, 10.98);
    const g2 = isoToScreen(d, 11.32);
    ctx.strokeStyle = '#5d6575';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(g1.x, g1.y);
    ctx.lineTo(g2.x, g2.y);
    ctx.stroke();
  }

  // Footpath concrete pavement (gy = 4.9 .. 10.4, gx = -3 .. 22)
  drawIsoQuad(
    ctx,
    -3,
    4.9,
    22,
    10.4,
    0,
    isEvening ? '#8b8a87' : '#bcb5a6',
    INK,
    2
  );

  // Subtle paving joints along footpath
  ctx.strokeStyle = isEvening ? 'rgba(40,40,48,0.28)' : 'rgba(90,82,70,0.24)';
  ctx.lineWidth = 1;
  for (let gx = -2; gx <= 21; gx += 2.2) {
    const s1 = isoToScreen(gx, 5.0);
    const s2 = isoToScreen(gx, 10.35);
    ctx.beginPath();
    ctx.moveTo(s1.x, s1.y);
    ctx.lineTo(s2.x, s2.y);
    ctx.stroke();
  }

  // Grass verge along left side of footpath (gx = -3 .. 2.2, gy = 6.2 .. 10.3)
  drawIsoQuad(
    ctx,
    -3.5,
    6.4,
    2.6,
    10.3,
    0,
    isEvening ? '#496641' : '#77a059',
    INK,
    1.5
  );

  // Sheltered Walkway ground slab (running up-right gy = -3.8 .. 5.2, gx = 1.2 .. 4.7)
  drawIsoQuad(
    ctx,
    1.2,
    -3.8,
    4.7,
    5.4,
    0,
    isEvening ? '#98948c' : '#cbc4b5',
    INK,
    1.5
  );

  // Yellow Tactile Paving Strip near crosswalk/bus bay
  drawIsoQuad(
    ctx,
    3.5,
    9.2,
    5.4,
    10.1,
    0,
    isEvening ? '#cfa844' : '#edc54f',
    '#856623',
    1.5
  );
  // Tactile dots
  ctx.fillStyle = isEvening ? '#9c7826' : '#bd952b';
  for (let tx = 3.7; tx <= 5.25; tx += 0.25) {
    for (let ty = 9.35; ty <= 9.95; ty += 0.22) {
      const p = isoToScreen(tx, ty);
      ctx.fillRect(p.x - 1.5, p.y - 1, 3, 2);
    }
  }

  // Void Deck Concrete Floor (gx = 6.0 .. 14.3, gy = 1.3 .. 4.95)
  drawIsoQuad(
    ctx,
    6.0,
    1.3,
    14.3,
    4.95,
    0,
    isEvening ? '#999289' : '#cbc1b1',
    INK,
    1.5
  );

  // Sunshine Minimart Interior Floor (gx = 14.3 .. 21.5, gy = 1.3 .. 5.2)
  drawIsoQuad(
    ctx,
    14.3,
    1.3,
    21.5,
    5.2,
    0,
    isEvening ? '#bfb5a2' : '#dfd4be',
    INK,
    1.5
  );

  // Checkered subtle minimart tile lines
  ctx.strokeStyle = 'rgba(110,95,78,0.22)';
  ctx.lineWidth = 1;
  for (let mx = 15; mx <= 20; mx += 1) {
    const a = isoToScreen(mx, 1.4);
    const b = isoToScreen(mx, 5.1);
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  }
}

function drawMosaicPillar(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  height: number,
  isEvening: boolean
) {
  const w = 0.62;
  const x1 = gx - w / 2;
  const x2 = gx + w / 2;
  const y1 = gy - w / 2;
  const y2 = gy + w / 2;

  const upperLeft = isEvening ? '#a79e95' : '#dad1c2';
  const upperRight = isEvening ? '#8d857e' : '#bfb5a6';

  // Upper column body
  drawIsoBox(ctx, x1, y1, x2, y2, 0, height, upperLeft, upperLeft, upperRight, INK, 2);

  // Classic Singapore HDB mosaic/terrazzo tiled skirt (bottom ~58px!)
  const tileBaseH = 56;
  const rows = 5;
  const cols = 3;
  const tileColors = ['#c96f4b', '#568d8c', '#d8b482', '#9e624d', '#75a39e'];

  // Left face tiles
  const bl1 = isoToScreen(x1, y2, 0);
  const bl2 = isoToScreen(x2, y2, 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u0 = c / cols;
      const u1 = (c + 1) / cols;
      const z0 = (r / rows) * tileBaseH;
      const z1 = ((r + 1) / rows) * tileBaseH;
      const p00 = { x: bl1.x + (bl2.x - bl1.x) * u0, y: bl1.y + (bl2.y - bl1.y) * u0 - z0 };
      const p10 = { x: bl1.x + (bl2.x - bl1.x) * u1, y: bl1.y + (bl2.y - bl1.y) * u1 - z0 };
      const p11 = { x: p10.x, y: p10.y - (z1 - z0) };
      const p01 = { x: p00.x, y: p00.y - (z1 - z0) };
      const color = tileColors[(r * 2 + c) % tileColors.length];
      drawIsoPoly(ctx, [p00, p10, p11, p01], color, INK, 0.9);
    }
  }

  // Right face tiles
  const br1 = isoToScreen(x2, y2, 0);
  const br2 = isoToScreen(x2, y1, 0);
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const u0 = c / cols;
      const u1 = (c + 1) / cols;
      const z0 = (r / rows) * tileBaseH;
      const z1 = ((r + 1) / rows) * tileBaseH;
      const p00 = { x: br1.x + (br2.x - br1.x) * u0, y: br1.y + (br2.y - br1.y) * u0 - z0 };
      const p10 = { x: br1.x + (br2.x - br1.x) * u1, y: br1.y + (br2.y - br1.y) * u1 - z0 };
      const p11 = { x: p10.x, y: p10.y - (z1 - z0) };
      const p01 = { x: p00.x, y: p00.y - (z1 - z0) };
      const color = tileColors[(r * 3 + c + 1) % tileColors.length];
      drawIsoPoly(ctx, [p00, p10, p11, p01], color, INK, 0.9);
    }
  }
}

function drawNoSmokingSign(ctx: CanvasRenderingContext2D, gx: number, gy: number, z: number) {
  const p1 = isoToScreen(gx - 0.18, gy + 0.34, z);
  const p2 = isoToScreen(gx + 0.18, gy + 0.34, z);
  const p3 = { x: p2.x, y: p2.y - 28 };
  const p4 = { x: p1.x, y: p1.y - 28 };
  drawIsoPoly(ctx, [p1, p2, p3, p4], '#f7f4ec', INK, 1.5);
  const cx = (p1.x + p3.x) / 2;
  const cy = (p1.y + p3.y) / 2 - 3;
  ctx.strokeStyle = '#d1433b';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.arc(cx, cy, 5.5, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx - 4, cy - 3);
  ctx.lineTo(cx + 4, cy + 3);
  ctx.stroke();
}

function drawVoidDeckBackdropAndMinimart(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  const voidHeight = 198;

  // Void Deck Back Wall (gy = 2.0, gx = 6.0 .. 23.5)
  const wBottomL = isoToScreen(6.0, 2.0, 0);
  const wBottomR = isoToScreen(23.5, 2.0, 0);
  const wTopR = isoToScreen(23.5, 2.0, voidHeight);
  const wTopL = isoToScreen(6.0, 2.0, voidHeight);
  drawIsoPoly(
    ctx,
    [wBottomL, wBottomR, wTopR, wTopL],
    isEvening ? '#877f78' : '#cec4b3',
    INK,
    2
  );

  // Left interior wall of Void Deck (gx = 6.0, gy = 2.0 .. 4.8)
  const lwB1 = isoToScreen(6.0, 2.0, 0);
  const lwB2 = isoToScreen(6.0, 4.8, 0);
  const lwT2 = isoToScreen(6.0, 4.8, voidHeight);
  const lwT1 = isoToScreen(6.0, 2.0, voidHeight);
  drawIsoPoly(
    ctx,
    [lwB1, lwB2, lwT2, lwT1],
    isEvening ? '#78716c' : '#bdb3a2',
    INK,
    2
  );

  // Silver HDB Letterbox Bank against left interior wall (gx = 6.08 .. 6.45, gy = 2.15 .. 4.1)
  drawIsoBox(
    ctx,
    6.08,
    2.15,
    6.45,
    4.1,
    0,
    82,
    isEvening ? '#98a0ab' : '#c0c7cf',
    isEvening ? '#767f8c' : '#9ca5b0',
    isEvening ? '#87919e' : '#aeb6c1',
    INK,
    2
  );
  // Letterbox grid slots on right face (facing +gx)
  const lbB = isoToScreen(6.45, 4.05, 8);
  const lbT = isoToScreen(6.45, 2.2, 8);
  const cols = 4;
  const rows = 4;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const u0 = c / cols + 0.03;
      const u1 = (c + 1) / cols - 0.03;
      const z0 = r * 16 + 4;
      const z1 = (r + 1) * 16;
      const p1 = { x: lbB.x + (lbT.x - lbB.x) * u0, y: lbB.y + (lbT.y - lbB.y) * u0 - z0 };
      const p2 = { x: lbB.x + (lbT.x - lbB.x) * u1, y: lbB.y + (lbT.y - lbB.y) * u1 - z0 };
      const p3 = { x: p2.x, y: p2.y - (z1 - z0) };
      const p4 = { x: p1.x, y: p1.y - (z1 - z0) };
      drawIsoPoly(ctx, [p1, p2, p3, p4], isEvening ? '#a8b0ba' : '#ced4dc', '#4b525c', 1);
      ctx.strokeStyle = '#383e47';
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(p4.x + 3, p4.y + 4);
      ctx.lineTo(p3.x - 3, p3.y + 4);
      ctx.stroke();
    }
  }

  // Cork Community Notice Board on back wall (gx = 8.4 .. 11.9, gy = 2.06, z = 26 .. 82)
  const nb1 = isoToScreen(8.4, 2.06, 26);
  const nb2 = isoToScreen(11.9, 2.06, 26);
  const nb3 = isoToScreen(11.9, 2.06, 82);
  const nb4 = isoToScreen(8.4, 2.06, 82);
  drawIsoPoly(ctx, [nb1, nb2, nb3, nb4], '#8f5b34', INK, 2);
  const nc1 = isoToScreen(8.6, 2.07, 30);
  const nc2 = isoToScreen(11.7, 2.07, 30);
  const nc3 = isoToScreen(11.7, 2.07, 78);
  const nc4 = isoToScreen(8.6, 2.07, 78);
  drawIsoPoly(ctx, [nc1, nc2, nc3, nc4], isEvening ? '#b88c52' : '#cf9f63', INK, 1.5);

  const flyers = [
    { x1: 8.8, x2: 9.35, z1: 56, z2: 74, col: '#f2e8cf' },
    { x1: 9.55, x2: 10.15, z1: 54, z2: 73, col: '#95d5b2' },
    { x1: 10.35, x2: 10.95, z1: 55, z2: 74, col: '#f7d67e' },
    { x1: 11.1, x2: 11.55, z1: 53, z2: 72, col: '#f4a28c' },
    { x1: 9.0, x2: 9.65, z1: 34, z2: 50, col: '#ffd166' },
    { x1: 9.85, x2: 10.5, z1: 35, z2: 49, col: '#a8dadc' },
    { x1: 10.7, x2: 11.35, z1: 34, z2: 49, col: '#f4efe6' },
  ];
  flyers.forEach((f) => {
    const f1 = isoToScreen(f.x1, 2.09, f.z1);
    const f2 = isoToScreen(f.x2, 2.09, f.z1);
    const f3 = isoToScreen(f.x2, 2.09, f.z2);
    const f4 = isoToScreen(f.x1, 2.09, f.z2);
    drawIsoPoly(ctx, [f1, f2, f3, f4], f.col, '#3d2c1e', 1);
  });

  if (isEvening) {
    const glowCenter = isoToScreen(10.5, 2.8, 70);
    const grad = ctx.createRadialGradient(
      glowCenter.x,
      glowCenter.y,
      10,
      glowCenter.x,
      glowCenter.y,
      230
    );
    grad.addColorStop(0, 'rgba(255, 214, 128, 0.35)');
    grad.addColorStop(1, 'rgba(255, 214, 128, 0)');
    ctx.fillStyle = grad;
    ctx.fillRect(620, 210, 660, 480);
  }

  // Void Deck Corner Trash / Crate near pillar (gx = 13.5, gy = 4.1)
  drawIsoBox(ctx, 13.3, 3.85, 13.9, 4.4, 0, 28, '#55606e', '#3d4552', '#2e3540', INK, 1.8);

  // SUNSHINE MINIMART INTERIOR (gx = 14.4 .. 20.5, gy = 2.05 .. 4.7)
  // Glass-door illuminated Chiller Fridge (gx = 14.9 .. 16.6, gy = 2.1 .. 2.85)
  drawIsoBox(
    ctx,
    14.9,
    2.1,
    16.6,
    2.85,
    0,
    92,
    '#7b8899',
    '#4a5568',
    '#343d4b',
    INK,
    2
  );
  const fr1 = isoToScreen(15.02, 2.86, 10);
  const fr2 = isoToScreen(16.48, 2.86, 10);
  const fr3 = isoToScreen(16.48, 2.86, 84);
  const fr4 = isoToScreen(15.02, 2.86, 84);
  drawIsoPoly(ctx, [fr1, fr2, fr3, fr4], isEvening ? '#e8f5ff' : '#d2e9f7', INK, 1.5);
  const shelfCols = ['#d9534f', '#5cb85c', '#f0ad4e', '#428bca', '#e8836b'];
  for (let row = 0; row < 4; row++) {
    const zShelf = 20 + row * 17;
    const sL = isoToScreen(15.08, 2.87, zShelf);
    const sR = isoToScreen(16.42, 2.87, zShelf);
    ctx.strokeStyle = '#3f5366';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sL.x, sL.y);
    ctx.lineTo(sR.x, sR.y);
    ctx.stroke();
    for (let c = 0; c < 5; c++) {
      const u = (c + 0.5) / 5;
      const cx = sL.x + (sR.x - sL.x) * u;
      const cy = sL.y + (sR.y - sL.y) * u;
      ctx.fillStyle = shelfCols[(row + c) % shelfCols.length];
      ctx.fillRect(cx - 4, cy - 11, 8, 10);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.strokeRect(cx - 4, cy - 11, 8, 10);
    }
  }

  // Cardboard box on top of chiller
  drawIsoBox(ctx, 15.1, 2.15, 16.0, 2.75, 92, 16, '#d4a66a', '#b8884d', '#996e3a', INK, 1.5);

  // Stacked Blue & Green Drink Crates inside minimart entrance
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 0, 17, '#4c77b8', '#395d96', '#2b4775', INK, 1.5);
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 17, 17, '#539e66', '#3d7d4d', '#2e613b', INK, 1.5);
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 34, 17, '#4c77b8', '#395d96', '#2b4775', INK, 1.5);

  // Minimart Snack Shelves along back wall (cleanly inside 16.85 .. 19.15!)
  drawIsoBox(ctx, 16.85, 2.1, 19.15, 2.8, 0, 86, '#c78a4e', '#a36b36', '#7d5026', INK, 2);
  for (let row = 0; row < 4; row++) {
    const zR = 14 + row * 17;
    for (let s = 0; s < 4; s++) {
      const gxPos = 17.1 + s * 0.52;
      const p = isoToScreen(gxPos, 2.82, zR);
      ctx.fillStyle = shelfCols[(row * 2 + s) % shelfCols.length];
      ctx.fillRect(p.x - 5, p.y - 11, 10, 11);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1;
      ctx.strokeRect(p.x - 5, p.y - 11, 10, 11);
    }
  }

  // Front "SNACKS" Chip Rack (gx = 17.3 .. 19.0, gy = 3.3 .. 3.95)
  drawIsoBox(ctx, 17.3, 3.3, 19.0, 3.95, 0, 42, '#e0a94f', '#c78834', '#9e6821', INK, 1.8);
  const snackSignPos = isoToScreen(18.15, 4.0, 40);
  ctx.save();
  ctx.translate(snackSignPos.x, snackSignPos.y);
  ctx.transform(0.89, 0.445, 0, 1, 0, 0);
  ctx.fillStyle = '#f5d76e';
  ctx.fillRect(-20, -9, 40, 14);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.strokeRect(-20, -9, 40, 14);
  ctx.fillStyle = '#a33327';
  ctx.font = 'bold 9px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('SNACKS', 0, 1);
  ctx.restore();

  if (isEvening) {
    const mg = isoToScreen(17.3, 3.1, 45);
    const mGrad = ctx.createRadialGradient(mg.x, mg.y, 15, mg.x, mg.y, 175);
    mGrad.addColorStop(0, 'rgba(255, 226, 150, 0.34)');
    mGrad.addColorStop(1, 'rgba(255, 226, 150, 0)');
    ctx.fillStyle = mGrad;
    ctx.fillRect(mg.x - 185, mg.y - 155, 370, 310);
  }
  void time;
}

function drawHDBUpperBuilding(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean
) {
  // Upper HDB Block Facade resting cleanly above tall Void Deck (z = 198 .. 560)
  const wallBaseZ = 198;
  const wallTopZ = 560;

  // Front wall face (facing down-left, +gy), extending past right viewport edge
  const f1 = isoToScreen(6.0, 4.8, wallBaseZ);
  const f2 = isoToScreen(24.0, 4.8, wallBaseZ);
  const f3 = isoToScreen(24.0, 4.8, wallTopZ);
  const f4 = isoToScreen(6.0, 4.8, wallTopZ);
  drawIsoPoly(ctx, [f1, f2, f3, f4], isEvening ? '#b7afa7' : '#eae2d6', INK, 2);

  // Horizontal Terracotta Orange & Slate Blue HDB floor bands on front wall
  const floorBand1 = [
    isoToScreen(6.0, 4.82, 198),
    isoToScreen(24.0, 4.82, 198),
    isoToScreen(24.0, 4.82, 220),
    isoToScreen(6.0, 4.82, 220),
  ];
  drawIsoPoly(ctx, floorBand1, isEvening ? '#875742' : '#c97855', INK, 1.5);

  const floorBand2 = [
    isoToScreen(6.0, 4.82, 330),
    isoToScreen(24.0, 4.82, 330),
    isoToScreen(24.0, 4.82, 354),
    isoToScreen(6.0, 4.82, 354),
  ];
  drawIsoPoly(ctx, floorBand2, isEvening ? '#476484' : '#5e88b5', INK, 1.5);

  const drawCorridorBay = (gxStart: number, gxEnd: number, zLow: number, zHigh: number, accentCol: string) => {
    const r1 = isoToScreen(gxStart, 4.82, zLow);
    const r2 = isoToScreen(gxEnd, 4.82, zLow);
    const r3 = isoToScreen(gxEnd, 4.82, zHigh);
    const r4 = isoToScreen(gxStart, 4.82, zHigh);
    drawIsoPoly(ctx, [r1, r2, r3, r4], isEvening ? '#523b32' : '#7a6357', INK, 2);

    const w1 = isoToScreen(gxStart + 0.5, 4.83, zLow + 22);
    const w2 = isoToScreen(gxStart + 1.7, 4.83, zLow + 22);
    const w3 = isoToScreen(gxStart + 1.7, 4.83, zHigh - 12);
    const w4 = isoToScreen(gxStart + 0.5, 4.83, zHigh - 12);
    drawIsoPoly(
      ctx,
      [w1, w2, w3, w4],
      isEvening ? '#ffcb5c' : '#8da3b8',
      INK,
      1.5
    );

    const w21 = isoToScreen(gxStart + 2.1, 4.83, zLow + 26);
    const w22 = isoToScreen(gxEnd - 0.3, 4.83, zLow + 26);
    const w23 = isoToScreen(gxEnd - 0.3, 4.83, zHigh - 14);
    const w24 = isoToScreen(gxStart + 2.1, 4.83, zHigh - 14);
    drawIsoPoly(
      ctx,
      [w21, w22, w23, w24],
      isEvening ? '#ffd978' : '#7d93a8',
      INK,
      1.5
    );

    const b1 = isoToScreen(gxStart, 4.84, zLow);
    const b2 = isoToScreen(gxEnd, 4.84, zLow);
    const b3 = isoToScreen(gxEnd, 4.84, zLow + 32);
    const b4 = isoToScreen(gxStart, 4.84, zLow + 32);
    drawIsoPoly(ctx, [b1, b2, b3, b4], accentCol, INK, 1.8);

    const m1 = isoToScreen(gxStart, 4.84, zLow + 42);
    const m2 = isoToScreen(gxEnd, 4.84, zLow + 42);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(m1.x, m1.y);
    ctx.lineTo(m2.x, m2.y);
    ctx.stroke();

    const poleBase = isoToScreen(gxStart + 1.6, 4.84, zLow + 26);
    const poleTip = { x: poleBase.x - 42, y: poleBase.y + 18 };
    ctx.strokeStyle = '#a37b4b';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(poleBase.x, poleBase.y);
    ctx.lineTo(poleTip.x, poleTip.y);
    ctx.stroke();

    const shirtColors = ['#d96459', '#f2e8cf', '#4f7cac', '#e8b954'];
    for (let k = 0; k < 3; k++) {
      const t = 0.25 + k * 0.28;
      const hx = poleBase.x + (poleTip.x - poleBase.x) * t;
      const hy = poleBase.y + (poleTip.y - poleBase.y) * t;
      ctx.fillStyle = shirtColors[(Math.floor(gxStart) + k) % shirtColors.length];
      ctx.strokeStyle = INK;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.rect(hx - 6, hy + 1, 12, k === 2 ? 18 : 14);
      ctx.fill();
      ctx.stroke();
    }
  };

  drawCorridorBay(7.8, 11.2, 230, 326, isEvening ? '#46688a' : '#5c87b5');
  drawCorridorBay(12.0, 15.4, 230, 326, isEvening ? '#a35e45' : '#cf7c59');
  drawCorridorBay(16.2, 19.6, 230, 326, isEvening ? '#46688a' : '#5c87b5');

  drawCorridorBay(6.6, 10.0, 364, 458, isEvening ? '#9b5a42' : '#c97855');
  drawCorridorBay(11.0, 14.4, 364, 458, isEvening ? '#46688a' : '#5c87b5');
  drawCorridorBay(15.4, 18.8, 364, 458, isEvening ? '#9b5a42' : '#c97855');

  // Crisp end-wing staircase window on the left side of the front facade (gx = 6.2..7.3, z = 240..305)
  const ew1 = isoToScreen(6.25, 4.83, 240);
  const ew2 = isoToScreen(7.35, 4.83, 240);
  const ew3 = isoToScreen(7.35, 4.83, 305);
  const ew4 = isoToScreen(6.25, 4.83, 305);
  drawIsoPoly(ctx, [ew1, ew2, ew3, ew4], isEvening ? '#678099' : '#8aa2b8', INK, 2);

  // SUNSHINE MINIMART YELLOW SIGNBOARD (cleanly under HDB floor beam z = 148 .. 190)
  const s1 = isoToScreen(14.3, 4.88, 146);
  const s2 = isoToScreen(22.2, 4.88, 146);
  const s3 = isoToScreen(22.2, 4.88, 186);
  const s4 = isoToScreen(14.3, 4.88, 186);
  drawIsoPoly(ctx, [s1, s2, s3, s4], isEvening ? '#f2d36b' : '#f7e17c', INK, 2);
  const sg1 = isoToScreen(14.3, 4.88, 139);
  const sg2 = isoToScreen(22.2, 4.88, 139);
  drawIsoPoly(ctx, [sg1, sg2, s2, s1], '#4d8f58', INK, 1.5);

  const signMid = isoToScreen(17.55, 4.9, 165);
  ctx.save();
  ctx.translate(signMid.x, signMid.y);
  ctx.transform(0.89, 0.445, 0, 1, 0, 0);
  ctx.fillStyle = '#cf4928';
  ctx.font = 'bold 22px "Fredoka", sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('Sunshine Minimart', 0, 0);
  ctx.restore();
}

function drawShelteredWalkway(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  // Sheltered walkway runs along gy = -3.8 .. 5.1, width gx = 1.2 .. 4.6 (tucked cleanly beside HDB left wall!)
  const pillarGys = [4.9, 2.3, -0.3, -2.9];
  for (const gy of pillarGys) {
    // Left pillar
    drawIsoBox(
      ctx,
      1.28,
      gy - 0.14,
      1.56,
      gy + 0.14,
      0,
      124,
      '#c7c2b8',
      '#b5afa4',
      '#999288',
      INK,
      1.8
    );
    drawIsoBox(
      ctx,
      1.22,
      gy - 0.2,
      1.62,
      gy + 0.2,
      0,
      12,
      '#aba498',
      '#948e82',
      '#7d776d',
      INK,
      1.5
    );
    // Right pillar
    drawIsoBox(
      ctx,
      4.26,
      gy - 0.14,
      4.54,
      gy + 0.14,
      0,
      124,
      '#c7c2b8',
      '#b5afa4',
      '#999288',
      INK,
      1.8
    );
    drawIsoBox(
      ctx,
      4.2,
      gy - 0.2,
      4.6,
      gy + 0.2,
      0,
      12,
      '#aba498',
      '#948e82',
      '#7d776d',
      INK,
      1.5
    );
  }

  // Curved corrugated awning roof (gx = 0.95 .. 4.9, gy = -4.0 .. 5.2)
  const ridgeGx = 2.92;
  const zEave = 124;
  const zRidge = 154;

  // Front arch fascia (at gy = 5.2)
  const fl = isoToScreen(0.95, 5.2, zEave);
  const fr = isoToScreen(4.9, 5.2, zEave);
  const fMid = isoToScreen(ridgeGx, 5.2, zRidge);
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.quadraticCurveTo(fMid.x, fMid.y - 14, fr.x, fr.y);
  ctx.lineTo(fr.x, fr.y + 8);
  ctx.quadraticCurveTo(fMid.x, fMid.y - 6, fl.x, fl.y + 8);
  ctx.closePath();
  ctx.fillStyle = isEvening ? '#87837b' : '#c7c1b3';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Roof slopes running from gy = 5.2 up-right to gy = -4.0
  const bl = isoToScreen(0.95, -4.0, zEave);
  const br = isoToScreen(4.9, -4.0, zEave);
  const bMid = isoToScreen(ridgeGx, -4.0, zRidge);

  drawIsoPoly(
    ctx,
    [fl, fMid, bMid, bl],
    isEvening ? '#767a84' : '#a9a499',
    INK,
    2
  );
  drawIsoPoly(
    ctx,
    [fMid, fr, br, bMid],
    isEvening ? '#5e626d' : '#948f85',
    INK,
    2
  );

  // Corrugated roof ribs
  ctx.strokeStyle = isEvening ? 'rgba(30,30,36,0.45)' : 'rgba(55,50,44,0.35)';
  ctx.lineWidth = 1.5;
  for (let gy = 4.6; gy >= -3.6; gy -= 0.75) {
    const rl = isoToScreen(1.0, gy, zEave);
    const rm = isoToScreen(ridgeGx, gy, zRidge);
    const rr = isoToScreen(4.85, gy, zEave);
    ctx.beginPath();
    ctx.moveTo(rl.x, rl.y);
    ctx.lineTo(rm.x, rm.y);
    ctx.lineTo(rr.x, rr.y);
    ctx.stroke();
  }

  // Evening cozy fairy / string lights under the sheltered walkway!
  if (isEvening) {
    for (let i = 0; i < 8; i++) {
      const gy = 4.6 - i * 1.1;
      const bulb = isoToScreen(4.35, gy, 118);
      const twinkle = 0.75 + 0.25 * Math.sin(time * 3 + i * 1.3);
      const g = ctx.createRadialGradient(bulb.x, bulb.y, 1, bulb.x, bulb.y, 18);
      g.addColorStop(0, `rgba(255, 224, 130, ${0.85 * twinkle})`);
      g.addColorStop(1, 'rgba(255, 224, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, 18, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff2b2';
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, 2.8, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawTree(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  scale: number,
  isEvening: boolean,
  time: number
) {
  const base = isoToScreen(gx, gy, 0);
  const sway = Math.sin(time * 1.5 + gx) * 2;

  // Ground shadow
  ctx.fillStyle = isEvening ? 'rgba(18,22,30,0.38)' : 'rgba(40,48,28,0.28)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y + 4, 48 * scale, 22 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk & branches
  ctx.fillStyle = isEvening ? '#523a29' : '#734f35';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(base.x - 14 * scale, base.y + 2);
  ctx.quadraticCurveTo(base.x - 8 * scale, base.y - 60 * scale, base.x - 32 * scale, base.y - 110 * scale);
  ctx.lineTo(base.x - 18 * scale, base.y - 116 * scale);
  ctx.lineTo(base.x, base.y - 82 * scale);
  ctx.lineTo(base.x + 28 * scale, base.y - 115 * scale);
  ctx.lineTo(base.x + 36 * scale, base.y - 104 * scale);
  ctx.quadraticCurveTo(base.x + 12 * scale, base.y - 56 * scale, base.x + 16 * scale, base.y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Layered lush pixel-style canopy clusters
  const darkLeaf = isEvening ? '#2b4a33' : '#4a7337';
  const midLeaf = isEvening ? '#3c6340' : '#6b9c46';
  const lightLeaf = isEvening ? '#4e7d4b' : '#8ec25b';

  const clusters = [
    { dx: -52, dy: -115, r: 44 },
    { dx: 52, dy: -112, r: 42 },
    { dx: -25, dy: -158, r: 48 },
    { dx: 34, dy: -152, r: 45 },
    { dx: 0, dy: -125, r: 52 },
    { dx: 2, dy: -182, r: 42 },
  ];

  clusters.forEach((c) => {
    const cx = base.x + c.dx * scale + sway * 0.4;
    const cy = base.y + c.dy * scale;
    const r = c.r * scale;
    ctx.fillStyle = darkLeaf;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = midLeaf;
    ctx.beginPath();
    ctx.arc(cx - r * 0.08, cy - r * 0.14, r * 0.82, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lightLeaf;
    ctx.beginPath();
    ctx.arc(cx - r * 0.18, cy - r * 0.3, r * 0.48, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawPottedFern(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const p = isoToScreen(gx, gy, 0);
  // Terracotta pot
  ctx.fillStyle = isEvening ? '#8f4f32' : '#c26b42';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(p.x - 16, p.y - 24);
  ctx.lineTo(p.x + 16, p.y - 24);
  ctx.lineTo(p.x + 11, p.y);
  ctx.lineTo(p.x - 11, p.y);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  // Fern fronds
  const leafColor = isEvening ? '#466e3d' : '#71a64b';
  for (let a = -2; a <= 2; a++) {
    ctx.save();
    ctx.translate(p.x, p.y - 24);
    ctx.rotate(a * 0.42);
    ctx.fillStyle = leafColor;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(0, -18, 6, 18, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  }
}

function drawStreetlamp(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const base = isoToScreen(gx, gy, 0);
  // Lamp pole
  ctx.fillStyle = isEvening ? '#4b5059' : '#6c727d';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(base.x - 3, base.y - 140, 6, 140);
  ctx.strokeRect(base.x - 3, base.y - 140, 6, 140);

  // Curved arm + lamp head
  ctx.beginPath();
  ctx.moveTo(base.x, base.y - 140);
  ctx.quadraticCurveTo(base.x - 12, base.y - 155, base.x - 28, base.y - 144);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.stroke();

  // Lantern bulb
  const bulbX = base.x - 28;
  const bulbY = base.y - 140;
  if (isEvening) {
    const g = ctx.createRadialGradient(bulbX, bulbY + 12, 4, bulbX, bulbY + 35, 110);
    g.addColorStop(0, 'rgba(255, 224, 130, 0.55)');
    g.addColorStop(1, 'rgba(255, 224, 130, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(bulbX, bulbY + 35, 110, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = isEvening ? '#ffe680' : '#d8dde3';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(bulbX, bulbY, 10, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();
}

function drawFootpathLamp(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const base = isoToScreen(gx, gy, 0);
  ctx.fillStyle = '#40454f';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(base.x - 3, base.y - 84, 6, 84);
  ctx.strokeRect(base.x - 3, base.y - 84, 6, 84);

  // Classic heritage garden lamp top
  const lx = base.x;
  const ly = base.y - 94;
  if (isEvening) {
    const g = ctx.createRadialGradient(lx, ly, 4, lx, ly + 15, 78);
    g.addColorStop(0, 'rgba(255, 214, 110, 0.52)');
    g.addColorStop(1, 'rgba(255, 214, 110, 0)');
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(lx, ly + 15, 78, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.fillStyle = isEvening ? '#ffe073' : '#dde4eb';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(lx - 9, ly - 10);
  ctx.lineTo(lx + 9, ly - 10);
  ctx.lineTo(lx + 6, ly + 8);
  ctx.lineTo(lx - 6, ly + 8);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
}

function drawPedestrianRailing(ctx: CanvasRenderingContext2D, isEvening: boolean) {
  // Runs along gy = 10.15, gx = 5.4 .. 15.0
  const gxStart = 5.4;
  const gxEnd = 15.0;
  const gy = 10.15;
  const h = 38;
  const railColor = isEvening ? '#767d87' : '#a4aab3';

  const pStartB = isoToScreen(gxStart, gy, 0);
  const pEndB = isoToScreen(gxEnd, gy, 0);
  const pStartT = isoToScreen(gxStart, gy, h);
  const pEndT = isoToScreen(gxEnd, gy, h);
  const pStartM = isoToScreen(gxStart, gy, h * 0.55);
  const pEndM = isoToScreen(gxEnd, gy, h * 0.55);

  // Vertical bars
  for (let gx = gxStart; gx <= gxEnd; gx += 0.48) {
    const pb = isoToScreen(gx, gy, 0);
    const pt = isoToScreen(gx, gy, h);
    ctx.strokeStyle = INK;
    ctx.lineWidth = 4.5;
    ctx.beginPath();
    ctx.moveTo(pb.x, pb.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(pb.x, pb.y);
    ctx.lineTo(pt.x, pt.y);
    ctx.stroke();
  }

  // Horizontal rails (mid and top)
  [
    [pStartM, pEndM],
    [pStartT, pEndT],
  ].forEach(([a, b]) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = railColor;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });
  void pStartB;
  void pEndB;
}

function drawRecyclingBin(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  drawIsoBox(
    ctx,
    gx - 0.34,
    gy - 0.34,
    gx + 0.34,
    gy + 0.34,
    0,
    46,
    isEvening ? '#3c804e' : '#53a667',
    isEvening ? '#316b40' : '#448f56',
    isEvening ? '#265432' : '#357344',
    INK,
    2
  );
  // Slanted lid top
  drawIsoBox(
    ctx,
    gx - 0.36,
    gy - 0.36,
    gx + 0.36,
    gy + 0.36,
    46,
    7,
    isEvening ? '#49945d' : '#63ba78',
    isEvening ? '#39784a' : '#4e9e61',
    isEvening ? '#2c5e3a' : '#3d804d',
    INK,
    1.8
  );
  // White recycling triangle icon on left face
  const c = isoToScreen(gx, gy + 0.36, 24);
  ctx.fillStyle = '#e9f2ea';
  ctx.fillRect(c.x - 4, c.y - 4, 8, 8);
}

function drawStoneTableAndStools(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const stoneTop = isEvening ? '#a39e95' : '#d6cfc2';
  const stoneSide = isEvening ? '#7a756e' : '#a69f93';

  const stoolOffsets = [
    { dx: -0.95, dy: 0 },
    { dx: 0.95, dy: 0 },
    { dx: 0, dy: -0.95 },
    { dx: 0, dy: 0.95 },
  ];

  const drawRoundPiece = (cx: number, cy: number, rx: number, ry: number, h: number) => {
    const p = isoToScreen(cx, cy, 0);
    // Pedestal leg
    ctx.fillStyle = stoneSide;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillRect(p.x - rx * 0.45, p.y - h, rx * 0.9, h);
    ctx.strokeRect(p.x - rx * 0.45, p.y - h, rx * 0.9, h);
    // Round top disc
    ctx.fillStyle = stoneTop;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - h, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  // Back stools first
  drawRoundPiece(gx + stoolOffsets[2].dx, gy + stoolOffsets[2].dy, 12, 7, 14);
  drawRoundPiece(gx + stoolOffsets[0].dx, gy + stoolOffsets[0].dy, 12, 7, 14);
  // Center table
  drawRoundPiece(gx, gy, 30, 17, 24);
  // Front stools
  drawRoundPiece(gx + stoolOffsets[1].dx, gy + stoolOffsets[1].dy, 12, 7, 14);
  drawRoundPiece(gx + stoolOffsets[3].dx, gy + stoolOffsets[3].dy, 12, 7, 14);
}

function drawCommunityCat(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  furColor: string,
  stripeColor: string,
  time: number,
  phaseOffset: number
) {
  const p = isoToScreen(gx, gy, 0);
  const tailWag = Math.sin(time * 3 + phaseOffset) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(20,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 1, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x - 6, p.y - 6);
  ctx.quadraticCurveTo(p.x - 14, p.y - 12 + tailWag, p.x - 12, p.y - 18 + tailWag);
  ctx.stroke();
  ctx.strokeStyle = furColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  // Body
  ctx.fillStyle = furColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 6, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Head + ears
  ctx.beginPath();
  ctx.arc(p.x + 6, p.y - 12, 5.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = stripeColor;
  ctx.beginPath();
  ctx.moveTo(p.x + 2, p.y - 16);
  ctx.lineTo(p.x + 4, p.y - 21);
  ctx.lineTo(p.x + 6, p.y - 17);
  ctx.fill();
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(p.x + 7, p.y - 17);
  ctx.lineTo(p.x + 9, p.y - 21);
  ctx.lineTo(p.x + 11, p.y - 16);
  ctx.fill();
  ctx.stroke();
}

function drawEzLinkOnGround(ctx: CanvasRenderingContext2D, gx: number, gy: number, time: number) {
  const p = isoToScreen(gx, gy, 2);
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  // Subtle glow ring so player can spot it easily!
  ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 16, 9, 0, 0, Math.PI * 2);
  ctx.stroke();

  // Tiny tilted teal EZ-Link card
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(-0.25);
  ctx.fillStyle = '#5eb8a8';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.5;
  ctx.fillRect(-9, -6, 18, 12);
  ctx.strokeRect(-9, -6, 18, 12);
  ctx.fillStyle = '#f5d76e';
  ctx.fillRect(-6, -2, 5, 4);
  ctx.restore();
}

function drawCharacterSprite(
  ctx: CanvasRenderingContext2D,
  opts: {
    gx: number;
    gy: number;
    dir: Direction;
    isMoving: boolean;
    walkPhase: number;
    skinTone: string;
    hairColor: string;
    shirtColor: string;
    pantsColor: string;
    hairStyle?: AvatarConfig['hairStyle'];
    hasShieldBackpack?: boolean;
    shieldColor?: string;
    hasPlasticBag?: boolean;
    isBald?: boolean;
    showGreenMarker?: boolean;
    time: number;
    label?: string;
  }
) {
  const p = isoToScreen(opts.gx, opts.gy, 0);
  const bob = opts.isMoving ? Math.abs(Math.sin(opts.walkPhase)) * 3 : 0;
  const stride = opts.isMoving ? Math.sin(opts.walkPhase) * 4 : 0;

  // Ground shadow
  ctx.fillStyle = 'rgba(20, 16, 12, 0.34)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const x = p.x;
  const y = p.y - bob;

  const facingRight = opts.dir === 'SE' || opts.dir === 'NE';
  const facingBack = opts.dir === 'NE' || opts.dir === 'NW';

  // Shield on back when facing away OR side-angled so player clearly sees shield!
  const drawShield = (behindTorso: boolean) => {
    if (!opts.hasShieldBackpack) return;
    if (behindTorso && !facingBack) return;
    const sx = facingBack ? x : facingRight ? x - 7 : x + 7;
    const sy = y - 27;
    ctx.fillStyle = opts.shieldColor || '#9ab0c4';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(sx - 9, sy - 9);
    ctx.lineTo(sx + 9, sy - 9);
    ctx.lineTo(sx + 9, sy + 2);
    ctx.lineTo(sx, sy + 11);
    ctx.lineTo(sx - 9, sy + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    // Inner emblem accent
    ctx.fillStyle = '#e8c468';
    ctx.fillRect(sx - 3, sy - 4, 6, 7);
  };

  // Legs + Sneakers/Slippers
  ctx.fillStyle = opts.pantsColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  // Left leg
  ctx.fillRect(x - 7, y - 16 + stride * 0.4, 6, 12);
  ctx.strokeRect(x - 7, y - 16 + stride * 0.4, 6, 12);
  // Right leg
  ctx.fillRect(x + 1, y - 16 - stride * 0.4, 6, 12);
  ctx.strokeRect(x + 1, y - 16 - stride * 0.4, 6, 12);

  // Shoes
  ctx.fillStyle = '#d9dfe6';
  ctx.fillRect(x - 8, y - 5 + stride * 0.4, 7, 4);
  ctx.strokeRect(x - 8, y - 5 + stride * 0.4, 7, 4);
  ctx.fillRect(x + 1, y - 5 - stride * 0.4, 7, 4);
  ctx.strokeRect(x + 1, y - 5 - stride * 0.4, 7, 4);

  if (!facingBack) drawShield(false);

  // Torso / Shirt
  ctx.fillStyle = opts.shirtColor;
  ctx.fillRect(x - 9, y - 34, 18, 19);
  ctx.strokeRect(x - 9, y - 34, 18, 19);

  // Arms
  ctx.fillStyle = opts.skinTone;
  ctx.fillRect(x - 13, y - 32 - stride * 0.3, 4, 13);
  ctx.strokeRect(x - 13, y - 32 - stride * 0.3, 4, 13);
  ctx.fillRect(x + 9, y - 32 + stride * 0.3, 4, 13);
  ctx.strokeRect(x + 9, y - 32 + stride * 0.3, 4, 13);

  // Sleeves
  ctx.fillStyle = opts.shirtColor;
  ctx.fillRect(x - 13, y - 33, 5, 6);
  ctx.strokeRect(x - 13, y - 33, 5, 6);
  ctx.fillRect(x + 8, y - 33, 5, 6);
  ctx.strokeRect(x + 8, y - 33, 5, 6);

  // Plastic grocery bag (Auntie)
  if (opts.hasPlasticBag) {
    const bx = x + 12;
    const by = y - 19;
    ctx.fillStyle = '#e8efe9';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.6;
    ctx.beginPath();
    ctx.ellipse(bx, by + 6, 5.5, 7.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#73ab65';
    ctx.fillRect(bx - 2, by + 3, 4, 5);
  }

  // Head
  ctx.fillStyle = opts.skinTone;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 54, 18, 19, 5);
  ctx.fill();
  ctx.stroke();

  // Face features if facing front
  if (!facingBack) {
    const eyeShift = facingRight ? 2 : -2;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 4 + eyeShift, y - 46, 2.2, 3);
    ctx.fillRect(x + 2 + eyeShift, y - 46, 2.2, 3);
    ctx.fillStyle = '#8f5b4a';
    ctx.fillRect(x - 2 + eyeShift, y - 40, 4, 1.5);
  }

  // Hair
  ctx.fillStyle = opts.hairColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  if (opts.isBald) {
    // Uncle fringe around sides
    ctx.fillRect(x - 10, y - 49, 3, 6);
    ctx.fillRect(x + 7, y - 49, 3, 6);
  } else {
    ctx.beginPath();
    ctx.roundRect(x - 10, y - 57, 20, facingBack ? 16 : 8, 4);
    ctx.fill();
    ctx.stroke();
    if (opts.hairStyle === 'bob') {
      ctx.fillRect(x - 10, y - 50, 4, 13);
      ctx.fillRect(x + 6, y - 50, 4, 13);
    } else if (opts.hairStyle === 'ponytail') {
      ctx.fillRect(x + 6, y - 52, 5, 13);
    } else if (opts.hairStyle === 'spiky') {
      ctx.fillRect(x - 6, y - 61, 4, 5);
      ctx.fillRect(x + 1, y - 62, 4, 6);
    }
  }

  if (facingBack) drawShield(true);

  // Floating Green Overhead Triangle Marker (exact match to screenshot!)
  if (opts.showGreenMarker) {
    const floatOffset = Math.sin(opts.time * 4) * 3;
    const my = y - 68 + floatOffset;
    ctx.fillStyle = '#58c958';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 9, my - 10);
    ctx.lineTo(x + 9, my - 10);
    ctx.lineTo(x, my + 2);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  }

  // Optional hover label
  if (opts.label) {
    ctx.font = 'bold 11px "Fredoka", sans-serif';
    const w = ctx.measureText(opts.label).width + 12;
    ctx.fillStyle = 'rgba(26, 30, 42, 0.85)';
    ctx.strokeStyle = '#c89b67';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.roundRect(x - w / 2, y - 82, w, 18, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#f7e9d2';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(opts.label, x, y - 73);
  }
}

function drawSpeechBubble(
  ctx: CanvasRenderingContext2D,
  npc: NPCEntity,
  text: string,
  icon: 'ezlink' | 'alert' | 'shop' | undefined,
  isEvening: boolean
) {
  const anchor = isoToScreen(npc.gx, npc.gy, 68);
  const bx = anchor.x - 14;
  const by = anchor.y - 34;

  const boxW = 248;
  const boxH = 68;
  const left = bx - boxW / 2;
  const top = by - boxH;

  // Bubble body + pointer triangle
  ctx.fillStyle = isEvening ? '#d4cde3' : '#f5efe6';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(left, top, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

  // Tail pointing down toward Uncle
  ctx.beginPath();
  ctx.moveTo(bx + 6, top + boxH - 1);
  ctx.lineTo(bx + 15, top + boxH + 13);
  ctx.lineTo(bx + 24, top + boxH - 1);
  ctx.closePath();
  ctx.fillStyle = isEvening ? '#d4cde3' : '#f5efe6';
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(bx + 6, top + boxH);
  ctx.lineTo(bx + 15, top + boxH + 13);
  ctx.lineTo(bx + 24, top + boxH);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;
  ctx.stroke();

  // Left icon inside speech bubble
  if (icon === 'ezlink') {
    const cx = left + 16;
    const cy = top + 19;
    ctx.save();
    ctx.translate(cx + 22, cy + 14);
    ctx.rotate(-0.14);
    ctx.fillStyle = '#5eb8a8';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.roundRect(-21, -13, 42, 26, 3);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8ee0cf';
    ctx.fillRect(-19, -11, 38, 6);
    ctx.fillStyle = '#1b4740';
    ctx.font = 'bold 8px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('EZ-Link', 0, 5);
    ctx.restore();
  } else {
    ctx.fillStyle = '#e6b84c';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(left + 34, top + 34, 15, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = INK;
    ctx.font = 'bold 18px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('!', left + 34, top + 40);
  }

  // Wrapped text inside bubble
  ctx.fillStyle = INK;
  ctx.font = '600 15px "Fredoka", sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  const words = text.split(' ');
  const lines: string[] = [];
  let cur = '';
  const maxLineW = boxW - 84;
  for (const w of words) {
    const test = cur ? `${cur} ${w}` : w;
    if (ctx.measureText(test).width > maxLineW) {
      lines.push(cur);
      cur = w;
    } else {
      cur = test;
    }
  }
  if (cur) lines.push(cur);

  const startY = top + (lines.length <= 2 ? 16 : 10);
  lines.slice(0, 3).forEach((ln, idx) => {
    ctx.fillText(ln, left + 68, startY + idx * 19);
  });
}

function drawLowBush(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  scale: number,
  isEvening: boolean
) {
  const base = isoToScreen(gx, gy, 0);
  const darkLeaf = isEvening ? '#2b4a33' : '#4a7337';
  const midLeaf = isEvening ? '#3c6340' : '#6b9c46';
  const lightLeaf = isEvening ? '#4e7d4b' : '#8ec25b';

  const blobs = [
    { dx: -24, dy: -18, r: 22 },
    { dx: 22, dy: -16, r: 20 },
    { dx: 0, dy: -28, r: 26 },
  ];
  blobs.forEach((b) => {
    const cx = base.x + b.dx * scale;
    const cy = base.y + b.dy * scale;
    const r = b.r * scale;
    ctx.fillStyle = darkLeaf;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = midLeaf;
    ctx.beginPath();
    ctx.arc(cx - r * 0.08, cy - r * 0.14, r * 0.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = lightLeaf;
    ctx.beginPath();
    ctx.arc(cx - r * 0.18, cy - r * 0.28, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  });
}

export function renderIsometricWorld(
  ctx: CanvasRenderingContext2D,
  state: RenderState
) {
  const isEvening = state.timeOfDay === 'evening';

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // 1. Ground, Roads, Tactile Paving, Void Deck & Minimart Flooring
  drawGroundAndRoads(ctx, isEvening);

  // 2. Sheltered Walkway BEFORE HDB Upper Building so HDB facade cleanly overlaps behind!
  drawShelteredWalkway(ctx, isEvening, state.time);

  // 3. Void Deck Interior Wall, Letterboxes, Notice Board & Minimart Shelving
  drawVoidDeckBackdropAndMinimart(ctx, isEvening, state.time);

  // 4. Upper HDB Block Facade + Corridors + Bamboo Laundry Poles + Yellow Minimart Sign
  drawHDBUpperBuilding(ctx, isEvening);

  // 5. Left Foliage (Grass shrubs, Potted Ferns, Large Tropical Rain Tree, Streetlamp)
  drawPottedFern(ctx, -0.8, 7.6, isEvening);
  drawPottedFern(ctx, 0.2, 8.7, isEvening);
  drawTree(ctx, -1.6, 7.2, 1.08, isEvening, state.time);
  drawTree(ctx, -2.5, 11.4, 0.85, isEvening, state.time);
  drawStreetlamp(ctx, 2.3, 9.6, isEvening);

  // 6. Click-to-walk destination indicator ripple
  if (state.walkTargetMarker) {
    const age = state.time - state.walkTargetMarker.createdAt;
    if (age < 1.1) {
      const tp = isoToScreen(state.walkTargetMarker.gx, state.walkTargetMarker.gy, 1);
      ctx.strokeStyle = `rgba(116, 224, 130, ${1 - age / 1.1})`;
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(tp.x, tp.y, 12 + age * 14, 6 + age * 7, 0, 0, Math.PI * 2);
      ctx.stroke();
    }
  }

  // 7. Depth-sorted Isometric Objects (Pillars, Bin, Stone Table, Cats, EZ-Link, Player, NPCs, Railing)
  interface SortableDraw {
    depth: number;
    draw: () => void;
  }
  const drawables: SortableDraw[] = [];

  // Mosaic HDB Pillars (tall height = 198 to meet HDB beam!)
  drawables.push({
    depth: 6.0 + 4.8,
    draw: () => drawMosaicPillar(ctx, 6.0, 4.8, 198, isEvening),
  });
  drawables.push({
    depth: 14.2 + 4.8,
    draw: () => {
      drawMosaicPillar(ctx, 14.2, 4.8, 198, isEvening);
      drawNoSmokingSign(ctx, 14.2, 4.82, 58);
    },
  });
  drawables.push({
    depth: 20.8 + 4.8,
    draw: () => {
      drawMosaicPillar(ctx, 20.8, 4.8, 198, isEvening);
      drawNoSmokingSign(ctx, 20.8, 4.82, 58);
    },
  });

  // Green Recycling Bin
  drawables.push({
    depth: 5.5 + 5.7,
    draw: () => drawRecyclingBin(ctx, 5.5, 5.7, isEvening),
  });

  // Round Stone Chess Table & 4 Stools
  drawables.push({
    depth: 9.8 + 3.0,
    draw: () => drawStoneTableAndStools(ctx, 9.8, 3.0, isEvening),
  });

  // Community Cats
  drawables.push({
    depth: 7.4 + 4.1,
    draw: () => drawCommunityCat(ctx, 7.4, 4.1, '#a7aab0', '#676b73', state.time, 0),
  });
  drawables.push({
    depth: 13.0 + 5.3,
    draw: () => drawCommunityCat(ctx, 13.0, 5.3, '#e39649', '#b86825', state.time, 2.2),
  });

  // Dropped EZ-Link Card on Void Deck ground if not yet picked up!
  if (!state.ezLinkPickedUp) {
    drawables.push({
      depth: 8.6 + 3.8,
      draw: () => drawEzLinkOnGround(ctx, 8.6, 3.8, state.time),
    });
  }

  // Footpath Heritage Lamp
  drawables.push({
    depth: 9.8 + 9.4,
    draw: () => drawFootpathLamp(ctx, 9.8, 9.4, isEvening),
  });

  // Pedestrian Metal Railing
  drawables.push({
    depth: 10.2 + 10.15,
    draw: () => drawPedestrianRailing(ctx, isEvening),
  });

  // Low foreground foliage bushes (matches screenshot without blocking footpath!)
  drawables.push({
    depth: 14.8 + 11.4,
    draw: () => drawLowBush(ctx, 14.8, 11.4, 1.05, isEvening),
  });
  drawables.push({
    depth: 17.6 + 11.0,
    draw: () => drawLowBush(ctx, 17.6, 11.0, 1.15, isEvening),
  });

  // Player
  const shieldPalette: Record<AvatarConfig['shieldStyle'], string> = {
    classic: '#9ab0c4',
    verifox: '#d98c3f',
    beacon: '#48a999',
    cluepaw: '#8e74b5',
  };
  drawables.push({
    depth: state.player.gx + state.player.gy,
    draw: () =>
      drawCharacterSprite(ctx, {
        gx: state.player.gx,
        gy: state.player.gy,
        dir: state.player.dir,
        isMoving: state.player.isMoving,
        walkPhase: state.player.walkPhase,
        skinTone: state.player.avatar.skinTone,
        hairColor: state.player.avatar.hairColor,
        shirtColor: state.player.avatar.shirtColor,
        pantsColor: state.player.avatar.pantsColor,
        hairStyle: state.player.avatar.hairStyle,
        hasShieldBackpack: true,
        shieldColor: shieldPalette[state.player.avatar.shieldStyle],
        showGreenMarker: true,
        time: state.time,
      }),
  });

  // NPCs
  state.npcs.forEach((npc) => {
    drawables.push({
      depth: npc.gx + npc.gy,
      draw: () =>
        drawCharacterSprite(ctx, {
          gx: npc.gx,
          gy: npc.gy,
          dir: npc.dir,
          isMoving: npc.id === 'auntie',
          walkPhase: state.time * 4.2,
          skinTone: npc.skinTone,
          hairColor: npc.hairColor,
          shirtColor: npc.shirtColor,
          pantsColor: npc.pantsColor,
          hasPlasticBag: npc.hasBag,
          isBald: npc.isBald,
          time: state.time,
          label: state.hoveredTarget === npc.id ? npc.name : undefined,
        }),
    });
  });

  drawables.sort((a, b) => a.depth - b.depth);
  drawables.forEach((item) => item.draw());

  // 8. Evening cozy atmospheric blue-indigo wash (preserves warm lit windows & lamps!)
  if (isEvening) {
    ctx.fillStyle = 'rgba(22, 30, 58, 0.24)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // 9. Active Speech Bubble (always drawn cleanly above world & twilight tint!)
  if (state.activeSpeechBubble) {
    const targetNpc = state.npcs.find((n) => n.id === state.activeSpeechBubble?.npcId);
    if (targetNpc) {
      drawSpeechBubble(
        ctx,
        targetNpc,
        state.activeSpeechBubble.text,
        state.activeSpeechBubble.icon,
        isEvening
      );
    }
  }
}
