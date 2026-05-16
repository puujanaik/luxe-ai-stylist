import React, { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Sparkles, 
  Camera, 
  ShoppingBag, 
  MessageSquare, 
  ChevronRight, 
  Search,
  CheckCircle2,
  Lock,
  Mail,
  User,
  ArrowRight
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendEmailVerification, 
  updateProfile,
  onAuthStateChanged
} from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

export const LandingPage = ({ onStart }: { onStart: () => void }) => {
  return (
    <div className="min-h-screen overflow-hidden">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-zinc-950/80 to-zinc-950" />
          <motion.div 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5 }}
            className="w-full h-full bg-[url('https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center"
          />
        </div>

        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <span className="inline-block py-1 px-3 rounded-full border border-white/20 bg-white/5 text-xs font-medium tracking-widest uppercase mb-6 backdrop-blur-sm">
              AI-Powered Fashion Intelligence
            </span>
            <h1 className="font-display italic text-7xl md:text-9xl mb-8 leading-[0.85] tracking-tighter">
              Bespoke <br /> <span className="text-zinc-400">Elegance.</span>
            </h1>
            <p className="text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              Unlock your perfect look with AI-driven stylists, multi-platform price comparison, and virtual try-ons.
            </p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onStart}
              className="bg-white text-black px-10 py-5 rounded-full font-medium text-lg flex items-center gap-2 mx-auto transition-colors hover:bg-zinc-200 shadow-2xl shadow-white/10"
            >
              Get Started <ChevronRight className="w-5 h-5" />
            </motion.button>
          </motion.div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 px-4 max-w-7xl mx-auto border-t border-zinc-500/20">
        <div className="grid md:grid-cols-3 gap-12">
          <FeatureCard 
            icon={<Camera className="w-8 h-8" />}
            title="Try Me Meta-Analysis"
            description="Deep skin-tone and gender detection for hyper-personalized makeup and outfit recommendations."
          />
          <FeatureCard 
            icon={<ShoppingBag className="w-8 h-8" />}
            title="Global Compare"
            description="Automatic price tracking across Myntra, Ajio, Flipkart, Nykaa, and more. Never overpay again."
          />
          <FeatureCard 
            icon={<MessageSquare className="w-8 h-8" />}
            title="Multilingual AI Chat"
            description="Interactive fashion consultant available in your preferred language via voice or text."
          />
        </div>
      </section>
    </div>
  );
};

const FeatureCard = ({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) => (
  <motion.div 
    whileHover={{ y: -10 }}
    className="p-8 rounded-3xl bg-zinc-500/5 border border-zinc-500/10 hover:border-white/20 transition-all group"
  >
    <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center mb-6 text-white group-hover:bg-white group-hover:text-black transition-colors">
      {icon}
    </div>
    <h3 className="text-xl font-semibold mb-4">{title}</h3>
    <p className="text-zinc-500 leading-relaxed">{description}</p>
  </motion.div>
);

export const AuthModal = ({ isOpen, type, onClose, onSuccess }: { isOpen: boolean, type: 'signin' | 'signup', onClose: () => void, onSuccess: () => void }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (type === 'signup') {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(userCred.user, { displayName: name });
        await setDoc(doc(db, 'users', userCred.user.uid), {
          uid: userCred.user.uid,
          email,
          displayName: name,
          createdAt: new Date().toISOString()
        });
        await sendEmailVerification(userCred.user);
        setIsSent(true);
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        onSuccess();
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[2.5rem] p-10 relative shadow-2xl"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-zinc-500 hover:text-white">
          <ChevronRight className="w-6 h-6 rotate-180" />
        </button>

        <div className="text-center mb-10">
          <div className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center mx-auto mb-6">
            {type === 'signup' ? <Sparkles className="w-8 h-8" /> : <Lock className="w-8 h-8" />}
          </div>
          <h2 className="text-3xl font-display italic font-semibold mb-2">
            {type === 'signup' ? 'Join Us' : 'Welcome Back'}
          </h2>
          <p className="text-zinc-500">
            {type === 'signup' ? 'Create your professional fashion profile.' : 'Sign in to access your dashboard.'}
          </p>
        </div>

        {isSent ? (
          <div className="text-center py-10">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-6" />
            <h3 className="text-xl font-medium mb-2">Check your inbox</h3>
            <p className="text-zinc-500 mb-8">We've sent a verification link to {email}. Please verify to continue.</p>
            <button onClick={onClose} className="w-full py-4 bg-white text-black rounded-2xl font-medium">Close</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            {type === 'signup' && (
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
                <input 
                  type="text" 
                  placeholder="Full Name" 
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-white/20 focus:outline-none transition-colors"
                />
              </div>
            )}
            <div className="relative">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="email" 
                placeholder="Email Address" 
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-white/20 focus:outline-none transition-colors"
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
              <input 
                type="password" 
                placeholder="Password" 
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-zinc-950 border border-white/5 rounded-2xl py-4 pl-12 pr-4 focus:border-white/20 focus:outline-none transition-colors"
              />
            </div>

            {error && <p className="text-red-500 text-sm text-center bg-red-500/10 py-3 rounded-xl">{error}</p>}

            <button 
              type="submit" 
              disabled={loading}
              className={cn(
                "w-full py-5 bg-white text-black rounded-2xl font-medium flex items-center justify-center gap-2 transition-all hover:bg-zinc-200",
                loading && "opacity-50 cursor-not-allowed"
              )}
            >
              {loading ? 'Processing...' : type === 'signup' ? 'Create Account' : 'Sign In'}
              <ArrowRight className="w-5 h-5" />
            </button>
          </form>
        )}

        <div className="mt-8 text-center text-sm">
          <button 
            onClick={() => {}} // Switch type modal logic here if needed
            className="text-zinc-500 hover:text-white transition-colors"
          >
            {type === 'signup' ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
          </button>
        </div>
      </motion.div>
    </div>
  );
};
