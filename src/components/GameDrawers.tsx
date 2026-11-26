import React from 'react';
import {
  DEFAULT_AVATAR,
  HAIR_COLORS,
  MAP_LANDMARKS,
  PANTS_COLORS,
  SHIELD_STYLES,
  SHIRT_COLORS,
  SINGAPORE_WORLD_LANDMARKS,
  SKIN_TONES,
} from '../data/gameData';
import {
  AvatarConfig,
  DrawerType,
  InventoryItem,
  QuestId,
  ShieldLetter,
  ShieldSkillState,
  TimeOfDay,
} from '../types/game';
import { sfx } from '../utils/sound';
import {
  ChopeTissueIcon,
  EzLinkCardIcon,
  FieldNotesIcon,
  KopiDabaoIcon,
  PlayerPortrait,
  ReceiptIcon,
  ShieldEmblemIcon,
} from './PixelIcons';

interface GameDrawersProps {
  activeDrawer: DrawerType;
  onClose: () => void;
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  inventory: InventoryItem[];
  skills: Record<ShieldLetter, ShieldSkillState>;
  questId: QuestId;
  ezLinkPickedUp: boolean;
  timeOfDay: TimeOfDay;
  onToggleTimeOfDay: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  squadCode: string;
  onWalkToLandmark: (gx: number, gy: number) => void;
  onStartLookoutMission: () => void;
  onReturnToTitle: () => void;
}

export const GameDrawers: React.FC<GameDrawersProps> = ({
  activeDrawer,
  onClose,
  avatar,
  setAvatar,
  inventory,
  skills,
  questId,
  ezLinkPickedUp,
  timeOfDay,
  onToggleTimeOfDay,
  soundEnabled,
  onToggleSound,
  squadCode,
  onWalkToLandmark,
  onStartLookoutMission,
  onReturnToTitle,
}) => {
  if (!activeDrawer) return null;

  const titles: Record<Exclude<DrawerType, null>, string> = {
    backpack: 'BACKPACK & FIELD CLUES',
    wardrobe: 'WARDROBE & CUSTOMISATION',
    map: 'BLOCK 260 NEIGHBOURHOOD MAP',
    menu: 'SHIELDQUEST MENU',
    quest: 'CURRENT QUESTS',
    shield: 'S.H.I.E.L.D. COMPETENCIES & GUARDIANS',
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12, 14, 22, 0.56)',
        zIndex: 35,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        className="pixel-modal-frame pixel-scroll"
        style={{
          width: 'min(92vw, 560px)',
          maxHeight: '84vh',
          overflowY: 'auto',
          padding: 20,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 10,
            borderBottom: '2px solid rgba(200, 155, 103, 0.35)',
            paddingBottom: 10,
            marginBottom: 14,
          }}
        >
          <h2
            style={{
              margin: 0,
              fontFamily: 'var(--font-display)',
              fontSize: 15,
              color: '#f3c46b',
            }}
          >
            {titles[activeDrawer]}
          </h2>
          <button
            type="button"
            className="pixel-secondary-btn"
            onClick={() => {
              sfx.click();
              onClose();
            }}
          >
            CLOSE
          </button>
        </div>

        {/* BACKPACK */}
        {activeDrawer === 'backpack' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {inventory.map((item) => (
              <div
                key={item.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  background: '#1b202b',
                  border: `2px solid ${item.collected ? '#63b5a7' : '#3c4356'}`,
                  borderRadius: 8,
                  padding: '10px 12px',
                  opacity: item.collected ? 1 : 0.55,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 8,
                    background: '#272f40',
                    border: '2px solid #231a16',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {item.icon === 'ezlink' ? (
                    <EzLinkCardIcon size={34} />
                  ) : item.icon === 'chope' ? (
                    <ChopeTissueIcon size={30} />
                  ) : item.icon === 'kopi' ? (
                    <KopiDabaoIcon size={30} />
                  ) : item.icon === 'receipt' ? (
                    <ReceiptIcon size={30} />
                  ) : (
                    <FieldNotesIcon size={30} />
                  )}
                </div>
                <div>
                  <div style={{ fontWeight: 700, color: '#f3c46b', fontSize: 14 }}>
                    {item.name} {!item.collected && '(Not found yet)'}
                  </div>
                  <div style={{ fontSize: 13, color: '#d0d7e3', marginTop: 2 }}>
                    {item.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* WARDROBE */}
        {activeDrawer === 'wardrobe' && (
          <div style={{ display: 'grid', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 76,
                  height: 76,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid #231a16',
                  boxShadow: '0 0 0 3px #c89b67',
                  flexShrink: 0,
                }}
              >
                <PlayerPortrait avatar={avatar} size={68} />
              </div>
              <div style={{ flex: 1 }}>
                <label style={{ fontSize: 12, color: '#f3c46b', display: 'block', marginBottom: 4 }}>
                  Display Name
                </label>
                <input
                  type="text"
                  maxLength={14}
                  value={avatar.name}
                  onChange={(e) =>
                    setAvatar((prev) => ({ ...prev, name: e.target.value }))
                  }
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '2px solid #231a16',
                    background: '#2b3244',
                    color: '#fff',
                    fontSize: 15,
                    fontWeight: 600,
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>Hair Style</div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {(['short', 'spiky', 'bob', 'ponytail'] as AvatarConfig['hairStyle'][]).map(
                  (style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((p) => ({ ...p, hairStyle: style }));
                      }}
                      style={{
                        padding: '6px 12px',
                        borderRadius: 6,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                        background: avatar.hairStyle === style ? '#3a4254' : '#1b202b',
                        border:
                          avatar.hairStyle === style
                            ? '2px solid #f3c46b'
                            : '2px solid #3c4356',
                        color: '#f5efe6',
                      }}
                    >
                      {style}
                    </button>
                  )
                )}
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>Skin Tone</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {SKIN_TONES.map((s) => (
                    <button
                      key={s.color}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((p) => ({ ...p, skinTone: s.color }));
                      }}
                      style={{
                        width: 28,
                        height: 26,
                        borderRadius: 6,
                        background: s.color,
                        cursor: 'pointer',
                        border:
                          avatar.skinTone === s.color
                            ? '3px solid #f3c46b'
                            : '2px solid #231a16',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>Hair Color</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {HAIR_COLORS.map((h) => (
                    <button
                      key={h.color}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((p) => ({ ...p, hairColor: h.color }));
                      }}
                      style={{
                        width: 28,
                        height: 26,
                        borderRadius: 6,
                        background: h.color,
                        cursor: 'pointer',
                        border:
                          avatar.hairColor === h.color
                            ? '3px solid #f3c46b'
                            : '2px solid #231a16',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>Top Tee</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {SHIRT_COLORS.map((t) => (
                    <button
                      key={t.color}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((p) => ({ ...p, shirtColor: t.color }));
                      }}
                      style={{
                        width: 28,
                        height: 26,
                        borderRadius: 6,
                        background: t.color,
                        cursor: 'pointer',
                        border:
                          avatar.shirtColor === t.color
                            ? '3px solid #f3c46b'
                            : '2px solid #231a16',
                      }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>Shorts / Pants</div>
                <div style={{ display: 'flex', gap: 7 }}>
                  {PANTS_COLORS.map((p) => (
                    <button
                      key={p.color}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((prev) => ({ ...prev, pantsColor: p.color }));
                      }}
                      style={{
                        width: 28,
                        height: 26,
                        borderRadius: 6,
                        background: p.color,
                        cursor: 'pointer',
                        border:
                          avatar.pantsColor === p.color
                            ? '3px solid #f3c46b'
                            : '2px solid #231a16',
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>

            <div>
              <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 5 }}>
                Shield Backpack Crest
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {SHIELD_STYLES.map((sh) => (
                  <button
                    key={sh.id}
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setAvatar((p) => ({ ...p, shieldStyle: sh.id }));
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '5px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      background: avatar.shieldStyle === sh.id ? '#344157' : '#1b202b',
                      border:
                        avatar.shieldStyle === sh.id
                          ? '2px solid #f3c46b'
                          : '2px solid #3c4356',
                      color: '#f5efe6',
                      fontSize: 12.5,
                    }}
                  >
                    <ShieldEmblemIcon size={20} accent={sh.accent} />
                    <span>{sh.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <button
                type="button"
                className="pixel-secondary-btn"
                onClick={() => {
                  sfx.click();
                  setAvatar(DEFAULT_AVATAR);
                }}
              >
                RESET TO DEFAULT
              </button>
            </div>
          </div>
        )}

        {/* MAP */}
        {activeDrawer === 'map' && (
          <div style={{ display: 'grid', gap: 12 }}>
            {/* Illustrated Pixel Singapore Skyline & Heartland Map Header */}
            <div
              style={{
                background: 'linear-gradient(180deg, #1d2744 0%, #2b3c60 68%, #2a473a 100%)',
                border: '2px solid #231a16',
                borderRadius: 8,
                padding: '10px 12px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 8,
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-display)',
                    fontSize: 10.5,
                    color: '#f3c46b',
                  }}
                >
                  SINGAPORE HEARTLAND &amp; BAYCREST VISTA
                </span>
                <span style={{ fontSize: 11, color: '#9cd6c8' }}>Blk 260 Pilot Active</span>
              </div>

              {/* Mini Pixel SVG Skyline with Renamed Game Landmarks */}
              <svg
                viewBox="0 0 480 96"
                width="100%"
                height="92"
                shapeRendering="crispEdges"
                style={{ display: 'block', borderRadius: 6, background: '#1c243c' }}
              >
                {/* Bay water */}
                <rect x="0" y="72" width="480" height="24" fill="#253b5e" />
                <rect x="0" y="84" width="480" height="12" fill="#3b5e42" />
                {/* GlowTree Grove */}
                <rect x="34" y="42" width="3" height="30" fill="#7c56a8" />
                <ellipse cx="35" cy="41" rx="11" ry="4" fill="#b68ce0" />
                <rect x="58" y="48" width="3" height="24" fill="#7c56a8" />
                <ellipse cx="59" cy="47" rx="9" ry="3.5" fill="#9c72c9" />
                {/* Baycrest SkyDeck (MBS-inspired) */}
                <rect x="108" y="22" width="11" height="50" fill="#4f6791" />
                <rect x="125" y="22" width="11" height="50" fill="#4f6791" />
                <rect x="142" y="22" width="11" height="50" fill="#4f6791" />
                <polygon points="98,20 162,20 166,15 103,15" fill="#829dc9" />
                <rect x="106" y="17" width="52" height="2" fill="#f5cf7b" />
                {/* Lion City Wheel */}
                <circle cx="204" cy="46" r="20" fill="none" stroke="#9ab4d6" strokeWidth="2" />
                <line x1="194" y1="72" x2="204" y2="46" stroke="#6c82a3" strokeWidth="2" />
                <line x1="214" y1="72" x2="204" y2="46" stroke="#6c82a3" strokeWidth="2" />
                {/* Durian Dome Arts */}
                <path d="M244 72 A11 11 0 0 1 266 72 Z" fill="#b5a78e" />
                <path d="M268 72 A11 11 0 0 1 290 72 Z" fill="#b5a78e" />
                {/* Blk 260 & Sunshine Minimart */}
                <rect x="328" y="28" width="66" height="48" fill="#d8cfc0" />
                <rect x="328" y="54" width="66" height="6" fill="#c97855" />
                <rect x="364" y="60" width="28" height="8" fill="#f7e17c" />
                <text x="334" y="42" fill="#3d7296" fontSize="9" fontFamily="monospace" fontWeight="bold">
                  260
                </text>
                {/* Emerald Dragon Playground */}
                <circle cx="432" cy="66" r="7" fill="#5da678" />
                <rect x="438" y="62" width="16" height="8" fill="#d97a54" />
                {/* Labels */}
                <text x="12" y="12" fill="#cfa7f2" fontSize="8" fontFamily="sans-serif">
                  GlowTree
                </text>
                <text x="96" y="11" fill="#f3c46b" fontSize="8" fontFamily="sans-serif" fontWeight="bold">
                  Baycrest SkyDeck
                </text>
                <text x="182" y="20" fill="#a8c7eb" fontSize="8" fontFamily="sans-serif">
                  Lion Wheel
                </text>
                <text x="238" y="55" fill="#e6d6b8" fontSize="8" fontFamily="sans-serif">
                  Durian Dome
                </text>
                <text x="328" y="22" fill="#8de0cf" fontSize="8" fontFamily="sans-serif" fontWeight="bold">
                  Blk 260 (You)
                </text>
                <text x="406" y="54" fill="#8be0a4" fontSize="8" fontFamily="sans-serif">
                  Dragon Park
                </text>
              </svg>
            </div>

            <div style={{ fontSize: 12.5, color: '#f3c46b', fontWeight: 700 }}>
              PLAYABLE BLK 260 LOCATIONS — TAP TO WALK:
            </div>
            {MAP_LANDMARKS.map((loc) => (
              <div
                key={loc.id}
                style={{
                  background: '#1b202b',
                  border: '2px solid #3c4356',
                  borderRadius: 8,
                  padding: '9px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={{ fontWeight: 700, color: loc.color, fontSize: 14 }}>{loc.name}</div>
                  <div style={{ fontSize: 12.5, color: '#cfd6e3', marginTop: 2 }}>{loc.detail}</div>
                </div>
                <button
                  type="button"
                  className="pixel-action-btn"
                  style={{ fontSize: 11, padding: '7px 11px', flexShrink: 0 }}
                  onClick={() => {
                    sfx.click();
                    onWalkToLandmark(loc.gx, loc.gy);
                    onClose();
                  }}
                >
                  WALK HERE
                </button>
              </div>
            ))}

            <div style={{ fontSize: 12.5, color: '#9cd6c8', fontWeight: 700, marginTop: 4 }}>
              SINGAPORE GAME DISTRICTS &amp; SKYLINE LANDMARKS:
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 8 }}>
              {SINGAPORE_WORLD_LANDMARKS.filter((l) => l.id !== 'blk260').map((sg) => (
                <div
                  key={sg.id}
                  style={{
                    background: '#181c26',
                    border: '2px solid #32394a',
                    borderRadius: 7,
                    padding: '8px 10px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: sg.accent, fontSize: 13 }}>{sg.gameName}</div>
                  <div style={{ fontSize: 11.5, color: '#9da7ba', marginTop: 1 }}>
                    {sg.district} • {sg.status}
                  </div>
                  <div style={{ fontSize: 12, color: '#cfd6e3', marginTop: 3 }}>{sg.summary}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* QUEST LOG */}
        {activeDrawer === 'quest' && (
          <div style={{ display: 'grid', gap: 12 }}>
            <div
              style={{
                background: '#1b202b',
                border: `2px solid ${questId === 'ezlink' ? '#f3c46b' : '#48a999'}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#f3c46b', fontSize: 15 }}>
                1. Find Uncle&apos;s EZ-Link {questId !== 'ezlink' ? '✓ Completed' : '(Active)'}
              </div>
              <p style={{ margin: '6px 0 10px', fontSize: 13.5, color: '#d0d7e3', lineHeight: 1.45 }}>
                {ezLinkPickedUp
                  ? 'You picked up the teal EZ-Link card! Return to Uncle Tan near the green recycling bin.'
                  : 'Uncle Tan misplaced his EZ-Link bus card near Block 260. Check by the Void Deck stone table and bring it back to him!'}
              </p>
              {questId === 'ezlink' && (
                <button
                  type="button"
                  className="pixel-secondary-btn"
                  onClick={() => {
                    sfx.click();
                    onWalkToLandmark(ezLinkPickedUp ? 4.9 : 8.6, ezLinkPickedUp ? 7.0 : 4.2);
                    onClose();
                  }}
                >
                  {ezLinkPickedUp ? 'WALK TO UNCLE TAN' : 'CHECK VOID DECK TABLE'}
                </button>
              )}
            </div>

            <div
              style={{
                background: '#1b202b',
                border: `2px solid ${questId === 'lookout' ? '#f3c46b' : '#3c4356'}`,
                borderRadius: 8,
                padding: '12px 14px',
              }}
            >
              <div style={{ fontWeight: 700, color: '#8de0cf', fontSize: 15 }}>
                2. The Lookout Dilemma — Sunshine Minimart{' '}
                {questId === 'completed' ? '✓ Completed' : ''}
              </div>
              <p style={{ margin: '6px 0 10px', fontSize: 13.5, color: '#d0d7e3', lineHeight: 1.45 }}>
                Visit Sunshine Minimart on the right side of Block 260 to practise all six
                S.H.I.E.L.D. shop-theft prevention skills.
              </p>
              <button
                type="button"
                className="pixel-action-btn"
                style={{ fontSize: 11 }}
                onClick={() => {
                  sfx.click();
                  onClose();
                  onStartLookoutMission();
                }}
              >
                PLAY LOOKOUT DILEMMA
              </button>
            </div>
          </div>
        )}

        {/* SHIELD SKILLS */}
        {activeDrawer === 'shield' && (
          <div style={{ display: 'grid', gap: 8 }}>
            <p style={{ margin: '0 0 6px', fontSize: 13.5, color: '#d0d7e3' }}>
              Each S.H.I.E.L.D. skill is independently assessed and unlocks its Original Guardian:
            </p>
            {(Object.keys(skills) as ShieldLetter[]).map((letter) => {
              const st = skills[letter];
              return (
                <div
                  key={letter}
                  style={{
                    background: '#1b202b',
                    border: `2px solid ${st.passed ? '#48a999' : '#3c4356'}`,
                    borderRadius: 8,
                    padding: '9px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 10,
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, color: '#f3c46b', fontSize: 14 }}>
                      {st.letter} — {st.title}
                    </div>
                    <div style={{ fontSize: 12.5, color: '#c4ccdc', marginTop: 2 }}>
                      {st.promptSummary}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: 12, color: '#8de0cf', fontWeight: 600 }}>
                      {st.guardianName}
                    </div>
                    <div
                      style={{
                        fontFamily: 'var(--font-display)',
                        fontSize: 10,
                        color: st.completed ? (st.passed ? '#7ce8be' : '#f29f8d') : '#9aa4b8',
                      }}
                    >
                      {st.completed ? `${st.score}/${st.maxScore}` : 'PENDING'}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* MENU */}
        {activeDrawer === 'menu' && (
          <div style={{ display: 'grid', gap: 10 }}>
            {squadCode && (
              <div
                style={{
                  background: '#1b202b',
                  border: '2px solid #63b5a7',
                  borderRadius: 8,
                  padding: '9px 12px',
                  fontSize: 13,
                  color: '#8de0cf',
                }}
              >
                Workshop Squad Code: <strong>{squadCode}</strong> (Pseudonymous Session)
              </div>
            )}

            <div
              style={{
                background: '#1b202b',
                border: '2px solid #3c4356',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Time & Atmosphere</div>
                <div style={{ fontSize: 12.5, color: '#bcc4d4' }}>
                  Currently {timeOfDay === 'evening' ? '19:15 Evening Dusk' : '17:30 Late Afternoon'}
                </div>
              </div>
              <button
                type="button"
                className="pixel-secondary-btn"
                onClick={() => {
                  sfx.click();
                  onToggleTimeOfDay();
                }}
              >
                SWITCH TO {timeOfDay === 'evening' ? '17:30' : '19:15'}
              </button>
            </div>

            <div
              style={{
                background: '#1b202b',
                border: '2px solid #3c4356',
                borderRadius: 8,
                padding: '10px 14px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <div>
                <div style={{ fontWeight: 700, fontSize: 14 }}>Sound Effects</div>
                <div style={{ fontSize: 12.5, color: '#bcc4d4' }}>Cozy 8-bit chiptune feedback</div>
              </div>
              <button type="button" className="pixel-secondary-btn" onClick={onToggleSound}>
                {soundEnabled ? 'ON' : 'OFF'}
              </button>
            </div>

            <div
              style={{
                background: '#1b202b',
                border: '2px solid #3c4356',
                borderRadius: 8,
                padding: '10px 14px',
                fontSize: 13,
                color: '#d0d7e3',
                lineHeight: 1.45,
              }}
            >
              <strong style={{ color: '#f3c46b' }}>Controls:</strong> Click/Tap anywhere on the
              footpath, void deck, or Sunshine Minimart to walk there, or use{' '}
              <strong>WASD / Arrow Keys</strong> (+ <strong>Shift</strong> to run). Click Uncle Tan,
              the glowing EZ-Link card, or Sunshine Minimart to interact!
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
              <button
                type="button"
                className="pixel-action-btn"
                style={{ flex: 1 }}
                onClick={() => {
                  sfx.click();
                  onClose();
                  onStartLookoutMission();
                }}
              >
                SUNSHINE MINIMART QUEST
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
                TITLE SCREEN
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
