'use client';

import { useEffect } from 'react';
import { useStore } from '@/store/useStore';

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const initializeAuth = useStore((state) => state.initializeAuth);
  const fetchWholesaleSettings = useStore((state) => state.fetchWholesaleSettings);

  useEffect(() => {
    initializeAuth();
    fetchWholesaleSettings();
  }, [initializeAuth, fetchWholesaleSettings]);

  return <>{children}</>;
};

export default AuthProvider;
