import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameWorld } from './components/GameWorld';
import { LandingScreen } from './components/LandingScreen';
import { TitleScreen } from './components/TitleScreen';
import { DEFAULT_AVATAR, INITIAL_INVENTORY, INITIAL_SHIELD_SKILLS } from './data/gameData';
import { AvatarConfig, InventoryItem, ShieldLetter, ShieldSkillState } from './types/game';
import { loadSave, SaveData, WorldSave, writeSave } from './utils/save';
import { useSingaporeClock } from './utils/sgClock';

type Screen = 'title' | 'create' | 'game';

export const App: React.FC = () => {
  const [screen, setScreen] = useState<Screen>('title');
  const [save, setSave] = useState<SaveData | null>(loadSave);
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);
  const clock = useSingaporeClock();
  const [inventory, setInventory] = useState<InventoryItem[]>(INITIAL_INVENTORY);
  const [skills, setSkills] = useState<Record<ShieldLetter, ShieldSkillState>>(INITIAL_SHIELD_SKILLS);
  const [squadCode, setSquadCode] = useState('');
  // World progress lives in GameWorld; we keep the latest copy to write alongside the rest.
  const worldRef = useRef<WorldSave | null>(null);
  const [initialWorld, setInitialWorld] = useState<WorldSave | null>(null);

  const handleCompleteSkill = (letter: ShieldLetter, passed: boolean, score: number) => {
    setSkills((prev) => ({
      ...prev,
      [letter]: { ...prev[letter], completed: true, passed, score },
    }));
  };

  // Autosave everything App owns while a game is running.
  useEffect(() => {
    if (screen === 'game') writeSave({ avatar, squadCode, inventory, skills, world: worldRef.current });
  }, [screen, avatar, squadCode, inventory, skills]);

  const handleWorldChange = useCallback(
    (world: WorldSave) => {
      worldRef.current = world;
      writeSave({ avatar, squadCode, inventory, skills, world });
    },
    [avatar, squadCode, inventory, skills]
  );

  const startNewGame = () => {
    // Avatar and squad code come from the creator; progress starts fresh.
    setInventory(INITIAL_INVENTORY);
    setSkills(INITIAL_SHIELD_SKILLS);
    worldRef.current = null;
    setInitialWorld(null);
    setScreen('game');
  };

  const continueGame = () => {
    const save = loadSave(); // re-read: the game may have autosaved since this screen opened
    if (!save) return;
    setAvatar(save.avatar);
    setSquadCode(save.squadCode);
    setInventory(save.inventory);
    setSkills(save.skills);
    worldRef.current = save.world;
    setInitialWorld(save.world);
    setScreen('game');
  };

  if (screen === 'title') {
    return (
      <TitleScreen
        clock={clock}
        save={save}
        onNewGame={() => {
          setAvatar(DEFAULT_AVATAR);
          setSquadCode('');
          setScreen('create');
        }}
        onContinue={continueGame}
      />
    );
  }

  if (screen === 'create') {
    return (
      <LandingScreen
        avatar={avatar}
        setAvatar={setAvatar}
        clock={clock}
        squadCode={squadCode}
        setSquadCode={setSquadCode}
        hasSave={!!save}
        onBack={() => setScreen('title')}
        onStartGame={startNewGame}
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
      initialWorld={initialWorld}
      onWorldChange={handleWorldChange}
      onReturnToTitle={() => {
        setSave(loadSave());
        setScreen('title');
      }}
    />
  );
};

export default App;
