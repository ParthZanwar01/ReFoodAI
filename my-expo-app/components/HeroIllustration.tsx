import * as React from 'react';
import Svg, { Rect, Circle, Ellipse, Path, G } from 'react-native-svg';
import { brandPrimary, accent, ink } from '@/constants/Colors';

export function HeroIllustration({ width = 320, height = 220 }) {
  return (
    <Svg width={width} height={height} viewBox="0 0 320 220" fill="none">
      {/* Tray base */}
      <Rect x="40" y="120" rx="32" width="240" height="60" fill={brandPrimary} opacity={0.9} />
      {/* Plate */}
      <Ellipse cx="160" cy="150" rx="38" ry="18" fill="#fff" opacity={0.95} />
      {/* Leaf */}
      <Path d="M210 130 Q220 110 240 140 Q220 135 210 130" fill={accent} opacity={0.8} />
      {/* Apple */}
      <Circle cx="110" cy="140" r="14" fill={accent} />
      <Path d="M110 126 Q112 122 116 126" stroke={ink} strokeWidth={2} />
      {/* Sparkles */}
      <G opacity={0.7}>
        <Circle cx="70" cy="130" r="3" fill="#fff" />
        <Circle cx="250" cy="160" r="2.5" fill="#fff" />
        <Circle cx="200" cy="110" r="2" fill="#fff" />
        <Circle cx="180" cy="170" r="1.5" fill="#fff" />
      </G>
      {/* Floating leaf */}
      <Path d="M80 110 Q90 100 100 120 Q90 115 80 110" fill={brandPrimary} opacity={0.7} />
    </Svg>
  );
} 