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
  time: number;
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
  kopiPickedUp: boolean;
  chopePickedUp: boolean;
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
  leftColor: string,
  rightColor: string,
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

  drawIsoPoly(ctx, [t10, t11, p11, p10], leftColor, outline, lineWidth);
  drawIsoPoly(ctx, [t11, t01, p01, p11], rightColor, outline, lineWidth);
  drawIsoPoly(ctx, [t00, t01, t11, t10], topColor, outline, lineWidth);
}

function drawSingaporeSkylineVista(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  const horizonY = 132;
  const maxVistaX = 700;

  const skyGrad = ctx.createLinearGradient(0, 0, 0, horizonY);
  if (isEvening) {
    skyGrad.addColorStop(0, '#19223d');
    skyGrad.addColorStop(0.58, '#2f3d63');
    skyGrad.addColorStop(1, '#685069');
  } else {
    skyGrad.addColorStop(0, '#6aaad9');
    skyGrad.addColorStop(0.65, '#a8d6ec');
    skyGrad.addColorStop(1, '#f2ddb8');
  }
  ctx.fillStyle = skyGrad;
  ctx.fillRect(0, 0, maxVistaX, horizonY);

  if (isEvening) {
    const stars = [
      [270, 18], [312, 34], [385, 16], [448, 22], [516, 15], [588, 28], [640, 14],
    ];
    stars.forEach(([sx, sy], i) => {
      const alpha = 0.45 + 0.45 * Math.sin(time * 2.2 + i * 1.4);
      ctx.fillStyle = `rgba(255, 244, 196, ${alpha})`;
      ctx.fillRect(sx, sy, 2, 2);
    });
  } else {
    ctx.fillStyle = 'rgba(255, 252, 245, 0.72)';
    [
      [295, 26, 46, 12],
      [480, 20, 54, 14],
      [590, 34, 42, 11],
    ].forEach(([cx, cy, w, h]) => {
      ctx.fillRect(cx, cy, w, h);
      ctx.fillRect(cx + 8, cy - 6, w - 16, 7);
    });
  }

  // Distant HDB Blocks silhouette
  const distantHdbCol = isEvening ? '#27314c' : '#8aa6bb';
  const distantWindowCol = isEvening ? 'rgba(255, 214, 118, 0.65)' : 'rgba(225, 240, 250, 0.5)';
  [
    { x: 185, w: 38, h: 58 },
    { x: 228, w: 36, h: 48 },
    { x: 642, w: 36, h: 62 },
  ].forEach((b) => {
    ctx.fillStyle = distantHdbCol;
    ctx.fillRect(b.x, horizonY - 10 - b.h, b.w, b.h);
    ctx.fillStyle = distantWindowCol;
    for (let wy = horizonY - 8 - b.h + 6; wy < horizonY - 16; wy += 9) {
      for (let wx = b.x + 6; wx < b.x + b.w - 8; wx += 9) {
        ctx.fillRect(wx, wy, 4, 4);
      }
    }
  });

  // Baycrest SkyDeck Towers (MBS-inspired)
  const mbsBaseY = horizonY - 10;
  const towerXs = [292, 322, 352];
  const towerCol = isEvening ? '#364566' : '#7b97b2';
  const towerSide = isEvening ? '#27334d' : '#647f99';
  const towerEdge = isEvening ? '#1b2236' : '#4a6278';

  towerXs.forEach((tx) => {
    ctx.fillStyle = towerCol;
    ctx.strokeStyle = towerEdge;
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.moveTo(tx - 9, mbsBaseY);
    ctx.lineTo(tx - 6, mbsBaseY - 82);
    ctx.lineTo(tx + 7, mbsBaseY - 82);
    ctx.lineTo(tx + 9, mbsBaseY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = towerSide;
    ctx.fillRect(tx + 2, mbsBaseY - 80, 4, 78);

    ctx.fillStyle = isEvening ? 'rgba(255, 220, 130, 0.72)' : 'rgba(225, 242, 255, 0.55)';
    for (let wy = mbsBaseY - 75; wy < mbsBaseY - 10; wy += 7) {
      ctx.fillRect(tx - 5, wy, 3, 3);
      ctx.fillRect(tx + 1, wy, 3, 3);
    }
  });

  // Cantilevered boat SkyPark deck
  ctx.fillStyle = isEvening ? '#53678f' : '#9bb3c9';
  ctx.strokeStyle = towerEdge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(272, mbsBaseY - 84);
  ctx.lineTo(378, mbsBaseY - 84);
  ctx.lineTo(386, mbsBaseY - 90);
  ctx.lineTo(281, mbsBaseY - 90);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  if (isEvening) {
    ctx.fillStyle = 'rgba(255, 214, 118, 0.75)';
    ctx.fillRect(284, mbsBaseY - 87, 88, 2);
  }

  // GlowTree Supertree Grove
  [
    { x: 404, h: 56, w: 24 },
    { x: 428, h: 44, w: 20 },
  ].forEach((st) => {
    const baseY = horizonY - 10;
    ctx.strokeStyle = isEvening ? '#7d56a3' : '#52786a';
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(st.x, baseY);
    ctx.lineTo(st.x, baseY - st.h);
    ctx.stroke();

    ctx.fillStyle = isEvening ? '#b07ee0' : '#6ea88c';
    ctx.strokeStyle = isEvening ? '#392854' : '#3a574f';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.ellipse(st.x, baseY - st.h, st.w / 2, 5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  });

  // Lion City Observation Wheel
  const wheelX = 472;
  const wheelY = horizonY - 48;
  const wheelR = 30;
  ctx.strokeStyle = isEvening ? '#4c5b7d' : '#657c94';
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(wheelX - 14, horizonY - 10);
  ctx.lineTo(wheelX, wheelY);
  ctx.lineTo(wheelX + 14, horizonY - 10);
  ctx.stroke();

  ctx.strokeStyle = isEvening ? '#87a3cf' : '#c6d6e6';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(wheelX, wheelY, wheelR, 0, Math.PI * 2);
  ctx.stroke();

  const rot = time * 0.14;
  for (let i = 0; i < 8; i++) {
    const ang = rot + (i * Math.PI * 2) / 8;
    const px = wheelX + Math.cos(ang) * wheelR;
    const py = wheelY + Math.sin(ang) * wheelR;
    ctx.strokeStyle = isEvening ? 'rgba(135, 163, 207, 0.38)' : 'rgba(255, 255, 255, 0.45)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(wheelX, wheelY);
    ctx.lineTo(px, py);
    ctx.stroke();
    ctx.fillStyle = isEvening ? '#f5cf7b' : '#f2f6fa';
    ctx.fillRect(px - 1.5, py - 1.5, 3, 3);
  }

  // Durian Dome Arts
  [520, 546].forEach((dx) => {
    ctx.fillStyle = isEvening ? '#6f6b7a' : '#b8b2a6';
    ctx.strokeStyle = isEvening ? '#272a3b' : '#5e5b54';
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(dx, horizonY - 10, 14, Math.PI, 0);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
  });

  // Bay Water & Park Border
  ctx.fillStyle = isEvening ? '#223354' : '#5d9bc2';
  ctx.fillRect(0, horizonY - 12, maxVistaX, 14);
  ctx.fillStyle = isEvening ? '#314b31' : '#588242';
  ctx.fillRect(0, horizonY, maxVistaX, 7);
  ctx.fillStyle = INK;
  ctx.fillRect(0, horizonY, maxVistaX, 2);
}

function drawMRTViaductAndTrain(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  // Elevated MRT Viaduct running up-right along gx = -2.2, gy = 7.2 down to -4.2
  const zTrack = 128;
  const pierGys = [6.2, 2.2, -1.6];

  // Concrete T-piers
  pierGys.forEach((gy) => {
    drawIsoBox(
      ctx,
      -2.45,
      gy - 0.28,
      -1.85,
      gy + 0.28,
      0,
      zTrack - 12,
      isEvening ? '#6f7785' : '#9fa5b0',
      isEvening ? '#636b78' : '#949aa6',
      isEvening ? '#4e5561' : '#7b828e',
      INK,
      1.8
    );
  });

  // Viaduct concrete girder deck (gx = -2.85 .. -1.45, gy = -4.2 .. 7.6)
  drawIsoBox(
    ctx,
    -2.85,
    -4.2,
    -1.45,
    7.6,
    zTrack - 14,
    14,
    isEvening ? '#575f6e' : '#858d99',
    isEvening ? '#6a7280' : '#9ea6b2',
    isEvening ? '#49505e' : '#747c88',
    INK,
    2
  );

  // Dark steel rail track strips
  const r1a = isoToScreen(-2.35, -4.0, zTrack + 1);
  const r1b = isoToScreen(-2.35, 7.5, zTrack + 1);
  const r2a = isoToScreen(-1.95, -4.0, zTrack + 1);
  const r2b = isoToScreen(-1.95, 7.5, zTrack + 1);
  ctx.strokeStyle = '#2d3138';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(r1a.x, r1a.y);
  ctx.lineTo(r1b.x, r1b.y);
  ctx.moveTo(r2a.x, r2a.y);
  ctx.lineTo(r2b.x, r2b.y);
  ctx.stroke();

  // Animated Singapore MRT Train ("Shield Line") gliding smoothly along viaduct!
  // Train runs smoothly from gy = 9.0 to -6.0 and loops cleanly
  const cycle = (time * 0.95) % 16;
  const trainHeadGy = 8.2 - cycle;

  for (let car = 0; car < 3; car++) {
    const carEndGy = trainHeadGy + car * 2.1;
    const carStartGy = carEndGy - 1.85;
    if (carStartGy > 7.8 || carEndGy < -4.2) continue;

    const c1 = Math.max(-4.2, carStartGy);
    const c2 = Math.min(7.6, carEndGy);
    if (c2 - c1 < 0.35) continue;

    // White/Silver MRT train body
    drawIsoBox(
      ctx,
      -2.62,
      c1,
      -1.68,
      c2,
      zTrack + 2,
      26,
      isEvening ? '#c4cbd6' : '#edf1f7',
      isEvening ? '#98a2b3' : '#cfd6e0',
      isEvening ? '#aeb8c7' : '#e0e6ef',
      INK,
      1.8
    );

    // Signature Singapore Red & Green MRT Stripe along train side (+gx face)
    const st1 = isoToScreen(-1.67, c1 + 0.08, zTrack + 10);
    const st2 = isoToScreen(-1.67, c2 - 0.08, zTrack + 10);
    ctx.strokeStyle = '#cf3f38';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(st1.x, st1.y);
    ctx.lineTo(st2.x, st2.y);
    ctx.stroke();

    // Glowing train passenger windows
    for (let w = 0; w < 3; w++) {
      const wg = c1 + 0.28 + w * 0.52;
      if (wg > c2 - 0.25) continue;
      const wp1 = isoToScreen(-1.66, wg, zTrack + 16);
      const wp2 = isoToScreen(-1.66, wg + 0.32, zTrack + 16);
      const wp3 = isoToScreen(-1.66, wg + 0.32, zTrack + 24);
      const wp4 = isoToScreen(-1.66, wg, zTrack + 24);
      drawIsoPoly(
        ctx,
        [wp1, wp2, wp3, wp4],
        isEvening ? '#ffe28a' : '#50647a',
        INK,
        1
      );
    }

    // Lead car front cockpit windshield & warm headlight beam
    if (car === 0 && c1 > -4.0) {
      const nose = isoToScreen(-2.15, c1, zTrack + 14);
      ctx.fillStyle = '#252b36';
      ctx.fillRect(nose.x - 8, nose.y - 8, 16, 10);
      if (isEvening) {
        ctx.fillStyle = 'rgba(255, 240, 170, 0.75)';
        ctx.beginPath();
        ctx.arc(nose.x + 5, nose.y + 4, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }
}

function drawGroundAndRoads(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  // Base grass / terrain fill
  ctx.fillStyle = isEvening ? '#3c5337' : '#6f9653';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Distant Singapore Skyline Vista
  drawSingaporeSkylineVista(ctx, isEvening, time);

  // Subtle park lawn grid streaks
  for (let i = 1; i < 8; i += 2) {
    drawIsoQuad(
      ctx,
      -3,
      i,
      3.5,
      i + 0.9,
      0,
      isEvening ? 'rgba(110,145,88,0.14)' : 'rgba(154,196,112,0.25)'
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
    isEvening ? '#363b47' : '#4a4e57',
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

  // Bus Bay Box outline (left of Zebra Crossing!)
  const b1 = isoToScreen(0.8, 11.45);
  const b2 = isoToScreen(5.2, 11.45);
  const b3 = isoToScreen(5.2, 14.0);
  const b4 = isoToScreen(0.8, 14.0);
  ctx.save();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 3.5;
  ctx.setLineDash([14, 10]);
  ctx.beginPath();
  ctx.moveTo(b1.x, b1.y);
  ctx.lineTo(b2.x, b2.y);
  ctx.lineTo(b3.x, b3.y);
  ctx.lineTo(b4.x, b4.y);
  ctx.closePath();
  ctx.stroke();
  ctx.restore();

  // Isometric "BUS" road text inside bus bay
  const busAnchor = isoToScreen(2.8, 12.8);
  ctx.save();
  ctx.translate(busAnchor.x, busAnchor.y);
  ctx.transform(0.89, 0.445, -0.89, 0.445, 0, 0);
  ctx.fillStyle = isEvening ? 'rgba(208, 169, 66, 0.85)' : 'rgba(235, 195, 76, 0.9)';
  ctx.font = 'bold 40px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('BUS', 0, 0);
  ctx.restore();

  // Realistic Singapore White Zebra Crossing (gx = 5.6 .. 7.8, gy = 10.8 .. 14.2)
  const stripeCol = isEvening ? '#c9ced6' : '#f0f2f5';
  for (let sy = 11.2; sy <= 13.9; sy += 0.62) {
    drawIsoQuad(ctx, 5.65, sy, 7.65, sy + 0.34, 0, stripeCol, INK, 1);
  }

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

  // Main Footpath concrete pavement (gy = 4.9 .. 10.4, gx = -3 .. 22)
  drawIsoQuad(
    ctx,
    -3.5,
    4.9,
    22,
    10.4,
    0,
    isEvening ? '#868583' : '#bcb5a6',
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

  // Kopi Corner Patio Slab (gx = -3.8 .. 1.8, gy = 4.6 .. 10.2)
  drawIsoQuad(
    ctx,
    -3.8,
    4.6,
    1.8,
    10.2,
    0,
    isEvening ? '#9c9284' : '#cec4b2',
    INK,
    1.5
  );

  // Sheltered Walkway ground slab (running up-right gy = -2.2 .. 5.2, gx = 1.2 .. 4.7)
  drawIsoQuad(
    ctx,
    1.2,
    -2.2,
    4.7,
    5.4,
    0,
    isEvening ? '#98948c' : '#cbc4b5',
    INK,
    1.5
  );

  // Yellow Tactile Paving Strip near crosswalk & bus stop!
  drawIsoQuad(
    ctx,
    4.1,
    9.2,
    5.8,
    10.1,
    0,
    isEvening ? '#cfa844' : '#edc54f',
    '#856623',
    1.5
  );
  ctx.fillStyle = isEvening ? '#9c7826' : '#bd952b';
  for (let tx = 4.3; tx <= 5.65; tx += 0.25) {
    for (let ty = 9.35; ty <= 9.95; ty += 0.22) {
      const p = isoToScreen(tx, ty);
      ctx.fillRect(p.x - 1.5, p.y - 1, 3, 2);
    }
  }

  // Void Deck Concrete Floor (gx = 6.0 .. 14.3, gy = 2.0 .. 4.95)
  drawIsoQuad(
    ctx,
    6.0,
    2.0,
    14.3,
    4.95,
    0,
    isEvening ? '#999289' : '#cbc1b1',
    INK,
    1.5
  );

  // Sunshine Minimart Interior Floor (gx = 14.3 .. 21.5, gy = 2.0 .. 5.2)
  drawIsoQuad(
    ctx,
    14.3,
    2.0,
    21.5,
    5.2,
    0,
    isEvening ? '#bfb5a2' : '#dfd4be',
    INK,
    1.5
  );
}

function drawFitnessCornerAndPark(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean
) {
  // Visible open-air Singapore HDB Fitness Corner on top-left green park lawn (left of Kopitiam!)
  drawIsoBox(ctx, -7.2, 6.2, -6.2, 6.7, 0, 12, '#a86b3e', '#85512b', '#6b3e1f', INK, 1.6);
  drawIsoBox(ctx, -7.2, 6.15, -6.2, 6.26, 12, 12, '#b87848', '#8f5932', '#6b3e1f', INK, 1.5);

  // Pull-Up / Chin-Up Bars (purple/teal Singapore park fitness colours!)
  const f1 = isoToScreen(-7.5, 4.9, 0);
  const f2 = isoToScreen(-6.5, 4.9, 0);
  const f1t = isoToScreen(-7.5, 4.9, 44);
  const f2t = isoToScreen(-6.5, 4.9, 44);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4.5;
  ctx.beginPath();
  ctx.moveTo(f1.x, f1.y);
  ctx.lineTo(f1t.x, f1t.y);
  ctx.lineTo(f2t.x, f2t.y);
  ctx.lineTo(f2.x, f2.y);
  ctx.stroke();

  ctx.strokeStyle = isEvening ? '#9b7fd9' : '#6c58a6';
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.moveTo(f1.x, f1.y);
  ctx.lineTo(f1t.x, f1t.y);
  ctx.lineTo(f2t.x, f2t.y);
  ctx.lineTo(f2.x, f2.y);
  ctx.stroke();

  // Elliptical Stepper Station beside bench
  const st = isoToScreen(-6.2, 5.5, 0);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(st.x, st.y);
  ctx.lineTo(st.x, st.y - 28);
  ctx.moveTo(st.x - 8, st.y - 22);
  ctx.lineTo(st.x + 8, st.y - 22);
  ctx.stroke();
  ctx.strokeStyle = '#5bb5a2';
  ctx.lineWidth = 2;
  ctx.stroke();
}

function drawKopitiamStalls(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean,
  time: number
) {
  // Kopitiam Building Block on far left (gx = -3.4 .. -1.4, gy = 3.2 .. 7.8)
  drawIsoBox(
    ctx,
    -3.4,
    3.2,
    -1.4,
    7.8,
    0,
    98,
    isEvening ? '#7d7772' : '#bab2a6',
    isEvening ? '#877d74' : '#c9bfb0',
    isEvening ? '#706861' : '#b3a99b',
    INK,
    2
  );

  const drawStall = (
    gy1: number,
    gy2: number,
    title: string,
    signBg: string,
    signText: string,
    counterCol: string
  ) => {
    const o1 = isoToScreen(-1.38, gy1, 10);
    const o2 = isoToScreen(-1.38, gy2, 10);
    const o3 = isoToScreen(-1.38, gy2, 74);
    const o4 = isoToScreen(-1.38, gy1, 74);
    drawIsoPoly(
      ctx,
      [o1, o2, o3, o4],
      isEvening ? '#ffe8ab' : '#f2dfc0',
      INK,
      1.8
    );

    const c1 = isoToScreen(-1.36, gy1, 10);
    const c2 = isoToScreen(-1.36, gy2, 10);
    const c3 = isoToScreen(-1.36, gy2, 32);
    const c4 = isoToScreen(-1.36, gy1, 32);
    drawIsoPoly(ctx, [c1, c2, c3, c4], counterCol, INK, 1.5);

    // Illuminated Stall Signboard mounted prominently on FRONT AWNING FASCIA (gx = 0.78) so 100% readable!
    const s1 = isoToScreen(0.78, gy1 - 0.05, 86);
    const s2 = isoToScreen(0.78, gy2 + 0.05, 86);
    const s3 = isoToScreen(0.78, gy2 + 0.05, 106);
    const s4 = isoToScreen(0.78, gy1 - 0.05, 106);
    drawIsoPoly(ctx, [s1, s2, s3, s4], signBg, INK, 1.8);

    const mid = isoToScreen(0.8, (gy1 + gy2) / 2, 95);
    ctx.save();
    ctx.translate(mid.x, mid.y);
    ctx.transform(0.89, -0.445, 0, 1, 0, 0);
    ctx.fillStyle = signText;
    ctx.font = 'bold 11px "Silkscreen", monospace';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(title, 0, 0);
    ctx.restore();
  };

  // Kopitiam Awning Roof projecting over tables (drawn before fascia signboards!)
  const r1 = isoToScreen(-1.4, 3.0, 106);
  const r2 = isoToScreen(0.8, 3.0, 96);
  const r3 = isoToScreen(0.8, 8.0, 96);
  const r4 = isoToScreen(-1.4, 8.0, 106);
  drawIsoPoly(
    ctx,
    [r1, r2, r3, r4],
    isEvening ? '#6d7380' : '#9c978d',
    INK,
    2
  );

  drawStall(3.5, 5.4, 'SATAY', '#b84239', '#fff4d4', '#8f5232');
  drawStall(5.7, 7.6, 'KOPI', '#3b824f', '#ffe88a', '#63804e');

  // Glowing string fairy lights along Kopitiam awning edge at 19:15!
  if (isEvening) {
    for (let i = 0; i < 6; i++) {
      const gy = 3.4 + i * 0.85;
      const b = isoToScreen(0.75, gy, 104);
      const glow = 0.75 + 0.25 * Math.sin(time * 3 + i);
      ctx.fillStyle = `rgba(255, 224, 130, ${0.85 * glow})`;
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.5, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Singapore Drink Vending Machine under linkway corner (gx = 1.45, gy = 4.75)
  drawIsoBox(
    ctx,
    1.15,
    4.5,
    1.75,
    5.15,
    0,
    66,
    '#5288b5',
    '#3d6c96',
    '#2f5478',
    INK,
    2
  );
  // Illuminated drink display panel on vending front (+gy)
  const v1 = isoToScreen(1.22, 5.16, 22);
  const v2 = isoToScreen(1.68, 5.16, 22);
  const v3 = isoToScreen(1.68, 5.16, 58);
  const v4 = isoToScreen(1.22, 5.16, 58);
  drawIsoPoly(ctx, [v1, v2, v3, v4], isEvening ? '#d9f2ff' : '#c7e3f5', INK, 1.4);
  const vColors = ['#d9534f', '#5cb85c', '#f0ad4e', '#428bca'];
  for (let row = 0; row < 3; row++) {
    const zV = 28 + row * 10;
    for (let col = 0; col < 3; col++) {
      const vp = isoToScreen(1.3 + col * 0.14, 5.18, zV);
      ctx.fillStyle = vColors[(row + col) % vColors.length];
      ctx.fillRect(vp.x - 2, vp.y - 6, 4, 6);
    }
  }
}

function drawKopitiamTableWithDiners(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  isEvening: boolean
) {
  const p = isoToScreen(gx, gy, 0);
  // 2 seated diners (one left, one right!)
  const drawSeatedDiner = (dx: number, dy: number, shirt: string, hair: string, skin: string) => {
    const sx = p.x + dx;
    const sy = p.y + dy;
    // Stool
    ctx.fillStyle = '#cf4d42';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 6, 7, 4, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Seated torso
    ctx.fillStyle = shirt;
    ctx.fillRect(sx - 6, sy - 22, 12, 14);
    ctx.strokeRect(sx - 6, sy - 22, 12, 14);
    // Head
    ctx.fillStyle = skin;
    ctx.beginPath();
    ctx.arc(sx, sy - 29, 6, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    // Hair
    ctx.fillStyle = hair;
    ctx.fillRect(sx - 5, sy - 35, 10, 4);
  };

  drawSeatedDiner(-22, -4, '#e6d8c3', '#9aa0ab', '#d49d78');
  drawSeatedDiner(22, -2, '#6fa89b', '#262228', '#d9a47c');

  // Round Kopitiam marble table
  ctx.fillStyle = '#7b746b';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.fillRect(p.x - 5, p.y - 20, 10, 20);
  ctx.strokeRect(p.x - 5, p.y - 20, 10, 20);
  ctx.fillStyle = isEvening ? '#cfc7b8' : '#efe9dc';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 20, 22, 12, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

  // Tiny Kopi cups & plates on table!
  ctx.fillStyle = '#528f5e';
  ctx.fillRect(p.x - 8, p.y - 23, 5, 4);
  ctx.fillStyle = '#f5f2eb';
  ctx.beginPath();
  ctx.ellipse(p.x + 6, p.y - 21, 5, 3, 0, 0, Math.PI * 2);
  ctx.fill();
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

  drawIsoBox(ctx, x1, y1, x2, y2, 0, height, upperLeft, upperLeft, upperRight, INK, 2);

  const tileBaseH = 56;
  const rows = 5;
  const cols = 3;
  const tileColors = ['#c96f4b', '#568d8c', '#d8b482', '#9e624d', '#75a39e'];

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
      drawIsoPoly(ctx, [p00, p10, p11, p01], tileColors[(r * 2 + c) % tileColors.length], INK, 0.9);
    }
  }

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
      drawIsoPoly(ctx, [p00, p10, p11, p01], tileColors[(r * 3 + c + 1) % tileColors.length], INK, 0.9);
    }
  }
}

function drawExposedHDBRiserPipes(ctx: CanvasRenderingContext2D, isEvening: boolean) {
  // Prominent exposed grey HDB service/drainage pipes running down the corner beside Blk 260!
  const pipeCol = isEvening ? '#868f9e' : '#b2b9c4';
  const b1 = isoToScreen(7.42, 4.92, 16);
  const t1 = isoToScreen(7.42, 4.92, 346);
  const b2 = isoToScreen(7.64, 4.92, 16);
  const t2 = isoToScreen(7.64, 4.92, 346);

  [
    [b1, t1],
    [b2, t2],
  ].forEach(([a, b]) => {
    ctx.strokeStyle = INK;
    ctx.lineWidth = 6.5;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();

    ctx.strokeStyle = pipeCol;
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    ctx.moveTo(a.x, a.y);
    ctx.lineTo(b.x, b.y);
    ctx.stroke();
  });

  // Junction box near z = 198
  const jb = isoToScreen(7.53, 4.94, 204);
  ctx.fillStyle = '#5a6370';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.fillRect(jb.x - 8, jb.y - 8, 16, 15);
  ctx.strokeRect(jb.x - 8, jb.y - 8, 16, 15);
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
  isEvening: boolean
) {
  const voidHeight = 198;

  // Void Deck Back Wall
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

  // Left interior wall of Void Deck
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

  // Stainless Steel HDB Letterbox Bank
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

  // Parcel / Cardboard box beside letterboxes
  drawIsoBox(ctx, 6.2, 2.35, 6.85, 2.95, 82, 22, '#cfa065', '#b38249', '#946733', INK, 1.5);

  // Cork Community Notice Board (z = 12 .. 55 so RC NOTICE is 100% unclipped below ceiling!)
  const nb1 = isoToScreen(8.4, 2.06, 12);
  const nb2 = isoToScreen(11.9, 2.06, 12);
  const nb3 = isoToScreen(11.9, 2.06, 55);
  const nb4 = isoToScreen(8.4, 2.06, 55);
  drawIsoPoly(ctx, [nb1, nb2, nb3, nb4], '#8f5b34', INK, 2);
  const nc1 = isoToScreen(8.6, 2.07, 16);
  const nc2 = isoToScreen(11.7, 2.07, 16);
  const nc3 = isoToScreen(11.7, 2.07, 51);
  const nc4 = isoToScreen(8.6, 2.07, 51);
  drawIsoPoly(ctx, [nc1, nc2, nc3, nc4], isEvening ? '#b88c52' : '#cf9f63', INK, 1.5);

  const rcPos = isoToScreen(10.15, 2.08, 52);
  ctx.save();
  ctx.translate(rcPos.x, rcPos.y);
  ctx.transform(0.89, 0.445, 0, 1, 0, 0);
  ctx.fillStyle = '#b8372c';
  ctx.fillRect(-26, -6, 52, 11);
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.2;
  ctx.strokeRect(-26, -6, 52, 11);
  ctx.fillStyle = '#fff5e0';
  ctx.font = 'bold 7.5px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('RC NOTICE', 0, 2);
  ctx.restore();

  const flyers = [
    { x1: 8.8, x2: 9.35, z1: 35, z2: 47, col: '#f2e8cf' },
    { x1: 9.55, x2: 10.15, z1: 34, z2: 46, col: '#95d5b2' },
    { x1: 10.35, x2: 10.95, z1: 35, z2: 47, col: '#f7d67e' },
    { x1: 11.1, x2: 11.55, z1: 33, z2: 45, col: '#f4a28c' },
    { x1: 9.0, x2: 9.65, z1: 19, z2: 31, col: '#ffd166' },
    { x1: 9.85, x2: 10.5, z1: 20, z2: 30, col: '#a8dadc' },
    { x1: 10.7, x2: 11.35, z1: 19, z2: 31, col: '#f4efe6' },
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

  // Void Deck Corner Crate near pillar
  drawIsoBox(ctx, 13.3, 3.85, 13.9, 4.4, 0, 28, '#55606e', '#3d4552', '#2e3540', INK, 1.8);

  // SUNSHINE MINIMART INTERIOR
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

  drawIsoBox(ctx, 15.1, 2.15, 16.0, 2.75, 92, 16, '#d4a66a', '#b8884d', '#996e3a', INK, 1.5);

  // Stacked Blue & Green Drink Crates
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 0, 17, '#4c77b8', '#395d96', '#2b4775', INK, 1.5);
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 17, 17, '#539e66', '#3d7d4d', '#2e613b', INK, 1.5);
  drawIsoBox(ctx, 14.55, 3.25, 15.2, 3.9, 34, 17, '#4c77b8', '#395d96', '#2b4775', INK, 1.5);

  // Minimart Snack Shelves along back wall
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

  // Front "SNACKS" Chip Rack
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
}

function drawHDBUpperBuilding(
  ctx: CanvasRenderingContext2D,
  isEvening: boolean
) {
  const wallBaseZ = 198;
  const wallTopZ = 560;

  const f1 = isoToScreen(6.0, 4.8, wallBaseZ);
  const f2 = isoToScreen(24.0, 4.8, wallBaseZ);
  const f3 = isoToScreen(24.0, 4.8, wallTopZ);
  const f4 = isoToScreen(6.0, 4.8, wallTopZ);
  drawIsoPoly(ctx, [f1, f2, f3, f4], isEvening ? '#b7afa7' : '#eae2d6', INK, 2);

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

    // Classic HDB security window grilles across second window
    const gr1 = isoToScreen(gxStart + 2.4, 4.84, zLow + 26);
    const gr2 = isoToScreen(gxStart + 2.4, 4.84, zHigh - 14);
    ctx.strokeStyle = 'rgba(40,42,50,0.6)';
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(gr1.x, gr1.y);
    ctx.lineTo(gr2.x, gr2.y);
    ctx.stroke();

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

  drawCorridorBay(8.0, 11.4, 364, 458, isEvening ? '#9b5a42' : '#c97855');
  drawCorridorBay(12.2, 15.6, 364, 458, isEvening ? '#46688a' : '#5c87b5');
  drawCorridorBay(16.4, 19.8, 364, 458, isEvening ? '#9b5a42' : '#c97855');

  // Staircase window + HDB Block Number "260"
  const ew1 = isoToScreen(6.25, 4.83, 240);
  const ew2 = isoToScreen(7.35, 4.83, 240);
  const ew3 = isoToScreen(7.35, 4.83, 305);
  const ew4 = isoToScreen(6.25, 4.83, 305);
  drawIsoPoly(ctx, [ew1, ew2, ew3, ew4], isEvening ? '#678099' : '#8aa2b8', INK, 2);

  const blkPos = isoToScreen(6.92, 4.85, 396);
  ctx.save();
  ctx.translate(blkPos.x, blkPos.y);
  ctx.transform(0.89, 0.445, 0, 1, 0, 0);
  ctx.fillStyle = isEvening ? '#528cb3' : '#356a8f';
  ctx.font = 'bold 21px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('260', 0, 0);
  ctx.restore();

  // Air-con compressor ledges
  [7.8, 12.0, 16.2].forEach((bx) => {
    const ac1 = isoToScreen(bx + 0.15, 4.86, 224);
    const ac2 = isoToScreen(bx + 0.72, 4.86, 224);
    const ac3 = isoToScreen(bx + 0.72, 4.86, 242);
    const ac4 = isoToScreen(bx + 0.15, 4.86, 242);
    drawIsoPoly(ctx, [ac1, ac2, ac3, ac4], isEvening ? '#98a0a8' : '#d2d7de', INK, 1.4);
    ctx.fillStyle = '#39404a';
    ctx.beginPath();
    ctx.arc((ac1.x + ac2.x) / 2, (ac1.y + ac3.y) / 2, 4, 0, Math.PI * 2);
    ctx.fill();
  });

  // SUNSHINE MINIMART YELLOW SIGNBOARD
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
  const pillarGys = [4.9, 2.3, -0.3];
  for (const gy of pillarGys) {
    drawIsoBox(ctx, 1.28, gy - 0.14, 1.56, gy + 0.14, 0, 114, '#c7c2b8', '#b5afa4', '#999288', INK, 1.8);
    drawIsoBox(ctx, 1.22, gy - 0.2, 1.62, gy + 0.2, 0, 12, '#aba498', '#948e82', '#7d776d', INK, 1.5);
    drawIsoBox(ctx, 4.26, gy - 0.14, 4.54, gy + 0.14, 0, 114, '#c7c2b8', '#b5afa4', '#999288', INK, 1.8);
    drawIsoBox(ctx, 4.2, gy - 0.2, 4.6, gy + 0.2, 0, 12, '#aba498', '#948e82', '#7d776d', INK, 1.5);
  }

  const ridgeGx = 2.92;
  const zEave = 114;
  const zRidge = 142;

  const fl = isoToScreen(0.95, 5.2, zEave);
  const fr = isoToScreen(4.9, 5.2, zEave);
  const fMid = isoToScreen(ridgeGx, 5.2, zRidge);
  ctx.beginPath();
  ctx.moveTo(fl.x, fl.y);
  ctx.quadraticCurveTo(fMid.x, fMid.y - 12, fr.x, fr.y);
  ctx.lineTo(fr.x, fr.y + 8);
  ctx.quadraticCurveTo(fMid.x, fMid.y - 4, fl.x, fl.y + 8);
  ctx.closePath();
  ctx.fillStyle = isEvening ? '#87837b' : '#c7c1b3';
  ctx.fill();
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.stroke();

  const bl = isoToScreen(0.95, -2.0, zEave);
  const br = isoToScreen(4.9, -2.0, zEave);
  const bMid = isoToScreen(ridgeGx, -2.0, zRidge);

  drawIsoPoly(ctx, [fl, fMid, bMid, bl], isEvening ? '#767a84' : '#a9a499', INK, 2);
  drawIsoPoly(ctx, [fMid, fr, br, bMid], isEvening ? '#5e626d' : '#948f85', INK, 2);

  ctx.strokeStyle = isEvening ? 'rgba(30,30,36,0.45)' : 'rgba(55,50,44,0.35)';
  ctx.lineWidth = 1.5;
  for (let gy = 4.6; gy >= -1.8; gy -= 0.75) {
    const rl = isoToScreen(1.0, gy, zEave);
    const rm = isoToScreen(ridgeGx, gy, zRidge);
    const rr = isoToScreen(4.85, gy, zEave);
    ctx.beginPath();
    ctx.moveTo(rl.x, rl.y);
    ctx.lineTo(rm.x, rm.y);
    ctx.lineTo(rr.x, rr.y);
    ctx.stroke();
  }

  if (isEvening) {
    for (let i = 0; i < 6; i++) {
      const gy = 4.6 - i * 1.1;
      const bulb = isoToScreen(4.35, gy, 110);
      const twinkle = 0.75 + 0.25 * Math.sin(time * 3 + i * 1.3);
      const g = ctx.createRadialGradient(bulb.x, bulb.y, 1, bulb.x, bulb.y, 16);
      g.addColorStop(0, `rgba(255, 224, 130, ${0.85 * twinkle})`);
      g.addColorStop(1, 'rgba(255, 224, 130, 0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, 16, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#fff2b2';
      ctx.beginPath();
      ctx.arc(bulb.x, bulb.y, 2.5, 0, Math.PI * 2);
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

  ctx.fillStyle = isEvening ? 'rgba(18,22,30,0.38)' : 'rgba(40,48,28,0.28)';
  ctx.beginPath();
  ctx.ellipse(base.x, base.y + 4, 42 * scale, 18 * scale, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.fillStyle = isEvening ? '#523a29' : '#734f35';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2.2;
  ctx.beginPath();
  ctx.moveTo(base.x - 10 * scale, base.y + 2);
  ctx.quadraticCurveTo(base.x - 6 * scale, base.y - 45 * scale, base.x - 24 * scale, base.y - 84 * scale);
  ctx.lineTo(base.x - 14 * scale, base.y - 88 * scale);
  ctx.lineTo(base.x, base.y - 62 * scale);
  ctx.lineTo(base.x + 20 * scale, base.y - 86 * scale);
  ctx.lineTo(base.x + 26 * scale, base.y - 78 * scale);
  ctx.quadraticCurveTo(base.x + 8 * scale, base.y - 42 * scale, base.x + 12 * scale, base.y + 2);
  ctx.closePath();
  ctx.fill();
  ctx.stroke();

  const darkLeaf = isEvening ? '#2b4a33' : '#4a7337';
  const midLeaf = isEvening ? '#3c6340' : '#6b9c46';
  const lightLeaf = isEvening ? '#4e7d4b' : '#8ec25b';

  const clusters = [
    { dx: -40, dy: -88, r: 34 },
    { dx: 40, dy: -86, r: 32 },
    { dx: -20, dy: -118, r: 36 },
    { dx: 26, dy: -114, r: 35 },
    { dx: 0, dy: -96, r: 40 },
    { dx: 2, dy: -136, r: 32 },
  ];

  clusters.forEach((c) => {
    const cx = base.x + c.dx * scale + sway * 0.4;
    const cy = base.y + c.dy * scale;
    const r = c.r * scale;
    ctx.fillStyle = darkLeaf;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2.2;
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

function drawFootpathLamp(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const base = isoToScreen(gx, gy, 0);
  ctx.fillStyle = '#40454f';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.fillRect(base.x - 3, base.y - 84, 6, 84);
  ctx.strokeRect(base.x - 3, base.y - 84, 6, 84);

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
  // Leaves zebra crossing gap at gx = 5.4 .. 7.8 open!
  const drawRailSegment = (gxStart: number, gxEnd: number) => {
    const gy = 10.15;
    const h = 36;
    const railColor = isEvening ? '#767d87' : '#a4aab3';
    const pStartT = isoToScreen(gxStart, gy, h);
    const pEndT = isoToScreen(gxEnd, gy, h);
    const pStartM = isoToScreen(gxStart, gy, h * 0.55);
    const pEndM = isoToScreen(gxEnd, gy, h * 0.55);

    for (let gx = gxStart; gx <= gxEnd; gx += 0.48) {
      const pb = isoToScreen(gx, gy, 0);
      const pt = isoToScreen(gx, gy, h);
      ctx.strokeStyle = INK;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(pb.x, pb.y);
      ctx.lineTo(pt.x, pt.y);
      ctx.stroke();
      ctx.strokeStyle = railColor;
      ctx.lineWidth = 2;
      ctx.stroke();
    }

    [
      [pStartM, pEndM],
      [pStartT, pEndT],
    ].forEach(([a, b]) => {
      ctx.strokeStyle = INK;
      ctx.lineWidth = 5.5;
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.strokeStyle = railColor;
      ctx.lineWidth = 2.8;
      ctx.stroke();
    });
  };

  drawRailSegment(2.2, 5.2);
  drawRailSegment(8.0, 15.0);
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
    ctx.fillStyle = stoneSide;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillRect(p.x - rx * 0.45, p.y - h, rx * 0.9, h);
    ctx.strokeRect(p.x - rx * 0.45, p.y - h, rx * 0.9, h);
    ctx.fillStyle = stoneTop;
    ctx.beginPath();
    ctx.ellipse(p.x, p.y - h, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
  };

  drawRoundPiece(gx + stoolOffsets[2].dx, gy + stoolOffsets[2].dy, 12, 7, 14);
  drawRoundPiece(gx + stoolOffsets[0].dx, gy + stoolOffsets[0].dy, 12, 7, 14);
  drawRoundPiece(gx, gy, 30, 17, 24);

  // Xiangqi grid on stone table
  const tc = isoToScreen(gx, gy, 24);
  ctx.strokeStyle = '#9c4338';
  ctx.lineWidth = 1.1;
  ctx.strokeRect(tc.x - 10, tc.y - 5, 20, 10);
  ctx.beginPath();
  ctx.moveTo(tc.x - 10, tc.y);
  ctx.lineTo(tc.x + 10, tc.y);
  ctx.moveTo(tc.x, tc.y - 5);
  ctx.lineTo(tc.x, tc.y + 5);
  ctx.stroke();

  // Chope white-and-blue pocket tissue packet!
  ctx.fillStyle = '#f8f5ef';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1;
  ctx.fillRect(tc.x + 11, tc.y - 2, 7, 4);
  ctx.strokeRect(tc.x + 11, tc.y - 2, 7, 4);

  drawRoundPiece(gx + stoolOffsets[1].dx, gy + stoolOffsets[1].dy, 12, 7, 14);
  drawRoundPiece(gx + stoolOffsets[3].dx, gy + stoolOffsets[3].dy, 12, 7, 14);
}

function drawBusStopPole(ctx: CanvasRenderingContext2D, gx: number, gy: number, isEvening: boolean) {
  const base = isoToScreen(gx, gy, 0);
  ctx.fillStyle = isEvening ? '#5b6370' : '#858d99';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.fillRect(base.x - 2.5, base.y - 76, 5, 76);
  ctx.strokeRect(base.x - 2.5, base.y - 76, 5, 76);

  ctx.fillStyle = '#e88e35';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.beginPath();
  ctx.roundRect(base.x - 16, base.y - 102, 32, 26, 4);
  ctx.fill();
  ctx.stroke();

  ctx.fillStyle = '#fff7e6';
  ctx.fillRect(base.x - 13, base.y - 98, 26, 18);
  ctx.fillStyle = '#231a16';
  ctx.font = 'bold 8px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BUS', base.x, base.y - 90);
  ctx.fillStyle = '#b53a35';
  ctx.font = 'bold 8.5px "Silkscreen", monospace';
  ctx.fillText('88', base.x, base.y - 82);
}

function drawBlkSignPlaque(ctx: CanvasRenderingContext2D, gx: number, gy: number, z: number) {
  const p1 = isoToScreen(gx - 0.24, gy + 0.34, z);
  const p2 = isoToScreen(gx + 0.24, gy + 0.34, z);
  const p3 = { x: p2.x, y: p2.y - 20 };
  const p4 = { x: p1.x, y: p1.y - 20 };
  drawIsoPoly(ctx, [p1, p2, p3, p4], '#2c5a82', INK, 1.5);
  const midX = (p1.x + p3.x) / 2;
  const midY = (p1.y + p3.y) / 2 + 2;
  ctx.save();
  ctx.translate(midX, midY);
  ctx.transform(0.89, 0.445, 0, 1, 0, 0);
  ctx.fillStyle = '#f8f5ef';
  ctx.font = 'bold 7.5px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('BLK 260', 0, 1);
  ctx.restore();
}

function drawSingaporePublicBus(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  isEvening: boolean
) {
  // Realistic Singapore Maroon/Purple-Cream City Bus parked cleanly at Stop 26019 bus bay!
  drawIsoBox(
    ctx,
    gx - 1.45,
    gy - 0.58,
    gx + 1.45,
    gy + 0.58,
    7,
    56,
    isEvening ? '#b8b2c4' : '#e6e2eb',
    isEvening ? '#7a475e' : '#a85d7e',
    isEvening ? '#63374c' : '#8c4866',
    INK,
    2
  );

  // Cream upper window band along +gy side
  const w1 = isoToScreen(gx - 1.32, gy + 0.6, 30);
  const w2 = isoToScreen(gx + 1.32, gy + 0.6, 30);
  const w3 = isoToScreen(gx + 1.32, gy + 0.6, 52);
  const w4 = isoToScreen(gx - 1.32, gy + 0.6, 52);
  drawIsoPoly(ctx, [w1, w2, w3, w4], isEvening ? '#e8d49c' : '#43586e', INK, 1.5);

  // Bus front windshield (+gx) & LED route number "88"
  const fw1 = isoToScreen(gx + 1.46, gy - 0.45, 24);
  const fw2 = isoToScreen(gx + 1.46, gy + 0.45, 24);
  const fw3 = isoToScreen(gx + 1.46, gy + 0.45, 52);
  const fw4 = isoToScreen(gx + 1.46, gy - 0.45, 52);
  drawIsoPoly(ctx, [fw1, fw2, fw3, fw4], '#2c3847', INK, 1.5);

  // Glowing Amber "88" LED route display on front top
  const led = isoToScreen(gx + 1.48, gy, 55);
  ctx.fillStyle = '#1b1d24';
  ctx.fillRect(led.x - 10, led.y - 5, 20, 9);
  ctx.fillStyle = '#f7be45';
  ctx.font = 'bold 7.5px "Silkscreen", monospace';
  ctx.textAlign = 'center';
  ctx.fillText('88', led.x, led.y + 2);

  // Warm headlights at evening
  if (isEvening) {
    const hl = isoToScreen(gx + 1.5, gy + 0.35, 14);
    ctx.fillStyle = '#fff0a6';
    ctx.beginPath();
    ctx.arc(hl.x, hl.y, 4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Wheels
  [-0.85, 0.85].forEach((wx) => {
    const wp = isoToScreen(gx + wx, gy + 0.6, 7);
    ctx.fillStyle = '#21242b';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = '#8b93a1';
    ctx.beginPath();
    ctx.arc(wp.x, wp.y, 4, 0, Math.PI * 2);
    ctx.fill();
  });
}

function drawMicroEVCar(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  isEvening: boolean
) {
  drawIsoBox(
    ctx,
    gx - 0.65,
    gy - 0.42,
    gx + 0.65,
    gy + 0.42,
    5,
    24,
    isEvening ? '#878ca8' : '#b2b8d4',
    isEvening ? '#6d728c' : '#949ab8',
    isEvening ? '#575c73' : '#7b819e',
    INK,
    1.8
  );
  drawIsoBox(
    ctx,
    gx - 0.42,
    gy - 0.36,
    gx + 0.36,
    gy + 0.36,
    29,
    16,
    isEvening ? '#989eb8' : '#c4cae3',
    '#435266',
    '#344152',
    INK,
    1.5
  );
  if (isEvening) {
    const hl = isoToScreen(gx - 0.66, gy + 0.25, 14);
    ctx.fillStyle = '#fff0a6';
    ctx.beginPath();
    ctx.arc(hl.x, hl.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }
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

  ctx.fillStyle = 'rgba(20,16,12,0.3)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 1, 10, 5, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = INK;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(p.x - 6, p.y - 6);
  ctx.quadraticCurveTo(p.x - 14, p.y - 12 + tailWag, p.x - 12, p.y - 18 + tailWag);
  ctx.stroke();
  ctx.strokeStyle = furColor;
  ctx.lineWidth = 2;
  ctx.stroke();

  ctx.fillStyle = furColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.6;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y - 6, 8, 6, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.stroke();

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

function drawGroundPickupItem(
  ctx: CanvasRenderingContext2D,
  gx: number,
  gy: number,
  kind: 'ezlink' | 'kopi' | 'chope',
  time: number
) {
  const p = isoToScreen(gx, gy, 2);
  const pulse = 0.65 + 0.35 * Math.sin(time * 4);
  ctx.strokeStyle = `rgba(255, 224, 102, ${pulse})`;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.ellipse(p.x, p.y, 14, 8, 0, 0, Math.PI * 2);
  ctx.stroke();

  if (kind === 'ezlink') {
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
  } else if (kind === 'kopi') {
    ctx.fillStyle = '#633c26';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.5;
    ctx.fillRect(p.x - 5, p.y - 10, 10, 12);
    ctx.strokeRect(p.x - 5, p.y - 10, 10, 12);
    ctx.strokeStyle = '#d1433b';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x - 5, p.y - 10);
    ctx.lineTo(p.x + 5, p.y - 10);
    ctx.stroke();
  } else {
    ctx.fillStyle = '#f7f4ec';
    ctx.strokeStyle = INK;
    ctx.lineWidth = 1.4;
    ctx.fillRect(p.x - 7, p.y - 4, 14, 8);
    ctx.strokeRect(p.x - 7, p.y - 4, 14, 8);
    ctx.fillStyle = '#4f82b8';
    ctx.fillRect(p.x - 7, p.y - 1, 14, 3);
  }
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
    hasTrolley?: boolean;
    hasApron?: boolean;
    isBald?: boolean;
    showGreenMarker?: boolean;
    time: number;
    label?: string;
  }
) {
  const p = isoToScreen(opts.gx, opts.gy, 0);
  const bob = opts.isMoving ? Math.abs(Math.sin(opts.walkPhase)) * 3 : 0;
  const stride = opts.isMoving ? Math.sin(opts.walkPhase) * 4 : 0;

  ctx.fillStyle = 'rgba(20, 16, 12, 0.34)';
  ctx.beginPath();
  ctx.ellipse(p.x, p.y + 2, 13, 6.5, 0, 0, Math.PI * 2);
  ctx.fill();

  const x = p.x;
  const y = p.y - bob;

  const facingRight = opts.dir === 'SE' || opts.dir === 'NE';
  const facingBack = opts.dir === 'NE' || opts.dir === 'NW';

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

    ctx.fillStyle = '#e8c468';
    ctx.fillRect(sx - 3, sy - 4, 6, 7);
  };

  // Legs + Shoes / Slippers
  ctx.fillStyle = opts.pantsColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  ctx.fillRect(x - 7, y - 16 + stride * 0.4, 6, 12);
  ctx.strokeRect(x - 7, y - 16 + stride * 0.4, 6, 12);
  ctx.fillRect(x + 1, y - 16 - stride * 0.4, 6, 12);
  ctx.strokeRect(x + 1, y - 16 - stride * 0.4, 6, 12);

  ctx.fillStyle = opts.isBald ? '#8c5f3f' : '#d9dfe6';
  ctx.fillRect(x - 8, y - 5 + stride * 0.4, 7, 4);
  ctx.strokeRect(x - 8, y - 5 + stride * 0.4, 7, 4);
  ctx.fillRect(x + 1, y - 5 - stride * 0.4, 7, 4);
  ctx.strokeRect(x + 1, y - 5 - stride * 0.4, 7, 4);

  if (!facingBack) drawShield(false);

  // Torso
  ctx.fillStyle = opts.shirtColor;
  ctx.fillRect(x - 9, y - 34, 18, 19);
  ctx.strokeRect(x - 9, y - 34, 18, 19);

  // Hawker Apron
  if (opts.hasApron) {
    ctx.fillStyle = '#385c4a';
    ctx.fillRect(x - 7, y - 30, 14, 17);
    ctx.strokeRect(x - 7, y - 30, 14, 17);
  }

  // Arms
  ctx.fillStyle = opts.skinTone;
  ctx.fillRect(x - 13, y - 32 - stride * 0.3, 4, 13);
  ctx.strokeRect(x - 13, y - 32 - stride * 0.3, 4, 13);
  ctx.fillRect(x + 9, y - 32 + stride * 0.3, 4, 13);
  ctx.strokeRect(x + 9, y - 32 + stride * 0.3, 4, 13);

  ctx.fillStyle = opts.shirtColor;
  ctx.fillRect(x - 13, y - 33, 5, 6);
  ctx.strokeRect(x - 13, y - 33, 5, 6);
  ctx.fillRect(x + 8, y - 33, 5, 6);
  ctx.strokeRect(x + 8, y - 33, 5, 6);

  // Reusable Singapore Grocery Bag
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

  // Silver Metal FairMart Grocery Shopping Trolley pushed by Auntie!
  if (opts.hasTrolley) {
    const tx = facingRight ? x + 16 : x - 28;
    const ty = y - 22;
    ctx.strokeStyle = INK;
    ctx.lineWidth = 2;
    ctx.fillStyle = 'rgba(190, 215, 228, 0.55)';
    ctx.beginPath();
    ctx.rect(tx, ty, 16, 12);
    ctx.fill();
    ctx.stroke();
    // Wire grid inside basket
    ctx.strokeStyle = '#687687';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(tx + 5, ty);
    ctx.lineTo(tx + 5, ty + 12);
    ctx.moveTo(tx + 11, ty);
    ctx.lineTo(tx + 11, ty + 12);
    ctx.stroke();
    // Handle & Wheels
    ctx.strokeStyle = '#231a16';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(facingRight ? tx : tx + 16, ty);
    ctx.lineTo(facingRight ? tx - 4 : tx + 20, ty - 5);
    ctx.stroke();
    ctx.fillStyle = '#2b2f38';
    ctx.beginPath();
    ctx.arc(tx + 3, ty + 16, 2.5, 0, Math.PI * 2);
    ctx.arc(tx + 13, ty + 16, 2.5, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = opts.skinTone;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.roundRect(x - 9, y - 54, 18, 19, 5);
  ctx.fill();
  ctx.stroke();

  if (!facingBack) {
    const eyeShift = facingRight ? 2 : -2;
    ctx.fillStyle = INK;
    ctx.fillRect(x - 4 + eyeShift, y - 46, 2.2, 3);
    ctx.fillRect(x + 2 + eyeShift, y - 46, 2.2, 3);
    ctx.fillStyle = '#8f5b4a';
    ctx.fillRect(x - 2 + eyeShift, y - 40, 4, 1.5);
  }

  ctx.fillStyle = opts.hairColor;
  ctx.strokeStyle = INK;
  ctx.lineWidth = 1.8;
  if (opts.isBald) {
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

  ctx.fillStyle = isEvening ? '#d4cde3' : '#f5efe6';
  ctx.strokeStyle = INK;
  ctx.lineWidth = 3;

  ctx.beginPath();
  ctx.roundRect(left, top, boxW, boxH, 10);
  ctx.fill();
  ctx.stroke();

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

  [
    { dx: -24, dy: -18, r: 22 },
    { dx: 22, dy: -16, r: 20 },
    { dx: 0, dy: -28, r: 26 },
  ].forEach((b) => {
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

  // 1. Ground, Skyline Vista, Road, Zebra Crossing & Footpaths
  drawGroundAndRoads(ctx, isEvening, state.time);

  // 2. Elevated MRT Viaduct & Moving Train + Park Fitness Corner
  drawMRTViaductAndTrain(ctx, isEvening, state.time);
  drawFitnessCornerAndPark(ctx, isEvening);

  // 3. Sheltered Walkway BEFORE HDB Block
  drawShelteredWalkway(ctx, isEvening, state.time);

  // 4. Kopi Corner & Sengkang Satay Hawker Stalls
  drawKopitiamStalls(ctx, isEvening, state.time);

  // 5. Void Deck Interior, Letterboxes, RC Notice Board & Minimart
  drawVoidDeckBackdropAndMinimart(ctx, isEvening);

  // 6. Upper HDB Block Facade + Exposed Pipes + Corridors + Yellow Minimart Sign
  drawHDBUpperBuilding(ctx, isEvening);
  drawExposedHDBRiserPipes(ctx, isEvening);

  // 7. Park Rain Trees (framing left fitness park & Kopi Corner cleanly!)
  drawTree(ctx, -0.5, 2.2, 0.78, isEvening, state.time);
  drawTree(ctx, -3.2, 9.2, 0.88, isEvening, state.time);

  // 8. Click-to-walk destination marker
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

  // 9. Depth-sorted Isometric Objects (Tables, Diners, Bus, EV, Cats, NPCs, Player, Railings)
  interface SortableDraw {
    depth: number;
    draw: () => void;
  }
  const drawables: SortableDraw[] = [];

  // Kopitiam outdoor round tables with seated SG diners!
  drawables.push({
    depth: -0.2 + 6.4,
    draw: () => drawKopitiamTableWithDiners(ctx, -0.2, 6.4, isEvening),
  });
  drawables.push({
    depth: 0.4 + 8.3,
    draw: () => drawKopitiamTableWithDiners(ctx, 0.4, 8.3, isEvening),
  });

  // Mosaic HDB Pillars
  drawables.push({
    depth: 6.0 + 4.8,
    draw: () => {
      drawMosaicPillar(ctx, 6.0, 4.8, 198, isEvening);
      drawBlkSignPlaque(ctx, 6.0, 4.82, 74);
    },
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

  // Bus Stop Pole (Stop 26019 — BUS 88)
  drawables.push({
    depth: 4.9 + 10.0,
    draw: () => drawBusStopPole(ctx, 4.9, 10.0, isEvening),
  });

  // Green Recycling Bins (near Uncle & near Kopi Corner)
  drawables.push({
    depth: 5.5 + 5.7,
    draw: () => drawRecyclingBin(ctx, 5.5, 5.7, isEvening),
  });
  drawables.push({
    depth: 2.3 + 4.8,
    draw: () => drawRecyclingBin(ctx, 2.3, 4.8, isEvening),
  });

  // Round Stone Xiangqi Table & Stools
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

  // Collectible Realistic SG Items on Ground (until picked up!)
  if (!state.ezLinkPickedUp) {
    drawables.push({
      depth: 8.6 + 3.8,
      draw: () => drawGroundPickupItem(ctx, 8.6, 3.8, 'ezlink', state.time),
    });
  }
  if (!state.kopiPickedUp) {
    drawables.push({
      depth: -0.6 + 7.2,
      draw: () => drawGroundPickupItem(ctx, -0.6, 7.2, 'kopi', state.time),
    });
  }
  if (!state.chopePickedUp) {
    drawables.push({
      depth: 9.8 + 4.2,
      draw: () => drawGroundPickupItem(ctx, 9.8, 4.2, 'chope', state.time),
    });
  }

  // Footpath Heritage Lamp
  drawables.push({
    depth: 9.8 + 9.4,
    draw: () => drawFootpathLamp(ctx, 9.8, 9.4, isEvening),
  });

  // Pedestrian Metal Railing (split neatly around Zebra Crossing!)
  drawables.push({
    depth: 10.2 + 10.15,
    draw: () => drawPedestrianRailing(ctx, isEvening),
  });

  // Singapore Public Bus (ShieldBus 88) parked in bus bay!
  drawables.push({
    depth: 2.8 + 12.6,
    draw: () => drawSingaporePublicBus(ctx, 2.8, 12.6, isEvening),
  });

  // Animated Micro EV cruising on Left-Hand lane!
  const evGx = 14.0 - ((state.time * 1.15) % 16);
  drawables.push({
    depth: evGx + 13.4,
    draw: () => drawMicroEVCar(ctx, evGx, 13.4, isEvening),
  });

  // Foreground right low bushes
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
          isMoving: npc.id === 'auntie' || npc.id === 'commuter',
          walkPhase: state.time * 4.0,
          skinTone: npc.skinTone,
          hairColor: npc.hairColor,
          shirtColor: npc.shirtColor,
          pantsColor: npc.pantsColor,
          hasPlasticBag: npc.hasBag,
          hasTrolley: npc.hasTrolley,
          hasApron: npc.hasApron,
          isBald: npc.isBald,
          time: state.time,
          label: state.hoveredTarget === npc.id ? npc.name : undefined,
        }),
    });
  });

  drawables.sort((a, b) => a.depth - b.depth);
  drawables.forEach((item) => item.draw());

  if (isEvening) {
    ctx.fillStyle = 'rgba(20, 26, 52, 0.22)';
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

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
