import React, { useState } from 'react';
import { GameWorld } from './components/GameWorld';
import { LandingScreen } from './components/LandingScreen';
import { useSingaporeClock } from './utils/sgClock';
import {
  DEFAULT_AVATAR,
  INITIAL_INVENTORY,
  INITIAL_SHIELD_SKILLS,
} from './data/gameData';
import {
  AvatarConfig,
  InventoryItem,
  ShieldLetter,
  ShieldSkillState,
} from './types/game';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<'landing' | 'game'>('landing');
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const clock = useSingaporeClock();
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [skills, setSkills] =
    useState<Record<ShieldLetter, ShieldSkillState>>(INITIAL_SHIELD_SKILLS);
  const [squadCode, setSquadCode] = useState('');

  const handleCompleteSkill = (letter: ShieldLetter, passed: boolean, score: number) => {
    setSkills((prev) => ({
      ...prev,
      [letter]: {
        ...prev[letter],
        completed: true,
        passed,
        score,
      },
    }));
  };

  if (screen === 'landing') {
    return (
      <LandingScreen
        avatar={avatar}
        setAvatar={setAvatar}
        clock={clock}
        squadCode={squadCode}
        setSquadCode={setSquadCode}
        onStartGame={() => setScreen('game')}
      />
    );
  }

  return (
    <GameWorld
      avatar={avatar}
      setAvatar={setAvatar}
      clock={clock}
      inventory={inventory}
      setInventory={setInventory}
      skills={skills}
      onCompleteSkill={handleCompleteSkill}
      squadCode={squadCode}
      onReturnToTitle={() => setScreen('landing')}
    />
  );
};

export default App;
