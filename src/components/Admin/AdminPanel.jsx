import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Edit2, Settings, Users, BookOpen, LayoutDashboard, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const AdminPanel = () => {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial Fetch
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

    // 2. Real-time Subscription
    const quizSubscription = supabase
      .channel('public:quizzes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'quizzes' }, () => {
        fetchQuizzes();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(quizSubscription);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#4F46E5] animate-spin" />
    </div>
  );

  return (
    <div className="flex min-h-screen bg-[#050510] text-gray-100 p-8 pt-24">
      {/* Sidebar Navigation */}
      <aside className="w-72 pr-8 hidden lg:block">
        <div className="space-y-4">
          <button className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#4F46E5] text-sm font-bold shadow-[0_0_20px_rgba(79,70,229,0.3)] transition-all">
            <span className="flex items-center gap-3"><LayoutDashboard className="w-5 h-5" /> Dashboard</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#111122]/50 hover:bg-[#111122] border border-[#222244] text-gray-400 hover:text-white text-sm font-bold transition-all group">
            <span className="flex items-center gap-3"><BookOpen className="w-5 h-5 group-hover:text-[#4F46E5] transition-colors" /> Manage Quizzes</span>
            <ChevronRight className="w-4 h-4" />
          </button>
          
          <button className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#111122]/50 hover:bg-[#111122] border border-[#222244] text-gray-400 hover:text-white text-sm font-bold transition-all group">
            <span className="flex items-center gap-3"><Users className="w-5 h-5 group-hover:text-[#4F46E5] transition-colors" /> User Statistics</span>
            <ChevronRight className="w-4 h-4" />
          </button>

          <button className="w-full flex items-center justify-between px-6 py-4 rounded-2xl bg-[#111122]/50 hover:bg-[#111122] border border-[#222244] text-gray-400 hover:text-white text-sm font-bold transition-all group">
            <span className="flex items-center gap-3"><Settings className="w-5 h-5 group-hover:text-[#4F46E5] transition-colors" /> Platform Settings</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 space-y-8">
        <div className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-black mb-2">Quiz Management</h1>
            <p className="text-gray-400">Add, edit, and organize challenges for your users.</p>
          </div>
          <button className="px-8 py-4 bg-white text-black font-black rounded-2xl flex items-center gap-2 hover:bg-gray-200 transition-all hover:scale-105 active:scale-95 shadow-xl">
             <div className="flex items-center gap-2"><Plus className="w-5 h-5" /> Live New Quiz</div>
          </button>
        </div>

        {/* Quiz Catalog Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {quizzes.length === 0 ? (
            <div className="col-span-full py-20 bg-[#111122] rounded-3xl border border-dashed border-[#222244] flex flex-col items-center justify-center text-gray-500">
               <BookOpen className="w-12 h-12 mb-4 opacity-20" />
               <p>No quizzes found. Create your first challenge!</p>
            </div>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} className="group flex flex-col p-6 rounded-3xl bg-[#111122] border border-[#222244] hover:border-[#4F46E5] transition-all relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-[#4F46E5]/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-[#4F46E5]/20 transition-colors" />
                  
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest bg-blue-500/10 text-blue-400`}>
                      {quiz.category || 'General'}
                    </span>
                    <div className="flex gap-2">
                      <button className="p-2 bg-gray-900 rounded-lg hover:text-blue-400 transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={async () => {
                           if(confirm('Are you sure you want to delete this quiz?')) {
                             await supabase.from('quizzes').delete().eq('id', quiz.id);
                           }
                        }}
                        className="p-2 bg-gray-900 rounded-lg hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold mb-2 group-hover:text-[#4F46E5] transition-colors">{quiz.title}</h3>
                  <p className="text-xs text-gray-500 mb-8 font-medium">Difficulty: {quiz.difficulty}</p>

                  <div className="mt-auto pt-6 border-t border-[#222244] flex justify-between items-center text-xs font-bold text-gray-400 uppercase tracking-widest">
                    <span>Active Live Sync</span>
                    <button className="text-[#4F46E5] hover:underline cursor-pointer">View Analytics</button>
                  </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminPanel;
