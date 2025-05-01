import * as React from 'react';
import { View, Animated, Easing, Pressable } from 'react-native';
import { BubblyLetter } from './BubblyLetter';

// Google + brand-inspired palette
const COLORS = [
  '#184C3A', // Hero background green
];

const HEADLINE = [
  'Forecast.',
  'Donate.',
  'Save.'
];

interface BubblyHeadlineProps {
  size?: number;
  style?: any;
  shouldAnimate: boolean;
  activeIndex?: number | null;
}

export function BubblyHeadline({ size = 80, style = {}, shouldAnimate, activeIndex = null }: BubblyHeadlineProps) {
  const flatLetters = HEADLINE.join(' ').split('');
  let letterCount = 0;

  return (
    <View style={[{ alignItems: 'center', justifyContent: 'center', gap: size * 0.18 }, style]}>
      {HEADLINE.map((word, wi) => (
        <View key={wi} style={{ flexDirection: 'row', gap: size * 0.08, marginBottom: size * 0.04 }}>
          {word.split('').map((char, i) => {
            if (char === ' ') {
              letterCount++;
              return <View key={i} style={{ width: size * 0.3 }} />;
            }
            const popAnim = React.useRef(new Animated.Value(0)).current;
            React.useEffect(() => {
              if (activeIndex === null) {
                if (shouldAnimate) {
                  Animated.spring(popAnim, {
                    toValue: 1,
                    delay: wi * 600 + i * 333,
                    useNativeDriver: true,
                    speed: 18,
                    bounciness: 8,
                  }).start();
                }
              } else {
                Animated.spring(popAnim, {
                  toValue: activeIndex === letterCount ? 1.2 : 1,
                  useNativeDriver: true,
                  speed: 18,
                  bounciness: 8,
                }).start();
              }
            }, [shouldAnimate, activeIndex, popAnim, wi, i, letterCount]);
            const idx = letterCount;
            letterCount++;
            return (
              <Pressable key={i} onHoverIn={() => {}}>
                <Animated.View
                  style={{
                    transform: [
                      { scale: popAnim },
                      { rotate: popAnim.interpolate({ inputRange: [0, 1], outputRange: ['-18deg', '0deg'] }) },
                    ],
                    marginHorizontal: 2,
                  }}
                >
                  <BubblyLetter
                    letter={char}
                    color={COLORS[(wi * 7 + i) % COLORS.length]}
                    size={size}
                    textColor="#fff"
                  />
                </Animated.View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </View>
  );
} 