import React, { useEffect, useState } from 'react';
import { Trophy, Medal, Search, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

const Leaderboard = () => {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // 1. Initial Fetch
    const fetchRankings = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('profiles')
          .select('id, username, total_xp, streak_count, avatar_url')
          .order('total_xp', { ascending: false })
          .limit(50);

        if (error) throw error;
        setRankings(data || []);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();

    // 2. Real-time Subscription
    const profileSubscription = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
        fetchRankings(); // Re-fetch on any profile changes
      })
      .subscribe();

    return () => {
      supabase.removeChannel(profileSubscription);
    };
  }, []);

  if (loading) return (
    <div className="min-h-screen bg-[#050510] flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-[#4F46E5] animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#050510] text-gray-100 p-8 pt-24">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2 flex items-center gap-4">
              <Trophy className="w-10 h-10 text-yellow-500" />
              Live Leaderboard
            </h1>
            <p className="text-gray-400">Updates in real-time as users earn points!</p>
          </div>
          <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 text-green-500 rounded-full text-xs font-black animate-pulse flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full" /> LIVE UPDATES ACTIVE
          </div>
        </div>

        {/* Podium/Top 3 */}
        {rankings.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
            {rankings.slice(0, 3).map((player, idx) => (
              <div key={player.id} className={`relative flex flex-col items-center p-8 rounded-3xl border ${idx === 0 ? 'bg-gradient-to-b from-[#4F46E5]/20 to-transparent border-[#4F46E5]/40 scale-105' : 'bg-[#111122] border-[#222244]'}`}>
                <div className="relative mb-6">
                  <div className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl border-4 overflow-hidden ${idx === 0 ? 'border-yellow-500' : idx === 1 ? 'border-gray-400' : 'border-orange-600'}`}>
                    {player.avatar_url ? <img src={player.avatar_url} alt="" /> : '👤'}
                  </div>
                  <div className={`absolute -bottom-2 -right-2 w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl ${idx === 0 ? 'bg-yellow-500' : idx === 1 ? 'bg-gray-400' : 'bg-orange-600'}`}>
                    {idx + 1}
                  </div>
                </div>
                <h3 className="text-xl font-bold mb-1">{player.username}</h3>
                <p className="text-[#4F46E5] font-black text-2xl mb-4">{player.total_xp.toLocaleString()} XP</p>
                <div className="flex gap-4 text-xs text-gray-500 uppercase tracking-widest font-semibold">
                  <span>{player.streak_count}D Streak</span>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* List View */}
        <div className="bg-[#111122] rounded-3xl border border-[#222244] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-[#0a0a1a] text-gray-500 text-xs uppercase font-black tracking-widest">
                <tr>
                  <th className="px-8 py-4">Rank</th>
                  <th className="px-8 py-4">Player</th>
                  <th className="px-8 py-4">Points</th>
                  <th className="px-8 py-4">Best Streak</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#222244]">
                {rankings.map((player, idx) => (
                  <tr key={player.id} className="hover:bg-[#4F46E5]/5 transition-colors group">
                    <td className="px-8 py-6 font-bold text-gray-400 group-hover:text-white transition-colors">#{idx + 1}</td>
                    <td className="px-8 py-6 flex items-center gap-4">
                       <span className="font-bold">{player.username}</span>
                    </td>
                    <td className="px-8 py-6 text-[#4F46E5] font-black">{player.total_xp.toLocaleString()}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-orange-500 font-bold">
                        <TrendingUp className="w-4 h-4" /> {player.streak_count} days
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Leaderboard;
