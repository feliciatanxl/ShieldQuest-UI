import React from 'react';
import { AvatarConfig } from '../types/game';

interface IconProps {
  size?: number;
  className?: string;
}

export const PlayerPortrait: React.FC<{
  avatar: AvatarConfig;
  size?: number;
}> = ({ avatar, size = 64 }) => {
  const { skinTone, hairColor, hairStyle, shirtColor } = avatar;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      shapeRendering="crispEdges"
      aria-label="Player portrait"
    >
      {/* Warm cream/sand backdrop inside circular frame */}
      <rect width="32" height="32" fill="#8b6948" />
      <rect x="2" y="2" width="28" height="28" fill="#cbb08b" />

      {/* Back hair for bob/ponytail */}
      {hairStyle === 'bob' && (
        <>
          <rect x="8" y="10" width="16" height="14" fill="#231a16" />
          <rect x="9" y="11" width="14" height="12" fill={hairColor} />
        </>
      )}
      {hairStyle === 'ponytail' && (
        <>
          <rect x="21" y="11" width="5" height="11" fill="#231a16" />
          <rect x="22" y="12" width="3" height="9" fill={hairColor} />
        </>
      )}

      {/* Shoulders & T-shirt */}
      <rect x="6" y="23" width="20" height="9" fill="#231a16" />
      <rect x="7" y="24" width="18" height="8" fill={shirtColor} />
      <rect x="12" y="23" width="8" height="3" fill="#231a16" />
      <rect x="13" y="23" width="6" height="2" fill={skinTone} />
      {/* Shirt collar highlight */}
      <rect x="11" y="24" width="10" height="1" fill="rgba(255,255,255,0.35)" />

      {/* Neck */}
      <rect x="13" y="19" width="6" height="5" fill={skinTone} />

      {/* Ears */}
      <rect x="8" y="13" width="2" height="4" fill="#231a16" />
      <rect x="9" y="14" width="1" height="2" fill={skinTone} />
      <rect x="22" y="13" width="2" height="4" fill="#231a16" />
      <rect x="22" y="14" width="1" height="2" fill={skinTone} />

      {/* Head shape */}
      <rect x="9" y="7" width="14" height="14" rx="2" fill="#231a16" />
      <rect x="10" y="8" width="12" height="12" fill={skinTone} />

      {/* Eyes & Brows */}
      <rect x="12" y="12" width="2" height="1" fill="#231a16" />
      <rect x="18" y="12" width="2" height="1" fill="#231a16" />
      <rect x="12" y="14" width="2" height="2" fill="#231a16" />
      <rect x="18" y="14" width="2" height="2" fill="#231a16" />
      {/* Eye shine */}
      <rect x="12" y="14" width="1" height="1" fill="#ffffff" />
      <rect x="18" y="14" width="1" height="1" fill="#ffffff" />
      {/* Soft mouth */}
      <rect x="14" y="18" width="4" height="1" fill="#8f5b4a" />

      {/* Hair top & bangs */}
      <rect x="9" y="5" width="14" height="6" fill="#231a16" />
      <rect x="10" y="6" width="12" height="5" fill={hairColor} />
      {hairStyle === 'short' && (
        <>
          <rect x="10" y="9" width="12" height="2" fill={hairColor} />
          <rect x="12" y="10" width="2" height="2" fill={hairColor} />
          <rect x="16" y="10" width="3" height="2" fill={hairColor} />
        </>
      )}
      {hairStyle === 'spiky' && (
        <>
          <rect x="11" y="4" width="3" height="3" fill={hairColor} />
          <rect x="15" y="3" width="3" height="4" fill={hairColor} />
          <rect x="19" y="5" width="3" height="3" fill={hairColor} />
        </>
      )}
      {hairStyle === 'bob' && (
        <>
          <rect x="9" y="8" width="3" height="9" fill={hairColor} />
          <rect x="20" y="8" width="3" height="9" fill={hairColor} />
          <rect x="11" y="9" width="10" height="2" fill={hairColor} />
        </>
      )}
      {hairStyle === 'ponytail' && (
        <>
          <rect x="10" y="9" width="12" height="2" fill={hairColor} />
          <rect x="20" y="9" width="2" height="3" fill="#e0a94f" />
        </>
      )}
    </svg>
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

export const MiniShieldSlotIcon: React.FC<IconProps> = ({ size = 18 }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" shapeRendering="crispEdges">
    <rect x="1" y="1" width="14" height="14" rx="2" fill="#231a16" />
    <rect x="2" y="2" width="12" height="12" fill="#b48b60" />
    <rect x="3" y="3" width="10" height="10" fill="#465266" />
    <path d="M5 5h6v3c0 2-3 4-3 4S5 10 5 8V5z" fill="#e6c46d" />
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <circle cx="12" cy="12" r="11" fill="#231a16" />
    <circle cx="12" cy="12" r="9" fill="#9fb6c9" />
    <circle cx="12" cy="12" r="7.2" fill="#f7f4ec" />
    <rect x="11" y="6" width="2" height="7" fill="#231a16" />
    <rect x="11" y="11" width="2" height="6" transform="rotate(140 12 12)" fill="#231a16" />
    <rect x="11" y="11" width="2" height="2" fill="#b84a39" />
  </svg>
);

export const MoonIcon: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <circle cx="12" cy="12" r="11" fill="#231a16" />
    <circle cx="12" cy="12" r="9" fill="#2c3e66" />
    <path
      d="M13 6a6 6 0 1 0 5 9.2A5 5 0 0 1 13 6z"
      fill="#f5df86"
    />
    <rect x="15" y="7" width="2" height="2" fill="#f5df86" />
    <rect x="17" y="10" width="1.5" height="1.5" fill="#fff5cc" />
  </svg>
);

export const DayWeatherIcon: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 26 22" shapeRendering="crispEdges">
    {/* Sun */}
    <circle cx="16" cy="8" r="5" fill="#231a16" />
    <circle cx="16" cy="8" r="4" fill="#f5c945" />
    {/* Cloud */}
    <path
      d="M4 17h15a3 3 0 0 0 0-6h-1a4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 13v4z"
      fill="#231a16"
    />
    <path
      d="M5 16h13.5a2.2 2.2 0 0 0 0-4.4H17a3.6 3.6 0 0 0-6.8-1.1A2.6 2.6 0 0 0 5 13v3z"
      fill="#f4f8fc"
    />
  </svg>
);

export const NightWeatherIcon: React.FC<IconProps> = ({ size = 28 }) => (
  <svg width={size} height={size} viewBox="0 0 26 22" shapeRendering="crispEdges">
    {/* Little Moon & Stars */}
    <circle cx="17" cy="7" r="4" fill="#f5d76e" />
    <circle cx="19" cy="6" r="3" fill="#232a3e" />
    <rect x="8" y="4" width="2" height="2" fill="#f5d76e" />
    {/* Dark Cloud */}
    <path
      d="M4 17h15a3 3 0 0 0 0-6h-1a4.5 4.5 0 0 0-8.5-1.5A3.5 3.5 0 0 0 4 13v4z"
      fill="#1b2030"
    />
    <path
      d="M5 16h13.5a2.2 2.2 0 0 0 0-4.4H17a3.6 3.6 0 0 0-6.8-1.1A2.6 2.6 0 0 0 5 13v3z"
      fill="#5b7299"
    />
  </svg>
);

export const BackpackIcon: React.FC<IconProps> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    {/* Handle */}
    <rect x="9" y="2" width="6" height="3" fill="#231a16" />
    <rect x="10" y="3" width="4" height="2" fill="#9c6239" />
    {/* Main Bag */}
    <rect x="5" y="4" width="14" height="17" rx="3" fill="#231a16" />
    <rect x="6" y="5" width="12" height="15" fill="#9e5a36" />
    {/* Top Flap */}
    <rect x="6" y="5" width="12" height="6" fill="#ba7147" />
    <rect x="6" y="10" width="12" height="1" fill="#231a16" />
    {/* Straps */}
    <rect x="8" y="8" width="2" height="4" fill="#dfba8c" />
    <rect x="14" y="8" width="2" height="4" fill="#dfba8c" />
    {/* Front Pocket */}
    <rect x="7" y="13" width="10" height="6" fill="#231a16" />
    <rect x="8" y="14" width="8" height="4" fill="#7c4327" />
    <rect x="11" y="14" width="2" height="1" fill="#e6c46d" />
  </svg>
);

export const WardrobeIcon: React.FC<IconProps> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    {/* Outer Cabinet */}
    <rect x="4" y="2" width="16" height="20" fill="#231a16" />
    <rect x="5" y="3" width="14" height="18" fill="#8f5936" />
    {/* Top Trim */}
    <rect x="5" y="3" width="14" height="2" fill="#b3754a" />
    {/* Double Doors */}
    <rect x="6" y="6" width="5.5" height="11" fill="#a86a42" />
    <rect x="12.5" y="6" width="5.5" height="11" fill="#a86a42" />
    <rect x="11.5" y="6" width="1" height="11" fill="#231a16" />
    {/* Door handles */}
    <rect x="10" y="10" width="1" height="2" fill="#e6c46d" />
    <rect x="13" y="10" width="1" height="2" fill="#e6c46d" />
    {/* Bottom Drawer */}
    <rect x="6" y="18" width="12" height="2" fill="#704327" />
    <rect x="11" y="18" width="2" height="1" fill="#e6c46d" />
  </svg>
);

export const MapIcon: React.FC<IconProps> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    {/* Folded Outline */}
    <path d="M2 5l6-2 8 2 6-2v15l-6 2-8-2-6 2V5z" fill="#231a16" />
    {/* Panel 1 */}
    <path d="M3 6l5-1.5v12.8L3 19V6z" fill="#e5d7b8" />
    {/* Panel 2 */}
    <path d="M8 4.5l8 2v12.8l-8-2V4.5z" fill="#d0c09c" />
    {/* Panel 3 */}
    <path d="M16 6.5l5-1.8v12.8l-5 1.8V6.5z" fill="#e5d7b8" />
    {/* Green patches & path */}
    <rect x="4" y="8" width="3" height="5" fill="#79a861" />
    <rect x="10" y="7" width="4" height="4" fill="#79a861" />
    <rect x="17" y="10" width="3" height="5" fill="#79a861" />
    <rect x="5" y="13" width="12" height="2" fill="#c98849" />
    <rect x="12" y="11" width="2" height="2" fill="#d45550" />
  </svg>
);

export const MenuHamburgerIcon: React.FC<IconProps> = ({ size = 34 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" shapeRendering="crispEdges">
    <rect x="4" y="5" width="16" height="4" rx="1" fill="#231a16" />
    <rect x="5" y="6" width="14" height="2" fill="#e8cba3" />
    <rect x="4" y="10" width="16" height="4" rx="1" fill="#231a16" />
    <rect x="5" y="11" width="14" height="2" fill="#e8cba3" />
    <rect x="4" y="15" width="16" height="4" rx="1" fill="#231a16" />
    <rect x="5" y="16" width="14" height="2" fill="#e8cba3" />
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
