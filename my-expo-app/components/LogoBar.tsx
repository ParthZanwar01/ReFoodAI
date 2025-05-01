import React, { useRef, useEffect, useState } from 'react';
import { View, StyleSheet, Animated, Dimensions } from 'react-native';
import { BubblyHeadline } from './BubblyHeadline';
import { HeroIllustration } from './HeroIllustration';

const SCREEN_WIDTH = Dimensions.get('window').width;

interface LogoBarProps {
  shouldAnimate?: boolean;
}

export function LogoBar({ shouldAnimate = true }: LogoBarProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const leftPlateAnim = useRef(new Animated.Value(0)).current;
  const rightPlateAnim = useRef(new Animated.Value(0)).current;
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
      delay: 200,
    }).start();
    // Floating plate animations
    Animated.loop(
      Animated.sequence([
        Animated.timing(leftPlateAnim, {
          toValue: 1,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(leftPlateAnim, {
          toValue: 0,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(rightPlateAnim, {
          toValue: 1,
          duration: 2800,
          useNativeDriver: true,
        }),
        Animated.timing(rightPlateAnim, {
          toValue: 0,
          duration: 2800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [fadeAnim, leftPlateAnim, rightPlateAnim]);

  const leftPlateStyle = {
    transform: [
      {
        translateY: leftPlateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -72] }),
      },
    ],
  };
  const rightPlateStyle = {
    transform: [
      {
        translateY: rightPlateAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -72] }),
      },
    ],
  };

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}> 
      <View style={styles.row}>
        <Animated.View style={[leftPlateStyle, styles.plate]}>
          <HeroIllustration width={SCREEN_WIDTH < 600 ? 320 : 480} height={SCREEN_WIDTH < 600 ? 220 : 320} />
        </Animated.View>
        <View style={styles.centered}>
          <BubblyHeadline
            size={64}
            shouldAnimate={shouldAnimate}
            activeIndex={activeIndex}
          />
        </View>
        <Animated.View style={[rightPlateStyle, styles.plate]}>
          <HeroIllustration width={SCREEN_WIDTH < 600 ? 320 : 480} height={SCREEN_WIDTH < 600 ? 220 : 320} />
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#162B26',
    paddingVertical: 28,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.04)',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    gap: 24,
  },
  centered: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 'auto',
    minWidth: 320,
    maxWidth: 600,
  },
  plate: {
    marginHorizontal: 32,
  },
}); 