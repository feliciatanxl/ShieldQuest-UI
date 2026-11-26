import React from 'react';
import { SHIELD_STYLES } from '../data/gameData';
import { AvatarConfig, DrawerType, TimeOfDay } from '../types/game';
import { sfx } from '../utils/sound';
import {
  BackpackIcon,
  ClockIcon,
  DayWeatherIcon,
  MapIcon,
  MenuHamburgerIcon,
  MiniShieldSlotIcon,
  MoonIcon,
  NightWeatherIcon,
  PlayerPortrait,
  ShieldEmblemIcon,
  WardrobeIcon,
} from './PixelIcons';

interface GameHUDProps {
  avatar: AvatarConfig;
  timeOfDay: TimeOfDay;
  onToggleTimeOfDay: () => void;
  confidencePct: number;
  energyPct: number;
  currentQuestTitle: string;
  activeDrawer: DrawerType;
  onSelectDrawer: (drawer: DrawerType) => void;
}

export const GameHUD: React.FC<GameHUDProps> = ({
  avatar,
  timeOfDay,
  onToggleTimeOfDay,
  confidencePct,
  energyPct,
  currentQuestTitle,
  activeDrawer,
  onSelectDrawer,
}) => {
  const shieldAccent =
    SHIELD_STYLES.find((s) => s.id === avatar.shieldStyle)?.accent || '#9ab0c4';

  const toggleDrawer = (drawer: Exclude<DrawerType, null>) => {
    sfx.click();
    onSelectDrawer(activeDrawer === drawer ? null : drawer);
  };

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      {/* ==================== TOP-LEFT HUD (Exact Match to Screenshot) ==================== */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          left: 16,
          display: 'flex',
          alignItems: 'flex-start',
          gap: 10,
          pointerEvents: 'auto',
        }}
      >
        {/* Circular Portrait Medallion */}
        <button
          type="button"
          onClick={() => toggleDrawer('wardrobe')}
          title="Open Character Wardrobe"
          style={{
            width: 78,
            height: 78,
            borderRadius: '50%',
            padding: 0,
            overflow: 'hidden',
            border: '4px solid #231a16',
            boxShadow: '0 0 0 3px #c3935e, 0 4px 0 rgba(20,14,12,0.55)',
            background: '#cbb08b',
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          <PlayerPortrait avatar={avatar} size={70} />
        </button>

        {/* Name + Red/Teal Bars + Silver Shield + Small Badge Slot */}
        <div style={{ display: 'flex', flexDirection: 'column', paddingTop: 2 }}>
          <div
            className="text-outline"
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 18,
              lineHeight: 1.1,
              color: '#f8f5ef',
              marginBottom: 4,
            }}
          >
            {avatar.name.trim() || 'Player'}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              {/* Red Bar */}
              <div
                style={{
                  width: 148,
                  height: 14,
                  background: '#3d332d',
                  border: '2.5px solid #231a16',
                  boxShadow: '0 0 0 1.5px #b98b5b',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(10, Math.min(100, confidencePct))}%`,
                    height: '100%',
                    background: 'linear-gradient(180deg, #e56a64 0%, #c4443f 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>

              {/* Teal Bar */}
              <div
                style={{
                  width: 148,
                  height: 14,
                  background: '#3d332d',
                  border: '2.5px solid #231a16',
                  boxShadow: '0 0 0 1.5px #b98b5b',
                  borderRadius: 4,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${Math.max(10, Math.min(100, energyPct))}%`,
                    height: '100%',
                    background: 'linear-gradient(180deg, #62cad4 0%, #3b96a0 100%)',
                    transition: 'width 0.3s ease',
                  }}
                />
              </div>
            </div>

            {/* Silver Shield Emblem beside the bars */}
            <button
              type="button"
              onClick={() => toggleDrawer('shield')}
              title="Open S.H.I.E.L.D. Skills & Guardians"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <ShieldEmblemIcon size={40} accent={shieldAccent} />
            </button>
          </div>

          {/* Small square badge slot directly below teal bar */}
          <div style={{ marginTop: 4 }}>
            <button
              type="button"
              onClick={() => toggleDrawer('shield')}
              title="Guardian Badge"
              style={{
                background: 'transparent',
                border: 'none',
                padding: 0,
                cursor: 'pointer',
                display: 'inline-flex',
              }}
            >
              <MiniShieldSlotIcon size={20} />
            </button>
          </div>
        </div>
      </div>

      {/* ==================== TOP-RIGHT HUD (Exact Match to Screenshot) ==================== */}
      <div
        style={{
          position: 'absolute',
          top: 14,
          right: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => {
            sfx.click();
            onToggleTimeOfDay();
          }}
          className="pixel-wood-panel"
          title="Click to toggle Afternoon (17:30) / Evening (19:15)"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            padding: '6px 14px',
            cursor: 'pointer',
            color: '#231a16',
          }}
        >
          {timeOfDay === 'evening' ? <MoonIcon size={28} /> : <ClockIcon size={28} />}
          <span
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 20,
              letterSpacing: '0.02em',
              color: '#231a16',
            }}
          >
            {timeOfDay === 'evening' ? '19:15' : '17:30'}
          </span>
          {timeOfDay === 'evening' ? (
            <NightWeatherIcon size={28} />
          ) : (
            <DayWeatherIcon size={28} />
          )}
        </button>
      </div>

      {/* ==================== BOTTOM-LEFT HUD (Exact Match to Screenshot) ==================== */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          left: 16,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => toggleDrawer('quest')}
          className="pixel-quest-box"
          title="Click to view Quests"
          style={{
            textAlign: 'left',
            padding: '11px 18px',
            minWidth: 245,
            cursor: 'pointer',
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 700,
              fontSize: 16,
              color: '#f3c46b',
              lineHeight: 1.2,
            }}
          >
            Current Quest:
          </div>
          <div
            style={{
              fontFamily: 'var(--font-ui)',
              fontWeight: 600,
              fontSize: 16,
              color: '#f8f5ef',
              marginTop: 2,
              lineHeight: 1.25,
            }}
          >
            {currentQuestTitle}
          </div>
        </button>
      </div>

      {/* ==================== BOTTOM-RIGHT HUD (Exact 4 Square Wooden Buttons) ==================== */}
      <div
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          pointerEvents: 'auto',
        }}
      >
        <button
          type="button"
          onClick={() => toggleDrawer('backpack')}
          className={`pixel-wood-btn ${activeDrawer === 'backpack' ? 'is-active' : ''}`}
          aria-label="Backpack"
          title="Backpack & Clues"
          style={{ width: 58, height: 58 }}
        >
          <BackpackIcon size={36} />
        </button>

        <button
          type="button"
          onClick={() => toggleDrawer('wardrobe')}
          className={`pixel-wood-btn ${activeDrawer === 'wardrobe' ? 'is-active' : ''}`}
          aria-label="Wardrobe"
          title="Wardrobe & Customisation"
          style={{ width: 58, height: 58 }}
        >
          <WardrobeIcon size={36} />
        </button>

        <button
          type="button"
          onClick={() => toggleDrawer('map')}
          className={`pixel-wood-btn ${activeDrawer === 'map' ? 'is-active' : ''}`}
          aria-label="Map"
          title="Neighbourhood Map"
          style={{ width: 58, height: 58 }}
        >
          <MapIcon size={36} />
        </button>

        <button
          type="button"
          onClick={() => toggleDrawer('menu')}
          className={`pixel-wood-btn ${activeDrawer === 'menu' ? 'is-active' : ''}`}
          aria-label="Menu"
          title="Game Menu & S.H.I.E.L.D."
          style={{ width: 58, height: 58 }}
        >
          <MenuHamburgerIcon size={36} />
        </button>
      </div>
    </div>
  );
};
