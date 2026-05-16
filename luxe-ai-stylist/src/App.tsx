/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from './lib/firebase';
import { LandingPage, AuthModal } from './components/LandingAndAuth';
import { Dashboard } from './components/Dashboard';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [authType, setAuthType] = useState<'signin' | 'signup'>('signin');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
    });
    return unsub;
  }, []);

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-zinc-950">
        <div className="w-12 h-12 border-4 border-white/10 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Dashboard />;
  }

  return (
    <>
      <LandingPage onStart={() => { setAuthType('signup'); setShowAuth(true); }} />
      <AuthModal 
        isOpen={showAuth} 
        type={authType} 
        onClose={() => setShowAuth(false)} 
        onSuccess={() => setShowAuth(false)}
      />
      
      {/* Navigation for landing page */}
      <nav className="fixed top-0 left-0 right-0 z-40 p-10 flex justify-between items-center pointer-events-none">
        <div className="font-display italic text-3xl font-black pointer-events-auto cursor-pointer">Luxe.</div>
        <div className="flex gap-4 pointer-events-auto">
          <button 
            onClick={() => { setAuthType('signin'); setShowAuth(true); }}
            className="px-8 py-3 rounded-full border border-white/20 bg-white/5 backdrop-blur-md font-medium transition-colors hover:bg-white hover:text-black"
          >
            Sign In
          </button>
        </div>
      </nav>
    </>
  );
}
