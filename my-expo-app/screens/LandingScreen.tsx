import React, { useRef, useState } from 'react';
import { View, StyleSheet, ScrollView, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { PrologueHero } from '@/components/PrologueHero';
import { LogoBar } from '@/components/LogoBar';
import { HowItWorks } from '@/components/HowItWorks';

export function LandingScreen() {
  const [logoBarInView, setLogoBarInView] = useState(false);
  const logoBarRef = useRef(null);
  const [logoBarY, setLogoBarY] = useState(0);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const windowHeight = event.nativeEvent.layoutMeasurement.height;
    // Trigger when LogoBar is at least 50% visible
    if (!logoBarInView && logoBarY < scrollY + windowHeight - 100) {
      setLogoBarInView(true);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      scrollEventThrottle={16}
      onScroll={handleScroll}
    >
      <PrologueHero />
      <View
        ref={logoBarRef}
        onLayout={e => setLogoBarY(e.nativeEvent.layout.y)}
      >
        <LogoBar shouldAnimate={logoBarInView} />
      </View>
      <HowItWorks />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  content: {
    alignItems: 'stretch',
    paddingBottom: 64,
  },
}); 