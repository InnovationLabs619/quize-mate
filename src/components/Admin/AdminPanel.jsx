import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Settings, Users, BookOpen, LayoutDashboard, ChevronRight, Loader2, Share2, Info, Activity, Wand2, CheckCircle2, XCircle, Trophy, Clock, Calendar } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { v4 as uuidv4 } from 'uuid';
import { supabase } from '../../lib/supabase';

const AdminPanel = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showLiveStatus, setShowLiveStatus] = useState(false);
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [liveSessions, setLiveSessions] = useState([]);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [newQuizData, setNewQuizData] = useState({
    title: '',
    category: 'Maths',
    difficulty: 'Medium',
    duration: 60,
    questions: []
  });
  const [manualQuestion, setManualQuestion] = useState({ 
    text: '', 
    type: 'mcq', 
    options: ['', '', '', ''], 
    correct: 0,
    testCases: [{ input: '', output: '' }] 
  });

  const subjects = ['Maths', 'Cloud Management', 'DAA', 'C', 'C++', 'Java', 'Python'];

  useEffect(() => {
    const fetchQuizzes = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('quizzes')
          .select('*')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setQuizzes(data || []);
      } catch (err) {
        console.error('Error fetching quizzes:', err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchQuizzes();

    const quizSubscription = supabase
      .channel('admin_quiz_panel')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
        fetchQuizzes();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'live_sessions' }, (payload) => {
        setLiveSessions(prev => {
          const filtered = prev.filter(s => s.user_id !== payload.new.user_id);
          return [...filtered, payload.new];
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(quizSubscription);
    };
  }, []);

  const handleGenerateQuiz = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      
      const quizId = uuidv4();
      
      // 1. Create Quiz Header with Scheduling
      const { error: quizError } = await supabase.from('quizzes').insert({
        id: quizId,
        title: newQuizData.title || `${newQuizData.category} Pro Contest`,
        category: newQuizData.category,
        difficulty: newQuizData.difficulty,
        creator_id: user.id,
        start_time: newQuizData.startTime || new Date().toISOString(),
        duration_minutes: newQuizData.duration
      });

      if (quizError) throw new Error(`Quiz Header Fail: ${quizError.message}`);

      const finalQuestions = newQuizData.questions.length > 0 
        ? newQuizData.questions 
        : [
            { text: `What is the time complexity of a binary search?`, opts: ['O(n)', 'O(log n)', 'O(n^2)', 'O(1)'], correct: 1 },
            { text: `Which protocol is primarily used for Cloud Management APIs?`, opts: ['FTP', 'REST', 'SMTP', 'POP3'], correct: 1 },
            { text: `In ${newQuizData.category}, which keyword is used to define a constant?`, opts: ['var', 'let', 'const', 'static'], correct: 2 },
            { text: `What is the main purpose of the ${newQuizData.category} runtime?`, opts: ['Scheduling', 'Execution', 'Debugging', 'Compiling'], correct: 1 }
          ].slice(0, newQuizData.numQuestions);

      for (let i = 0; i < finalQuestions.length; i++) {
        const qSeed = finalQuestions[i];
        const questionId = uuidv4();

        const { error: qError } = await supabase.from('questions').insert({
          id: questionId,
          quiz_id: quizId,
          question_text: qSeed.text,
          type: qSeed.type || 'mcq',
          test_cases: qSeed.testCases || null,
          points: 10
        });

        if (qError) throw new Error(`Question ${i+1} Fail: ${qError.message}`);

        if (qSeed.type !== 'programming') {
          const optionsToInsert = qSeed.opts.map((opt, idx) => ({
            question_id: questionId,
            option_text: opt,
            is_correct: idx === qSeed.correct,
            explanation: `Correct choice for ${qSeed.text}.`
          }));

          const { error: optError } = await supabase.from('options').insert(optionsToInsert);
          if (optError) throw new Error(`Options for Q${i+1} Fail: ${optError.message}`);
        }
      }

      setShowCreateModal(false);
      setNewQuizData({ ...newQuizData, questions: [] });
      const { data: freshQuizzes } = await supabase.from('quizzes').select('*').order('created_at', { ascending: false });
      setQuizzes(freshQuizzes || []);
      alert('Contest Created & Published Successfully!');
    } catch (e) {
      console.error("Generation error:", e.message);
      alert(`Generation Failed: ${e.message}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteQuiz = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz?')) return;
    try {
      setLoading(true);
      const { error } = await supabase.from('quizzes').delete().eq('id', id);
      if (error) throw error;
      setQuizzes(prev => prev.filter(q => q.id !== id));
      alert('Quiz deleted.');
    } catch (err) {
      alert('Delete failed: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const shareQuiz = (token) => {
    const url = `${window.location.origin}/join/${token}`;
    navigator.clipboard.writeText(url);
    alert('Share link copied!');
  };

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#050510] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#4F46E5] animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-gray-100 p-4 md:p-8 pt-24 transition-colors overflow-x-hidden">
      {/* Sidebar - More Compact */}
      <aside className="w-20 lg:w-72 pr-0 lg:pr-8 hidden md:block">
        <div className="space-y-4 sticky top-24">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'quizzes', label: 'Contests', icon: BookOpen },
            { id: 'stats', label: 'Analytics', icon: Users },
            { id: 'settings', label: 'System', icon: Settings }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center justify-center lg:justify-between px-4 lg:px-6 py-4 rounded-2xl text-sm font-bold transition-all ${activeTab === tab.id ? 'bg-[#4F46E5] text-white shadow-lg' : 'bg-[#111122]/50 hover:bg-[#111122] border border-[#222244] text-gray-400'}`}
            >
              <span className="flex items-center gap-3"><tab.icon className="w-5 h-5" /> <span className="hidden lg:inline">{tab.label}</span></span>
              <ChevronRight className="w-4 h-4 hidden lg:inline" />
            </button>
          ))}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 space-y-8 max-w-full">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-black mb-1 tracking-tighter uppercase italic">Control Center</h1>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest leading-relaxed">High-Performance Competitive Sandbox</p>
          </div>
          <button 
            onClick={() => setShowCreateModal(true)}
            className="w-full sm:w-auto px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all hover:scale-105 shadow-xl"
          >
             <Plus className="w-5 h-5" /> CREATE CONTEST
          </button>
        </div>

        {/* Catalog - More Compact Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {quizzes.length === 0 ? (
            <div className="col-span-full py-20 bg-[#111122] rounded-3xl border-2 border-dashed border-[#222244] flex flex-col items-center justify-center text-gray-600">
               <BookOpen className="w-12 h-12 mb-4 opacity-10" />
               <p className="font-black uppercase tracking-widest text-xs">Sandbox Empty</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="group flex flex-col p-6 rounded-3xl bg-[#0a0a1a] border border-[#1a1a3a] hover:border-[#4F46E5] transition-all relative overflow-hidden shadow-2xl">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest bg-[#4F46E5]/10 text-[#4F46E5] border border-[#4F46E5]/20">
                      {quiz.category}
                    </span>
                    <div className="flex gap-1">
                       <button onClick={() => shareQuiz(quiz.share_token)} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-white transition-colors"><Share2 className="w-3.5 h-3.5" /></button>
                       <button onClick={() => handleDeleteQuiz(quiz.id)} className="p-2 bg-white/5 rounded-lg text-gray-500 hover:text-red-500 transition-colors"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>

                  <h3 className="text-lg font-black mb-1 line-clamp-1 group-hover:text-[#4F46E5] transition-colors">{quiz.title}</h3>
                  <div className="flex items-center gap-3 text-[10px] text-gray-500 font-bold mb-6">
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-[#4F46E5]" /> {quiz.duration_minutes}m</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-[#4F46E5]" /> {new Date(quiz.start_time).toLocaleDateString()}</span>
                  </div>

                  <div className="mt-auto pt-4 border-t border-white/5 flex justify-between items-center text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    <div className="flex items-center gap-1.5"><span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse" /> LIVE</div>
                    <button onClick={() => { setActiveQuiz(quiz); setShowLiveStatus(true); }} className="text-[#4F46E5] hover:underline">Telemetric Insights</button>
                  </div>
              </div>
            ))
          )}
        </div>

        {/* Scheduler Modal */}
        <AnimatePresence>
          {showCreateModal && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={() => setShowCreateModal(false)} />
               <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }} className="relative w-full max-w-lg bg-[#050510] border border-white/10 p-8 rounded-[2rem] shadow-2xl">
                 <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-[#4F46E5] rounded-xl shadow-lg shadow-indigo-500/20"><Calendar className="w-6 h-6 text-white" /></div>
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">Scheduler</h2>
                 </div>

                 <div className="space-y-4">
                    <div>
                        <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Contest Title</label>
                        <input type="text" value={newQuizData.title} onChange={(e) => setNewQuizData({...newQuizData, title: e.target.value})} placeholder="e.g. Algo-Sprint 2024" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none focus:border-[#4F46E5] transition-all font-bold text-sm" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Contest Launch</label>
                           <input type="datetime-local" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none font-bold text-xs" onChange={(e) => setNewQuizData({...newQuizData, startTime: e.target.value})} />
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Duration (Min)</label>
                           <input type="number" placeholder="60" className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none font-bold text-sm" onChange={(e) => setNewQuizData({...newQuizData, duration: parseInt(e.target.value)})} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                           <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Domain</label>
                           <select value={newQuizData.category} onChange={(e) => setNewQuizData({...newQuizData, category: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none font-bold text-sm">
                              {subjects.map(s => <option key={s} value={s}>{s}</option>)}
                           </select>
                        </div>
                        <div>
                           <label className="text-[10px] font-black uppercase text-gray-500 mb-1.5 block tracking-widest">Difficulty</label>
                           <select value={newQuizData.difficulty} onChange={(e) => setNewQuizData({...newQuizData, difficulty: e.target.value})} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white outline-none font-bold text-sm">
                              <option value="Easy">Easy</option><option value="Medium">Medium</option><option value="Hard">Hard</option>
                           </select>
                        </div>
                    </div>
                    <div className="flex flex-col gap-4 p-4 border-t border-[#4F46E5]/20 bg-indigo-500/5 rounded-2xl italic">
                       <div className="flex justify-between items-center mb-2">
                          <label className="text-[10px] font-black uppercase text-gray-500 tracking-widest">Question Architect</label>
                          <div className="flex bg-black/40 p-1 rounded-lg border border-white/5">
                             {['mcq', 'programming'].map(t => (
                               <button 
                                 key={t}
                                 onClick={() => setManualQuestion({...manualQuestion, type: t})}
                                 className={`px-3 py-1 rounded-md text-[9px] font-black uppercase transition-all ${manualQuestion.type === t ? 'bg-[#4F46E5] text-white' : 'text-gray-500 hover:text-white'}`}
                               >
                                 {t}
                               </button>
                             ))}
                          </div>
                       </div>

                       <div className="flex-1">
                          <textarea 
                            value={manualQuestion.text} 
                            onChange={(e) => setManualQuestion({...manualQuestion, text: e.target.value})} 
                            placeholder={manualQuestion.type === 'mcq' ? "Type question..." : "Enter problem statement (e.g. Print a 4x4 Star Pattern)..."} 
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white text-sm min-h-[80px] outline-none focus:border-[#4F46E5]" 
                          />
                          
                          {manualQuestion.type === 'mcq' ? (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                               {manualQuestion.options.map((opt, idx) => (
                                 <input key={idx} type="text" value={opt} onChange={(e) => {
                                   const newOpts = [...manualQuestion.options];
                                   newOpts[idx] = e.target.value;
                                   setManualQuestion({...manualQuestion, options: newOpts});
                                 }} placeholder={`Option ${idx+1}`} className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white" />
                               ))}
                            </div>
                          ) : (
                            <div className="mt-3 space-y-2">
                               <p className="text-[9px] font-black uppercase text-[#4F46E5] tracking-widest">Expected Test Case</p>
                               <div className="grid grid-cols-2 gap-2">
                                  <input 
                                    type="text" 
                                    placeholder="Input (Optional)" 
                                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                                    onChange={(e) => {
                                      const tc = [...manualQuestion.testCases];
                                      tc[0].input = e.target.value;
                                      setManualQuestion({...manualQuestion, testCases: tc});
                                    }}
                                  />
                                  <input 
                                    type="text" 
                                    placeholder="Expected Output" 
                                    className="bg-white/5 border border-white/10 rounded-lg p-2 text-xs text-white"
                                    onChange={(e) => {
                                      const tc = [...manualQuestion.testCases];
                                      tc[0].output = e.target.value;
                                      setManualQuestion({...manualQuestion, testCases: tc});
                                    }}
                                  />
                               </div>
                            </div>
                          )}
                       </div>
                       <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                          <span className="text-[10px] text-gray-500 font-bold">{newQuizData.questions.length} TOTAL IN POOL</span>
                          <button onClick={() => {
                            if(!manualQuestion.text) return;
                            setNewQuizData({
                              ...newQuizData,
                              questions: [...newQuizData.questions, { 
                                text: manualQuestion.text, 
                                type: manualQuestion.type,
                                opts: manualQuestion.type === 'mcq' ? manualQuestion.options : null, 
                                correct: 0,
                                testCases: manualQuestion.type === 'programming' ? manualQuestion.testCases : null
                              }]
                            });
                            setManualQuestion({ 
                              text: '', 
                              type: manualQuestion.type, 
                              options: ['', '', '', ''], 
                              correct: 0,
                              testCases: [{ input: '', output: '' }]
                            });
                          }} className="px-6 py-2 bg-[#4F46E5] rounded-xl text-white font-black text-[10px] uppercase">INSERT TO CONTEST</button>
                       </div>
                    </div>

                    <button onClick={handleGenerateQuiz} className="w-full py-5 bg-white text-black font-black rounded-2xl text-lg shadow-2xl hover:bg-gray-200 transition-all mt-6 uppercase tracking-tighter italic">Launch Contest</button>
                 </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>

        {/* Live Sidepanel - Compact Personnel tracking */}
        <AnimatePresence>
          {showLiveStatus && (
            <div className="fixed inset-0 z-[100] flex justify-end">
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLiveStatus(false)} />
               <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 20 }} className="relative w-full max-w-xl bg-[#0a0a1a] shadow-2xl p-8 border-l border-white/10 h-screen overflow-y-auto">
                  <div className="flex justify-between items-center mb-8 pb-4 border-b border-white/5">
                     <div className="flex items-center gap-3">
                        <Activity className="w-5 h-5 text-indigo-500" />
                        <h2 className="text-xl font-black italic uppercase tracking-tighter underline decoration-[#4F46E5]">Live Telemetry</h2>
                     </div>
                     <button onClick={() => setShowLiveStatus(false)} className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest">Close [Esc]</button>
                  </div>

                  <div className="space-y-4">
                     {liveSessions.filter(s => s.quiz_id === activeQuiz?.id).length === 0 ? (
                       <div className="py-20 text-center opacity-20"><p className="font-black text-xs uppercase tracking-widest">Awaiting Candidates...</p></div>
                     ) : (
                        liveSessions
                          .filter(s => s.quiz_id === activeQuiz?.id)
                          .sort((a, b) => b.current_score - a.current_score)
                          .map((session, idx) => (
                          <motion.div layout key={session.user_id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between">
                             <div className="flex items-center gap-3">
                                <span className="text-xs font-black text-[#4F46E5]">{idx + 1}</span>
                                <div>
                                   <p className="font-black text-white text-sm tracking-tight capitalize">USER_{session.user_id.slice(0, 4)}</p>
                                   <p className="text-[9px] font-bold text-gray-500 uppercase tracking-widest">{session.status} | Q{session.current_question_index + 1}</p>
                                </div>
                             </div>
                             <p className="text-lg font-black text-[#4F46E5]">{session.current_score} XP</p>
                          </motion.div>
                        ))
                     )}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default AdminPanel;
