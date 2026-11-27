import React, { useEffect, useState } from 'react';
import {
  DEFAULT_AVATAR,
  HAIR_COLORS,
  MAP_LANDMARKS,
  PANTS_COLORS,
  REWARDS,
  SHIELD_STYLES,
  SHOP_ITEMS,
  SHIRT_COLORS,
  SKIN_TONES,
} from '../data/gameData';
import { DISTRICT_NAMES, DistrictId, Point } from '../data/districts';
import {
  DISTRICTS, DISTRICT_DESTINATIONS, WORLD_HEIGHT, WORLD_WIDTH,
} from '../data/worldMap';
import {
  ALL_LANDMARKS,
  isTileWalkable,
  TILES,
  WORLD_PROPS,
} from '../data/singaporeWorld';
import { isoToWorld, MAP_COLS, MAP_ROWS, TileId, worldToIso } from '../game/isoGrid';
import { ITEM_POS, UNCLE_POS } from '../game/sceneRenderer';
import { expansionLandmarks } from '../game/expansionGeometry';
import {
  AvatarConfig,
  DrawerType,
  InventoryItem,
  QuestId,
  ShieldLetter,
  ShieldSkillState,
} from '../types/game';
import { Wallet } from '../utils/save';
import { SingaporeClock } from '../utils/sgClock';
import { sfx } from '../utils/sound';
import { PlayerSpritePreview, ShieldEmblemIcon, UiIcon } from './PixelIcons';

interface GameDrawersProps {
  activeDrawer: DrawerType;
  onClose: () => void;
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  inventory: InventoryItem[];
  skills: Record<ShieldLetter, ShieldSkillState>;
  questId: QuestId;
  ezLinkPickedUp: boolean;
  clock: SingaporeClock;
  soundEnabled: boolean;
  onToggleSound: () => void;
  squadCode: string;
  playerPos: { x: number; y: number };
  district: DistrictId;
  worldPosition: Point;
  onWalkToLandmark: (target: { x: number; y: number }) => void;
  onWalkToWorldPoint: (target: Point) => void;
  onWalkToQuest: (target: { x: number; y: number }) => void;
  onStartLookoutMission: () => void;
  onReturnToTitle: () => void;
  wallet: Wallet;
  onBuyItem: (id: string) => void;
}

const HEADINGS: Record<Exclude<DrawerType, null>, [eyebrow: string, title: string]> = {
  backpack: ['Your adventure', 'Pack'],
  wardrobe: ['Wardrobe', 'Choose your look'],
  map: ['Neighbourhood guide', 'Area map'],
  menu: ['Your adventure', 'Settings'],
  quest: ['Your adventure', 'Quests'],
  shield: ['Your adventure', 'Guardians'],
  rewards: ['Earn & spend coins', 'Sunshine Rewards'],
};

// PixelLab item art in public/assets/ui/item-<name>.png
const ITEM_ICON_FILE: Record<InventoryItem['icon'], string> = {
  ezlink: 'item-ezlink',
  chope: 'item-chope',
  kopi: 'item-kopi',
  receipt: 'item-receipt',
  notes: 'item-notes',
  badge: 'item-notes',
};

const HAIR_STYLES: AvatarConfig['hairStyle'][] = ['short', 'spiky', 'bob', 'ponytail'];

const pick = <T,>(list: T[]) => list[Math.floor(Math.random() * list.length)];

export const GameDrawers: React.FC<GameDrawersProps> = (props) => {
  const { activeDrawer, onClose } = props;

  // Esc closes the open panel
  useEffect(() => {
    if (!activeDrawer) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeDrawer, onClose]);

  if (!activeDrawer) return null;
  const [eyebrow, title] = HEADINGS[activeDrawer];
  const wide = activeDrawer === 'wardrobe' || activeDrawer === 'map' || activeDrawer === 'rewards';

  return (
    <div className="panel-backdrop" onClick={onClose}>
      <div
        className="pixel-modal-frame pixel-scroll"
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
        style={{
          width: `min(94vw, ${wide ? 980 : 620}px)`,
          maxHeight: '88vh',
          overflowY: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="panel-header">
          <div>
            <div className="panel-eyebrow">{eyebrow}</div>
            <h2 id="drawer-title" className="panel-title">
              {title}
            </h2>
          </div>
          <button
            type="button"
            className="panel-close"
            aria-label="Close"
            onClick={() => {
              sfx.click();
              onClose();
            }}
          >
            ✕
          </button>
        </div>

        {activeDrawer === 'backpack' && <PackPanel {...props} />}
        {activeDrawer === 'wardrobe' && <WardrobePanel {...props} />}
        {activeDrawer === 'map' && <MapPanel {...props} />}
        {activeDrawer === 'quest' && <QuestPanel {...props} />}
        {activeDrawer === 'shield' && <GuardiansPanel {...props} />}
        {activeDrawer === 'menu' && <SettingsPanel {...props} />}
        {activeDrawer === 'rewards' && <RewardsPanel {...props} />}
      </div>
    </div>
  );
};

// ---------- Pack ----------

const PackPanel: React.FC<GameDrawersProps> = ({ inventory }) => {
  const found = inventory.filter((i) => i.collected).length;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <span className="pill" style={{ justifySelf: 'start' }}>
        {found} of {inventory.length} items
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 10 }}>
        {inventory.map((item) => (
          <div
            key={item.id}
            className="cream-card"
            style={{ display: 'flex', gap: 12, alignItems: 'center', opacity: item.collected ? 1 : 0.55 }}
          >
            <div className="sprite-tile" style={{ width: 72, height: 72, flexShrink: 0 }}>
              <UiIcon name={ITEM_ICON_FILE[item.icon]} size={64} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{item.name}</div>
              <div className="cream-muted" style={{ marginTop: 2 }}>
                {item.collected ? item.description : 'Not found yet — keep exploring Block 260.'}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// ---------- Wardrobe ("Choose your look") ----------

type WardrobeTab = 'body' | 'head' | 'torso' | 'legs' | 'misc';
const WARDROBE_TABS: [WardrobeTab, string][] = [
  ['body', 'Face & Body'],
  ['head', 'Head'],
  ['torso', 'Torso'],
  ['legs', 'Legs'],
  ['misc', 'Misc'],
];

const ColourGrid: React.FC<{
  heading: string;
  hint: string;
  options: { label: string; color: string }[];
  value: string;
  onPick: (color: string) => void;
}> = ({ heading, hint, options, value, onPick }) => (
  <div className="cream-card">
    <div style={{ fontWeight: 800, fontSize: 16 }}>{heading}</div>
    <div className="cream-muted" style={{ margin: '2px 0 10px' }}>
      {hint}
    </div>
    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button
          key={o.color}
          type="button"
          title={o.label}
          aria-label={o.label}
          aria-pressed={value === o.color}
          className={`pixel-swatch${value === o.color ? ' is-active' : ''}`}
          style={{ background: o.color, width: 34, height: 34 }}
          onClick={() => {
            sfx.click();
            onPick(o.color);
          }}
        />
      ))}
    </div>
  </div>
);

/** Default colour options plus any of this kind bought in the Rewards shop. */
const withOwned = (base: { label: string; color: string }[], kind: 'shirt' | 'pants', owned: string[]) => [
  ...base,
  ...SHOP_ITEMS.filter((i) => i.kind === kind && owned.includes(i.id)).map((i) => ({ label: i.label, color: i.color })),
];

const WardrobePanel: React.FC<GameDrawersProps> = ({ avatar, setAvatar, wallet }) => {
  const [tab, setTab] = useState<WardrobeTab>('body');
  const set = (patch: Partial<AvatarConfig>) => setAvatar((p) => ({ ...p, ...patch }));

  return (
    <div>
      <div className="cream-tabs" role="tablist">
        {WARDROBE_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`cream-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => {
              sfx.click();
              setTab(id);
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 250px', gap: 14 }} className="wardrobe-grid">
        <div style={{ display: 'grid', gap: 12, alignContent: 'start' }}>
          {tab === 'body' && (
            <ColourGrid
              heading="Skin tone"
              hint="Pick the skin tone for your hero."
              options={SKIN_TONES}
              value={avatar.skinTone}
              onPick={(c) => set({ skinTone: c })}
            />
          )}
          {tab === 'head' && (
            <>
              <div className="cream-card">
                <div style={{ fontWeight: 800, fontSize: 16 }}>Hairstyle</div>
                <div className="cream-muted" style={{ margin: '2px 0 10px' }}>
                  Short and Spiky are boys&apos; cuts; Bob and Ponytail are girls&apos;.
                </div>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {HAIR_STYLES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      aria-pressed={avatar.hairStyle === s}
                      className={`pixel-chip${avatar.hairStyle === s ? ' is-active' : ''}`}
                      onClick={() => {
                        sfx.click();
                        set({ hairStyle: s });
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <ColourGrid
                heading="Hair colour"
                hint="Natural shades for every hairstyle."
                options={HAIR_COLORS}
                value={avatar.hairColor}
                onPick={(c) => set({ hairColor: c })}
              />
            </>
          )}
          {tab === 'torso' && (
            <ColourGrid
              heading="T-shirt"
              hint="Your everyday heartland tee."
              options={withOwned(SHIRT_COLORS, 'shirt', wallet.owned)}
              value={avatar.shirtColor}
              onPick={(c) => set({ shirtColor: c })}
            />
          )}
          {tab === 'legs' && (
            <ColourGrid
              heading="Shorts"
              hint="Comfy for walking around the estate."
              options={withOwned(PANTS_COLORS, 'pants', wallet.owned)}
              value={avatar.pantsColor}
              onPick={(c) => set({ pantsColor: c })}
            />
          )}
          {tab === 'misc' && (
            <div className="cream-card">
              <div style={{ fontWeight: 800, fontSize: 16 }}>Shield crest</div>
              <div className="cream-muted" style={{ margin: '2px 0 10px' }}>
                Shown on your HUD badge.
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SHIELD_STYLES.map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    aria-pressed={avatar.shieldStyle === sh.id}
                    className={`pixel-chip${avatar.shieldStyle === sh.id ? ' is-active' : ''}`}
                    style={{ display: 'inline-flex', alignItems: 'center', gap: 6, textTransform: 'none' }}
                    onClick={() => {
                      sfx.click();
                      set({ shieldStyle: sh.id });
                    }}
                  >
                    <ShieldEmblemIcon size={20} accent={sh.accent} />
                    {sh.label}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 10, alignContent: 'start' }}>
          <label htmlFor="wardrobe-name" style={{ fontWeight: 700, fontSize: 15 }}>
            Your name
          </label>
          <input
            id="wardrobe-name"
            type="text"
            maxLength={14}
            value={avatar.name}
            placeholder="e.g. Wei Ling, Hafiz, Priya"
            onChange={(e) => set({ name: e.target.value })}
            className="parchment-input"
            style={{ borderColor: '#ecd6aa' }}
          />
          <div className="wardrobe-stage">
            <PlayerSpritePreview avatar={avatar} scale={3} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <button
              type="button"
              className="pixel-secondary-btn"
              onClick={() => {
                sfx.click();
                setAvatar((p) => ({ ...DEFAULT_AVATAR, name: p.name }));
              }}
            >
              ↺ Reset
            </button>
            <button
              type="button"
              className="teal-btn"
              style={{ background: '#2b2118', borderColor: '#2b2118', boxShadow: '0 3px 0 #000' }}
              onClick={() => {
                sfx.click();
                set({
                  hairStyle: pick(HAIR_STYLES),
                  skinTone: pick(SKIN_TONES).color,
                  hairColor: pick(HAIR_COLORS).color,
                  shirtColor: pick(SHIRT_COLORS).color,
                  pantsColor: pick(PANTS_COLORS).color,
                });
              }}
            >
              ⤨ Random
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ---------- Area map ----------

const TILE_MAP_COLOR: Record<TileId, [string, string]> = {
  grass: ['#7f8c46', '#2c3329'],
  grass_tuft: ['#73803e', '#282f25'],
  grass_flower: ['#8fa052', '#343c2e'],
  pavement: ['#cbb898', '#58534d'],
  pavement_alt: ['#bfa988', '#4f4a45'],
  void_deck: ['#d5cab8', '#605c58'],
  plaza: ['#d9c29e', '#655c50'],
  plaza_alt: ['#c6ae89', '#575046'],
  road_plain: ['#4b494e', '#25262e'],
  road_se: ['#59575d', '#2b2d36'],
  road_sw: ['#59575d', '#2b2d36'],
  road_busbay: ['#8c743a', '#4d4126'],
  road_taxibay: ['#c49a3a', '#594822'],
  road_yellowbox: ['#c49a3a', '#594822'],
  zebra_sw: ['#d8d4ca', '#6c6b6d'],
  zebra_se: ['#d8d4ca', '#6c6b6d'],
  drain_se: ['#8c8578', '#3c3c40'],
  drain_sw: ['#8c8578', '#3c3c40'],
  tactile: ['#e0b247', '#7a622a'],
  pcn_red: ['#b85249', '#5e2e2c'],
  pcn_green: ['#458a66', '#284a3c'],
  playground_orange: ['#d97e4a', '#6b422d'],
  playground_blue: ['#4b88ad', '#2b475c'],
  sandpit: ['#e3ca94', '#6b6049'],
  court_orange: ['#d47344', '#683b28'],
  court_cream: ['#e5c48e', '#6e6049'],
  hawker_floor: ['#b5a38d', '#544d46'],
  market_floor: ['#9fa39f', '#4a4e50'],
};

function propMapColor(id: string, night: boolean): string {
  if (id.startsWith('hdb_blk')) return night ? '#b89468' : '#e6cfb0';
  if (id === 'minimart_front') return night ? '#ffd45e' : '#f5c242';
  if (id === 'dragon_playground') return '#e6583e';
  if (id === 'sunhub_atrium') return night ? '#82d8e8' : '#6ab6c4';
  if (id.startsWith('shop_')) return night ? '#b89872' : '#d9c5a3';
  if (id.startsWith('hawker_stall')) return night ? '#e0894a' : '#d96443';
  if (id.startsWith('market_stall')) return '#5da662';
  if (id === 'sg_bus') return '#66b850';
  if (id === 'sg_taxi') return '#d9483b';
  if (id.includes('tree')) return night ? '#385728' : '#649642';
  if (id.startsWith('linkway_roof')) return night ? '#69666b' : '#9c958b';
  if (id.startsWith('pavilion')) return '#b05a3e';
  return night ? '#7e7874' : '#9c9286';
}

const MapPanel: React.FC<GameDrawersProps> = ({
  clock, district, worldPosition, onWalkToWorldPoint, onClose,
}) => {
  const mapCanvasRef = React.useRef<HTMLCanvasElement | null>(null);
  const night = clock.timeOfDay === 'evening';
  const landmarks = district === 'block260' ? MAP_LANDMARKS : expansionLandmarks(district);

  const walkToWorld = (point: { x: number; y: number }) => {
    sfx.click();
    onWalkToWorldPoint(point);
    onClose();
  };
  const walkToDistrict = (area: DistrictId) => {
    sfx.click();
    onWalkToWorldPoint(DISTRICT_DESTINATIONS[area]);
    onClose();
  };

  useEffect(() => {
    const canvas = mapCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || !canvas) return;
    const sx = canvas.width / WORLD_WIDTH;
    const sy = canvas.height / WORLD_HEIGHT;

    ctx.fillStyle = night ? '#1b2030' : '#647338';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw 64x64 isometric tiles
    for (let row = 0; row < MAP_ROWS; row++) {
      for (let col = 0; col < MAP_COLS; col++) {
        const pt = isoToWorld(col, row);
        const cx = pt.x * sx;
        const cy = pt.y * sy;
        const hw = 32 * sx + 0.6;
        const hh = 16 * sy + 0.6;
        ctx.fillStyle = TILE_MAP_COLOR[TILES[row][col]][night ? 1 : 0];
        ctx.beginPath();
        ctx.moveTo(cx, cy - hh);
        ctx.lineTo(cx + hw, cy);
        ctx.lineTo(cx, cy + hh);
        ctx.lineTo(cx - hw, cy);
        ctx.closePath();
        ctx.fill();
      }
    }

    // Draw building & landmark footprints
    for (const prop of WORLD_PROPS) {
      const p0 = isoToWorld(prop.col - 0.45, prop.row - 0.45);
      const p1 = isoToWorld(prop.col + prop.footCols - 0.55, prop.row - 0.45);
      const p2 = isoToWorld(prop.col + prop.footCols - 0.55, prop.row + prop.footRows - 0.55);
      const p3 = isoToWorld(prop.col - 0.45, prop.row + prop.footRows - 0.55);
      ctx.fillStyle = propMapColor(prop.id, night);
      ctx.beginPath();
      ctx.moveTo(p0.x * sx, p0.y * sy);
      ctx.lineTo(p1.x * sx, p1.y * sy);
      ctx.lineTo(p2.x * sx, p2.y * sy);
      ctx.lineTo(p3.x * sx, p3.y * sy);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = '#231a16';
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }, [night]);

  const pctWorld = (p: Point) => ({
    left: `${(p.x / WORLD_WIDTH) * 100}%`,
    top: `${(p.y / WORLD_HEIGHT) * 100}%`,
  });

  const handleMinimapClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const wx = ((e.clientX - rect.left) / rect.width) * WORLD_WIDTH;
    const wy = ((e.clientY - rect.top) / rect.height) * WORLD_HEIGHT;
    const { col, row } = worldToIso(wx, wy);
    const ic = Math.floor(col + 0.5);
    const ir = Math.floor(row + 0.5);
    if (isTileWalkable(ic, ir)) {
      walkToWorld({ x: wx, y: wy });
    }
  };

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <span className="pill" style={{ justifySelf: 'start' }}>
        📍 {DISTRICT_NAMES[district]}
      </span>
      <div className="cream-card" style={{ padding: 10 }}>
        <div className="area-map" style={{ position: 'relative', maxWidth: 680, margin: '0 auto' }}>
          <canvas
            ref={mapCanvasRef}
            width={1088}
            height={660}
            onClick={handleMinimapClick}
            aria-label="Isometric Singapore neighbourhood map"
            style={{ display: 'block', width: '100%', height: 'auto', cursor: 'pointer', imageRendering: 'pixelated' }}
          />
          {DISTRICTS.map((area) => {
            const dest = DISTRICT_DESTINATIONS[area];
            const pos = pctWorld(dest);
            return (
              <button
                key={area}
                type="button"
                className="map-marker"
                style={{ left: pos.left, top: pos.top, transform: 'translate(-50%, -185%)', zIndex: 2 }}
                title={`Walk to ${DISTRICT_NAMES[area]}`}
                onClick={() => walkToDistrict(area)}
              >
                <span className="map-label" style={{ display: 'inline-block' }}>
                  {DISTRICT_SHORT_NAMES[area]}
                </span>
              </button>
            );
          })}
          {ALL_LANDMARKS.filter((l) => l.district === district).map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="map-marker"
              style={{ ...pctWorld(loc), zIndex: 3 }}
              title={`Walk to ${loc.name}`}
              aria-label={`Walk to ${loc.name}`}
              onClick={() => walkToWorld(loc)}
            >
              <span className="map-dot" style={{ background: loc.color }}>
                {loc.name[0]}
              </span>
            </button>
          ))}
          <div className="map-you" style={{ ...pctWorld(worldPosition), zIndex: 4 }} aria-label="You are here">
            YOU
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 10 }}>
          {DISTRICTS.map((area) => (
            <button key={area} className="teal-btn" type="button" onClick={() => walkToDistrict(area)}>
              {DISTRICT_NAMES[area]}
            </button>
          ))}
        </div>
      </div>

      <div className="cream-card" style={{ display: 'grid', gap: 8, padding: 12 }}>
        <div style={{ fontWeight: 800, fontSize: 15 }}>Landmarks in {DISTRICT_SHORT_NAMES[district]}</div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {landmarks.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="pixel-secondary-btn"
              onClick={() => walkToWorld(loc)}
            >
              ● {loc.name}
            </button>
          ))}
        </div>
        <div className="cream-muted">Tap anywhere on the isometric map, a district button, or a landmark to walk there.</div>
      </div>
    </div>
  );
};

const DISTRICT_SHORT_NAMES: Record<DistrictId, string> = {
  park: 'Dragon Park', estate: 'Shield View', transport: 'Transport',
  block260: 'Blk 260', market: 'Shiok Market', mall: 'SUNhub',
};

// ---------- Quests ----------

const QuestPanel: React.FC<GameDrawersProps> = ({
  questId,
  ezLinkPickedUp,
  onWalkToQuest,
  onStartLookoutMission,
  onClose,
}) => (
  <div style={{ display: 'grid', gap: 12 }}>
    <div className="cream-card" style={{ borderColor: questId === 'ezlink' ? '#2a9d8f' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>1. Find Uncle&apos;s EZ-Link</div>
        <span className="pill">{questId === 'ezlink' ? 'Active' : '✓ Done'}</span>
      </div>
      <p className="cream-muted" style={{ margin: '6px 0 10px', fontSize: 14, lineHeight: 1.45 }}>
        {ezLinkPickedUp
          ? 'You picked up the teal EZ-Link card! Return it to Uncle Tan at the bus stop.'
          : 'Uncle Tan misplaced his EZ-Link bus card near Block 260. Check by the void deck stone table and bring it back to him!'}
      </p>
      {questId === 'ezlink' && (
        <button
          type="button"
          className="pixel-secondary-btn"
          onClick={() => {
            sfx.click();
            onWalkToQuest(ezLinkPickedUp ? UNCLE_POS : ITEM_POS.ezlink);
            onClose();
          }}
        >
          {ezLinkPickedUp ? 'Walk to Uncle Tan →' : 'Check the void deck table →'}
        </button>
      )}
    </div>

    <div className="cream-card" style={{ borderColor: questId === 'lookout' ? '#2a9d8f' : undefined }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: 16 }}>2. The Lookout Dilemma</div>
        <span className="pill">
          {questId === 'completed' ? '✓ Done' : questId === 'lookout' ? 'Active' : 'Up next'}
        </span>
      </div>
      <p className="cream-muted" style={{ margin: '6px 0 10px', fontSize: 14, lineHeight: 1.45 }}>
        Visit Sunshine Minimart to practise all six S.H.I.E.L.D. shop-theft prevention skills.
      </p>
      <button
        type="button"
        className="teal-btn"
        onClick={() => {
          sfx.click();
          onClose();
          onStartLookoutMission();
        }}
      >
        Play the Lookout Dilemma →
      </button>
    </div>
  </div>
);

// ---------- Guardians ----------

const GuardiansPanel: React.FC<GameDrawersProps> = ({ skills }) => {
  const letters = Object.keys(skills) as ShieldLetter[];
  const collected = letters.filter((l) => skills[l].passed).length;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <div>
        <span className="pill">
          {collected} of {letters.length} collected
        </span>
        <div style={{ fontSize: 14, marginTop: 8 }}>
          Pass a S.H.I.E.L.D. challenge in the Lookout Dilemma, then collect its Guardian here.
        </div>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: 10 }}>
        {letters.map((letter) => {
          const st = skills[letter];
          return (
            <div
              key={letter}
              className="cream-card"
              style={{ textAlign: 'center', padding: 14, display: 'flex', flexDirection: 'column' }}
            >
              <div className="sprite-tile" style={{ width: 84, height: 84, margin: '0 auto 10px' }}>
                <img
                  src={`/assets/guardians/${st.guardianName.toLowerCase()}.png`}
                  alt=""
                  width={64}
                  height={64}
                  style={{ imageRendering: 'pixelated', filter: st.passed ? 'none' : 'saturate(0.85)' }}
                />
              </div>
              <div style={{ fontWeight: 800, fontSize: 16 }}>{st.guardianName}</div>
              <div className="cream-muted">
                {st.letter} · {st.title}
              </div>
              <div style={{ marginTop: 'auto', paddingTop: 10, fontWeight: 700, fontSize: 13, color: st.passed ? '#1f7a6d' : '#6b5744' }}>
                {st.passed
                  ? `✓ Collected · ${st.score}/${st.maxScore}`
                  : st.completed
                    ? `Try again · ${st.score}/${st.maxScore}`
                    : '🔒 Locked'}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ---------- Settings & help ----------

const SettingRow: React.FC<{ title: string; hint?: string; children: React.ReactNode }> = ({
  title,
  hint,
  children,
}) => (
  <div className="cream-card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
    <div>
      <div style={{ fontWeight: 700, fontSize: 15 }}>{title}</div>
      {hint && <div className="cream-muted">{hint}</div>}
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>{children}</div>
  </div>
);

const SettingsPanel: React.FC<GameDrawersProps> = ({
  clock,
  soundEnabled,
  onToggleSound,
  squadCode,
  onStartLookoutMission,
  onReturnToTitle,
  onClose,
}) => (
  <div style={{ display: 'grid', gap: 8 }}>
    <div className="panel-section">Game</div>
    <SettingRow title="Sound effects" hint="Cosy 8-bit chiptune feedback.">
      <button
        type="button"
        role="switch"
        aria-checked={soundEnabled}
        aria-label="Sound effects"
        className="switch"
        onClick={onToggleSound}
      />
    </SettingRow>
    <SettingRow
      title="Time of day"
      hint="Follows live Singapore time: day 07:00–19:00, night after."
    >
      <span className="keycap">{clock.label} SGT</span>
      <span className="pill">{clock.timeOfDay === 'evening' ? 'Night' : 'Day'}</span>
    </SettingRow>
    {squadCode && (
      <SettingRow title="Workshop squad" hint="Pseudonymous session code.">
        <span className="keycap">{squadCode}</span>
      </SettingRow>
    )}

    <div className="panel-section" style={{ marginTop: 8 }}>
      Help &amp; controls
    </div>
    <SettingRow title="Move">
      <span className="keycap">WASD</span>
      <span className="cream-muted">or</span>
      <span className="keycap">↑ ↓ ← →</span>
      <span className="cream-muted">or click</span>
    </SettingRow>
    <SettingRow title="Run">
      <span className="cream-muted">Hold</span>
      <span className="keycap">Shift</span>
    </SettingRow>
    <SettingRow title="Touch controls">
      <span className="cream-muted">
        Drag the joystick to move. Pull up until the lock icon lights up, then release to sprint. Tap the lock or grab the joystick to stop.
      </span>
    </SettingRow>
    <SettingRow title="Interact">
      <span className="cream-muted">Click a neighbour or glowing item</span>
    </SettingRow>
    <SettingRow title="Close a panel">
      <span className="keycap">Esc</span>
      <span className="cream-muted">or ✕</span>
    </SettingRow>

    <div style={{ display: 'flex', gap: 10, marginTop: 10, flexWrap: 'wrap' }}>
      <button
        type="button"
        className="teal-btn"
        style={{ flex: 1 }}
        onClick={() => {
          sfx.click();
          onClose();
          onStartLookoutMission();
        }}
      >
        Sunshine Minimart quest
      </button>
      <button
        type="button"
        className="pixel-secondary-btn"
        onClick={() => {
          sfx.click();
          onClose();
          onReturnToTitle();
        }}
      >
        Main menu
      </button>
    </div>
  </div>
);

// ---------- Rewards (earn coins, buy clothing) ----------

type RewardsTab = 'front' | 'earn' | 'clothing' | 'collection';
const REWARDS_TABS: [RewardsTab, string][] = [
  ['front', 'Front page'],
  ['earn', 'Earn coins'],
  ['clothing', 'Clothing'],
  ['collection', 'Your collection'],
];

type ShopItem = (typeof SHOP_ITEMS)[number];

/** The player wearing a shop item (used for previews). */
const wearing = (avatar: AvatarConfig, item: ShopItem): AvatarConfig =>
  item.kind === 'shirt' ? { ...avatar, shirtColor: item.color } : { ...avatar, pantsColor: item.color };

const CoinAmount: React.FC<{ amount: number; size?: number }> = ({ amount, size = 16 }) => (
  <span className="coin-amount">
    <UiIcon name="coin" size={size} />
    {amount}
  </span>
);

const ShopCard: React.FC<{
  item: ShopItem;
  avatar: AvatarConfig;
  wallet: Wallet;
  onBuy: () => void;
  onWear: () => void;
}> = ({ item, avatar, wallet, onBuy, onWear }) => {
  const owned = wallet.owned.includes(item.id);
  const worn = (item.kind === 'shirt' ? avatar.shirtColor : avatar.pantsColor) === item.color;
  const short = item.price - wallet.coins;
  return (
    <div className="cream-card shop-card">
      <div className="sprite-tile shop-stage">
        <PlayerSpritePreview avatar={wearing(avatar, item)} scale={2} />
      </div>
      <div style={{ fontWeight: 800, fontSize: 15 }}>{item.label}</div>
      <div className="cream-muted" style={{ display: 'flex', justifyContent: 'center', gap: 8, alignItems: 'center' }}>
        {item.kind === 'shirt' ? 'T-shirt' : 'Shorts'} · {owned ? 'Owned' : <CoinAmount amount={item.price} />}
      </div>
      <div style={{ marginTop: 'auto', paddingTop: 12 }}>
        {owned ? (
          <button type="button" className="pixel-secondary-btn" style={{ width: '100%' }} disabled={worn} onClick={onWear}>
            {worn ? 'Wearing' : 'Wear'}
          </button>
        ) : (
          <button type="button" className="teal-btn" style={{ width: '100%' }} disabled={short > 0} onClick={onBuy}>
            {short > 0 ? `Need ${short} more` : 'Buy'}
          </button>
        )}
      </div>
    </div>
  );
};

const RewardsPanel: React.FC<GameDrawersProps> = ({ wallet, avatar, setAvatar, onBuyItem }) => {
  const [tab, setTab] = useState<RewardsTab>('front');
  const owned = SHOP_ITEMS.filter((i) => wallet.owned.includes(i.id));
  const featured = SHOP_ITEMS.find((i) => !wallet.owned.includes(i.id)) ?? SHOP_ITEMS[0];
  const earned = REWARDS.filter((r) => wallet.claimed.includes(r.id));
  const go = (t: RewardsTab) => {
    sfx.click();
    setTab(t);
  };
  const buy = (item: ShopItem) => {
    sfx.success();
    onBuyItem(item.id);
  };
  const wear = (item: ShopItem) => {
    sfx.click();
    setAvatar((a) => wearing(a, item));
  };
  const card = (item: ShopItem) => (
    <ShopCard key={item.id} item={item} avatar={avatar} wallet={wallet} onBuy={() => buy(item)} onWear={() => wear(item)} />
  );

  return (
    <div>
      <div className="rewards-topline">
        <span className="cream-muted" style={{ fontSize: 14 }}>
          Help around Block 260 to earn coins, then treat yourself.
        </span>
        <span className="coin-badge" aria-label={`${wallet.coins} coins`}>
          <UiIcon name="coin" size={32} />
          {wallet.coins}
          <small>coins</small>
        </span>
      </div>

      <div className="cream-tabs" role="tablist">
        {REWARDS_TABS.map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={tab === id}
            className={`cream-tab${tab === id ? ' is-active' : ''}`}
            onClick={() => go(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'front' && (
        <div className="rewards-front">
          <div className="cream-card rewards-hero">
            <div className="panel-eyebrow">The Sunshine collection</div>
            <div className="sprite-tile rewards-hero-stage">
              <PlayerSpritePreview avatar={wearing(avatar, featured)} scale={3} />
            </div>
            <div className="rewards-hero-title">Fresh threads for the estate.</div>
            <div className="cream-muted">
              Try the {featured.label} for <CoinAmount amount={featured.price} />.
            </div>
            <button type="button" className="teal-btn" style={{ marginTop: 14 }} onClick={() => go('clothing')}>
              Browse clothing →
            </button>
          </div>
          <div style={{ display: 'grid', gap: 14, alignContent: 'start' }}>
            <div className="cream-card">
              <div className="panel-eyebrow">Earn coins</div>
              <div className="rewards-card-title">
                {earned.length} of {REWARDS.length} rewards claimed
              </div>
              <div className="px-bar is-teal rewards-progress">
                <span style={{ width: `${(earned.length / REWARDS.length) * 100}%` }} />
              </div>
              <button type="button" className="pixel-secondary-btn" onClick={() => go('earn')}>
                How to earn →
              </button>
            </div>
            <div className="cream-card">
              <div className="panel-eyebrow">Your finds, all together</div>
              <div className="rewards-card-title">
                {owned.length} of {SHOP_ITEMS.length} outfits collected
              </div>
              <button type="button" className="pixel-secondary-btn" onClick={() => go('collection')}>
                See your collection →
              </button>
            </div>
          </div>
        </div>
      )}

      {tab === 'earn' && (
        <div style={{ display: 'grid', gap: 8 }}>
          {REWARDS.map((r) => {
            const done = wallet.claimed.includes(r.id);
            return (
              <div key={r.id} className="cream-card rewards-row" style={{ opacity: done ? 0.7 : 1 }}>
                <span style={{ fontWeight: 700 }}>
                  {done ? '✓ ' : ''}
                  {r.label}
                </span>
                {done ? <span className="pill">Claimed</span> : <CoinAmount amount={r.coins} size={32} />}
              </div>
            );
          })}
        </div>
      )}

      {tab === 'clothing' && <div className="shop-grid">{SHOP_ITEMS.map(card)}</div>}

      {tab === 'collection' &&
        (owned.length ? (
          <div className="shop-grid">{owned.map(card)}</div>
        ) : (
          <div className="cream-card" style={{ textAlign: 'center', padding: 28 }}>
            <div className="rewards-card-title">Nothing here yet</div>
            <p className="cream-muted" style={{ margin: '6px 0 14px' }}>
              Outfits you buy will appear here and in your Wardrobe.
            </p>
            <button type="button" className="teal-btn" onClick={() => go('clothing')}>
              Browse clothing →
            </button>
          </div>
        ))}

      <div className="cream-muted" style={{ textAlign: 'center', marginTop: 16, fontSize: 12 }}>
        Coins are earned in the game only. No real-money payments.
      </div>
    </div>
  );
};
