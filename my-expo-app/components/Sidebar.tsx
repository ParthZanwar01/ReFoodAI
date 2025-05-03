import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, ScrollView } from 'react-native';
import { ReFoodLogo } from './ReFoodLogo';
import { AuthContext } from '../context/AuthContext';
import { useRouter } from 'expo-router';

const navLinks = [
  { label: 'Dashboard', route: '/dashboard' },
  { label: 'Upload', route: '/upload' },
  { label: 'Forecast Studio', route: '/forecast' },
  { label: 'Action Planner', route: '/planner' },
  { label: 'Pickup Tracker', route: '/tracker' },
  { label: 'Settings', route: '/settings' },
];

export function Sidebar() {
  const { user, signOut } = useContext(AuthContext);
  const router = useRouter();
  if (!user) return null;
  return (
    <View style={styles.sidebar}>
      <View style={styles.logoWrap}>
        <ReFoodLogo size={40} />
        <Text style={styles.brand}>ReFood AI</Text>
      </View>
      <ScrollView style={styles.linksContainer} showsVerticalScrollIndicator={false}>
        <View style={styles.links}>
          {navLinks.map(link => (
            <TouchableOpacity key={link.route} style={styles.link} onPress={() => router.push(link.route)}>
              <Text style={styles.linkText}>{link.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <View style={styles.bottom}>
        <Text style={styles.user} numberOfLines={1} ellipsizeMode="middle">{user.email}</Text>
        <TouchableOpacity style={styles.signOut} onPress={signOut}>
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 260,
    backgroundColor: '#184C3A',
    height: '100%',
    paddingTop: 32,
    paddingHorizontal: 18,
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    zIndex: 20,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 16,
    shadowOffset: { width: 2, height: 0 },
    display: 'flex',
    flexDirection: 'column',
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 32,
    flexShrink: 0,
  },
  brand: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 20,
    marginLeft: 8,
    letterSpacing: 1.1,
  },
  linksContainer: {
    flex: 1,
    marginBottom: 20,
  },
  links: {
    paddingBottom: 20,
  },
  link: {
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  linkText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  bottom: {
    flexShrink: 0,
    paddingTop: 16,
    paddingBottom: 32,
    borderTopWidth: 1,
    borderTopColor: '#245C47',
    alignItems: 'flex-start',
  },
  user: {
    color: '#CBD5E1',
    fontSize: 14,
    marginBottom: 12,
    maxWidth: '100%',
  },
  signOut: {
    backgroundColor: '#3DC86F',
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  signOutText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 14,
  },
}); 