import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BrowserRouter as Router, Routes, Route, Link, NavLink, Navigate } from 'react-router-dom';
import ProfileDashboard from './components/User/ProfileDashboard';
import Leaderboard from './components/User/Leaderboard';
import AdminPanel from './components/Admin/AdminPanel';
import AuthForm from './components/Auth/AuthForm';
import QuizAttempt from './components/User/QuizAttempt';
import { LayoutGrid, Trophy, User, ShieldCheck, LogOut, Sun, Moon, Zap } from 'lucide-react';
import { supabase } from './lib/supabase';
import './App.css';

function App() {
  const [session, setSession] = useState(null);
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [activeQuiz, setActiveQuiz] = useState(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const toggleTheme = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  if (!session) {
    return <div className={isDarkMode ? 'dark' : ''}><AuthForm onAuthSuccess={(user) => setSession(user)} /></div>;
  }

  // Mock Quiz Data for implementation
  const demoQuiz = {
    id: 'quiz-1',
    questions: [
      { text: "What is the primary purpose of Redux in a React application?", options: [
        { text: "Component Styling", is_correct: false },
        { text: "Global State Management", is_correct: true },
        { text: "Routing Logic", is_correct: false },
        { text: "Database Connectivity", is_correct: false }
      ]},
      { text: "Which hook is used for handling side effects by default?", options: [
        { text: "useMemo", is_correct: false },
        { text: "useCallback", is_correct: false },
        { text: "useEffect", is_correct: true },
        { text: "useRef", is_correct: false }
      ]}
    ]
  };

  return (
    <Router>
      <div className={`${isDarkMode ? 'dark' : ''} min-h-screen bg-gray-50 dark:bg-[#050510] transition-colors duration-500`}>
        <div className="text-gray-900 dark:text-white selection:bg-[#4F46E5] selection:text-white">
          
          <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#050510]/80 backdrop-blur-3xl border-b border-gray-100 dark:border-white/5 px-8 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 bg-gradient-to-tr from-[#4F46E5] to-purple-600 rounded-xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-all rotate-3">
                <ShieldCheck className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter uppercase">QUIZMATE</span>
            </Link>

            <div className="hidden md:flex items-center gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-[1.25rem] border border-transparent dark:border-white/5">
              <NavLink to="/" className={({ isActive }) => `flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${isActive ? 'bg-white dark:bg-[#4F46E5] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:hover:text-white hover:bg-white/10'}`}>
                <LayoutGrid className="w-4 h-4" /> Discover
              </NavLink>
              <NavLink to="/leaderboard" className={({ isActive }) => `flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${isActive ? 'bg-white dark:bg-[#4F46E5] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:hover:text-white hover:bg-white/10'}`}>
                <Trophy className="w-4 h-4" /> Rank
              </NavLink>
              <NavLink to="/profile" className={({ isActive }) => `flex items-center gap-2 px-6 py-2.5 rounded-2xl text-sm font-black transition-all ${isActive ? 'bg-white dark:bg-[#4F46E5] shadow-sm text-gray-900 dark:text-white' : 'text-gray-500 dark:hover:text-white hover:bg-white/10'}`}>
                <User className="w-4 h-4" /> Me
              </NavLink>
            </div>

            <div className="flex items-center gap-4">
              <button 
                onClick={toggleTheme}
                className="p-3 bg-gray-100 dark:bg-white/5 rounded-2xl border border-transparent dark:border-white/5 text-gray-500 hover:text-[#4F46E5] transition-all active:scale-90"
              >
                {isDarkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
              <button 
                onClick={() => supabase.auth.signOut()}
                className="p-3 bg-gray-100 dark:bg-red-500/10 rounded-2xl border border-transparent dark:border-red-500/10 text-gray-500 dark:text-red-500 hover:bg-red-500 hover:text-white transition-all shadow-sm"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </nav>

          <main className="pt-24 min-h-screen">
            <Routes>
              <Route path="/" element={<DiscoverPage onStart={() => setActiveQuiz(demoQuiz)} />} />
              <Route path="/attempt" element={activeQuiz ? <QuizAttempt quizData={activeQuiz} onComplete={() => setActiveQuiz(null)} /> : <Navigate to="/" />} />
              <Route path="/leaderboard" element={<Leaderboard />} />
              <Route path="/profile" element={<ProfileDashboard />} />
              <Route path="/admin" element={<AdminPanel />} />
            </Routes>
          </main>

        </div>
      </div>
    </Router>
  );
}

const DiscoverPage = ({ onStart }) => (
  <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col items-center text-center">
    <motion.div 
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#4F46E5]/10 border border-[#4F46E5]/20 text-[#4F46E5] rounded-full text-[10px] font-black uppercase tracking-widest shadow-xl shadow-[#4F46E5]/10 animate-pulse">
        Ready for the challenge?
      </div>
      <h1 className="text-6xl md:text-8xl font-black tracking-tighter leading-[0.9] dark:text-white text-gray-900 group cursor-default">
        MASTER THE<br />
        <span className="bg-gradient-to-r from-[#4F46E5] to-purple-500 bg-clip-text text-transparent group-hover:tracking-normal transition-all duration-700">EXPERIENCE.</span>
      </h1>
      <p className="max-w-xl mx-auto text-gray-500 dark:text-gray-400 font-medium text-lg leading-relaxed">
        Join thousands of learners in the most secure and competitive quiz platform. No cheats. No shortcuts. Only pure knowledge.
      </p>
      <div className="pt-10 flex gap-4 justify-center">
        <Link 
          to="/attempt"
          onClick={onStart}
          className="px-10 py-5 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-xl hover:scale-110 active:scale-95 transition-all shadow-2xl flex items-center gap-3 group"
        >
          START NOW <Zap className="w-5 h-5 fill-current transition-transform group-hover:rotate-12" />
        </Link>
      </div>
    </motion.div>
  </div>
);

export default App;
