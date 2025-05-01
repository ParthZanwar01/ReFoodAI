import React, { useContext } from 'react';
import { View, StyleSheet, TouchableOpacity, Text } from 'react-native';
import { ReFoodLogo } from './ReFoodLogo';
import { AuthContext } from '../context/AuthContext';

export function HeaderBar() {
  const { user, signOut, openAuthModal } = useContext(AuthContext);
  return (
    <View style={styles.header}>
      <View style={styles.logoWrap}>
        <ReFoodLogo size={48} />
        <Text style={styles.brand}>ReFood AI</Text>
      </View>
      <View style={styles.right}>
        {user ? (
          <>
            <Text style={styles.user}>{user.email}</Text>
            <TouchableOpacity style={styles.button} onPress={signOut}>
              <Text style={styles.buttonText}>Sign Out</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity style={styles.button} onPress={() => openAuthModal('signin')}>
              <Text style={styles.buttonText}>Sign In</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.button} onPress={() => openAuthModal('signup')}>
              <Text style={styles.buttonText}>Sign Up</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 32,
    paddingVertical: 18,
    backgroundColor: '#184C3A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
    zIndex: 10,
  },
  logoWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  brand: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 22,
    marginLeft: 8,
    letterSpacing: 1.2,
  },
  right: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  user: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
    marginRight: 12,
  },
  button: {
    backgroundColor: '#3DC86F',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 8,
    marginLeft: 8,
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 15,
  },
}); 