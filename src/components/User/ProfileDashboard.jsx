import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Flame, Trophy, CheckCircle2, Share2, Medal, Loader2 } from 'lucide-react';

const ProfileDashboard = () => {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState({ attempts: 0, points: 0, streak: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Fetch Profile
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        setProfile(profileData);

        // 2. Fetch Stats
        const { count } = await supabase
          .from('attempts')
          .select('*', { count: 'exact', head: true })
          .eq('user_id', user.id);

        setStats({
          attempts: count || 0,
          points: profileData?.total_xp || 0,
          streak: profileData?.streak_count || 0
        });

      } catch (err) {
        console.error('Error fetching dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Real-time listener for profile updates (XP/Streaks)
    const subscription = supabase
      .channel('profile_updates')
      .on('postgres_changes', { 
        event: 'UPDATE', 
        schema: 'public', 
        table: 'profiles' 
      }, (payload) => {
        if (profile && payload.new.id === profile.id) {
          setProfile(payload.new);
          setStats(prev => ({
            ...prev,
            points: payload.new.total_xp,
            streak: payload.new.streak_count
          }));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-white dark:bg-[#050510] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#4F46E5] animate-spin" />
    </div>
  );

  const mockPerformance = [
    { date: 'Mar 18', solved: 4 },
    { date: 'Mar 19', solved: 7 },
    { date: 'Mar 20', solved: 5 },
    { date: 'Mar 21', solved: 10 },
    { date: 'Mar 22', solved: 12 },
    { date: 'Mar 23', solved: 8 },
    { date: 'Mar 24', solved: 15 },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-[#050510] text-gray-900 dark:text-gray-100 p-8 pt-24 transition-colors">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* User Header */}
        <div className="flex items-center gap-6 mb-12">
           <div className="w-20 h-20 bg-gradient-to-tr from-[#4F46E5] to-purple-600 rounded-3xl flex items-center justify-center text-3xl font-black shadow-2xl rotate-3">
             {profile?.username?.[0]?.toUpperCase() || 'U'}
           </div>
           <div>
             <h1 className="text-4xl font-black tracking-tighter uppercase">{profile?.username || 'User'}</h1>
             <p className="text-gray-500 font-medium">Level {Math.floor((profile?.total_xp || 0) / 1000) + 1} Challenger</p>
           </div>
        </div>

        {/* User Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-[#111122] rounded-2xl p-6 border border-gray-100 dark:border-[#222244] flex items-center justify-between group hover:border-orange-500/50 transition-all shadow-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Current Streak</p>
              <h3 className="text-3xl font-black text-orange-500">{stats.streak} Days</h3>
            </div>
            <div className="bg-orange-500/10 p-4 rounded-2xl border border-orange-500/20 group-hover:scale-110 transition-transform">
              <Flame className="w-8 h-8 text-orange-500 fill-orange-500/20" />
            </div>
          </div>
          
          <div className="bg-white dark:bg-[#111122] rounded-2xl p-6 border border-gray-100 dark:border-[#222244] flex items-center justify-between group hover:border-blue-500/50 transition-all shadow-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Quizzes Completed</p>
              <h3 className="text-3xl font-black text-blue-500 dark:text-blue-400">{stats.attempts}</h3>
            </div>
            <div className="bg-blue-500/10 p-4 rounded-2xl border border-blue-500/20 group-hover:scale-110 transition-transform">
              <CheckCircle2 className="w-8 h-8 text-blue-500 dark:text-blue-400 fill-blue-500/20" />
            </div>
          </div>

          <div className="bg-white dark:bg-[#111122] rounded-2xl p-6 border border-gray-100 dark:border-[#222244] flex items-center justify-between group hover:border-yellow-500/50 transition-all shadow-sm">
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total XP</p>
              <h3 className="text-3xl font-black text-yellow-500">{stats.points.toLocaleString()}</h3>
            </div>
            <div className="bg-yellow-500/10 p-4 rounded-2xl border border-yellow-500/20 group-hover:scale-110 transition-transform">
              <Trophy className="w-8 h-8 text-yellow-500 fill-yellow-500/20" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Graph */}
          <div className="lg:col-span-2 bg-white dark:bg-[#111122] rounded-[2.5rem] p-10 border border-gray-100 dark:border-[#222244] shadow-sm">
            <h2 className="text-xl font-black mb-8 flex items-center gap-3 uppercase tracking-tight">
              Learning Velocity <span className="text-[10px] font-black text-indigo-500 px-3 py-1 bg-indigo-50 dark:bg-indigo-500/10 rounded-full border border-indigo-100 dark:border-indigo-500/20 uppercase">XP Gain</span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformance}>
                  <defs>
                    <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--chart-primary)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--chart-primary)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--chart-grid)" vertical={false} />
                  <XAxis dataKey="date" stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis domain={[0, 'auto']} stroke="var(--chart-text)" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'var(--chart-tooltip-bg)', 
                      backdropFilter: 'blur(10px)',
                      borderColor: 'var(--chart-tooltip-border)', 
                      borderRadius: '16px',
                      boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
                      borderWidth: '1px'
                    }} 
                    itemStyle={{ color: 'var(--chart-primary)', fontWeight: 'bold' }} 
                  />
                  <Area type="monotone" dataKey="solved" stroke="var(--chart-primary)" strokeWidth={4} fillOpacity={1} fill="url(#colorSolved)" animationDuration={2000} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Achievements Summary */}
          <div className="bg-white dark:bg-[#111122] rounded-[2.5rem] p-10 border border-gray-100 dark:border-[#222244] shadow-sm">
            <h2 className="text-xl font-black mb-8 uppercase tracking-tight">Recent Status</h2>
            <div className="space-y-6">
              <div className="p-8 rounded-[2rem] bg-gray-50 dark:bg-[#0a0a1a] border border-gray-100 dark:border-[#222244] hover:scale-[1.02] transition-transform">
                 <p className="text-gray-400 dark:text-gray-500 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">Current Rank</p>
                 <h4 className="text-3xl font-black text-gray-900 dark:text-white">#12 <span className="text-indigo-500">GLOBAL</span></h4>
              </div>
              <div className="p-8 rounded-[2rem] bg-gray-50 dark:bg-[#0a0a1a] border border-gray-100 dark:border-[#222244] hover:scale-[1.02] transition-transform">
                 <p className="text-gray-400 dark:text-gray-500 text-[10px] mb-2 uppercase tracking-[0.2em] font-black">Efficiency</p>
                 <h4 className="text-3xl font-black text-emerald-500">84%</h4>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileDashboard;
