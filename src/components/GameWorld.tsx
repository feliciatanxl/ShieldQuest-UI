import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  AUNTIE_PATH,
  CANVAS_H,
  CANVAS_W,
  directionFor,
  isWalkable,
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
import { WorldSave } from '../utils/save';
import { SingaporeClock } from '../utils/sgClock';
import { sfx } from '../utils/sound';
import { GameDrawers } from './GameDrawers';
import { GameHUD } from './GameHUD';
import { LookoutDilemmaModal } from './LookoutDilemmaModal';

interface GameWorldProps {
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  clock: SingaporeClock;
  inventory: InventoryItem[];
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>;
  skills: Record<ShieldLetter, ShieldSkillState>;
  onCompleteSkill: (letter: ShieldLetter, passed: boolean, score: number) => void;
  squadCode: string;
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
  { id: 'student', name: 'Wei Ming (Student)', role: 'Secondary Student', x: 335, y: 372, dir: 'south-east' },
  { id: 'cashier', name: 'Mr Lim (Cashier)', role: 'Sunshine Minimart Staff', x: 1238, y: 598, dir: 'south-west' },
  { id: 'jun', name: 'Jun (Friend)', role: 'Classmate', x: 1160, y: 618, dir: 'south-west' },
];

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
  initialWorld,
  onWorldChange,
  onReturnToTitle,
}) => {
  const start = initialWorld;
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

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
  const playerRef = useRef({
    ...(start && isWalkable(start.player.x, start.player.y) ? start.player : PLAYER_START),
    dir: 'north-east' as Direction,
    isMoving: false,
    walkPhase: 0,
    target: null as Pt | null,
  });
  const walkMarkerRef = useRef<(Pt & { createdAt: number }) | null>(null);
  const hoveredTargetRef = useRef<string | null>(null);
  const speechBubbleRef = useRef<RenderState['speech']>(
    start?.ezLinkReturned
      ? { npcId: 'uncle', text: 'Thanks again! Go check Sunshine Minimart!', icon: 'shop' }
      : { npcId: 'uncle', text: 'Eh boy, did you see my bus card?', icon: 'ezlink' }
  );
  const simTimeRef = useRef(0);
  const cameraRef = useRef({ x: 0.5, y: 0.5, ready: false, view: [0, CANVAS_W] as [number, number] });
  const minimartCooldownRef = useRef(-10);

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
    player: { x: Math.round(playerRef.current.x), y: Math.round(playerRef.current.y) },
  });
  const onWorldChangeRef = useRef(onWorldChange);
  onWorldChangeRef.current = onWorldChange;
  useEffect(() => {
    onWorldChangeRef.current(worldSnapshot.current());
  }, [questId, ezLinkPickedUp, ezLinkReturned, kopiPickedUp, chopePickedUp, confidencePct, energyPct]);
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
    showToast("Picked up Uncle's SimplyGo EZ-Link Card! Bring it back to Uncle Tan.");
  }, [setInventory, showToast]);

  const pickupSideItem = useCallback(
    (id: 'kopi' | 'chope', label: string) => {
      sfx.success();
      if (id === 'kopi') setKopiPickedUp(true);
      if (id === 'chope') setChopePickedUp(true);
      setInventory((prev) =>
        prev.map((item) => (item.id === id ? { ...item, collected: true } : item))
      );
      showToast(`Added ${label} to your Backpack!`);
    },
    [setInventory, showToast]
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
    showToast('Quest Complete! Next Quest: The Lookout Dilemma at Sunshine Minimart.');
  }, [setInventory, showToast]);

  // Keyboard listeners
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (activeDrawer || showLookoutModal) return;
      const k = e.key.toLowerCase();
      if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright', 'shift'].includes(k)) {
        keysPressed.current.add(k);
        // Manual keys cancel click-to-walk
        if (k !== 'shift') playerRef.current.target = null;
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
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
      const keys = keysPressed.current;
      const running = keys.has('shift');
      const speed = running ? RUN_SPEED : WALK_SPEED;

      let dx = 0;
      let dy = 0;
      if (keys.has('w') || keys.has('arrowup')) dy -= 1;
      if (keys.has('s') || keys.has('arrowdown')) dy += 1;
      if (keys.has('a') || keys.has('arrowleft')) dx -= 1;
      if (keys.has('d') || keys.has('arrowright')) dx += 1;

      if (dx === 0 && dy === 0 && p.target) {
        dx = p.target.x - p.x;
        dy = p.target.y - p.y;
        if (Math.hypot(dx, dy) < 6) {
          p.target = null;
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

        // Blocked? Steer up to 90° either side so we slide around pillars and tables.
        const step = [0, 0.5, -0.5, 1, -1, 1.5, -1.5]
          .map((turn) => {
            const c = Math.cos(turn);
            const s = Math.sin(turn);
            return { x: mx * c - my * s, y: mx * s + my * c };
          })
          .find((v) => isWalkable(p.x + v.x, p.y + v.y));
        if (step) {
          p.x += step.x;
          p.y += step.y;
        } else {
          p.target = null;
          p.isMoving = false;
        }
      } else {
        p.isMoving = false;
      }

      const near = (q: Pt, r: number) => Math.hypot(p.x - q.x, p.y - q.y) < r;
      const sync = stateSyncRef.current;
      if (!sync.ezLinkPickedUp && near(ITEM_POS.ezlink, 44)) pickupEzLink();
      if (!sync.kopiPickedUp && near(ITEM_POS.kopi, 40)) pickupSideItem('kopi', 'Kopi-O Dabao Packet');
      if (!sync.chopePickedUp && near(ITEM_POS.chope, 40)) {
        pickupSideItem('chope', 'Pocket Tissue ("Chope" Pack)');
      }
      if (sync.ezLinkPickedUp && !sync.ezLinkReturned && near(UNCLE_POS, 70)) returnEzLinkToUncle();

      const z = MINIMART_ZONE;
      if (
        p.x >= z.x0 &&
        p.x <= z.x1 &&
        p.y >= z.y0 &&
        p.y <= z.y1 &&
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

      // Camera: when the screen crops the 16:9 scene (phones), slide object-position to keep the player in view.
      const canvas = canvasRef.current;
      if (canvas && canvas.clientWidth > 0) {
        const scale = Math.max(canvas.clientWidth / CANVAS_W, canvas.clientHeight / CANVAS_H);
        const visW = canvas.clientWidth / scale;
        const visH = canvas.clientHeight / scale;
        const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
        const tx = visW < CANVAS_W - 1 ? clamp01((p.x - visW / 2) / (CANVAS_W - visW)) : 0.5;
        const ty = visH < CANVAS_H - 1 ? clamp01((p.y - 60 - visH / 2) / (CANVAS_H - visH)) : 0.5;
        const cam = cameraRef.current;
        const k = cam.ready ? Math.min(1, dt * 4) : 1;
        cam.x += (tx - cam.x) * k;
        cam.y += (ty - cam.y) * k;
        cam.ready = true;
        const x0 = Math.max(0, CANVAS_W - visW) * cam.x;
        cam.view = [x0, x0 + Math.min(visW, CANVAS_W)];
        canvas.style.objectPosition = `${(cam.x * 100).toFixed(2)}% ${(cam.y * 100).toFixed(2)}%`;
      }

      const ctx = canvas?.getContext('2d');
      if (ctx) {
        renderScene(ctx, {
          time: t,
          timeOfDay: sync.timeOfDay,
          player: { x: p.x, y: p.y, dir: p.dir, isMoving: p.isMoving, walkPhase: p.walkPhase, avatar: sync.avatar },
          npcs: [...STATIC_NPCS, auntieAt(t)],
          items,
          hoveredTarget: hoveredTargetRef.current,
          speech: speechBubbleRef.current,
          walkTargetMarker: walkMarkerRef.current,
          viewX: cameraRef.current.view,
        });
      }

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [activeDrawer, pickupEzLink, pickupSideItem, returnEzLinkToUncle, showLookoutModal]);

  // Convert DOM pointer position into 1280x720 canvas coords (object-fit: cover + camera object-position)
  const getCanvasPoint = (clientX: number, clientY: number): Pt | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const scale = Math.max(rect.width / CANVAS_W, rect.height / CANVAS_H);
    const offsetX = (rect.width - CANVAS_W * scale) * cameraRef.current.x;
    const offsetY = (rect.height - CANVAS_H * scale) * cameraRef.current.y;
    return {
      x: (clientX - rect.left - offsetX) / scale,
      y: (clientY - rect.top - offsetY) / scale,
    };
  };

  const walkTo = (target: Pt) => {
    playerRef.current.target = target;
    walkMarkerRef.current = { ...target, createdAt: simTimeRef.current };
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (activeDrawer || showLookoutModal) return;
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;

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

    if (hitsCharacter(pt, auntieAt(simTimeRef.current))) {
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

    // Jun, Mr Lim or the shop front open the anchor mission
    const shopPeople = STATIC_NPCS.filter((n) => n.id === 'jun' || n.id === 'cashier');
    if (shopPeople.some((n) => hitsCharacter(pt, n)) || Math.hypot(pt.x - 1170, pt.y - 400) < 110) {
      sfx.click();
      setShowLookoutModal(true);
      return;
    }

    if (Math.hypot(pt.x - 930, pt.y - 280) < 75) {
      sfx.click();
      showToast('RC Notice Board: "Block 260 Neighbourhood Watch — look out for one another!"');
      return;
    }

    if (Math.hypot(pt.x - 875, pt.y - 430) < 60) {
      sfx.click();
      showToast('Someone chope-d the stone table with a tissue packet! Look beside it!');
      return;
    }

    if (Math.hypot(pt.x - 380, pt.y - 680) < 80) {
      sfx.click();
      showToast('Bus Stop 26019 — ShieldBus 88 toward Baycrest SkyDeck & Shiok Hawker Square.');
      return;
    }

    if (isWalkable(pt.x, pt.y)) walkTo(pt);
  };

  const handleCanvasMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const pt = getCanvasPoint(e.clientX, e.clientY);
    if (!pt) return;
    const hovered =
      [...STATIC_NPCS, auntieAt(simTimeRef.current)].find((n) => hitsCharacter(pt, n))?.id ?? null;
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
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        background: '#161a24',
      }}
    >
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
        confidencePct={confidencePct}
        energyPct={energyPct}
        currentQuestTitle={currentQuestTitle}
        activeDrawer={activeDrawer}
        onSelectDrawer={setActiveDrawer}
      />

      {toastMsg && (
        <div
          className="px-dark"
          role="status"
          style={{
            position: 'absolute',
            top: 22,
            left: '50%',
            transform: 'translateX(-50%)',
            padding: '8px 18px',
            zIndex: 25,
            fontFamily: 'var(--font-pixel)',
            fontSize: 22,
            lineHeight: 1.1,
            color: '#fff4dc',
            pointerEvents: 'none',
            whiteSpace: 'nowrap',
            maxWidth: '90vw',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {toastMsg}
        </div>
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
        playerPos={{ x: playerRef.current.x, y: playerRef.current.y }}
        onWalkToLandmark={walkTo}
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
            showToast('Completed The Lookout Dilemma! Check your S.H.I.E.L.D. badge.');
          }}
          onClose={() => setShowLookoutModal(false)}
        />
      )}
    </div>
  );
};
