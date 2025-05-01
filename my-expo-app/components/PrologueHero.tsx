import * as React from 'react';
import { View, StyleSheet, Dimensions, Image, Animated, Easing, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { ThemedText } from '@/components/ThemedText';
import { ReFoodLogo } from '@/components/ReFoodLogo';
import { brandPrimary, accent, ink } from '@/constants/Colors';
import { useWindowDimensions } from 'react-native';
import { BlurView } from 'expo-blur';

const SCREEN_WIDTH = Dimensions.get('window').width;

export function PrologueHero() {
  const { width } = useWindowDimensions();
  const isMobile = width < 1024; // lg breakpoint

  // Animation values
  const fadeAnim = React.useRef(new Animated.Value(0)).current;
  const slideAnim = React.useRef(new Animated.Value(20)).current;
  const tiltAnim = React.useRef(new Animated.Value(0)).current;
  const blobAnim = React.useRef(new Animated.Value(0)).current;
  const buttonScale = React.useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Fade in animation
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Slide up animation
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 1200,
      useNativeDriver: true,
      easing: Easing.out(Easing.cubic),
    }).start();

    // Continuous tilt animation for the dashboard preview
    Animated.loop(
      Animated.sequence([
        Animated.timing(tiltAnim, {
          toValue: 1,
          duration: 10000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(tiltAnim, {
          toValue: -1,
          duration: 10000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();

    // Subtle blob animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(blobAnim, {
          toValue: 1,
          duration: 15000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
        Animated.timing(blobAnim, {
          toValue: 0,
          duration: 15000,
          useNativeDriver: true,
          easing: Easing.inOut(Easing.sin),
        }),
      ])
    ).start();
  }, []);

  const handleButtonPress = () => {
    Animated.sequence([
      Animated.timing(buttonScale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(buttonScale, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const tiltStyle = {
    transform: [
      {
        rotateX: tiltAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['-1.6deg', '1.6deg'],
        }),
      },
      {
        rotateY: tiltAnim.interpolate({
          inputRange: [-1, 1],
          outputRange: ['1.6deg', '-1.6deg'],
        }),
      },
    ],
  };

  const blobStyle = {
    transform: [
      {
        translateY: blobAnim.interpolate({
          inputRange: [0, 1],
          outputRange: [0, -20],
        }),
      },
    ],
  };

  return (
    <View style={styles.container}>
      {/* Background gradient */}
      <LinearGradient
        colors={['#0A3D2F', '#1A5D4F', '#2A7D6F']}
        style={styles.background}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Radial gradient overlay */}
        <LinearGradient
          colors={['rgba(72, 207, 150, 0.15)', 'transparent']}
          style={styles.radialOverlay}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
        />
        
        {/* Grain texture overlay */}
        <View style={styles.grainOverlay} />
        
        {/* Blurred blobs */}
        <View style={styles.blurredBlob1} />
        <View style={styles.blurredBlob2} />
        <View style={styles.blurredBlob3} />

        {/* Content */}
        <View style={[styles.content, isMobile ? styles.mobileContent : styles.desktopContent]}>
          {/* Left column - Text & CTAs */}
          <Animated.View 
            style={[
              styles.leftColumn, 
              isMobile ? styles.mobileLeftColumn : styles.desktopLeftColumn,
              {
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }],
              }
            ]}
          >
            {/* Tagline */}
            <ThemedText style={styles.tagline}>
              AI-Powered Food Waste Reduction
            </ThemedText>

            {/* Main heading */}
            <ThemedText style={styles.heading}>
              Smarter kitchens.{'\n'}Cleaner communities.
            </ThemedText>

            {/* Sub-copy */}
            <ThemedText style={styles.subCopy}>
              Turn tomorrow's waste into today's impact. Use AI to predict leftovers and reroute them before they hit the bin.
            </ThemedText>

            {/* CTAs */}
            <View style={[styles.ctaContainer, isMobile ? styles.mobileCtaContainer : styles.desktopCtaContainer]}>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.primaryButton,
                  { transform: [{ scale: buttonScale }] }
                ]}
                onPress={handleButtonPress}
              >
                <ThemedText style={styles.buttonText}>Get started free</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.button, 
                  styles.secondaryButton,
                  { transform: [{ scale: buttonScale }] }
                ]}
                onPress={handleButtonPress}
              >
                <ThemedText style={styles.secondaryButtonText}>Watch 60-sec demo</ThemedText>
              </TouchableOpacity>
            </View>
          </Animated.View>

          {/* Right column - Dashboard mock */}
          <Animated.View 
            style={[
              styles.rightColumn, 
              isMobile ? styles.mobileRightColumn : styles.desktopRightColumn,
              tiltStyle,
              blobStyle
            ]}
          >
            <BlurView intensity={20} style={styles.dashboardImage}>
              <View style={styles.dashboardContent}>
                <View style={styles.dashboardHeader}>
                  <View style={styles.dashboardDot} />
                  <View style={styles.dashboardDot} />
                  <View style={styles.dashboardDot} />
                </View>
                <View style={styles.dashboardGrid}>
                  {[...Array(6)].map((_, i) => (
                    <View key={i} style={styles.dashboardCard}>
                      <View style={styles.dashboardCardHeader} />
                      <View style={styles.dashboardCardContent} />
                    </View>
                  ))}
                </View>
              </View>
            </BlurView>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    minHeight: 600,
    position: 'relative',
  },
  background: {
    flex: 1,
    width: '100%',
  },
  radialOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  grainOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08,
    backgroundColor: '#000',
    mixBlendMode: 'soft-light',
  },
  blurredBlob1: {
    position: 'absolute',
    bottom: 0,
    right: '33%',
    width: 480,
    height: 480,
    backgroundColor: '#48CF96',
    opacity: 0.15,
    borderRadius: 240,
    filter: 'blur(120px)',
    zIndex: -1,
  },
  blurredBlob2: {
    position: 'absolute',
    top: '20%',
    left: '10%',
    width: 360,
    height: 360,
    backgroundColor: '#48CF96',
    opacity: 0.1,
    borderRadius: 180,
    filter: 'blur(100px)',
    zIndex: -1,
  },
  blurredBlob3: {
    position: 'absolute',
    top: '40%',
    right: '20%',
    width: 280,
    height: 280,
    backgroundColor: '#48CF96',
    opacity: 0.12,
    borderRadius: 140,
    filter: 'blur(80px)',
    zIndex: -1,
  },
  content: {
    maxWidth: 1280,
    marginHorizontal: 'auto',
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  desktopContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 40,
  },
  mobileContent: {
    flexDirection: 'column',
    gap: 32,
  },
  leftColumn: {
    flex: 1,
  },
  desktopLeftColumn: {
    flex: 7,
  },
  mobileLeftColumn: {
    width: '100%',
  },
  rightColumn: {
    flex: 1,
  },
  desktopRightColumn: {
    flex: 5,
  },
  mobileRightColumn: {
    width: '100%',
  },
  tagline: {
    fontSize: 14,
    fontFamily: 'System',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1.2,
    color: '#CBD5E1',
    marginBottom: 16,
  },
  heading: {
    fontSize: 64,
    fontFamily: 'System',
    fontWeight: '700',
    letterSpacing: -1,
    color: '#fff',
    marginBottom: 24,
    lineHeight: 72,
  },
  subCopy: {
    fontSize: 20,
    fontFamily: 'System',
    color: '#CBD5E1',
    maxWidth: 512,
    marginBottom: 24,
    lineHeight: 32,
    fontWeight: '400',
  },
  ctaContainer: {
    flexDirection: 'row',
    gap: 16,
  },
  desktopCtaContainer: {
    flexDirection: 'row',
  },
  mobileCtaContainer: {
    flexDirection: 'column',
    width: '100%',
  },
  button: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: brandPrimary,
    shadowColor: brandPrimary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'System',
    fontWeight: '600',
  },
  dashboardImage: {
    width: '100%',
    height: 440,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  dashboardContent: {
    flex: 1,
    padding: 16,
  },
  dashboardHeader: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  dashboardDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  dashboardGrid: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  dashboardCard: {
    width: '48%',
    height: 120,
    backgroundColor: '#184C3A',
    borderRadius: 8,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dashboardCardHeader: {
    width: '60%',
    height: 16,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderRadius: 4,
    marginBottom: 12,
  },
  dashboardCardContent: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 4,
  },
}); 