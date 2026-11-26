import React from 'react';
import { AvatarConfig, DrawerType } from '../types/game';
import { SingaporeClock } from '../utils/sgClock';
import { sfx } from '../utils/sound';
import { PlayerPortrait, UiIcon } from './PixelIcons';

interface GameHUDProps {
  avatar: AvatarConfig;
  clock: SingaporeClock;
  confidencePct: number;
  energyPct: number;
  currentQuestTitle: string;
  activeDrawer: DrawerType;
  onSelectDrawer: (drawer: DrawerType) => void;
}

const BUTTONS: [Exclude<DrawerType, null>, string, string][] = [
  ['shield', 'shield', 'Guardians'],
  ['backpack', 'backpack', 'Pack'],
  ['wardrobe', 'wardrobe', 'Wardrobe'],
  ['map', 'map', 'Map'],
  ['menu', 'menu', 'Settings'],
];

const clampPct = (v: number) => `${Math.max(8, Math.min(100, v))}%`;

export const GameHUD: React.FC<GameHUDProps> = ({
  avatar,
  clock,
  confidencePct,
  energyPct,
  currentQuestTitle,
  activeDrawer,
  onSelectDrawer,
}) => {
  const night = clock.timeOfDay === 'evening';
  const toggleDrawer = (drawer: Exclude<DrawerType, null>) => {
    sfx.click();
    onSelectDrawer(activeDrawer === drawer ? null : drawer);
  };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 10 }}>
      {/* Top-left: portrait, name, bars, guardians */}
      <div className="hud-top-left">
        <button
          type="button"
          className="px-wood hud-portrait"
          onClick={() => toggleDrawer('wardrobe')}
          title="Wardrobe"
          aria-label="Open wardrobe"
        >
          <PlayerPortrait avatar={avatar} size={64} />
        </button>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 9, paddingTop: 2 }}>
          <div className="px-text hud-name">{avatar.name.trim() || 'Player'}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
            <div className="px-bar is-red hud-bar" title="Confidence" aria-label={`Confidence ${confidencePct}%`}>
              <span style={{ width: clampPct(confidencePct) }} />
            </div>
            <div className="px-bar is-teal hud-bar" title="Energy" aria-label={`Energy ${energyPct}%`}>
              <span style={{ width: clampPct(energyPct) }} />
            </div>
          </div>
        </div>
      </div>

      {/* Top-right: live Singapore clock */}
      <div className="px-wood hud-clock" title="Live Singapore time (SGT)">
        <UiIcon name={night ? 'moon' : 'clock'} size={32} />
        <span>{clock.label}</span>
        <UiIcon name={night ? 'night-cloud' : 'sun'} size={32} />
      </div>

      {/* Bottom-left: current quest */}
      <button type="button" className="px-dark hud-quest" onClick={() => toggleDrawer('quest')} title="Quests">
        <UiIcon name="quest" size={32} />
        <span>
          <span className="hud-quest-label">Current Quest</span>
          <span className="hud-quest-title">{currentQuestTitle}</span>
        </span>
      </button>

      {/* Bottom-right: drawer buttons */}
      <div className="hud-buttons">
        {BUTTONS.map(([drawer, icon, label]) => (
          <button
            key={drawer}
            type="button"
            className={`px-wood hud-btn${activeDrawer === drawer ? ' is-active' : ''}`}
            onClick={() => toggleDrawer(drawer)}
            aria-label={label}
            title={label}
          >
            <UiIcon name={icon} size={64} />
          </button>
        ))}
      </div>
    </div>
  );
};
