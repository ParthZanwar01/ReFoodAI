import React, { useContext, useEffect } from 'react';
import { useRouter } from 'expo-router';
import { AuthContext } from '../context/AuthContext';
import { LandingScreen } from '../screens/LandingScreen';

export default function IndexScreen() {
  const { user } = useContext(AuthContext);
  const router = useRouter();

  useEffect(() => {
    // Add a small delay to ensure auth context is fully loaded
    const timeoutId = setTimeout(() => {
      if (user && router) {
        router.replace('/dashboard');
      }
    }, 100);

    return () => clearTimeout(timeoutId);
  }, [user, router]);

  // Don't render anything while redirecting to prevent flash
  if (user) {
    return null;
  }

  return <LandingScreen />;
} 