import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Organization, UserRole } from '../types/index.ts';
import { api } from '../services/api.ts';

interface AuthContextType {
  user: User | null;
  organization: Organization | null;
  loading: boolean;
  error: string | null;
  login: (emailOrCpf: string) => Promise<boolean>;
  logout: () => void;
  switchRole: (role?: UserRole, userId?: string) => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMe();
      setUser(data.user);
      setOrganization(data.organization);
    } catch (err: any) {
      console.error('Falha ao carregar sessão', err);
      setError(err.message || 'Erro ao carregar sessão');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  const login = async (emailOrCpf: string): Promise<boolean> => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.login(emailOrCpf);
      setUser(data.user);
      setOrganization(data.organization);
      return true;
    } catch (err: any) {
      setError(err.message || 'Erro ao efetuar login');
      return false;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    // Para conveniência institucional, mantemos a navegação limpa
    setUser(null);
    setOrganization(null);
  };

  const switchRole = async (role?: UserRole, userId?: string) => {
    try {
      setLoading(true);
      const data = await api.switchRole({ role, userId });
      setUser(data.user);
      setOrganization(data.organization);
    } catch (err: any) {
      console.error('Erro ao alternar perfil', err);
    } finally {
      setLoading(false);
    }
  };

  const refresh = async () => {
    await fetchSession();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        organization,
        loading,
        error,
        login,
        logout,
        switchRole,
        refresh,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser utilizado dentro de um AuthProvider');
  }
  return context;
};
