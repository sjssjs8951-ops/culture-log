'use client';

import { useState, useEffect, useMemo } from 'react';
import { supabase } from './supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MusicRecord {
  id: number;
  user_id: string;
  title: string;
  subtitle: string; // 아티스트명
  image: string;
  memo: string;
  created_at: string;
  author_name?: string;
}

interface MixtapeItem {
  id: number;
  user_id: string;
  title: string;
  description: string;
  format: 'cassette' | 'vinyl';
  created_at: string;
  author_name?: string;
}

export default function MusicHomePage() {
  const [activeTab, setActiveTab] = useState<'archives' | 'mixtapes'>('archives');
  const [records, setRecords] = useState<MusicRecord[]>([]);
  const [mixtapes, setMixtapes] = useState<MixtapeItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [userNickname, setUserNickname] = useState<string>('');
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [onlyMyRecords, setOnlyMyRecords] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchData = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        setCurrentUserId(session.user.id);
        const { data: profileData } = await supabase
          .from('profiles')
          .select('username')
          .eq('id', session.user.id)
          .maybeSingle();

        setUserNickname(profileData?.username || session.user.email?.split('@')[0] || 'Melophile');
      }

      // 1. 프로필 맵 가져오기
      const { data: profilesData } = await supabase.from('profiles').select('id, username');
      const profileMap = new Map((profilesData || []).map((p) => [p.id, p.username]));

      // 2. 음악 기록 가져오기
      const { data: recordsData } = await supabase
        .from('culture_records')
        .select('*')
        .eq('category', 'music')
        .order('created_at', { ascending: false });

      const enrichedRecords: MusicRecord[] = (recordsData || []).map((rec) => ({
        ...rec,
        author_name: profileMap.get(rec.user_id) || 'archiver',
      }));
      setRecords(enrichedRecords);

      // 3. 믹스테이프 가져오기
      const { data: mixtapesData } = await supabase
        .from('mixtapes')
        .select('*')
        .order('created_at', { ascending: false });

      const enrichedMixtapes: MixtapeItem[] = (mixtapesData || []).map((mix) => ({
        ...mix,
        author_name: profileMap.get(mix.user_id) || 'archiver',
      }));
      setMixtapes(enrichedMixtapes);

    } catch (err) {
      console.error('Error loading data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUserNickname('');
    setCurrentUserId(null);
    router.push('/login');
  };

  // 프로필 링크 복사 핸들러
  const handleCopyProfileLink = () => {
    if (!currentUserId) return;
    const profileUrl = `${window.location.origin}/user/${currentUserId}`;
    navigator.clipboard.writeText(profileUrl);
    alert('Profile link copied to clipboard! Share it with your friends.');
  };

  const handleDeleteRecord = async (id: number) => {
    if (!confirm('Are you sure you want to delete this music archive?')) return;
    try {
      const { error } = await supabase.from('culture_records').delete().eq('id', id);
      if (error) throw error;
      setRecords((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  const handleDeleteMixtape = async (id: number) => {
    if (!confirm('Are you sure you want to delete this mixtape?')) return;
    try {
      const { error } = await supabase.from('mixtapes').delete().eq('id', id);
      if (error) throw error;
      setMixtapes((prev) => prev.filter((item) => item.id !== id));
    } catch (err: any) {
      alert(`Failed to delete: ${err.message}`);
    }
  };

  // 필터링된 음악 기록
  const filteredRecords = useMemo(() => {
    return records.filter((record) => {
      if (onlyMyRecords && currentUserId && record.user_id !== currentUserId) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return record.title?.toLowerCase().includes(q) || record.subtitle?.toLowerCase().includes(q) || record.memo?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [records, searchQuery, onlyMyRecords, currentUserId]);

  // 필터링된 믹스테이프
  const filteredMixtapes = useMemo(() => {
    return mixtapes.filter((mix) => {
      if (onlyMyRecords && currentUserId && mix.user_id !== currentUserId) return false;
      if (searchQuery.trim() !== '') {
        const q = searchQuery.toLowerCase();
        return mix.title?.toLowerCase().includes(q) || mix.description?.toLowerCase().includes(q);
      }
      return true;
    });
  }, [mixtapes, searchQuery, onlyMyRecords, currentUserId]);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100">
      {/* 상단 네비게이션 바 */}
      <header className="sticky top-0 z-30 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold tracking-tight text-white flex items-center gap-2">
            <span>🎵</span> Music Archive
          </Link>

          <div className="flex items-center gap-2.5">
            {userNickname ? (
              <>
                <span className="text-xs font-medium text-neutral-400 hidden sm:inline">
                  Hi, <strong className="text-white">{userNickname}</strong>
                </span>
                
                {/* 프로필 링크 복사 버튼 */}
                <button
                  onClick={handleCopyProfileLink}
                  className="bg-neutral-900 text-neutral-300 border border-neutral-800 px-3 py-2 rounded-full text-xs font-semibold hover:bg-neutral-800 hover:text-white transition shadow"
                  title="Copy my profile link to share"
                >
                  🔗 Share Profile
                </button>

                <Link
                  href="/mixtape/new"
                  className="bg-neutral-800 text-white border border-neutral-700 px-3 py-2 rounded-full text-xs font-bold hover:bg-neutral-700 transition shadow"
                >
                  📼 + Mixtape
                </Link>

                <Link
                  href="/record/new"
                  className="bg-white text-neutral-950 px-3.5 py-2 rounded-full text-xs font-bold hover:bg-neutral-200 transition shadow"
                >
                  + Add Music
                </Link>

                <button
                  onClick={handleSignOut}
                  className="text-xs text-neutral-400 hover:text-white transition ml-1"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="bg-white text-neutral-950 px-4 py-2 rounded-full text-xs font-bold hover:bg-neutral-200 transition"
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* 메인 컨테이너 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        
        {/* 상단 탭 전환 및 검색 컨트롤 영역 */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          {/* 탭 버튼들 */}
          <div className="flex items-center gap-2 bg-neutral-900 p-1.5 rounded-2xl border border-neutral-800 w-fit">
            <button
              onClick={() => setActiveTab('archives')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'archives' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              🎵 Music Archives ({records.length})
            </button>
            <button
              onClick={() => setActiveTab('mixtapes')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition ${
                activeTab === 'mixtapes' ? 'bg-white text-neutral-950 shadow' : 'text-neutral-400 hover:text-white'
              }`}
            >
              📼 Mixtapes ({mixtapes.length})
            </button>
          </div>

          <div className="flex items-center gap-2">
            {currentUserId && (
              <button
                onClick={() => setOnlyMyRecords(!onlyMyRecords)}
                className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition whitespace-nowrap ${
                  onlyMyRecords
                    ? 'bg-neutral-800 text-white border-neutral-600'
                    : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:text-white'
                }`}
              >
                {onlyMyRecords ? '✓ Mine Only' : 'Mine Only'}
              </button>
            )}
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'archives' ? 'Search track, artist, notes...' : 'Search mixtapes...'}
              className="w-full sm:w-60 px-3.5 py-2 bg-neutral-900 border border-neutral-800 rounded-xl text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-neutral-600"
            />
          </div>
        </div>

        {/* 컨텐츠 렌더링 영역 */}
        {loading ? (
          <div className="text-center py-24 text-neutral-500 text-sm">Loading...</div>
        ) : activeTab === 'archives' ? (
          /* 음악 아카이브 탭 */
          filteredRecords.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-8">
              <p className="text-neutral-400 text-sm mb-2">No music records found.</p>
              <Link
                href="/record/new"
                className="inline-block mt-3 bg-white text-neutral-950 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition"
              >
                Log Your First Song/Album
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredRecords.map((item) => {
                const formattedDate = item.created_at ? new Date(item.created_at).toISOString().split('T')[0].replace(/-/g, '.') : '';
                const isMyItem = currentUserId && item.user_id === currentUserId;

                return (
                  <article key={item.id} className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-neutral-700 transition group">
                    <div>
                      <div className="relative aspect-square bg-neutral-950 overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-neutral-600 text-xs">No Album Art</div>
                        )}
                      </div>
                      <div className="p-5">
                        <div className="text-[11px] text-neutral-400 mb-1.5 font-semibold">@{item.author_name}</div>
                        <h2 className="text-base font-bold text-white leading-snug mb-1">{item.title}</h2>
                        {item.subtitle && <p className="text-xs text-neutral-400 mb-3 font-medium">🎤 {item.subtitle}</p>}
                        {item.memo && (
                          <p className="text-xs text-neutral-300 leading-relaxed line-clamp-3 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60 mb-2">
                            {item.memo}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="px-5 pb-5 pt-0 flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800/40 pt-3">
                      <span>Created: {formattedDate}</span>
                      {isMyItem && (
                        <button onClick={() => handleDeleteRecord(item.id)} className="text-red-400 hover:text-red-300 font-medium transition">
                          Delete
                        </button>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          )
        ) : (
          /* 믹스테이프 탭 */
          filteredMixtapes.length === 0 ? (
            <div className="text-center py-20 bg-neutral-900/50 border border-neutral-800/80 rounded-3xl p-8">
              <p className="text-neutral-400 text-sm mb-2">No mixtapes found.</p>
              <Link
                href="/mixtape/new"
                className="inline-block mt-3 bg-white text-neutral-950 px-6 py-2.5 rounded-full text-xs font-bold hover:bg-neutral-200 transition"
              >
                Create Your First Mixtape
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredMixtapes.map((mix) => {
                const formattedDate = mix.created_at ? new Date(mix.created_at).toISOString().split('T')[0].replace(/-/g, '.') : '';
                const isMyItem = currentUserId && mix.user_id === currentUserId;

                return (
                  <article key={mix.id} className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-xl flex flex-col justify-between hover:border-neutral-700 transition group">
                    <Link href={`/mixtape/${mix.id}`} className="block p-6">
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-2xl">{mix.format === 'cassette' ? '📼' : '💿'}</span>
                        <span className="text-[10px] uppercase font-bold tracking-wider px-2.5 py-1 rounded-full bg-neutral-950 border border-neutral-800 text-neutral-300">
                          {mix.format}
                        </span>
                      </div>

                      <div className="text-[11px] text-neutral-400 mb-1 font-semibold">@{mix.author_name}</div>
                      <h2 className="text-base font-bold text-white leading-snug mb-2 group-hover:underline">{mix.title}</h2>
                      
                      {mix.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60">
                          "{mix.description}"
                        </p>
                      )}
                    </Link>

                    <div className="px-6 pb-6 pt-0 flex items-center justify-between text-[11px] text-neutral-500 border-t border-neutral-800/40 pt-3">
                      <span>Created: {formattedDate}</span>
                      <div className="flex items-center gap-3">
                        <Link href={`/mixtape/${mix.id}`} className="text-white font-medium hover:underline">
                          View &rarr;
                        </Link>
                        {isMyItem && (
                          <button onClick={() => handleDeleteMixtape(mix.id)} className="text-red-400 hover:text-red-300 font-medium transition">
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )
        )}
      </div>
    </main>
  );
}