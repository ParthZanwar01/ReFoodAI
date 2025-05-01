import React, { useContext, useState } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { AuthContext } from '../context/AuthContext';

export function AuthModal() {
  const { authModal, closeAuthModal, signIn, signUp } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    let ok = false;
    if (authModal.mode === 'signin') {
      ok = await signIn(email, password);
      if (!ok) setError('Invalid email or password');
    } else {
      ok = await signUp(email, password);
      if (!ok) setError('User already exists');
    }
    setLoading(false);
    if (ok) {
      setEmail('');
      setPassword('');
      closeAuthModal();
    }
  };

  if (!authModal.open) return null;
  return (
    <Modal visible transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>{authModal.mode === 'signin' ? 'Sign In' : 'Sign Up'}</Text>
          <TextInput
            style={styles.input}
            placeholder="Email"
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Password"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          {error ? <Text style={styles.error}>{error}</Text> : null}
          <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
            <Text style={styles.buttonText}>{authModal.mode === 'signin' ? 'Sign In' : 'Sign Up'}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={closeAuthModal} style={styles.closeBtn}>
            <Text style={styles.closeText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 18,
    padding: 32,
    width: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.18,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 4 },
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 18,
    color: '#184C3A',
  },
  input: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#3DC86F',
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 12,
    marginTop: 8,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 17,
  },
  error: {
    color: '#E53E3E',
    marginBottom: 8,
    fontSize: 15,
  },
  closeBtn: {
    marginTop: 16,
  },
  closeText: {
    color: '#184C3A',
    fontWeight: '600',
    fontSize: 15,
  },
}); 