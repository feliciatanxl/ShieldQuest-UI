import React, { useEffect, useRef, useState } from 'react';
import {
  DEFAULT_AVATAR,
  HAIR_COLORS,
  SHIELD_STYLES,
  SHIRT_COLORS,
  SKIN_TONES,
} from '../data/gameData';
import { CANVAS_H, CANVAS_W, renderIsometricWorld } from '../game/isometricRenderer';
import { AvatarConfig, NPCEntity, TimeOfDay } from '../types/game';
import { sfx } from '../utils/sound';
import {
  ClockIcon,
  DayWeatherIcon,
  MoonIcon,
  NightWeatherIcon,
  PlayerPortrait,
  ShieldEmblemIcon,
} from './PixelIcons';

interface LandingScreenProps {
  avatar: AvatarConfig;
  setAvatar: React.Dispatch<React.SetStateAction<AvatarConfig>>;
  timeOfDay: TimeOfDay;
  setTimeOfDay: React.Dispatch<React.SetStateAction<TimeOfDay>>;
  squadCode: string;
  setSquadCode: (code: string) => void;
  onStartGame: () => void;
}

const PREVIEW_NPCS: NPCEntity[] = [
  {
    id: 'uncle',
    name: 'Uncle Tan',
    role: 'Neighbourhood Elder',
    gx: 4.9,
    gy: 6.3,
    dir: 'SW',
    shirtColor: '#c9d4db',
    pantsColor: '#6b5344',
    hairColor: '#c8cdd4',
    skinTone: '#d49d78',
    isBald: true,
  },
  {
    id: 'auntie',
    name: 'Auntie Mei',
    role: 'Neighbour',
    gx: 7.4,
    gy: 8.6,
    dir: 'SE',
    shirtColor: '#d97b74',
    pantsColor: '#48454f',
    hairColor: '#2d2930',
    skinTone: '#d6a07b',
    hasBag: true,
  },
];

export const LandingScreen: React.FC<LandingScreenProps> = ({
  avatar,
  setAvatar,
  timeOfDay,
  setTimeOfDay,
  squadCode,
  setSquadCode,
  onStartGame,
}) => {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [showSquadInput, setShowSquadInput] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);

  // Live animated background preview of the exact Singapore neighbourhood!
  useEffect(() => {
    let rafId = 0;
    const start = performance.now();

    const frame = (now: number) => {
      const t = (now - start) / 1000;
      const canvas = bgCanvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const auntieGx = 9.4 + Math.sin(t * 0.34) * 1.6;
          const auntieDir = Math.cos(t * 0.34) >= 0 ? 'SE' : 'NW';
          renderIsometricWorld(ctx, {
            time: t,
            timeOfDay,
            player: {
              gx: 4.0,
              gy: 7.9,
              dir: 'NE',
              isMoving: false,
              walkPhase: 0,
              avatar,
            },
            npcs: [
              PREVIEW_NPCS[0],
              { ...PREVIEW_NPCS[1], gx: auntieGx, dir: auntieDir },
            ],
            ezLinkFound: false,
            ezLinkPickedUp: false,
            hoveredTarget: null,
            activeSpeechBubble: {
              npcId: 'uncle',
              text: 'Eh boy, did you see my bus card?',
              icon: 'ezlink',
            },
            walkTargetMarker: null,
          });
        }
      }
      rafId = requestAnimationFrame(frame);
    };

    rafId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(rafId);
  }, [avatar, timeOfDay]);

  const hairOptions: AvatarConfig['hairStyle'][] = ['short', 'spiky', 'bob', 'ponytail'];

  return (
    <div
      style={{
        position: 'relative',
        width: '100vw',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#161a24',
      }}
    >
      {/* Live Animated Heartland Canvas Backdrop */}
      <canvas
        ref={bgCanvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          filter: 'blur(2px) brightness(0.68)',
          transform: 'scale(1.02)',
        }}
      />

      {/* Cozy radial vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at center, rgba(20, 24, 36, 0.25) 0%, rgba(16, 19, 28, 0.78) 100%)',
        }}
      />

      {/* Top-Right Time-of-Day Mood Toggle */}
      <button
        type="button"
        onClick={() => {
          sfx.click();
          setTimeOfDay((prev) => (prev === 'evening' ? 'afternoon' : 'evening'));
        }}
        className="pixel-wood-panel"
        style={{
          position: 'absolute',
          top: 18,
          right: 22,
          zIndex: 10,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '6px 14px',
          cursor: 'pointer',
          color: '#231a16',
        }}
        title="Switch Afternoon (17:30) / Evening (19:15)"
      >
        {timeOfDay === 'evening' ? <MoonIcon size={26} /> : <ClockIcon size={26} />}
        <span style={{ fontWeight: 700, fontSize: 18, letterSpacing: '0.03em' }}>
          {timeOfDay === 'evening' ? '19:15' : '17:30'}
        </span>
        {timeOfDay === 'evening' ? <NightWeatherIcon size={26} /> : <DayWeatherIcon size={26} />}
      </button>

      {/* Main Cozy Landing Start Card */}
      <div
        className="pixel-modal-frame pixel-scroll"
        style={{
          position: 'relative',
          zIndex: 5,
          width: 'min(92vw, 760px)',
          maxHeight: '90vh',
          overflowY: 'auto',
          padding: '26px 28px 24px',
        }}
      >
        {/* Title Banner */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 14,
            borderBottom: '2px solid rgba(200, 155, 103, 0.35)',
            paddingBottom: 16,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div className="animate-float-slow">
              <ShieldEmblemIcon
                size={54}
                accent={
                  SHIELD_STYLES.find((s) => s.id === avatar.shieldStyle)?.accent || '#9ab0c4'
                }
              />
            </div>
            <div>
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'clamp(22px, 3.6vw, 32px)',
                  color: '#f5cf7b',
                  letterSpacing: '0.06em',
                }}
                className="text-outline"
              >
                SHIELDQUEST
              </div>
              <div style={{ fontSize: 14, color: '#d7cfc4', marginTop: 2 }}>
                A cosy 2D isometric adventure set in the Singapore heartlands
              </div>
            </div>
          </div>

          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 10,
              color: '#f3c46b',
              background: 'rgba(198, 154, 103, 0.16)',
              border: '2px solid #8e5f39',
              borderRadius: 6,
              padding: '5px 10px',
            }}
          >
            BLOCK 260 • PROJECT SHIELD
          </div>
        </div>

        {/* Character Setup + Adventure Preview Grid */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
            gap: 20,
            marginTop: 18,
          }}
        >
          {/* Left Column: Avatar Preview & Name */}
          <div
            style={{
              background: '#1b202b',
              border: '2px solid #485063',
              borderRadius: 10,
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <div
                style={{
                  width: 74,
                  height: 74,
                  borderRadius: '50%',
                  overflow: 'hidden',
                  border: '4px solid #231a16',
                  boxShadow: '0 0 0 3px #c89b67',
                  flexShrink: 0,
                  background: '#cbb08b',
                }}
              >
                <PlayerPortrait avatar={avatar} size={66} />
              </div>

              <div style={{ flex: 1 }}>
                <label
                  htmlFor="player-nickname"
                  style={{
                    display: 'block',
                    fontSize: 12,
                    color: '#f3c46b',
                    fontWeight: 600,
                    marginBottom: 4,
                  }}
                >
                  Nickname (Pseudonymous)
                </label>
                <input
                  id="player-nickname"
                  type="text"
                  maxLength={14}
                  value={avatar.name}
                  onChange={(e) =>
                    setAvatar((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Player"
                  style={{
                    width: '100%',
                    padding: '7px 10px',
                    borderRadius: 6,
                    border: '2px solid #231a16',
                    background: '#2c3344',
                    color: '#ffffff',
                    fontFamily: 'var(--font-ui)',
                    fontSize: 15,
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
              </div>
            </div>

            {/* Swatches: Skin / Shirt / Hair */}
            <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 4 }}>Hair Style</div>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {hairOptions.map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => {
                        sfx.click();
                        setAvatar((prev) => ({ ...prev, hairStyle: style }));
                      }}
                      style={{
                        padding: '4px 10px',
                        fontSize: 12,
                        borderRadius: 6,
                        cursor: 'pointer',
                        border:
                          avatar.hairStyle === style
                            ? '2px solid #f3c46b'
                            : '2px solid #3a4152',
                        background: avatar.hairStyle === style ? '#3a4254' : '#232836',
                        color: '#f4efe6',
                        textTransform: 'capitalize',
                        fontWeight: 600,
                      }}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <div>
                  <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 4 }}>Skin</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {SKIN_TONES.map((s) => (
                      <button
                        key={s.color}
                        type="button"
                        aria-label={s.label}
                        onClick={() => {
                          sfx.click();
                          setAvatar((prev) => ({ ...prev, skinTone: s.color }));
                        }}
                        style={{
                          width: 24,
                          height: 24,
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
                  <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 4 }}>Hair</div>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {HAIR_COLORS.map((h) => (
                      <button
                        key={h.color}
                        type="button"
                        aria-label={h.label}
                        onClick={() => {
                          sfx.click();
                          setAvatar((prev) => ({ ...prev, hairColor: h.color }));
                        }}
                        style={{
                          width: 24,
                          height: 24,
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

              <div>
                <div style={{ fontSize: 12, color: '#bcc4d4', marginBottom: 4 }}>Outfit Tee</div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {SHIRT_COLORS.map((t) => (
                    <button
                      key={t.color}
                      type="button"
                      aria-label={t.label}
                      onClick={() => {
                        sfx.click();
                        setAvatar((prev) => ({ ...prev, shirtColor: t.color }));
                      }}
                      style={{
                        width: 26,
                        height: 24,
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
                  <button
                    type="button"
                    onClick={() => {
                      sfx.click();
                      setAvatar(DEFAULT_AVATAR);
                    }}
                    style={{
                      marginLeft: 'auto',
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 5,
                      background: '#2b3142',
                      color: '#cbd2df',
                      border: '1px solid #495268',
                      cursor: 'pointer',
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Neighbourhood Mission Card & Controls */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: 12,
            }}
          >
            <div
              style={{
                background: '#1b202b',
                border: '2px solid #485063',
                borderRadius: 10,
                padding: 15,
              }}
            >
              <div
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 11,
                  color: '#f3c46b',
                  marginBottom: 8,
                }}
              >
                TONIGHT IN BLOCK 260
              </div>
              <p style={{ margin: '0 0 10px', fontSize: 14, lineHeight: 1.45, color: '#e5dfd5' }}>
                Explore <strong style={{ color: '#8ad8c8' }}>Blk 260 Shield View</strong>, the RC
                notice board, stone Xiangqi table and{' '}
                <strong style={{ color: '#f7e17c' }}>Sunshine Minimart</strong>—with{' '}
                <strong style={{ color: '#9ec4ea' }}>Baycrest SkyDeck</strong> &amp;{' '}
                <strong style={{ color: '#cfa7f2' }}>Lion City Wheel</strong> glowing across the
                Singapore skyline.
              </p>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                  fontSize: 11.5,
                  color: '#c4ccdc',
                }}
              >
                <span
                  style={{
                    background: '#272e3f',
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #3f485e',
                    color: '#f3c46b',
                  }}
                >
                  Blk 260 &amp; Sunshine Minimart
                </span>
                <span
                  style={{
                    background: '#272e3f',
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #3f485e',
                  }}
                >
                  Baycrest SkyDeck
                </span>
                <span
                  style={{
                    background: '#272e3f',
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #3f485e',
                  }}
                >
                  Durian Dome Arts
                </span>
                <span
                  style={{
                    background: '#272e3f',
                    padding: '3px 8px',
                    borderRadius: 5,
                    border: '1px solid #3f485e',
                  }}
                >
                  WASD / Tap to Walk
                </span>
              </div>
            </div>

            {showSquadInput && (
              <div
                style={{
                  background: '#1b202b',
                  border: '2px solid #63b5a7',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                }}
              >
                <input
                  type="text"
                  maxLength={10}
                  value={squadCode}
                  onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
                  placeholder="Workshop Code (e.g. NYP-04)"
                  style={{
                    flex: 1,
                    padding: '6px 10px',
                    borderRadius: 6,
                    border: '2px solid #231a16',
                    background: '#2b3244',
                    color: '#ffffff',
                    fontFamily: 'var(--font-display)',
                    fontSize: 12,
                  }}
                />
                <span style={{ fontSize: 11, color: '#8de0cf' }}>Optional</span>
              </div>
            )}

            {/* Start / Secondary CTA Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                type="button"
                className="pixel-action-btn"
                onClick={() => {
                  sfx.success();
                  onStartGame();
                }}
                style={{
                  width: '100%',
                  fontSize: 16,
                  padding: '13px 20px',
                  textAlign: 'center',
                }}
              >
                START GAME
              </button>

              <div style={{ display: 'flex', gap: 10 }}>
                <button
                  type="button"
                  className="pixel-secondary-btn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    sfx.click();
                    setShowSquadInput((v) => !v);
                  }}
                >
                  {showSquadInput ? 'HIDE SQUAD CODE' : 'JOIN SQUAD'}
                </button>
                <button
                  type="button"
                  className="pixel-secondary-btn"
                  style={{ flex: 1 }}
                  onClick={() => {
                    sfx.click();
                    setShowBriefModal(true);
                  }}
                >
                  S.H.I.E.L.D. BRIEF
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* S.H.I.E.L.D. Brief Modal */}
      {showBriefModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(12, 14, 22, 0.78)',
            zIndex: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={() => setShowBriefModal(false)}
        >
          <div
            className="pixel-modal-frame pixel-scroll"
            style={{ width: 'min(92vw, 560px)', maxHeight: '82vh', overflowY: 'auto', padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <h2
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-display)',
                  fontSize: 16,
                  color: '#f3c46b',
                }}
              >
                THE S.H.I.E.L.D. FRAMEWORK
              </h2>
              <button
                type="button"
                className="pixel-secondary-btn"
                onClick={() => setShowBriefModal(false)}
              >
                CLOSE
              </button>
            </div>
            <p style={{ fontSize: 14, color: '#d7cfc4', lineHeight: 1.5, marginTop: 0 }}>
              Choose Right. Protect Together. Each letter trains a separate real-world skill in
              situations like shop-theft peer pressure — without confrontation or vigilantism:
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {[
                ['S — Spot the Risk', 'Notice objective facts without jumping to assumptions.'],
                ['H — Hold Before Acting', 'Set an immediate safe boundary when pressured.'],
                ['I — Identify the Influence', 'Recognise peer-pressure tactics and requested roles.'],
                ['E — Evaluate Consequences', 'Think ahead about immediate and delayed ripple effects.'],
                ['L — Lead the Right Choice', 'Redirect a friend respectfully towards a safer choice.'],
                ['D — Defend Your Community', 'Seek trusted adult or store-staff help with clear facts.'],
              ].map(([title, desc]) => (
                <div
                  key={title}
                  style={{
                    background: '#1b202b',
                    border: '2px solid #3f485e',
                    borderRadius: 8,
                    padding: '9px 12px',
                  }}
                >
                  <div style={{ fontWeight: 700, color: '#f3c46b', fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 13, color: '#d2d8e4', marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
