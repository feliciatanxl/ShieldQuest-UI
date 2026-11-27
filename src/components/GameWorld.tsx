import React, { useCallback, useEffect, useRef, useState } from 'react';
import { DISTRICT_NAMES, DistrictId, readDistrict } from '../data/districts';
import {
  DISTRICTS, WORLD_HEIGHT, WORLD_WIDTH, districtAt, localPoint, worldPoint,
} from '../data/worldMap';
import {
  ISO_MINIMART_CENTER,
  ISO_MR_LIM_POS,
  ISO_WEI_MING_POS,
} from '../data/singaporeWorld';
import { isoToWorld, tileAtWorld } from '../game/isoGrid';
import { landmarkNear } from '../game/expansionGeometry';
import { canWalkAt, canWalkIn } from '../game/neighbourhoodCollision';
import { districtResidents } from '../game/districtResidents';
import { findWalkRoute } from '../game/districtNavigation';
import {
  AUNTIE_PATH,
  CANVAS_H,
  CANVAS_W,
  directionFor,
  ITEM_POS,
  MINIMART_ZONE,
  PLAYER_START,
  Pt,
  renderScene,
  RenderState,
  UNCLE_POS,
} from '../game/sceneRenderer';
import {
  AvatarConfig,
  Direction,
  DrawerType,
  InventoryItem,
  NPCEntity,
  QuestId,
  ShieldLetter,
  ShieldSkillState,
} from '../types/game';
import { Wallet, WorldSave } from '../utils/save';
import { SingaporeClock } from '../utils/sgClock';
import { sfx } from '../utils/sound';
import { GameDrawers } from './GameDrawers';
import { GameHUD } from './GameHUD';
import { LookoutDilemmaModal } from './LookoutDilemmaModal';
import { TouchJoystick, type TouchMovement } from './TouchJoystick';

interface GameWorldProps {
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  clock: SingaporeClock;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  skills: Record<ShieldLetter, ShieldSkillState>;
  onCompleteSkill: (letter: ShieldLetter, passed: boolean, score: number) => void;
  squadCode: string;
  wallet: Wallet;
  /** Grants a one-time coin reward by id (see REWARDS). */
  onClaimReward: (id: string) => void;
  onBuyItem: (id: string) => void;
  /** Saved progress to resume from (null = fresh game). */
  initialWorld: WorldSave | null;
  onWorldChange: (world: WorldSave) => void;
  onReturnToTitle: () => void;
}

const WALK_SPEED = 170; // canvas px per second
const RUN_SPEED = 280;

/** Auntie Mei paces the footpath between the two AUNTIE_PATH points. */
function auntieAt(t: number): NPCEntity {
  const k = (Math.sin(t * 0.32) + 1) / 2;
  const [a, b] = AUNTIE_PATH;
  return {
    id: 'auntie',
    name: 'Auntie Mei',
    role: 'FairMart Shopper',
    x: a.x + (b.x - a.x) * k,
    y: a.y + (b.y - a.y) * k,
    dir: Math.cos(t * 0.32) >= 0 ? 'south-east' : 'north-west',
    walking: true,
  };
}

const STATIC_NPCS: NPCEntity[] = [
  { id: 'uncle', name: 'Uncle Tan', role: 'Heartland Elder', ...UNCLE_POS, dir: 'south-west' },
  { id: 'student', name: 'Wei Ming (Student)', role: 'Secondary Student', ...ISO_WEI_MING_POS, dir: 'south-east' },
  { id: 'cashier', name: 'Mr Lim (Cashier)', role: 'Sunshine Minimart Staff', ...ISO_MR_LIM_POS, dir: 'south-west' },
];

/** Feet footprints (canvas px ellipses) the player cannot walk into. */
const NPC_FOOT = { rx: 40, ry: 30 };
const ITEM_FOOT = { rx: 22, ry: 12 };
type Solid = { c: Pt; f: { rx: number; ry: number } };

/** < 1 means (x, y) is inside the footprint. */
function footDist(x: number, y: number, { c, f }: Solid) {
  return ((x - c.x) / f.rx) ** 2 + ((y - c.y) / f.ry) ** 2;
}

/**
 * Can the player step from (cx, cy) to (nx, ny)? Moving out of a footprint is always
 * allowed, so a saved position that overlaps someone never traps the player.
 */
function clearOfSolids(nx: number, ny: number, cx: number, cy: number, solids: Solid[]) {
  return solids.every((o) => {
    const dn = footDist(nx, ny, o);
    return dn >= 1 || dn > footDist(cx, cy, o);
  });
}

/** Hit box for clicking a character: roughly the 2x sprite's body. */
function hitsCharacter(pt: Pt, c: Pt) {
  return Math.abs(pt.x - c.x) < 32 && pt.y < c.y + 6 && pt.y > c.y - 120;
}

export const GameWorld: React.FC<GameWorldProps> = ({
  avatar,
  setAvatar,
  clock,
  inventory,
  setInventory,
  skills,
  onCompleteSkill,
  squadCode,
  wallet,
  onClaimReward,
  onBuyItem,
  initialWorld,
  onWorldChange,
  onReturnToTitle,
}) => {
  const start = initialWorld;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const savedDistrict = readDistrict(start?.district);
  const isIsoSave = start?.isoVersion === 4;
  const legacyPosition = isIsoSave && start && canWalkIn(savedDistrict, start.player.x, start.player.y)
    ? worldPoint(savedDistrict, start.player)
    : null;
  const storedPosition = isIsoSave ? start?.worldPosition : undefined;
  const savedPosition = storedPosition && canWalkAt(storedPosition.x, storedPosition.y) ? storedPosition : legacyPosition;
  const [district, setDistrict] = useState<DistrictId>(
    savedPosition ? districtAt(savedPosition.x, savedPosition.y) ?? savedDistrict : 'block260',
  );
  const districtRef = useRef(district);
  const residentClocks = useRef(new Map<string, number>());
  const currentNpcs = useRef<RenderState['npcs']>([]);
  const route = useRef<Pt[]>([]);

  const [activeDrawer, setActiveDrawer] = useState<DrawerType>(null);
  const [questId, setQuestId] = useState<QuestId>(start?.questId ?? 'ezlink');
  const [ezLinkPickedUp, setEzLinkPickedUp] = useState(start?.ezLinkPickedUp ?? false);
  const [ezLinkReturned, setEzLinkReturned] = useState(start?.ezLinkReturned ?? false);
  const [kopiPickedUp, setKopiPickedUp] = useState(start?.kopiPickedUp ?? false);
  const [chopePickedUp, setChopePickedUp] = useState(start?.chopePickedUp ?? false);
  const [showLookoutModal, setShowLookoutModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(sfx.enabled);
  const [confidencePct, setConfidencePct] = useState(start?.confidencePct ?? 78);
  const [energyPct, setEnergyPct] = useState(start?.energyPct ?? 66);
  const [cursor, setCursor] = useState<'pointer' | 'default'>('default');

  // Mutable simulation refs for smooth 60fps loop without re-renders
  const keysPressed = useRef<Set<string>>(new Set());
  const touchMovement = useRef<TouchMovement>({ x: 0, y: 0, running: false });
  const playerRef = useRef({
    ...(savedPosition ?? worldPoint('block260', PLAYER_START)),
    dir: 'north-east' as Direction,
    isMoving: false,
    walkPhase: 0,
    target: null as Pt | null,
  });
  const walkMarkerRef = useRef<(Pt & { createdAt: number }) | null>(null);
  const hoveredTargetRef = useRef<string | null>(null);
  const hoveredTileRef = useRef<{ col: number; row: number } | null>(null);
  const speechBubbleRef = useRef<RenderState['speech']>(
    start?.ezLinkReturned
      ? { npcId: 'uncle', text: 'Thanks again! Go check Sunshine Minimart!', icon: 'shop' }
      : { npcId: 'uncle', text: 'Eh boy, did you see my bus card?', icon: 'ezlink' }
  );
  const simTimeRef = useRef(0);
  const auntieTimeRef = useRef(0);
  const cameraRef = useRef({ x: 0, y: 0, ready: false });
  const minimartCooldownRef = useRef(-10);
  const nextHawkerMeal = useRef(0);

  const stateSyncRef = useRef({
    avatar,
    timeOfDay: clock.timeOfDay,
    ezLinkPickedUp,
    ezLinkReturned,
    kopiPickedUp,
    chopePickedUp,
  });
  stateSyncRef.current = {
    avatar,
    timeOfDay: clock.timeOfDay,
    ezLinkPickedUp,
    ezLinkReturned,
    kopiPickedUp,
    chopePickedUp,
  };

  // Autosave: on any progress change, every few seconds (player position) and when leaving.
  const worldSnapshot = useRef<() => WorldSave>(() => ({} as WorldSave));
  worldSnapshot.current = () => ({
    questId,
    ezLinkPickedUp,
    ezLinkReturned,
    kopiPickedUp,
    chopePickedUp,
    confidencePct,
    energyPct,
    district: districtRef.current,
    player: localPoint(districtRef.current, {
      x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y),
    }),
    worldPosition: { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
    isoVersion: 4,
  });
  const onWorldChangeRef = useRef(onWorldChange);
  onWorldChangeRef.current = onWorldChange;
  useEffect(() => {
    onWorldChangeRef.current(worldSnapshot.current());
  }, [questId, ezLinkPickedUp, ezLinkReturned, kopiPickedUp, chopePickedUp, confidencePct, energyPct, district]);
  useEffect(() => {
    const id = setInterval(() => onWorldChangeRef.current(worldSnapshot.current()), 3000);
    return () => {
      clearInterval(id);
      onWorldChangeRef.current(worldSnapshot.current());
    };
  }, []);

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
  }, []);

  useEffect(() => {
    if (!toastMsg) return;
    const t = setTimeout(() => setToastMsg(null), 3400);
    return () => clearTimeout(t);
  }, [toastMsg]);

  const pickupEzLink = useCallback(() => {
    if (stateSyncRef.current.ezLinkPickedUp) return;
    sfx.success();
    setEzLinkPickedUp(true);
    setInventory((prev) =>
      prev.map((item) => (item.id === 'ezlink' ? { ...item, collected: true } : item))
    );
    setEnergyPct((v) => Math.min(100, v + 10));
    onClaimReward('ezlink-found');
    showToast("Picked up Uncle's SimplyGo EZ-Link Card! Bring it back to Uncle Tan.");
  }, [setInventory, showToast, onClaimReward]);

  const pickupSideItem = useCallback(
    (id: 'kopi' | 'chope', label: string) => {
      sfx.success();
      if (id === 'kopi') setKopiPickedUp(true);
      if (id === 'chope') setChopePickedUp(true);
      setInventory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, collected: true } : item))
      );
      onClaimReward(id);
      showToast(`Added ${label} to your Backpack!`);
    },
    [setInventory, showToast, onClaimReward]
  );

  const returnEzLinkToUncle = useCallback(() => {
    if (!stateSyncRef.current.ezLinkPickedUp || stateSyncRef.current.ezLinkReturned) return;
    sfx.success();
    setEzLinkReturned(true);
    setQuestId('lookout');
    setConfidencePct((v) => Math.min(100, v + 12));
    setInventory((prev) =>
      prev.map((item) => (item.id === 'ezlink' ? { ...item, collected: false } : item))
    );
    speechBubbleRef.current = {
      npcId: 'uncle',
      text: 'Wah, steady lah! Check Sunshine Minimart next!',
      icon: 'shop',
    };
    onClaimReward('ezlink-return');
    showToast('Quest Complete! Next Quest: The Lookout Dilemma at Sunshine Minimart.');
  }, [setInventory, showToast, onClaimReward]);

  // Keyboard listeners
  useEffect(() => {
    const clearKeys = () => keysPressed.current.clear();
    clearKeys();
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeDrawer || showLookoutModal) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        keysPressed.current.add(k);
        // Manual keys cancel click-to-walk
        if (k !== 'shift') {
          playerRef.current.target = null;
          route.current = [];
        }
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('blur', clearKeys);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('blur', clearKeys);
    };
  }, [activeDrawer, showLookoutModal]);

  // Main 60fps simulation + render loop
  useEffect(() => {
    let rafId = 0;
    let lastNow = performance.now();

    const step = (now: number) => {
      const dt = Math.min(0.05, (now - lastNow) / 1000);
      lastNow = now;
      simTimeRef.current += dt;
      const t = simTimeRef.current;

      const p = playerRef.current;
      const sync = stateSyncRef.current;
      const originalPlayer = localPoint('block260', p);

      // Auntie Mei waits instead of walking into the player.
      const auntieNext = { c: auntieAt(auntieTimeRef.current + dt), f: NPC_FOOT };
      const auntieNow = { c: auntieAt(auntieTimeRef.current), f: NPC_FOOT };
      const auntieDistance = footDist(originalPlayer.x, originalPlayer.y, auntieNext);
      const auntieBlocked = auntieDistance < 1.2 && auntieDistance < footDist(originalPlayer.x, originalPlayer.y, auntieNow);
      if (!auntieBlocked) auntieTimeRef.current += dt;
      const npcs = DISTRICTS.flatMap((area) => {
        const residents = area === 'block260'
          ? [...STATIC_NPCS, { ...auntieAt(auntieTimeRef.current), walking: !auntieBlocked }]
          : districtResidents(area, localPoint(area, p), dt, residentClocks.current);
        return residents.map((npc) => ({
          ...npc, ...worldPoint(area, npc), worldKey: `${area}:${npc.id}`,
        }));
      });
      currentNpcs.current = npcs;

      const solids: Solid[] = npcs.map((n) => ({ c: n, f: NPC_FOOT }));
      if (!sync.ezLinkPickedUp) solids.push({ c: worldPoint('block260', ITEM_POS.ezlink), f: ITEM_FOOT });
      if (!sync.kopiPickedUp) solids.push({ c: worldPoint('block260', ITEM_POS.kopi), f: ITEM_FOOT });
      if (!sync.chopePickedUp) solids.push({ c: worldPoint('block260', ITEM_POS.chope), f: ITEM_FOOT });
      const canStand = (nx: number, ny: number) =>
        canWalkAt(nx, ny)
        && canWalkAt((p.x + nx) / 2, (p.y + ny) / 2)
        && clearOfSolids(nx, ny, p.x, p.y, solids);

      const keys = keysPressed.current;
      const paused = !!activeDrawer || showLookoutModal;
      const touch = touchMovement.current;
      const running = keys.has('shift') || touch.running;
      const speed = running ? RUN_SPEED : WALK_SPEED;

      let dx = 0;
      let dy = 0;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      if (paused) {
        dx = dy = 0;
      } else if (dx === 0 && dy === 0) {
        ({ x: dx, y: dy } = touch);
      }

      if (!paused && dx === 0 && dy === 0) {
        if (!p.target && route.current.length) p.target = route.current.shift() ?? null;
      }
      if (!paused && dx === 0 && dy === 0 && p.target) {
        dx = p.target.x - p.x;
        dy = p.target.y - p.y;
        if (Math.hypot(dx, dy) < 6) {
          p.target = route.current.shift() ?? null;
          dx = dy = 0;
        }
      }

      if (dx !== 0 || dy !== 0) {
        const len = Math.hypot(dx, dy);
        const mx = (dx / len) * speed * dt;
        const my = (dy / len) * speed * dt;
        p.isMoving = true;
        p.walkPhase += dt * (running ? 14 : 10);
        p.dir = directionFor(dx, dy);

        // Walking up to a person or item you clicked: stop once you bump into it.
        // Only counts when the thing in the way is the person/item that was clicked.
        const target = p.target;
        const nearTarget =
          !!target &&
          solids.some(
            (o) => !clearOfSolids(p.x + mx, p.y + my, p.x, p.y, [o]) && footDist(target.x, target.y, o) < 2.5
          );
        // Blocked? Steer up to 90° either side so we slide around pillars, tables and people.
        const step =
          nearTarget
            ? undefined
            : [0, 0.5, -0.5, 1, -1, 1.5, -1.5]
                .map((turn) => {
                  const c = Math.cos(turn);
                  const s = Math.sin(turn);
                  return { x: mx * c - my * s, y: mx * s + my * c };
                })
                .find((v) => canStand(p.x + v.x, p.y + v.y));
        if (step) {
          p.x += step.x;
          p.y += step.y;
        } else {
          if (!p.target || !route.current.length) p.target = null;
          p.isMoving = false;
        }
      } else {
        p.isMoving = false;
      }

      const area = districtAt(p.x, p.y);
      if (area && area !== districtRef.current) {
        districtRef.current = area;
        setDistrict(area);
        showToast(DISTRICT_NAMES[area]);
      }
      const original = area === 'block260';
      const local = localPoint('block260', p);
      const near = (q: Pt, r: number) => Math.hypot(local.x - q.x, local.y - q.y) < r;

      if (original && !sync.ezLinkPickedUp && near(ITEM_POS.ezlink, 44)) pickupEzLink();
      if (original && !sync.kopiPickedUp && near(ITEM_POS.kopi, 40)) pickupSideItem('kopi', 'Kopi-O Dabao Packet');
      if (original && !sync.chopePickedUp && near(ITEM_POS.chope, 40)) {
        pickupSideItem('chope', 'Pocket Tissue ("Chope" Pack)');
      }
      if (original && sync.ezLinkPickedUp && !sync.ezLinkReturned && near(UNCLE_POS, 70)) returnEzLinkToUncle();

      const z = MINIMART_ZONE;
      const destination = route.current.at(-1) ?? p.target ?? p;
      if (
        original &&
        local.x >= z.x0 &&
        local.x <= z.x1 &&
        local.y >= z.y0 &&
        local.y <= z.y1 &&
        districtAt(destination.x, destination.y) === 'block260' &&
        t - minimartCooldownRef.current > 4 &&
        !showLookoutModal &&
        !activeDrawer
      ) {
        minimartCooldownRef.current = t;
        p.target = null;
        setShowLookoutModal(true);
      }

      const items: RenderState['items'] = [];
      if (!sync.ezLinkPickedUp) items.push({ kind: 'ezlink' });
      if (!sync.kopiPickedUp) items.push({ kind: 'kopi' });
      if (!sync.chopePickedUp) items.push({ kind: 'chope' });

      // The same camera follows the player across every district and connecting path.
      const canvas = canvasRef.current;
      const ctx = canvas?.getContext('2d');
      if (ctx && canvas) {
        const scale = Math.max(canvas.clientWidth / CANVAS_W, canvas.clientHeight / CANVAS_H);
        const insetX = scale > 0 ? Math.max(0, (CANVAS_W - canvas.clientWidth / scale) / 2) : 0;
        const insetY = scale > 0 ? Math.max(0, (CANVAS_H - canvas.clientHeight / scale) / 2) : 0;
        const cam = cameraRef.current;
        const tx = Math.max(-insetX, Math.min(WORLD_WIDTH - CANVAS_W + insetX, p.x - CANVAS_W / 2));
        const ty = Math.max(-insetY, Math.min(WORLD_HEIGHT - CANVAS_H + insetY, p.y - CANVAS_H / 2 - 45));
        const k = cam.ready ? 1 - Math.exp(-dt * 9) : 1;
        cam.x += (tx - cam.x) * k;
        cam.y += (ty - cam.y) * k;
        cam.ready = true;
        const camera = { x: Math.round(cam.x / 2) * 2, y: Math.round(cam.y / 2) * 2 };
        renderScene(ctx, {
          camera,
          time: t,
          timeOfDay: sync.timeOfDay,
          player: { x: p.x, y: p.y, dir: p.dir, isMoving: p.isMoving, walkPhase: p.walkPhase, avatar: sync.avatar },
          npcs,
          items,
          hoveredTarget: hoveredTargetRef.current,
          hoveredTile: hoveredTileRef.current,
          speech: original ? speechBubbleRef.current : null,
          walkTargetMarker: walkMarkerRef.current,
          viewX: [camera.x + insetX, camera.x + CANVAS_W - insetX],
        });
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [activeDrawer, pickupEzLink, pickupSideItem, returnEzLinkToUncle, showLookoutModal, showToast]);

  // Convert DOM pointer position into 1280x720 canvas coords (object-fit: cover + camera object-position)
  const getCanvasPoint = (clientX: number, clientY: number): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.max(rect.width / CANVAS_W, rect.height / CANVAS_H);
    const offsetX = (rect.width - CANVAS_W * scale) / 2;
    const offsetY = (rect.height - CANVAS_H * scale) / 2;
    return {
      x: (clientX - rect.left - offsetX) / scale + Math.round(cameraRef.current.x / 2) * 2,
      y: (clientY - rect.top - offsetY) / scale + Math.round(cameraRef.current.y / 2) * 2,
    };
  };

  const walkTo = (target: Pt) => {
    const p = playerRef.current;
    route.current = findWalkRoute(p, target, canWalkAt);
    p.target = route.current.shift() ?? null;
    if (!p.target) return;
    walkMarkerRef.current = { ...target, createdAt: simTimeRef.current };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrawer || showLookoutModal) return;
    const point = getCanvasPoint(e.clientX, e.clientY);
    if (!point) return;
    const area = districtAt(point.x, point.y);
    if (!area) {
      if (canWalkAt(point.x, point.y)) walkTo(point);
      return;
    }
    const pt = localPoint(area, point);
    if (area !== 'block260') {
      const resident = currentNpcs.current.find((npc) => hitsCharacter(point, npc));
      const landmark = landmarkNear(area, pt);
      if (landmark?.refreshment) {
        const p = playerRef.current;
        const serving = worldPoint(area, landmark);
        if (Math.hypot(p.x - serving.x, p.y - serving.y) > 85) {
          walkTo(serving);
          showToast('Walk up to the dining hall and tap again for a meal.');
        } else if (simTimeRef.current >= nextHawkerMeal.current) {
          nextHawkerMeal.current = simTimeRef.current + 45;
          setEnergyPct((energy) => Math.min(100, energy + 10));
          sfx.success();
          showToast('You had chicken rice at Shiok Hawker. Energy restored!');
        } else {
          showToast(landmark.detail);
        }
        return;
      }
      if (resident) {
        sfx.click();
        showToast(`${resident.name} · ${resident.role}`);
      } else if (landmark) {
        sfx.click();
        showToast(landmark.detail);
      }
      if (canWalkAt(point.x, point.y)) walkTo(point);
      return;
    }

    if (hitsCharacter(pt, UNCLE_POS)) {
      sfx.click();
      if (ezLinkPickedUp && !ezLinkReturned) {
        returnEzLinkToUncle();
      } else if (ezLinkReturned) {
        speechBubbleRef.current = {
          npcId: 'uncle',
          text: 'Thanks again! Go check Sunshine Minimart!',
          icon: 'shop',
        };
      } else {
        speechBubbleRef.current = {
          npcId: 'uncle',
          text: 'Eh boy, did you see my bus card?',
          icon: 'ezlink',
        };
        showToast('Hint: Check near the stone table inside the Block 260 void deck!');
      }
      return;
    }

    if (hitsCharacter(pt, auntieAt(auntieTimeRef.current))) {
      sfx.click();
      showToast(
        ezLinkReturned
          ? 'Auntie Mei: "Steady lah! Remember S.H.I.E.L.D. inside Sunshine Minimart!"'
          : 'Auntie Mei: "Aiya, Uncle Tan always drop his EZ-Link near the stone table!"'
      );
      return;
    }

    const student = STATIC_NPCS.find((n) => n.id === 'student')!;
    if (hitsCharacter(pt, student)) {
      sfx.click();
      showToast('Wei Ming: "Waiting for ShieldBus 88. Someone left a kopi packet under the shelter!"');
      return;
    }

    // Mr Lim or the shop front open the anchor mission
    const cashier = STATIC_NPCS.find((n) => n.id === 'cashier')!;
    if (hitsCharacter(pt, cashier) || Math.hypot(pt.x - ISO_MINIMART_CENTER.x, pt.y - (ISO_MINIMART_CENTER.y - 36)) < 78) {
      sfx.click();
      setShowLookoutModal(true);
      return;
    }

    const voidDeckPos = isoToWorld(22, 20);
    if (Math.hypot(pt.x - voidDeckPos.x, pt.y - (voidDeckPos.y - 24)) < 56) {
      sfx.click();
      showToast('Blk 260 Shield View Void Deck — check nearby for Uncle Tan\'s missing EZ-Link card!');
      return;
    }

    const busPos = isoToWorld(17, 27);
    if (Math.hypot(pt.x - busPos.x, pt.y - (busPos.y - 12)) < 64) {
      sfx.click();
      showToast('Bus Stop 26019 — SBS Bus 88 along Ang Mo Kio Ave 3 toward SUNhub.');
      return;
    }

    if (canWalkAt(point.x, point.y)) walkTo(point);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    hoveredTileRef.current = tileAtWorld(pt.x, pt.y);
    const hovered =
      currentNpcs.current.find((n) => hitsCharacter(pt, n))?.worldKey ?? null;
    hoveredTargetRef.current = hovered;
    setCursor(hovered ? 'pointer' : 'default');
  };

  const currentQuestTitle =
    questId === 'ezlink'
      ? "Find Uncle's EZ-Link"
      : questId === 'lookout'
        ? 'The Lookout Dilemma'
        : 'All Block 260 Quests Done!';

  return (
    <div className="game-world">
      {/* Full-viewport pixel-art scene */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        onMouseMove={handleCanvasMove}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          imageRendering: 'pixelated',
          cursor,
        }}
      />

      <GameHUD
        avatar={avatar}
        clock={clock}
        coins={wallet.coins}
        confidencePct={confidencePct}
        energyPct={energyPct}
        currentQuestTitle={currentQuestTitle}
        activeDrawer={activeDrawer}
        onSelectDrawer={setActiveDrawer}
      />

      {toastMsg && (
        <div
          className="px-dark game-toast"
          role="status"
          style={{
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 18px',
            zIndex: 25,
            fontFamily: 'var(--font-pixel)',
            fontSize: 22,
            lineHeight: 1.1,
            color: '#fff4dc',
            pointerEvents: 'none',
            maxWidth: '90vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {toastMsg}
        </div>
      )}

      {!activeDrawer && !showLookoutModal && (
        <TouchJoystick
          movement={touchMovement}
          onStart={() => {
            playerRef.current.target = null;
            route.current = [];
            walkMarkerRef.current = null;
          }}
        />
      )}

      <GameDrawers
        activeDrawer={activeDrawer}
        onClose={() => setActiveDrawer(null)}
        avatar={avatar}
        setAvatar={setAvatar}
        inventory={inventory}
        skills={skills}
        questId={questId}
        ezLinkPickedUp={ezLinkPickedUp}
        clock={clock}
        soundEnabled={soundEnabled}
        onToggleSound={() => {
          sfx.enabled = !sfx.enabled;
          setSoundEnabled(sfx.enabled);
          if (sfx.enabled) sfx.click();
        }}
        squadCode={squadCode}
        playerPos={localPoint(district, playerRef.current)}
        worldPosition={playerRef.current}
        district={district}
        onWalkToLandmark={(target) => walkTo(worldPoint(district, target))}
        onWalkToWorldPoint={walkTo}
        onWalkToQuest={(target) => walkTo(worldPoint('block260', target))}
        wallet={wallet}
        onBuyItem={onBuyItem}
        onStartLookoutMission={() => setShowLookoutModal(true)}
        onReturnToTitle={onReturnToTitle}
      />

      {showLookoutModal && (
        <LookoutDilemmaModal
          skills={skills}
          onCompleteSkill={(letter, passed, score) => {
            onCompleteSkill(letter, passed, score);
            if (passed) {
              setConfidencePct((v) => Math.min(100, v + 4));
              setEnergyPct((v) => Math.min(100, v + 5));
            }
          }}
          onFinishMission={() => {
            setQuestId('completed');
            onClaimReward('lookout');
            showToast('Completed The Lookout Dilemma! Check your S.H.I.E.L.D. badge.');
          }}
          onClose={() => setShowLookoutModal(false)}
        />
      )}
    </div>
  );
};
