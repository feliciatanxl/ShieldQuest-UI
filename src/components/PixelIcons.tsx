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

export const EzLinkCardIcon: React.FC<IconProps> = ({ size = 32 }) => (
  <svg width={size} height={size * 0.68} viewBox="0 0 32 22" shapeRendering="crispEdges">
    <rect x="0" y="0" width="32" height="22" rx="3" fill="#231a16" />
    <rect x="1.5" y="1.5" width="29" height="19" rx="2" fill="#63b5a7" />
    <rect x="1.5" y="1.5" width="29" height="5" fill="#89d4c4" />
    <rect x="4" y="9" width="7" height="5" fill="#f3d675" />
    <rect x="13" y="9" width="14" height="2" fill="#1e4d45" />
    <rect x="13" y="13" width="10" height="2" fill="#2e6f64" />
    <rect x="23" y="15" width="4" height="3" fill="#c44545" />
  </svg>
);

export const ChopeTissueIcon: React.FC<IconProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <rect x="3" y="6" width="18" height="12" rx="2" fill="#231a16" />
    <rect x="4" y="7" width="16" height="10" fill="#f5f2eb" />
    <rect x="4" y="10" width="16" height="4" fill="#4f82b8" />
    <rect x="8" y="8" width="8" height="2" fill="#d9dfe6" />
    <rect x="9" y="11" width="6" height="2" fill="#f5cf7b" />
  </svg>
);

export const KopiDabaoIcon: React.FC<IconProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    {/* Red raffia string loop */}
    <path d="M9 3h6v4H9z" fill="none" stroke="#d1433b" strokeWidth="2" />
    {/* Clear plastic bag */}
    <rect x="6" y="7" width="12" height="15" rx="3" fill="#231a16" />
    <rect x="7" y="8" width="10" height="13" rx="2" fill="#d9e6eb" />
    {/* Rich Kopi-O inside */}
    <rect x="7.5" y="12" width="9" height="8.5" rx="1" fill="#5e3824" />
    <rect x="7.5" y="12" width="9" height="2" fill="#8f5d3e" />
    {/* Red tie */}
    <rect x="6" y="7" width="12" height="2" fill="#d1433b" />
    {/* Straw */}
    <rect x="14" y="3" width="2" height="11" fill="#70b55c" />
  </svg>
);

export const ReceiptIcon: React.FC<IconProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <path d="M5 2h14v20l-2-2-2 2-3-2-3 2-2-2-2 2V2z" fill="#231a16" />
    <path d="M6 3h12v17l-1.5-1.5-1.5 1.5-3-1.5-3 1.5-1.5-1.5L6 20V3z" fill="#f7f3e8" />
    <rect x="8" y="6" width="8" height="2" fill="#cf4928" />
    <rect x="8" y="10" width="6" height="1.5" fill="#465063" />
    <rect x="8" y="13" width="8" height="1.5" fill="#465063" />
    <rect x="8" y="16" width="5" height="1.5" fill="#48a999" />
  </svg>
);

export const FieldNotesIcon: React.FC<IconProps> = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <rect x="4" y="3" width="16" height="18" rx="2" fill="#231a16" />
    <rect x="5" y="4" width="14" height="16" fill="#487ca3" />
    <rect x="5" y="4" width="3" height="16" fill="#2d5575" />
    <rect x="10" y="7" width="7" height="3" fill="#f5cf7b" />
    <rect x="10" y="12" width="7" height="1.5" fill="#e8eff5" />
    <rect x="10" y="15" width="5" height="1.5" fill="#e8eff5" />
  </svg>
);
