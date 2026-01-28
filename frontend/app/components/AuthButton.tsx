'use client';

import { useState, useEffect } from 'react';
import { API_BASE_URL } from '../lib/api';

const backendBase = API_BASE_URL;

export default function AuthButton() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const res = await fetch(`${backendBase}/user`, {
        credentials: 'include',
      });
      if (res.ok) {
        const user = await res.json();
        setIsAuthenticated(true);
        setUserEmail(user.email || 'User');
      } else {
        setIsAuthenticated(false);
        setUserEmail(null);
      }
    } catch {
      setIsAuthenticated(false);
      setUserEmail(null);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-gray-500 text-sm">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  if (isAuthenticated) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm text-gray-700 hidden sm:inline">
          {userEmail}
        </span>
        <a
          href={`${backendBase}/logout`}
          className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
        >
          Log out
        </a>
      </div>
    );
  }

  return (
    <a
      href={`${backendBase}/login`}
      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
    >
      Log in
    </a>
  );
}
