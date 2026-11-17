'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface MusicRecord {
  id: number;
  title: string;
  subtitle: string;
  image: string;
  memo: string;
  created_at: string;
}

interface MixtapeItem {
  id: number;
  title: string;
  description: string;
  format: 'cassette' | 'vinyl';
  created_at: string;
}

export default function UserProfilePage() {
  const params = useParams();
  const userId = params?.id as string;

  const [username, setUsername] = useState<string>('Archiver');
  const [records, setRecords] = useState<MusicRecord[]>([]);
  const [mixtapes, setMixtapes] = useState<MixtapeItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    const fetchUserProfileData = async () => {
      try {
        // 1. 사용자 닉네임 가져오기
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', userId)
          .maybeSingle();

        if (profileData?.username) {
          setUsername(profileData.username);
        }

        // 2. 해당 유저의 음악 아카이브 가져오기
        const { data: recordsData } = await supabase
          .from('culture_records')
          .select('*')
          .eq('user_id', userId)
          .eq('category', 'music')
          .order('created_at', { ascending: false });

        setRecords(recordsData || []);

        // 3. 해당 유저의 믹스테이프 가져오기
        const { data: mixtapesData } = await supabase
          .from('mixtapes')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false });

        setMixtapes(mixtapesData || []);
      } catch (err) {
        console.error('Error fetching user profile:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfileData();
  }, [userId]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-500 flex items-center justify-center text-sm">Loading profile...</div>;
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-neutral-400 hover:text-white text-sm font-medium">&larr; Back to Main</Link>
          <span className="text-xs text-neutral-500 font-mono">User Profile ID: {userId.slice(0, 8)}...</span>
        </div>

        {/* 프로필 헤더 카드 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl mb-10 flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center text-3xl shadow-inner">
            🎧
          </div>
          <div className="text-center sm:text-left">
            <h1 className="text-2xl font-extrabold text-white mb-1">@{username}</h1>
            <p className="text-xs text-neutral-400">
              Exploring music tastes with <span className="text-white font-bold">{records.length}</span> archives and <span className="text-white font-bold">{mixtapes.length}</span> mixtapes.
            </p>
          </div>
        </div>

        {/* 1. Mixtapes Section */}
        <div className="mb-12">
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Mixtapes Collection</h2>
          {mixtapes.length === 0 ? (
            <p className="text-xs text-neutral-600 bg-neutral-900/40 border border-neutral-800/60 p-6 rounded-2xl text-center">No mixtapes published yet.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {mixtapes.map((mix) => (
                <Link key={mix.id} href={`/mixtape/${mix.id}`} className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 hover:border-neutral-700 transition block">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xl">{mix.format === 'cassette' ? '📼' : '💿'}</span>
                    <span className="text-[10px] uppercase font-bold px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300">
                      {mix.format}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold text-white mb-1">{mix.title}</h3>
                  {mix.description && <p className="text-xs text-neutral-400 line-clamp-2">"{mix.description}"</p>}
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* 2. Music Archives Section */}
        <div>
          <h2 className="text-sm font-bold text-neutral-400 uppercase tracking-wider mb-4">Music Archives</h2>
          {records.length === 0 ? (
            <p className="text-xs text-neutral-600 bg-neutral-900/40 border border-neutral-800/60 p-6 rounded-2xl text-center">No music records found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {records.map((item) => (
                <div key={item.id} className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden shadow-lg flex flex-col">
                  <div className="aspect-square bg-neutral-950">
                    {item.image ? (
                      <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">No Image</div>
                    )}
                  </div>
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="text-xs font-bold text-white mb-1">{item.title}</h3>
                      <p className="text-[10px] text-neutral-400 mb-2">🎤 {item.subtitle}</p>
                      {item.memo && <p className="text-[11px] text-neutral-300 bg-neutral-950 p-2.5 rounded-xl border border-neutral-800/60 line-clamp-2">{item.memo}</p>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}