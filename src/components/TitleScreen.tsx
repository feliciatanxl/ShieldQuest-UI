import React from 'react';
import { QuestId } from '../types/game';
import { SaveData } from '../utils/save';
import { SingaporeClock } from '../utils/sgClock';
import { sfx } from '../utils/sound';
import { UiIcon } from './PixelIcons';

interface TitleScreenProps {
  clock: SingaporeClock;
  save: SaveData | null;
  onNewGame: () => void;
  onContinue: () => void;
}

const QUEST_LABEL: Record<QuestId, string> = {
  ezlink: "Find Uncle's EZ-Link",
  lookout: 'The Lookout Dilemma',
  completed: 'All quests done',
};

export const TitleScreen: React.FC<TitleScreenProps> = ({ clock, save, onNewGame, onContinue }) => {
  const evening = clock.timeOfDay === 'evening';
  const quest = QUEST_LABEL[save?.world?.questId ?? 'ezlink'];

  return (
    <div className="landing-root pixel-scroll">
      <div className={`landing-art${evening ? ' is-evening' : ''}`} aria-hidden="true" />
      <div className="landing-shade" aria-hidden="true" />

      <div className="px-wood hud-clock" title="Live Singapore time (SGT)" style={{ zIndex: 10 }}>
        <UiIcon name={evening ? 'moon' : 'clock'} size={32} />
        <span>{clock.label}</span>
        <UiIcon name={evening ? 'night-cloud' : 'sun'} size={32} />
      </div>

      <main className="title-wrap">
        <div className="title-card">
          <div className="px-wood title-emblem" aria-hidden="true">
            <UiIcon name="shield" size={64} />
          </div>

          <div className="title-eyebrow">✦ Project SHIELD presents ✦</div>
          <h1 className="title-logo">
            <span className="title-logo-gold">SHIELD</span>QUEST
          </h1>
          <div className="title-divider" aria-hidden="true">
            <span />✦<span />
          </div>
          <p className="title-tagline">
            A cosy Singapore heartland adventure about choices, courage and looking out for one
            another.
          </p>

          <div className="title-actions">
            <button
              type="button"
              className="title-btn is-primary"
              onClick={() => {
                sfx.success();
                onNewGame();
              }}
            >
              ▶ Start new game
            </button>
            <button
              type="button"
              className="title-btn"
              disabled={!save}
              onClick={() => {
                sfx.click();
                onContinue();
              }}
            >
              <UiIcon name="quest" size={32} />
              Continue
            </button>
          </div>

          <div className="title-save" aria-live="polite">
            {save ? (
              <>
                Continue as <strong>{save.avatar.name.trim() || 'Player'}</strong> · {quest}
              </>
            ) : (
              'No saved game yet. Start a new one!'
            )}
          </div>
          <div className="title-note">Progress is saved in this browser only.</div>
        </div>
      </main>
    </div>
  );
};
