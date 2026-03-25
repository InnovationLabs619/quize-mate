import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, CheckCircle2, ChevronRight, XCircle, AlertTriangle, ShieldCheck } from 'lucide-react';

const QuizAttempt = ({ quizData, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isCheatAttempt, setIsCheatAttempt] = useState(false);

  // Anti-Cheat: Disable Copy-Paste and Right Click
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => {
      e.preventDefault();
      setIsCheatAttempt(true);
      setTimeout(() => setIsCheatAttempt(false), 3000);
    };
    
    // Visibility Check (Detection of tab switching)
    const handleVisibility = () => {
      if (document.hidden) {
        alert("CHEATING DETECTED: Don't leave the quiz screen!");
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('visibilitychange', handleVisibility);
    
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !quizFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0) {
      handleNext();
    }
  }, [timeLeft, quizFinished]);

  const handleNext = () => {
    if (selectedOption !== null && quizData.questions[currentQuestion].options[selectedOption].is_correct) {
      setScore(prev => prev + 10);
    }

    if (currentQuestion + 1 < quizData.questions.length) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedOption(null);
      setTimeLeft(30);
    } else {
      setQuizFinished(true);
    }
  };

  if (quizFinished) {
    return (
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mb-6 border border-green-500/20">
          <CheckCircle2 className="w-12 h-12 text-green-500" />
        </div>
        <h2 className="text-4xl font-black mb-2">Quiz Completed!</h2>
        <p className="text-gray-400 text-xl mb-8 font-medium">You earned {score} XP points.</p>
        <button 
          onClick={onComplete}
          className="px-8 py-4 bg-[#4F46E5] text-white font-black rounded-2xl shadow-xl hover:scale-105 transition-all"
        >
          Check Leaderboard
        </button>
      </motion.div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="max-w-4xl mx-auto p-4 select-none relative">
      
      {/* Cheat Alert Overlay */}
      <AnimatePresence>
        {isCheatAttempt && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="fixed top-8 left-1/2 -translate-x-1/2 z-50 bg-red-600 text-white px-8 py-4 rounded-full font-black flex items-center gap-3 shadow-[0_0_50px_rgba(220,38,38,0.5)] border border-red-500"
          >
            <AlertTriangle className="w-6 h-6 animate-pulse" />
            COPYING DETECTED - SYSTEM LOCKED
            <XCircle className="w-5 h-5 cursor-pointer ml-4" onClick={() => setIsCheatAttempt(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Header */}
      <div className="flex items-center justify-between mb-12">
        <div className="flex gap-2">
          {quizData.questions.map((_, idx) => (
            <div 
              key={idx} 
              className={`h-2.5 rounded-full transition-all duration-500 ${idx === currentQuestion ? 'w-12 bg-[#4F46E5]' : idx < currentQuestion ? 'w-6 bg-green-500' : 'w-6 bg-gray-100 dark:bg-white/10'}`} 
            />
          ))}
        </div>
        
        <div className={`flex items-center gap-2 px-6 py-2 rounded-2xl border font-black ${timeLeft < 10 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-[#111122] border-[#222244] text-white'}`}>
          <Timer className="w-5 h-5" />
          {timeLeft}s
        </div>
      </div>

      <motion.div
        key={currentQuestion}
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="bg-white dark:bg-[#111122] border border-gray-100 dark:border-[#222244] rounded-[2.5rem] p-10 md:p-16 shadow-2xl relative"
      >
        <div className="absolute -top-8 -left-8 w-16 h-16 bg-[#4F46E5] text-white rounded-2xl flex items-center justify-center font-black text-2xl rotate-3 shadow-lg">
          Q{currentQuestion + 1}
        </div>

        <h3 className="text-2xl md:text-3xl font-black mb-12 leading-tight dark:text-white text-gray-900 pr-10">
          {currentQ.text}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {currentQ.options.map((option, idx) => (
            <motion.button
              key={idx}
              whileHover={{ y: -4 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => setSelectedOption(idx)}
              className={`p-6 rounded-3xl text-left border-2 transition-all group flex items-center justify-between ${selectedOption === idx ? 'bg-[#4F46E5] border-transparent text-white shadow-xl' : 'bg-gray-50 dark:bg-white/5 border-transparent dark:border-white/5 hover:border-[#4F46E5]/30 dark:text-gray-300 text-gray-700'}`}
            >
              <span className="font-bold text-lg">{option.text}</span>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 ${selectedOption === idx ? 'bg-white/20 border-white/30 text-white' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/10 text-gray-400'}`}>
                {String.fromCharCode(65 + idx)}
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-12 flex justify-end">
          <button 
            onClick={handleNext}
            disabled={selectedOption === null}
            className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center gap-2 ${selectedOption === null ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 shadow-xl hover:shadow-[#4F46E5]/20'}`}
          >
            {currentQuestion + 1 === quizData.questions.length ? 'Finalize Quiz' : 'Continue' }
             <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default QuizAttempt;
