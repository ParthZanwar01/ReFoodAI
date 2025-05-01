import * as React from 'react';
import Svg, { Circle, Rect, Path, Text as SvgText } from 'react-native-svg';
import { brandPrimary, accent, ink } from '@/constants/Colors';

export function ReFoodLogo({ size = 64 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64" fill="none">
      <Circle cx="32" cy="32" r="32" fill={brandPrimary} />
      <Rect x="18" y="20" width="4" height="24" rx="2" fill={accent} />
      <Rect x="24" y="20" width="4" height="24" rx="2" fill={accent} />
      <Circle cx="32" cy="40" r="10" fill={ink} fillOpacity={0.12} />
      <Path d="M44 28 Q54 36 40 44 Q46 36 44 28" fill={accent} />
      <SvgText
        x="32"
        y="36"
        textAnchor="middle"
        fontSize="14"
        fontWeight="bold"
        fill={ink}
        fontFamily="SpaceMono-Regular"
      >
        RF
      </SvgText>
    </Svg>
  );
} 