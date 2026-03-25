import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, ShieldCheck, Sparkles, Moon, Sun } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AuthForm = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    username: ''
  });
  const [error, setError] = useState('');

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      if (isLogin) {
        // Sign In
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password
        });
        if (error) throw error;
        onAuthSuccess(data.user);
      } else {
        // Sign Up
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: { username: formData.username }
          }
        });
        if (error) throw error;
        
        // Manual profile injection (backend will normally handle this)
        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            username: formData.username,
            total_xp: 0,
            streak_count: 0
          });
        }
        setIsLogin(true);
        alert('Registration successful! Please sign in.');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-transparent p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md bg-white/5 dark:bg-black/20 backdrop-blur-3xl border border-white/10 dark:border-white/5 rounded-[2.5rem] p-10 relative overflow-hidden shadow-2xl"
      >
        {/* Decorative elements */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-[#4F46E5]/20 rounded-full blur-[80px]" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-purple-500/20 rounded-full blur-[80px]" />

        <div className="relative text-center mb-10">
          <div className="w-16 h-16 bg-gradient-to-tr from-[#4F46E5] to-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg rotate-3 group">
             <ShieldCheck className="w-8 h-8 text-white group-hover:scale-110 transition-transform" />
          </div>
          <h2 className="text-3xl font-black tracking-tight text-gray-900 dark:text-white">
            {isLogin ? 'Welcome Back' : 'Join QuizMate'}
          </h2>
          <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">
            {isLogin ? 'Continue your learning journey' : 'Start your competitive career today'}
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          <AnimatePresence mode="wait">
            {!isLogin && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="relative"
              >
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
                  <User className="w-5 h-5" />
                </div>
                <input 
                  type="text" 
                  placeholder="Username"
                  required
                  value={formData.username}
                  onChange={(e) => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-[#4F46E5]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-900 dark:text-white font-medium"
                />
              </motion.div>
            )}
          </AnimatePresence>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Mail className="w-5 h-5" />
            </div>
            <input 
              type="email" 
              placeholder="Email address"
              required
              value={formData.email}
              onChange={(e) => setFormData({...formData, email: e.target.value})}
              className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-[#4F46E5]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-900 dark:text-white font-medium"
            />
          </div>

          <div className="relative">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
              <Lock className="w-5 h-5" />
            </div>
            <input 
              type="password" 
              placeholder="Password"
              required
              value={formData.password}
              onChange={(e) => setFormData({...formData, password: e.target.value})}
              className="w-full bg-gray-100 dark:bg-white/5 border border-transparent focus:border-[#4F46E5]/30 focus:bg-white dark:focus:bg-white/10 rounded-2xl py-4 pl-12 pr-4 outline-none transition-all text-gray-900 dark:text-white font-medium"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center animate-shake">
              {error}
            </p>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-[#4F46E5] hover:bg-[#4338CA] text-white font-black py-4 rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
          >
            {loading ? <Sparkles className="w-5 h-5 animate-spin" /> : (
               <>
                 {isLogin ? 'Sign In' : 'Create Account'}
                 <ArrowRight className="w-5 h-5" />
               </>
            )}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm font-bold text-gray-500 dark:text-gray-400 hover:text-[#4F46E5] dark:hover:text-[#4F46E5] transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default AuthForm;
