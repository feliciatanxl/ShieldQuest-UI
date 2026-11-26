import React, { useEffect, useState } from 'react';
import {
  DEFAULT_AVATAR,
  HAIR_COLORS,
  MAP_LANDMARKS,
  PANTS_COLORS,
  SHIELD_STYLES,
  SHIRT_COLORS,
  SKIN_TONES,
} from '../data/gameData';
import {
  AvatarConfig,
  DrawerType,
  InventoryItem,
  QuestId,
  ShieldLetter,
  ShieldSkillState,
} from '../types/game';
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
  onWalkToLandmark: (target: { x: number; y: number }) => void;
  onStartLookoutMission: () => void;
  onReturnToTitle: () => void;
}

const HEADINGS: Record<Exclude<DrawerType, null>, [eyebrow: string, title: string]> = {
  backpack: ['Your adventure', 'Pack'],
  wardrobe: ['Wardrobe', 'Choose your look'],
  map: ['Neighbourhood guide', 'Area map'],
  menu: ['Your adventure', 'Settings'],
  quest: ['Your adventure', 'Quests'],
  shield: ['Your adventure', 'Guardians'],
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
  const wide = activeDrawer === 'wardrobe' || activeDrawer === 'map';

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

const WardrobePanel: React.FC<GameDrawersProps> = ({ avatar, setAvatar }) => {
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
              options={SHIRT_COLORS}
              value={avatar.shirtColor}
              onPick={(c) => set({ shirtColor: c })}
            />
          )}
          {tab === 'legs' && (
            <ColourGrid
              heading="Shorts"
              hint="Comfy for walking around the estate."
              options={PANTS_COLORS}
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

const MapPanel: React.FC<GameDrawersProps> = ({ clock, playerPos, onWalkToLandmark, onClose }) => {
  const pct = (p: { x: number; y: number }) => ({ left: `${(p.x / 1280) * 100}%`, top: `${(p.y / 720) * 100}%` });
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <span className="pill" style={{ justifySelf: 'start' }}>
        📍 Block 260, Sunshine Estate
      </span>
      <div className="cream-card" style={{ padding: 10 }}>
        <div className="area-map">
          <img
            src={`/assets/scenes/${clock.timeOfDay === 'evening' ? 'street-night' : 'street-day'}.png`}
            alt="Block 260 street: bus stop, void deck and Sunshine Minimart"
          />
          {MAP_LANDMARKS.map((loc) => (
            <button
              key={loc.id}
              type="button"
              className="map-marker"
              style={pct(loc)}
              title={`Walk to ${loc.name}`}
              onClick={() => {
                sfx.click();
                onWalkToLandmark(loc);
                onClose();
              }}
            >
              <span className="map-dot" style={{ background: loc.color }}>
                {loc.name[0]}
              </span>
              <span className="map-label">{loc.name}</span>
            </button>
          ))}
          <div className="map-you" style={pct(playerPos)} aria-label="You are here">
            YOU
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', fontSize: 13 }}>
        <span>
          <span className="map-you map-you-inline">YOU</span> You
        </span>
        {MAP_LANDMARKS.map((loc) => (
          <span key={loc.id} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
            <span className="map-dot" style={{ background: loc.color, position: 'static' }}>
              {loc.name[0]}
            </span>
            {loc.name}
          </span>
        ))}
      </div>
      <div className="cream-muted">Tap a marker to walk there.</div>
    </div>
  );
};

// ---------- Quests ----------

const QuestPanel: React.FC<GameDrawersProps> = ({
  questId,
  ezLinkPickedUp,
  onWalkToLandmark,
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
            onWalkToLandmark(ezLinkPickedUp ? { x: 600, y: 480 } : { x: 790, y: 478 });
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
