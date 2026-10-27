import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('smart_mfg_user');
    return saved ? JSON.parse(saved) : {
      email: 'admin@smart-manufacturing.io',
      role: 'Admin',
      name: 'Security Admin',
      isAuthenticated: true
    };
  });

  const login = (email, password, role) => {
    const userData = {
      email,
      role: role || 'Admin',
      name: role === 'Admin' ? 'Lead Cybersecurity Admin' : 'Plant Floor Operator',
      isAuthenticated: true,
      loginTime: new Date().toISOString()
    };
    setUser(userData);
    localStorage.setItem('smart_mfg_user', JSON.stringify(userData));
    return true;
  };

  const logout = () => {
    const defaultOperator = {
      email: 'operator@smart-manufacturing.io',
      role: 'Operator',
      name: 'Floor Operator',
      isAuthenticated: false
    };
    setUser(defaultOperator);
    localStorage.removeItem('smart_mfg_user');
  };

  const switchRole = (newRole) => {
    if (user) {
      const updated = { ...user, role: newRole, name: newRole === 'Admin' ? 'Lead Cybersecurity Admin' : 'Plant Floor Operator' };
      setUser(updated);
      localStorage.setItem('smart_mfg_user', JSON.stringify(updated));
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
