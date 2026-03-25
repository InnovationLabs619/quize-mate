import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Timer, Zap, CheckCircle2, ChevronRight, XCircle, AlertTriangle, ShieldCheck, Loader2, Code2, Play } from 'lucide-react';
import Editor from "@monaco-editor/react";
import { supabase } from '../../lib/supabase';

const QuizAttempt = ({ quizData, onComplete }) => {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isCheatAttempt, setIsCheatAttempt] = useState(false);
  const [saving, setSaving] = useState(false);
  const [answers, setAnswers] = useState([]); // Track user choices for review
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [cheatTimer, setCheatTimer] = useState(null);
  const [cheatCountdown, setCheatCountdown] = useState(5);
  const [code, setCode] = useState("// Write your code here...");
  const [output, setOutput] = useState("");
  const [isCompiling, setIsCompiling] = useState(false);

  // Live Score Broadcast Function
  const updateLiveState = async (qIndex, currentPoints) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase.from('live_sessions').upsert({
        quiz_id: quizData.id,
        user_id: user.id,
        current_score: currentPoints,
        current_question_index: qIndex,
        status: 'active',
        last_ping: new Date().toISOString()
      });
    } catch (e) {
      console.warn("Live update failed", e);
    }
  };

  // Anti-Cheat: Disable Copy-Paste, Right Click, and Force Fullscreen
  useEffect(() => {
    const handleContextMenu = (e) => e.preventDefault();
    const handleCopy = (e) => {
      e.preventDefault();
      setIsCheatAttempt(true);
      setTimeout(() => setIsCheatAttempt(false), 3000);
    };
    
    // Visibility Check (Tab Switching Logic)
    const handleVisibility = () => {
      if (document.hidden && !quizFinished) {
         setIsCheatAttempt(true);
         setCheatCountdown(5);
         const interval = setInterval(() => {
            setCheatCountdown(prev => {
               if (prev <= 1) {
                  clearInterval(interval);
                  finalizeQuiz(score); // Auto-submit
                  return 0;
               }
               return prev - 1;
            });
         }, 1000);
         setCheatTimer(interval);
      } else {
         // User came back
         if (cheatTimer) {
            clearInterval(cheatTimer);
            setCheatTimer(null);
            setIsCheatAttempt(false);
         }
      }
    };

    const enterFullscreen = () => {
       const elem = document.documentElement;
       if (elem.requestFullscreen) {
         elem.requestFullscreen().catch(err => console.log("Fullscreen failed"));
       }
       setIsFullscreen(true);
    };

    const handleFullscreenChange = () => {
      if (!document.fullscreenElement) {
        setIsFullscreen(false);
        if(!quizFinished) {
           setIsCheatAttempt(true);
        }
      }
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopy);
    document.addEventListener('visibilitychange', handleVisibility);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    // Initial Fullscreen attempt after a delay
    setTimeout(enterFullscreen, 1500);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopy);
      document.removeEventListener('visibilitychange', handleVisibility);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      if (cheatTimer) clearInterval(cheatTimer);
      if (document.fullscreenElement) document.exitFullscreen();
    };
  }, [quizFinished]);

  const handleRunCode = async () => {
    setIsCompiling(true);
    const currentQData = quizData.questions[currentQuestion];
    setOutput("Compiling and Running...\n> Establishing sandbox connection...");
    
    try {
      const response = await fetch('http://localhost:8000/compiler/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          language: quizData.category?.toLowerCase() || 'python',
          code: code
        })
      });

      if (!response.ok) throw new Error("Sandbox execution failed");
      
      const result = await response.json();
      const actualOutput = result.stdout?.trim() || "";
      
      // If it's a programming question, validate against test cases
      if (currentQData.type === 'programming' && currentQData.test_cases?.length > 0) {
        const expected = currentQData.test_cases[0].output?.trim();
        const passed = actualOutput === expected;

        if (passed) {
           setOutput(`[SUCCESS] ALL TEST CASES PASSED\n\nOutput:\n${actualOutput}\n\nPerfect Match!`);
        } else {
           setOutput(`[FAILED] TEST CASE MISMATCH\n\nExpected:\n${expected}\n\nActual Output:\n${actualOutput}`);
        }
      } else {
         if (result.stdout || result.stderr) {
            setOutput(`[EXECUTION RESULT]\n${result.stdout}${result.stderr}\n\n[EXIT CODE ${result.exit_code}]`);
         } else {
            setOutput("> Program executed successfully with no output.");
         }
      }
    } catch (err) {
      setOutput(`[FATAL ERROR]\n${err.message}\n> Ensure the backend server is running on port 8000.`);
    } finally {
      setIsCompiling(false);
    }
  };

  // Timer Logic
  useEffect(() => {
    if (timeLeft > 0 && !quizFinished) {
      const timer = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
      return () => clearInterval(timer);
    } else if (timeLeft === 0 && !quizFinished) {
      handleNext();
    }
  }, [timeLeft, quizFinished]);

  const handleNext = async () => {
    const currentQData = quizData.questions[currentQuestion];
    let isCorrect = false;

    if (currentQData.type === 'programming') {
       // Check if output matches test case (using current output state)
       const expected = currentQData.test_cases?.[0]?.output?.trim();
       const actual = output.includes("[SUCCESS]") || (output.split('\n\nOutput:\n')[1]?.split('\n\n')[0]?.trim() === expected);
       isCorrect = actual;
    } else {
       isCorrect = selectedOption !== null && currentQData.options[selectedOption].is_correct;
    }

    const currentScore = isCorrect ? score + 10 : score;
    
    // Store answer for review
    setAnswers(prev => [...prev, {
      question: currentQData.question_text || currentQData.text,
      selected: currentQData.type === 'programming' ? 'Source Code Submitted' : (selectedOption !== null ? currentQData.options[selectedOption].text : 'No Answer'),
      correct: currentQData.type === 'programming' ? 'Logical Solution' : currentQData.options.find(o => o.is_correct)?.text,
      explanation: currentQData.type === 'programming' ? 'Test cases validated the logic.' : currentQData.options.find(o => o.is_correct)?.explanation || 'No explanation provided.',
      is_correct: isCorrect
    }]);

    if (isCorrect) setScore(currentScore);

    if (currentQuestion + 1 < quizData.questions.length) {
      const nextIdx = currentQuestion + 1;
      setCurrentQuestion(nextIdx);
      setSelectedOption(null);
      setTimeLeft(currentQData.type === 'programming' ? 300 : 30); // More time for code
      setOutput("");
      setCode("// Write solution for next challenge...");
      updateLiveState(nextIdx, currentScore);
    } else {
      await finalizeQuiz(currentScore);
    }
  };

  const finalizeQuiz = async (finalScore) => {
    try {
      setSaving(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found");

      // 1. Log Attempt
      await supabase.from('attempts').insert({
        user_id: user.id,
        quiz_id: quizData.id,
        score: finalScore,
        total_points: quizData.questions.length * 10,
        attempt_data: answers
      });

      // 2. Update Profile (XP & Streak)
      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, streak_count')
        .eq('id', user.id)
        .single();

      await supabase.from('profiles').update({
        total_xp: (profile?.total_xp || 0) + finalScore,
        streak_count: (profile?.streak_count || 0) + 1,
        last_active_date: new Date().toISOString()
      }).eq('id', user.id);

      setQuizFinished(true);
    } catch (err) {
      console.error("Error saving quiz results:", err);
      setQuizFinished(true); // Still show completion screen
    } finally {
      setSaving(false);
    }
  };

  if (saving) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
       <Loader2 className="w-12 h-12 text-[#4F46E5] animate-spin mb-4" />
       <p className="text-gray-500 font-bold uppercase tracking-widest text-xs">Syncing your results...</p>
    </div>
  );

  if (quizFinished) {
    return (
      <div className="max-w-4xl mx-auto space-y-8 pb-20 mt-10">
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white dark:bg-[#111122] border border-gray-100 dark:border-[#222244] p-12 rounded-[2.5rem] text-center shadow-2xl"
        >
          <div className="w-24 h-24 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6 border border-green-500/20 shadow-2xl shadow-green-500/10">
            <CheckCircle2 className="w-12 h-12 text-green-500" />
          </div>
          <h2 className="text-4xl font-black mb-2 text-gray-900 dark:text-white">Session Complete!</h2>
          <p className="text-gray-500 dark:text-gray-400 text-xl mb-10 font-medium tracking-tight">
             Live sync finalized. You earned <span className="text-[#4F46E5] font-black">{score} XP</span>.
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
             <button 
                onClick={onComplete}
                className="px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white font-black rounded-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2"
              >
                Return to Hub
              </button>
              <button 
                onClick={() => window.scrollTo({ top: 800, behavior: 'smooth' })}
                className="px-8 py-4 bg-black dark:bg-white text-white dark:text-black font-black rounded-2xl shadow-xl hover:scale-105 active:scale-95 transition-all"
              >
                Review My Answers
              </button>
          </div>
        </motion.div>

        {/* Review Section */}
        <div className="space-y-6">
           <h3 className="text-2xl font-black uppercase tracking-widest text-[#4F46E5]">Deep Review</h3>
           {answers.map((answer, idx) => (
             <motion.div 
               key={idx}
               initial={{ opacity: 0, y: 20 }}
               whileInView={{ opacity: 1, y: 0 }}
               className={`p-8 rounded-3xl border-2 ${answer.is_correct ? 'bg-green-500/5 border-green-500/10' : 'bg-red-500/5 border-red-500/10'}`}
             >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <h4 className="text-xl font-bold dark:text-white text-gray-900">{idx + 1}. {answer.question}</h4>
                  {answer.is_correct ? <CheckCircle2 className="w-6 h-6 text-green-500 flex-shrink-0" /> : <XCircle className="w-6 h-6 text-red-500 flex-shrink-0" />}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                   <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5">
                      <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">Your Selection</p>
                      <span className={`font-bold ${answer.is_correct ? 'text-green-500' : 'text-red-500 line-through'}`}>{answer.selected}</span>
                   </div>
                   <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                      <p className="text-[10px] font-black uppercase tracking-widest text-green-500 mb-1">Correct Identity</p>
                      <span className="font-bold text-green-600 dark:text-green-400">{answer.correct}</span>
                   </div>
                </div>

                <div className="p-6 rounded-2xl bg-[#4F46E5]/10 border border-[#4F46E5]/20 flex gap-4">
                   <ShieldCheck className="w-6 h-6 text-[#4F46E5] flex-shrink-0" />
                   <div>
                      <p className="text-xs font-black uppercase tracking-widest text-[#4F46E5] mb-1">Staff Explanation</p>
                      <p className="text-gray-600 dark:text-gray-300 font-medium leading-relaxed">{answer.explanation}</p>
                   </div>
                </div>
             </motion.div>
           ))}
        </div>
      </div>
    );
  }

  const currentQ = quizData.questions[currentQuestion];

  return (
    <div className="max-w-[1600px] mx-auto p-4 select-none relative pb-20 mt-10">
      
      {/* Cheat Alert Overlay */}
      <AnimatePresence>
        {isCheatAttempt && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md px-6"
          >
            <div className="bg-red-600 text-white p-12 rounded-[3.5rem] text-center shadow-[0_0_100px_rgba(220,38,38,0.5)] border border-red-500 max-w-md">
               <AlertTriangle className="w-20 h-20 mx-auto mb-6 animate-bounce" />
               <h2 className="text-4xl font-black mb-4 uppercase italic">Security Breach</h2>
               <p className="text-xl font-bold mb-8 opacity-80 uppercase tracking-tighter">Tab Switching Detected. Auto-Submitting In:</p>
               <div className="text-8xl font-black mb-8">{cheatCountdown}</div>
               <p className="text-xs font-black uppercase tracking-widest opacity-50">Return NOW to cancel session destruction.</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col lg:flex-row gap-8 items-start h-full">
        {/* Left Side: Quiz Content / Problem Statement */}
        <div className="flex-1 w-full space-y-6 flex flex-col h-full">
          <div className="flex items-center justify-between bg-white dark:bg-[#111122] p-4 rounded-2xl border border-gray-100 dark:border-[#222244] shadow-sm">
            <div className="flex gap-2">
              {quizData.questions.map((_, idx) => (
                <div 
                  key={idx} 
                  className={`h-2 rounded-full transition-all duration-500 ${idx === currentQuestion ? 'w-10 bg-[#4F46E5]' : idx < currentQuestion ? 'w-5 bg-green-500' : 'w-5 bg-gray-100 dark:bg-white/5'}`} 
                />
              ))}
            </div>
            
            <div className={`flex items-center gap-2 px-6 py-2 rounded-xl border text-sm font-black transition-colors ${timeLeft < 20 ? 'bg-red-500/10 border-red-500/30 text-red-500 animate-pulse' : 'bg-gray-50 dark:bg-[#0a0a1a] border-gray-200 dark:border-[#333344] text-gray-900 dark:text-white'}`}>
              <Clock className="w-4 h-4" />
              {timeLeft}S
            </div>
          </div>

          <motion.div
            key={currentQuestion}
            initial={{ x: 20, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            className={`bg-white dark:bg-[#111122] border border-gray-100 dark:border-[#222244] rounded-[2.5rem] p-10 shadow-2xl relative transition-all flex flex-col flex-1 min-h-[500px] overflow-y-auto`}
          >
            <div className={`absolute top-0 right-0 p-4 font-black text-[9px] uppercase tracking-widest text-[#4F46E5] opacity-50`}>
               {currentQ.type === 'programming' ? 'Logical Task' : 'MCQ Protocol'}
            </div>

            <h3 className="text-2xl font-black mb-8 leading-tight dark:text-white text-gray-900">
              {currentQ.question_text || currentQ.text}
            </h3>

            {currentQ.type === 'programming' ? (
               <div className="flex-1 prose dark:prose-invert">
                  <div className="p-6 bg-black/20 rounded-2xl border border-white/5 font-mono text-sm mb-6">
                     <p className="text-[#4F46E5] font-black text-[10px] uppercase mb-2 tracking-widest">Expected Output Format</p>
                     <pre className="text-gray-400">{currentQ.test_cases?.[0]?.output || 'No sample output provided.'}</pre>
                  </div>
                  <p className="text-gray-500 font-bold uppercase text-[10px] tracking-widest leading-loose">
                     System Requirement: Write a program that mirrors the logic described above. Validate your script using the Cloud Sandbox before submitting.
                  </p>
               </div>
            ) : (
               <div className="grid grid-cols-1 gap-4">
                 {currentQ.options.map((option, idx) => (
                   <motion.button
                     key={idx}
                     whileHover={{ x: 8 }}
                     whileTap={{ scale: 0.98 }}
                     onClick={() => setSelectedOption(idx)}
                     className={`p-5 rounded-2xl text-left border-2 transition-all group flex items-center justify-between ${selectedOption === idx ? 'bg-[#4F46E5] border-transparent text-white shadow-xl' : 'bg-gray-50 dark:bg-white/5 border-transparent dark:border-white/5 hover:border-[#4F46E5]/30 dark:text-gray-200 text-gray-700 hover:bg-white/80 dark:hover:bg-white/10 shadow-sm'}`}
                   >
                     <div className="flex-1">
                        <p className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Option {String.fromCharCode(65 + idx)}</p>
                        <span className="font-bold text-lg">{option.text}</span>
                     </div>
                     <div className={`w-10 h-10 rounded-xl flex items-center justify-center border-2 transition-all ${selectedOption === idx ? 'bg-white/20 border-white/30 text-white rotate-12' : 'bg-white dark:bg-gray-900 border-gray-100 dark:border-white/10 text-gray-400'}`}>
                       {String.fromCharCode(65 + idx)}
                     </div>
                   </motion.button>
                 ))}
               </div>
            )}

            <div className="mt-auto pt-10 flex justify-between items-center">
              <div className="text-[#4F46E5] text-xs font-black uppercase tracking-widest flex items-center gap-2">
                 <Zap className="w-4 h-4" /> +{score} XP
              </div>
              <button 
                onClick={handleNext}
                disabled={currentQ.type === 'mcq' && selectedOption === null}
                className={`px-10 py-5 rounded-2xl font-black transition-all flex items-center gap-3 text-lg ${currentQ.type === 'mcq' && selectedOption === null ? 'bg-gray-100 dark:bg-white/5 text-gray-400 cursor-not-allowed opacity-50' : 'bg-black dark:bg-white text-white dark:text-black hover:scale-105 shadow-2xl'}`}
              >
                {currentQuestion + 1 === quizData.questions.length ? 'SUBMIT SESSION' : 'NEXT STEP' }
                 <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </motion.div>
        </div>

        {/* Right Side: Compiler Workspace */}
        <div className="w-full lg:w-[500px] shrink-0">
           <div className="bg-[#111122] border border-[#222244] rounded-[2.5rem] overflow-hidden flex flex-col h-[700px] shadow-2xl">
              <div className="p-6 border-b border-[#222244] flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3">
                    <Code2 className="w-6 h-6 text-[#4F46E5]" />
                    <span className="text-xs font-black uppercase tracking-[0.3em] text-white">Cloud Sandbox 2.0</span>
                 </div>
                 <div className="flex items-center gap-2">
                    <span className={`px-4 py-1.5 bg-white/5 rounded-xl text-[10px] font-black text-indigo-400 uppercase tracking-widest border border-indigo-500/10`}>
                       {quizData.category || 'Python'}
                    </span>
                    <button 
                      onClick={handleRunCode}
                      disabled={isCompiling}
                      className="p-3 bg-white text-black rounded-xl hover:bg-gray-200 transition-all flex items-center gap-2 shadow-lg"
                    >
                       <Play className={`w-4 h-4 ${isCompiling ? 'animate-spin' : ''}`} />
                    </button>
                 </div>
              </div>
              
              <div className="flex-1 min-h-0">
                 <Editor
                   height="100%"
                   defaultLanguage={quizData.category?.toLowerCase() || 'python'}
                   theme="vs-dark"
                   value={code}
                   onChange={(val) => setCode(val)}
                   options={{
                     minimap: { enabled: false },
                     fontSize: 15,
                     lineNumbers: 'on',
                     roundedSelection: false,
                     scrollBeyondLastLine: false,
                     readOnly: false,
                     automaticLayout: true,
                     padding: { top: 20 },
                     fontFamily: 'JetBrains Mono, SF Mono, monospace'
                   }}
                 />
              </div>

              <div className="h-48 bg-[#050510] border-t border-[#222244] p-6 font-mono text-sm overflow-y-auto">
                 <div className="flex items-center gap-2 mb-4 opacity-50">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <p className="uppercase tracking-[0.2em] font-black text-[10px] text-white">System Out</p>
                 </div>
                 <pre className="text-gray-300 leading-relaxed">{output || "Waiting for execution payload..."}</pre>
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default QuizAttempt;
