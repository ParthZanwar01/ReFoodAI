import React from 'react';
import { View, Text, StyleSheet, Dimensions, Animated, Easing } from 'react-native';
import Svg, { Path, Rect, Circle, G, Ellipse, Line, Defs, Stop, LinearGradient, RadialGradient } from 'react-native-svg';
import { useRef, useEffect } from 'react';

const steps = [
  {
    title: 'Upload',
    desc: 'Easily upload your inventory or menu data in seconds. No manual entry required.',
  },
  {
    title: 'Predict',
    desc: 'Let our AI forecast surplus and demand, so you know what to expect before it happens.',
  },
  {
    title: 'Optimise',
    desc: 'Get actionable suggestions to optimize portions, reduce waste, and save money.',
  },
  {
    title: 'Track',
    desc: 'Monitor your impact and savings with beautiful, real-time dashboards.',
  },
];

// Redesigned SVGs for each step (120x120, modern, meaningful)
function HowItWorksUploadIcon() {
  return (
    <Svg width={120} height={120} viewBox="0 0 120 120" fill="none">
      {/* Cloud */}
      <Path d="M40 80c-8 0-14-6-14-14 0-7 5-13 12-14 2-13 13-22 26-22 11 0 21 7 24 18 7 1 12 7 12 14 0 8-6 14-14 14H40z" fill="#E6F4EA" stroke="#2A7D6F" strokeWidth={3}/>
      {/* Upward Arrow */}
      <Path d="M60 88V54" stroke="#2A7D6F" strokeWidth={4} strokeLinecap="round"/>
      <Path d="M52 62l8-8 8 8" stroke="#2A7D6F" strokeWidth={4} strokeLinecap="round" strokeLinejoin="round"/>
      {/* Document */}
      <Rect x={54} y={38} width={12} height={16} rx={2} fill="#B6E2D3" stroke="#2A7D6F" strokeWidth={2}/>
      <Path d="M56 42h8" stroke="#2A7D6F" strokeWidth={2} strokeLinecap="round"/>
      <Path d="M56 46h8" stroke="#2A7D6F" strokeWidth={2} strokeLinecap="round"/>
    </Svg>
  );
}

function HowItWorksPredictIcon() {
  return (
    <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
      {/* Magnifying glass */}
      <Circle cx={80} cy={80} r={48} stroke="#3DC86F" strokeWidth={10} fill="none" />
      <Line x1={120} y1={120} x2={150} y2={150} stroke="#3DC86F" strokeWidth={10} strokeLinecap="round" />
    </Svg>
  );
}

function HowItWorksOptimiseIcon() {
  return (
    <Svg width={160} height={160} viewBox="0 0 160 160" fill="none">
      {/* Gear icon */}
      <G>
        {/* Outer gear teeth */}
        <G stroke="#3DC86F" strokeWidth={10} strokeLinecap="round">
          <Line x1="80" y1="20" x2="80" y2="0" />
          <Line x1="80" y1="140" x2="80" y2="160" />
          <Line x1="20" y1="80" x2="0" y2="80" />
          <Line x1="140" y1="80" x2="160" y2="80" />
          <Line x1="40" y1="40" x2="25" y2="25" />
          <Line x1="120" y1="40" x2="135" y2="25" />
          <Line x1="40" y1="120" x2="25" y2="135" />
          <Line x1="120" y1="120" x2="135" y2="135" />
        </G>
        {/* Gear body */}
        <Circle cx="80" cy="80" r="40" stroke="#3DC86F" strokeWidth={10} fill="none" />
        {/* Gear center */}
        <Circle cx="80" cy="80" r="18" stroke="#3DC86F" strokeWidth={8} fill="none" />
      </G>
    </Svg>
  );
}

function HowItWorksTrackIcon() {
  return (
    <Svg width={180} height={180} viewBox="0 0 180 180" fill="none" style={{ marginLeft: -12 }}>
      {/* Improved zig-zag up arrow with sharp arrowhead */}
      <Path d="M30 150 L60 120 L90 130 L120 70 L150 90" stroke="#3DC86F" strokeWidth={14} fill="none" strokeLinejoin="round" />
      {/* Sharp arrowhead */}
      <Path d="M150 90 L140 80" stroke="#3DC86F" strokeWidth={8} strokeLinecap="round" />
      <Path d="M150 90 L165 85" stroke="#3DC86F" strokeWidth={8} strokeLinecap="round" />
    </Svg>
  );
}

function UploadIllustrationAnimated() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 700,
        useNativeDriver: true,
        easing: Easing.out(Easing.exp),
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);
  return (
    <Animated.View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>
      <Svg width="100%" height="100%" viewBox="0 0 480 320" style={{ width: '100%', height: '100%' }}>
        {/* Centered background ellipse */}
        <Defs>
          <LinearGradient id="uploadBg" x1="0" y1="0" x2="480" y2="320" gradientUnits="userSpaceOnUse">
            <Stop stopColor="#B6E2D3" stopOpacity="0.25" offset="0%" />
            <Stop stopColor="#E6F4EA" stopOpacity="0.12" offset="100%" />
          </LinearGradient>
        </Defs>
        {/* Removed the greyish rectangle background */}
        {/* Bold cloud upload icon */}
        <Path d="M120 200c0-44 36-80 80-80 8-32 40-56 80-56 40 0 72 24 80 56 44 0 80 36 80 80 0 44-36 80-80 80H200c-44 0-80-36-80-80z" fill="none" stroke="#3DC86F" strokeWidth={18} strokeLinejoin="round" />
        <Path d="M240 250V130" stroke="#3DC86F" strokeWidth={18} strokeLinecap="round" />
        <Path d="M200 170l40-40 40 40" stroke="#3DC86F" strokeWidth={18} strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </Svg>
    </Animated.View>
  );
}

export function HowItWorks() {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>How It Works</Text>
      {steps.map((step, idx) => {
        const isEven = idx % 2 === 0;
        let IconComponent = null;
        if (idx === 0) IconComponent = HowItWorksUploadIcon;
        if (idx === 1) IconComponent = HowItWorksPredictIcon;
        if (idx === 2) IconComponent = HowItWorksOptimiseIcon;
        if (idx === 3) IconComponent = HowItWorksTrackIcon;
        return (
          <View key={idx} style={[styles.card, !isEven && styles.cardReverse]}> 
            <View style={styles.textCol}>
              <View style={styles.stepNum}><Text style={styles.stepNumText}>{idx + 1}</Text></View>
              <Text style={styles.cardTitle}>{step.title}</Text>
              <Text style={styles.cardDesc}>{step.desc}</Text>
            </View>
            <View style={[styles.imgCol, idx === 0 && { alignItems: 'stretch', margin: 0 }]}> 
              {idx === 0 ? (
                <View style={{ flex: 1, alignItems: 'flex-start', justifyContent: 'center', marginLeft: 75 }}>
                  <UploadIllustrationAnimated />
                </View>
              ) : (
                <View style={{ alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                  {IconComponent && <IconComponent />}
                </View>
              )}
            </View>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    width: '100%',
    alignItems: 'center',
    paddingVertical: 64,
    backgroundColor: 'transparent',
  },
  sectionTitle: {
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 48,
    color: '#184C3A',
    letterSpacing: -1,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    maxWidth: 1200,
    width: '100%',
    backgroundColor: 'rgba(22,43,38,0.96)',
    borderRadius: 40,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    shadowColor: '#000',
    shadowOpacity: 0.10,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 8 },
    marginBottom: 64,
    padding: 40,
    gap: 48,
  },
  cardReverse: {
    flexDirection: 'row-reverse',
  },
  textCol: {
    flex: 1.2,
    gap: 16,
  },
  imgCol: {
    flex: 1,
    alignItems: 'center',
  },
  iconWrap: {
    width: 120,
    height: 120,
    borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 8,
    shadowColor: '#184C3A',
    shadowOpacity: 0.10,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 3 },
  },
  stepNum: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#2A7D6F',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  stepNumText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
  },
  cardTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  cardDesc: {
    fontSize: 18,
    color: '#CBD5E1',
    lineHeight: 28,
  },
}); 