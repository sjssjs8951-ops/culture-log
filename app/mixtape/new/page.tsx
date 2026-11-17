'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MusicRecord {
  id: number;
  title: string;
  subtitle: string;
  image: string;
}

export default function NewMixtapePage() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [format, setFormat] = useState<'cassette' | 'vinyl'>('cassette');
  const [myRecords, setMyRecords] = useState<MusicRecord[]>([]);
  const [selectedRecordIds, setSelectedRecordIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchMyMusic = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('Sign in required.');
        router.push('/login');
        return;
      }

      const { data } = await supabase
        .from('culture_records')
        .select('id, title, subtitle, image')
        .eq('category', 'music')
        .eq('user_id', session.user.id)
        .order('created_at', { ascending: false });

      setMyRecords(data || []);
    };
    fetchMyMusic();
  }, [router]);

  const toggleSelectRecord = (id: number) => {
    if (selectedRecordIds.includes(id)) {
      setSelectedRecordIds(selectedRecordIds.filter((item) => item !== id));
    } else {
      if (selectedRecordIds.length >= 10) {
        alert('You can select up to 10 tracks for a mixtape.');
        return;
      }
      setSelectedRecordIds([...selectedRecordIds, id]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedRecordIds.length === 0) {
      alert('Please select at least one track.');
      return;
    }
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;

      // 1. mixtapes 테이블에 저장
      const { data: mixtapeData, error: mixtapeError } = await supabase
        .from('mixtapes')
        .insert([{ user_id: session.user.id, title, description, format }])
        .select()
        .single();

      if (mixtapeError) throw mixtapeError;

      // 2. mixtape_items에 수록곡들 매핑 저장
      const itemsToInsert = selectedRecordIds.map((recordId, index) => ({
        mixtape_id: mixtapeData.id,
        record_id: recordId,
        track_order: index + 1,
      }));

      const { error: itemsError } = await supabase.from('mixtape_items').insert(itemsToInsert);
      if (itemsError) throw itemsError;

      router.push('/');
    } catch (err: any) {
      console.error('Error creating mixtape:', err);
      alert(`Failed: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 sm:px-6">
      <div className="max-w-2xl mx-auto bg-neutral-900 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-neutral-400 hover:text-white text-sm font-medium">&larr; Back</Link>
          <h1 className="text-lg font-bold text-white">Create Custom Mixtape</h1>
          <div className="w-10"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Mixtape Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="e.g., Midnight Autumn Drive"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Format Style</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormat('cassette')}
                className={`py-3 rounded-xl text-xs font-bold border transition ${
                  format === 'cassette' ? 'bg-white text-neutral-950 border-white' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                📼 Cassette Tape
              </button>
              <button
                type="button"
                onClick={() => setFormat('vinyl')}
                className={`py-3 rounded-xl text-xs font-bold border transition ${
                  format === 'vinyl' ? 'bg-white text-neutral-950 border-white' : 'bg-neutral-950 text-neutral-400 border-neutral-800'
                }`}
              >
                💿 Vinyl Record
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Liner Notes / Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="Write the mood or story behind this mixtape..."
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600 resize-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-2">
              Select Tracks ({selectedRecordIds.length} selected)
            </label>
            <div className="max-h-64 overflow-y-auto space-y-2 pr-1">
              {myRecords.length === 0 ? (
                <p className="text-xs text-neutral-500 py-4 text-center">No music records found. Add some music first!</p>
              ) : (
                myRecords.map((rec) => {
                  const isSelected = selectedRecordIds.includes(rec.id);
                  return (
                    <div
                      key={rec.id}
                      onClick={() => toggleSelectRecord(rec.id)}
                      className={`p-3 rounded-xl border cursor-pointer flex items-center justify-between transition ${
                        isSelected ? 'bg-neutral-800 border-white' : 'bg-neutral-950 border-neutral-800 hover:border-neutral-700'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <img src={rec.image} alt={rec.title} className="w-10 h-10 rounded-lg object-cover" />
                        <div>
                          <p className="text-xs font-bold text-white line-clamp-1">{rec.title}</p>
                          <p className="text-[10px] text-neutral-400 line-clamp-1">{rec.subtitle}</p>
                        </div>
                      </div>
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-lg ${isSelected ? 'bg-white text-neutral-950' : 'bg-neutral-900 text-neutral-500'}`}>
                        {isSelected ? 'Selected' : 'Select'}
                      </span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-neutral-950 py-3.5 rounded-full font-bold text-sm hover:bg-neutral-200 transition shadow"
          >
            {loading ? 'Creating Mixtape...' : 'Publish Mixtape'}
          </button>
        </form>
      </div>
    </main>
  );
}