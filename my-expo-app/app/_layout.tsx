import { Stack } from 'expo-router';
import React, { useContext } from 'react';
import { AuthProvider, AuthContext } from '../context/AuthContext';
import { Sidebar } from '../components/Sidebar';
import { HeaderBar } from '../components/HeaderBar';
import { AuthModal } from '../components/AuthModal';
import { View, StyleSheet } from 'react-native';
import { LandingScreen } from '../screens/LandingScreen';

function AppShell() {
  const { user } = useContext(AuthContext);
  if (!user) {
    return (
      <View style={styles.root}>
        <View style={styles.mainContentNoSidebar}>
          <HeaderBar />
          <LandingScreen />
        </View>
        <AuthModal />
      </View>
    );
  }
  return (
    <View style={styles.root}>
      <Sidebar />
      <View style={styles.mainContent}>
        <HeaderBar />
        <Stack />
      </View>
      <AuthModal />
    </View>
  );
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <AppShell />
    </AuthProvider>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    flexDirection: 'row',
    minHeight: '100%',
    backgroundColor: '#184C3A',
  },
  mainContent: {
    flex: 1,
    marginLeft: 260, // sidebar width
    minHeight: '100%',
    backgroundColor: '#184C3A',
  },
  mainContentNoSidebar: {
    flex: 1,
    minHeight: '100%',
    backgroundColor: '#184C3A',
  },
});
