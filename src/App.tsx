import React, { useCallback, useEffect, useRef, useState } from 'react';
import { GameWorld } from './components/GameWorld';
import { LandingScreen } from './components/LandingScreen';
import { TitleScreen } from './components/TitleScreen';
import { DEFAULT_AVATAR, INITIAL_INVENTORY, INITIAL_SHIELD_SKILLS, REWARDS, SHOP_ITEMS } from './data/gameData';
import { AvatarConfig, InventoryItem, ShieldLetter, ShieldSkillState } from './types/game';
import { EMPTY_WALLET, loadSave, SaveData, Wallet, WorldSave, writeSave } from './utils/save';
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
  const [wallet, setWallet] = useState<Wallet>(EMPTY_WALLET);
  // World progress lives in GameWorld; we keep the latest copy to write alongside the rest.
  const worldRef = useRef<WorldSave | null>(null);
  const [initialWorld, setInitialWorld] = useState<WorldSave | null>(null);

  /** Grants a one-time reward; claiming the same id again does nothing. */
  const claimReward = useCallback((id: string) => {
    const reward = REWARDS.find((r) => r.id === id);
    if (!reward) return;
    setWallet((w) =>
      w.claimed.includes(id) ? w : { ...w, coins: w.coins + reward.coins, claimed: [...w.claimed, id] }
    );
  }, []);

  const buyItem = useCallback((id: string) => {
    const item = SHOP_ITEMS.find((i) => i.id === id);
    if (!item) return;
    setWallet((w) =>
      w.owned.includes(id) || w.coins < item.price
        ? w
        : { ...w, coins: w.coins - item.price, owned: [...w.owned, id] }
    );
  }, []);

  const handleCompleteSkill = (letter: ShieldLetter, passed: boolean, score: number) => {
    setSkills((prev) => ({
      ...prev,
      [letter]: { ...prev[letter], completed: true, passed, score },
    }));
    if (passed) claimReward(`skill-${letter}`);
  };

  // Autosave everything App owns while a game is running.
  useEffect(() => {
    if (screen === 'game') writeSave({ avatar, squadCode, inventory, skills, wallet, world: worldRef.current });
  }, [screen, avatar, squadCode, inventory, skills, wallet]);

  const handleWorldChange = useCallback(
    (world: WorldSave) => {
      worldRef.current = world;
      writeSave({ avatar, squadCode, inventory, skills, wallet, world });
    },
    [avatar, squadCode, inventory, skills, wallet]
  );

  const startNewGame = () => {
    // Avatar and squad code come from the creator; progress starts fresh.
    setInventory(INITIAL_INVENTORY);
    setSkills(INITIAL_SHIELD_SKILLS);
    setWallet(EMPTY_WALLET);
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
    setWallet(save.wallet);
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
      wallet={wallet}
      onClaimReward={claimReward}
      onBuyItem={buyItem}
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
