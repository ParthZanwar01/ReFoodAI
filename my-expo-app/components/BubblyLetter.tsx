import * as React from 'react';
import Svg, { Circle, Text as SvgText } from 'react-native-svg';

export function BubblyLetter({
  letter,
  color = '#3DBA6F',
  size = 72,
  textColor = '#fff',
  style = {},
  ...props
}) {
  return (
    <Svg width={size} height={size} style={style} {...props}>
      <Circle cx={size / 2} cy={size / 2} r={size / 2 - 4} fill={color} />
      <SvgText
        x={size / 2}
        y={size / 2 + size * 0.18}
        fontSize={size * 0.6}
        fontWeight="bold"
        fill={textColor}
        textAnchor="middle"
        fontFamily="Arial, Helvetica, sans-serif"
      >
        {letter}
      </SvgText>
    </Svg>
  );
} 