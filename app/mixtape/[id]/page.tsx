'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useParams } from 'next/navigation';
import Link from 'next/link';

interface MixtapeDetail {
  id: number;
  title: string;
  description: string;
  format: 'cassette' | 'vinyl';
  created_at: string;
  user_id: string;
}

interface TrackItem {
  id: number;
  track_order: number;
  culture_records: {
    id: number;
    title: string;
    subtitle: string;
    image: string;
    memo: string;
  };
}

export default function MixtapeDetailPage() {
  const params = useParams();
  const id = params?.id;

  const [mixtape, setMixtape] = useState<MixtapeDetail | null>(null);
  const [tracks, setTracks] = useState<TrackItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;

    const fetchMixtape = async () => {
      try {
        // 1. 믹스테이프 정보 조회
        const { data: mixtapeData, error: mixtapeError } = await supabase
          .from('mixtapes')
          .select('*')
          .eq('id', id)
          .single();

        if (mixtapeError) throw mixtapeError;
        setMixtape(mixtapeData);

        // 2. 수록곡 목록 조회
        const { data: tracksData, error: tracksError } = await supabase
          .from('mixtape_items')
          .select('id, track_order, culture_records(*)')
          .eq('mixtape_id', id)
          .order('track_order', { ascending: true });

        if (tracksError) throw tracksError;
        setTracks(tracksData || []);
      } catch (err) {
        console.error('Error loading mixtape detail:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMixtape();
  }, [id]);

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-500 flex items-center justify-center text-sm">Loading mixtape...</div>;
  }

  if (!mixtape) {
    return <div className="min-h-screen bg-neutral-950 text-neutral-400 flex items-center justify-center text-sm">Mixtape not found.</div>;
  }

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <Link href="/" className="text-neutral-400 hover:text-white text-sm font-medium">&larr; Back to Feed</Link>
          <span className="text-xs uppercase tracking-widest bg-neutral-900 border border-neutral-800 px-3 py-1 rounded-full text-neutral-300">
            {mixtape.format === 'cassette' ? '📼 Cassette Mixtape' : '💿 Vinyl Record'}
          </span>
        </div>

        {/* 아날로그 비주얼 카드 커버 */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl mb-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-neutral-800/20 to-transparent pointer-events-none"></div>
          
          <div className="w-24 h-24 mx-auto mb-4 rounded-2xl bg-neutral-950 border border-neutral-800 flex items-center justify-center shadow-inner">
            <span className="text-3xl">{mixtape.format === 'cassette' ? '📼' : '💿'}</span>
          </div>

          <h1 className="text-xl font-extrabold text-white mb-2">{mixtape.title}</h1>
          {mixtape.description && (
            <p className="text-xs text-neutral-400 max-w-md mx-auto leading-relaxed bg-neutral-950/60 p-3 rounded-xl border border-neutral-800/60 mt-4">
              "{mixtape.description}"
            </p>
          )}
        </div>

        {/* 트랙리스트 */}
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-neutral-400 uppercase tracking-wider mb-3">Tracklist ({tracks.length} Tracks)</h2>
          {tracks.map((item, index) => {
            const record = item.culture_records;
            if (!record) return null;

            return (
              <div key={item.id} className="bg-neutral-900 border border-neutral-800/80 rounded-2xl p-4 flex items-center gap-4">
                <span className="text-xs font-mono text-neutral-500 w-4 text-center">{index + 1}</span>
                <img src={record.image} alt={record.title} className="w-12 h-12 rounded-xl object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-white truncate">{record.title}</p>
                  <p className="text-[10px] text-neutral-400 truncate">🎤 {record.subtitle}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}