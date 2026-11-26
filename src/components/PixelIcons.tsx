import React, { useEffect, useRef, useState } from 'react';
import { drawCharacter, getPlayerSheet, onSpritesLoaded } from '../game/sprites';
import { AvatarConfig } from '../types/game';

interface IconProps {
  size?: number;
  className?: string;
}

/** PixelLab icon from public/assets/ui, drawn at a whole-number scale so pixels stay square. */
export const UiIcon: React.FC<{ name: string; size: number }> = ({ name, size }) => (
  <img className="px-icon" src={`/assets/ui/${name}.png`} width={size} height={size} alt="" draggable={false} />
);

/** Animated full-body preview of the player's sprite (walk cycle facing the viewer). */
export const PlayerSpritePreview: React.FC<{ avatar: AvatarConfig; scale?: number }> = ({
  avatar,
  scale = 3,
}) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  useEffect(() => {
    let raf = 0;
    const start = performance.now();
    const frame = (now: number) => {
      const ctx = ref.current?.getContext('2d');
      const sheet = getPlayerSheet(avatar);
      if (ctx && sheet) {
        ctx.imageSmoothingEnabled = false;
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        const size = sheet.cell * scale;
        drawCharacter(ctx, sheet, size / 2, size - 2 * scale, 'south', ((now - start) / 1000) * 8, scale);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [avatar, scale]);
  return <canvas ref={ref} width={64 * scale} height={64 * scale} style={{ imageRendering: 'pixelated' }} />;
};

/** Head-and-shoulders crop of the player's sprite, used in the HUD and menus. */
export const PlayerPortrait: React.FC<{
  avatar: AvatarConfig;
  size?: number;
}> = ({ avatar, size = 64 }) => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const [, setLoaded] = useState(0);
  useEffect(() => onSpritesLoaded(() => setLoaded((n) => n + 1)), []);
  const sheet = getPlayerSheet(avatar);
  useEffect(() => {
    const ctx = ref.current?.getContext('2d');
    if (!ctx || !sheet) return;
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = '#cbb08b';
    ctx.fillRect(0, 0, size, size);
    // Head sits in the top half of the 64px south-facing cell; 32px crop keeps pixels square at 2x.
    const col = sheet.idle.south ?? 0;
    ctx.drawImage(sheet.img, col * sheet.cell + 16, 2, 32, 32, 0, 0, size, size);
  });
  return (
    <canvas
      ref={ref}
      width={size}
      height={size}
      aria-label="Player portrait"
      style={{ display: 'block', imageRendering: 'pixelated' }}
    />
  );
};

export const ShieldEmblemIcon: React.FC<IconProps & { accent?: string }> = ({
  size = 38,
  accent = '#9bb0c4',
}) => (
  <svg width={size} height={size} viewBox="0 0 24 26" shapeRendering="crispEdges">
    <path
      d="M3 2h18v10c0 6.5-9 12-9 12S3 18.5 3 12V2z"
      fill="#231a16"
    />
    <path
      d="M5 4h14v8c0 5-7 9.5-7 9.5S5 17 5 12V4z"
      fill="#d8e2eb"
    />
    <path
      d="M6 5h12v7c0 4.2-6 8.2-6 8.2S6 16.2 6 12V5z"
      fill={accent}
    />
    <path
      d="M12 5h6v7c0 4.2-6 8.2-6 8.2V5z"
      fill="rgba(25,35,50,0.22)"
    />
    <rect x="7" y="6" width="3" height="2" fill="rgba(255,255,255,0.55)" />
  </svg>
);
