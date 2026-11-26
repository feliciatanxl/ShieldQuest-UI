import React, { useState } from 'react';
import { DEFAULT_AVATAR, HAIR_COLORS, SHIRT_COLORS, SKIN_TONES } from '../data/gameData';
import { AvatarConfig, TimeOfDay } from '../types/game';
import { sfx } from '../utils/sound';
import {
  ClockIcon,
  DayWeatherIcon,
  MoonIcon,
  NightWeatherIcon,
  PlayerSpritePreview,
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

const HAIR_STYLES: AvatarConfig['hairStyle'][] = ['short', 'spiky', 'bob', 'ponytail'];

const SHIELD_BRIEF = [
  ['S — Spot the Risk', 'Notice objective facts without jumping to assumptions.'],
  ['H — Hold Before Acting', 'Set an immediate safe boundary when pressured.'],
  ['I — Identify the Influence', 'Recognise peer-pressure tactics and requested roles.'],
  ['E — Evaluate Consequences', 'Think ahead about immediate and delayed ripple effects.'],
  ['L — Lead the Right Choice', 'Redirect a friend respectfully towards a safer choice.'],
  ['D — Defend Your Community', 'Seek trusted adult or store-staff help with clear facts.'],
];

const Swatches: React.FC<{
  label: string;
  options: { label: string; color: string }[];
  value: string;
  onPick: (color: string) => void;
}> = ({ label, options, value, onPick }) => (
  <div>
    <div className="parchment-label">{label}</div>
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
      {options.map((o) => (
        <button
          key={o.color}
          type="button"
          aria-label={o.label}
          title={o.label}
          className={`pixel-swatch${value === o.color ? ' is-active' : ''}`}
          style={{ background: o.color }}
          onClick={() => {
            sfx.click();
            onPick(o.color);
          }}
        />
      ))}
    </div>
  </div>
);

export const LandingScreen: React.FC<LandingScreenProps> = ({
  avatar,
  setAvatar,
  timeOfDay,
  setTimeOfDay,
  squadCode,
  setSquadCode,
  onStartGame,
}) => {
  const [showSquadInput, setShowSquadInput] = useState(false);
  const [showBriefModal, setShowBriefModal] = useState(false);
  const evening = timeOfDay === 'evening';

  return (
    <div className="landing-root pixel-scroll">
      {/* Town overview art, slowly panning */}
      <div className={`landing-art${evening ? ' is-evening' : ''}`} aria-hidden="true" />
      <div className="landing-shade" aria-hidden="true" />

      <button
        type="button"
        onClick={() => {
          sfx.click();
          setTimeOfDay((prev) => (prev === 'evening' ? 'afternoon' : 'evening'));
        }}
        className="pixel-wood-panel landing-time"
        title="Switch Afternoon (17:30) / Evening (19:15)"
      >
        {evening ? <MoonIcon size={26} /> : <ClockIcon size={26} />}
        <span style={{ fontWeight: 700, fontSize: 18 }}>{evening ? '19:15' : '17:30'}</span>
        {evening ? <NightWeatherIcon size={26} /> : <DayWeatherIcon size={26} />}
      </button>

      <div className="landing-content">
        <header style={{ textAlign: 'center' }}>
          <h1 className="landing-title">SHIELDQUEST</h1>
          <div className="pixel-wood-panel landing-subtitle">
            A cosy heartland adventure · Block 260, Singapore
          </div>
        </header>

        <main className="pixel-parchment landing-card">
          <div className="landing-grid">
            {/* Hero preview */}
            <section className="parchment-inset landing-hero">
              <div className="parchment-heading">YOUR HERO</div>
              <div className="landing-stage">
                <PlayerSpritePreview avatar={avatar} scale={3} />
              </div>
              <label htmlFor="player-nickname" className="parchment-label">
                Nickname (pseudonymous)
              </label>
              <input
                id="player-nickname"
                type="text"
                maxLength={14}
                value={avatar.name}
                onChange={(e) => setAvatar((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Player"
                className="parchment-input"
              />
            </section>

            {/* Customisation + mission */}
            <section style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="parchment-inset" style={{ display: 'grid', gap: 10 }}>
                <div>
                  <div className="parchment-label">Hair style</div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {HAIR_STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        className={`pixel-chip${avatar.hairStyle === style ? ' is-active' : ''}`}
                        onClick={() => {
                          sfx.click();
                          setAvatar((prev) => ({ ...prev, hairStyle: style }));
                        }}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                  <Swatches
                    label="Skin"
                    options={SKIN_TONES}
                    value={avatar.skinTone}
                    onPick={(c) => setAvatar((p) => ({ ...p, skinTone: c }))}
                  />
                  <Swatches
                    label="Hair"
                    options={HAIR_COLORS}
                    value={avatar.hairColor}
                    onPick={(c) => setAvatar((p) => ({ ...p, hairColor: c }))}
                  />
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 10 }}>
                  <Swatches
                    label="Tee"
                    options={SHIRT_COLORS}
                    value={avatar.shirtColor}
                    onPick={(c) => setAvatar((p) => ({ ...p, shirtColor: c }))}
                  />
                  <button
                    type="button"
                    className="pixel-chip"
                    style={{ marginLeft: 'auto' }}
                    onClick={() => {
                      sfx.click();
                      setAvatar(DEFAULT_AVATAR);
                    }}
                  >
                    Reset
                  </button>
                </div>
              </div>

              <div className="parchment-inset">
                <div className="parchment-heading">{evening ? 'TONIGHT' : 'TODAY'} IN BLOCK 260</div>
                <p style={{ margin: 0, fontSize: 14, lineHeight: 1.45 }}>
                  Uncle Tan lost his <strong>EZ-Link card</strong> near the void deck, and something
                  feels off at <strong>Sunshine Minimart</strong>. Help your neighbours and practise
                  the <strong>S.H.I.E.L.D.</strong> way.
                </p>
              </div>

              {showSquadInput && (
                <div className="parchment-inset" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <input
                    type="text"
                    maxLength={10}
                    value={squadCode}
                    onChange={(e) => setSquadCode(e.target.value.toUpperCase())}
                    placeholder="Workshop Code (e.g. NYP-04)"
                    aria-label="Squad workshop code"
                    className="parchment-input"
                    style={{ fontFamily: 'var(--font-display)', fontSize: 12 }}
                  />
                  <span style={{ fontSize: 12, color: '#6b4a2c' }}>Optional</span>
                </div>
              )}
            </section>
          </div>

          <div className="landing-actions">
            <button
              type="button"
              className="pixel-action-btn"
              style={{ flex: '2 1 220px', fontSize: 17, padding: '14px 20px' }}
              onClick={() => {
                sfx.success();
                onStartGame();
              }}
            >
              START GAME
            </button>
            <button
              type="button"
              className="pixel-wood-btn landing-wood-btn"
              onClick={() => {
                sfx.click();
                setShowSquadInput((v) => !v);
              }}
            >
              {showSquadInput ? 'HIDE CODE' : 'JOIN SQUAD'}
            </button>
            <button
              type="button"
              className="pixel-wood-btn landing-wood-btn"
              onClick={() => {
                sfx.click();
                setShowBriefModal(true);
              }}
            >
              S.H.I.E.L.D. BRIEF
            </button>
          </div>
        </main>

        <footer className="landing-hint">WASD / arrows or click to walk · Shift to run</footer>
      </div>

      {showBriefModal && (
        <div className="landing-modal-backdrop" onClick={() => setShowBriefModal(false)}>
          <div
            className="pixel-parchment pixel-scroll"
            role="dialog"
            aria-modal="true"
            aria-labelledby="brief-title"
            style={{ width: 'min(92vw, 560px)', maxHeight: '82vh', overflowY: 'auto', padding: 22 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <h2 id="brief-title" className="parchment-heading" style={{ margin: 0, fontSize: 16 }}>
                THE S.H.I.E.L.D. FRAMEWORK
              </h2>
              <button type="button" className="pixel-chip" onClick={() => setShowBriefModal(false)}>
                Close
              </button>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.5, marginTop: 0 }}>
              Choose Right. Protect Together. Each letter trains a separate real-world skill in
              situations like shop-theft peer pressure — without confrontation or vigilantism:
            </p>
            <div style={{ display: 'grid', gap: 8 }}>
              {SHIELD_BRIEF.map(([title, desc]) => (
                <div key={title} className="parchment-inset" style={{ padding: '9px 12px' }}>
                  <div style={{ fontWeight: 700, color: '#8e4f1e', fontSize: 14 }}>{title}</div>
                  <div style={{ fontSize: 13, marginTop: 2 }}>{desc}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
