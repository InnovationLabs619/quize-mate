import React from 'react';
import { supabase } from '../../lib/supabase';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { Flame, Trophy, CheckCircle2, Share2, Medal } from 'lucide-react';

const mockPerformance = [
  { date: 'Mar 18', solved: 4 },
  { date: 'Mar 19', solved: 7 },
  { date: 'Mar 20', solved: 5 },
  { date: 'Mar 21', solved: 10 },
  { date: 'Mar 22', solved: 12 },
  { date: 'Mar 23', solved: 8 },
  { date: 'Mar 24', solved: 15 },
];

const mockBadges = [
  { id: 1, name: 'Quick Learner', icon: <Medal className="w-6 h-6 text-yellow-400" />, level: 'Gold' },
  { id: 2, name: 'Streak Master', icon: <Flame className="w-6 h-6 text-orange-500" />, level: 'Silver' },
  { id: 3, name: 'Concept King', icon: <Trophy className="w-6 h-6 text-purple-500" />, level: 'Gold' },
];

const ProfileDashboard = () => {
  return (
    <div className="min-h-screen bg-[#050510] text-gray-100 p-8 pt-24">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* User Status Bar */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111122] rounded-2xl p-6 border border-[#222244] flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Longest Streak</p>
              <h3 className="text-3xl font-bold text-orange-500">24 Days</h3>
            </div>
            <div className="bg-orange-500/10 p-3 rounded-xl border border-orange-500/20">
              <Flame className="w-8 h-8 text-orange-500" />
            </div>
          </div>
          
          <div className="bg-[#111122] rounded-2xl p-6 border border-[#222244] flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Quizzes Completed</p>
              <h3 className="text-3xl font-bold text-blue-400">142</h3>
            </div>
            <div className="bg-blue-500/10 p-3 rounded-xl border border-blue-500/20">
              <CheckCircle2 className="w-8 h-8 text-blue-400" />
            </div>
          </div>

          <div className="bg-[#111122] rounded-2xl p-6 border border-[#222244] flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Points Earned</p>
              <h3 className="text-3xl font-bold text-yellow-500">12,450</h3>
            </div>
            <div className="bg-yellow-500/10 p-3 rounded-xl border border-yellow-500/20">
              <Trophy className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Performance Graph */}
          <div className="lg:col-span-2 bg-[#111122] rounded-3xl p-8 border border-[#222244]">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              Performance Timeline <span className="text-xs font-normal text-gray-500 px-2 py-1 bg-gray-800 rounded-full">Weekly</span>
            </h2>
            <div className="h-[300px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={mockPerformance}>
                  <defs>
                    <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#222244" vertical={false} />
                  <XAxis 
                    dataKey="date" 
                    stroke="#444466" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="#444466" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#111122', borderColor: '#222244', borderRadius: '12px' }}
                    itemStyle={{ color: '#fff' }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="solved" 
                    stroke="#4F46E5" 
                    strokeWidth={3}
                    fillOpacity={1} 
                    fill="url(#colorSolved)" 
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Badges Section */}
          <div className="bg-[#111122] rounded-3xl p-8 border border-[#222244]">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Earned Badges</h2>
              <button className="p-2 hover:bg-gray-800 rounded-full transition-colors">
                <Share2 className="w-5 h-5 text-gray-400" />
              </button>
            </div>
            <div className="space-y-4">
              {mockBadges.map((badge) => (
                <div key={badge.id} className="flex items-center gap-4 p-4 rounded-2xl bg-[#0a0a1a] border border-[#222244] hover:border-[#4F46E5]/50 transition-all cursor-pointer group">
                  <div className="p-3 bg-gray-900 rounded-xl group-hover:scale-110 transition-transform">
                    {badge.icon}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-semibold">{badge.name}</h4>
                    <p className="text-xs text-gray-500 uppercase tracking-wider">{badge.level} Badge</p>
                  </div>
                </div>
              ))}
            </div>
            <button className="w-full mt-6 py-4 rounded-2xl bg-gray-900 border border-gray-800 text-sm font-medium hover:bg-gray-800 transition-colors">
              View All Achievements
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileDashboard;
