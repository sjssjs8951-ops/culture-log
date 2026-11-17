'use client';

import { useState } from 'react';
import { supabase } from '../../supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface MusicSearchResult {
  title: string;
  subtitle: string;
  image: string;
}

export default function NewMusicRecordPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredResults, setFilteredResults] = useState<MusicSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [listenDate, setListenDate] = useState('');
  const [image, setImage] = useState('');
  const [memo, setMemo] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // iTunes API를 통한 실시간 음악 검색
  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    if (query.trim() === '') {
      setFilteredResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/search/music?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setFilteredResults(data.results || []);
    } catch (err) {
      console.error('Music search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectItem = (item: MusicSearchResult) => {
    setTitle(item.title);
    setArtist(item.subtitle);
    setImage(item.image);
    setSearchQuery('');
    setFilteredResults([]);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        alert('You must be signed in to add a record.');
        router.push('/login');
        return;
      }

      const { error } = await supabase.from('culture_records').insert([
        {
          user_id: session.user.id,
          category: 'music', // 내부 데이터 분류용 유지
          title,
          subtitle: artist, // 아티스트명 저장
          visit_date: listenDate || null,
          image,
          user_images: image ? [image] : [],
          memo,
        },
      ]);

      if (error) throw error;
      router.push('/');
    } catch (err: any) {
      console.error('Error adding record:', err);
      alert(`Failed to add record: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 sm:px-6">
      <div className="max-w-xl mx-auto bg-neutral-900 border border-neutral-800/80 rounded-3xl p-8 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <Link href="/" className="text-neutral-400 hover:text-white text-sm font-medium">
            &larr; Back
          </Link>
          <h1 className="text-lg font-bold text-white">New Music Archive</h1>
          <div className="w-10"></div>
        </div>

        {/* Quick Search Section (iTunes Live Search) */}
        <div className="mb-6 p-4 bg-neutral-950 border border-neutral-800 rounded-2xl relative">
          <label className="block text-xs font-semibold text-neutral-400 mb-1.5">
            Search Album or Track (Apple Music API)
          </label>
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            placeholder="Type song or artist name..."
            className="w-full px-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
          />

          {isSearching && (
            <div className="absolute right-4 top-11 text-xs text-neutral-500">Searching...</div>
          )}

          {filteredResults.length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-2 bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl z-20 overflow-hidden max-h-72 overflow-y-auto">
              {filteredResults.map((item, idx) => (
                <div
                  key={idx}
                  onClick={() => handleSelectItem(item)}
                  className="px-4 py-3 hover:bg-neutral-800 cursor-pointer flex items-center gap-3 transition border-b border-neutral-800/50 last:border-0"
                >
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-neutral-800 flex items-center justify-center text-[10px]">No Art</div>
                  )}
                  <div>
                    <p className="text-xs font-bold text-white line-clamp-1">{item.title}</p>
                    <p className="text-[10px] text-neutral-400 line-clamp-1">{item.subtitle}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Track / Album Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              placeholder="Album or song name"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Artist</label>
            <input
              type="text"
              value={artist}
              onChange={(e) => setArtist(e.target.value)}
              placeholder="Artist name"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Date Listened</label>
            <input
              type="date"
              value={listenDate}
              onChange={(e) => setListenDate(e.target.value)}
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Album Cover Image URL</label>
            <input
              type="text"
              value={image}
              onChange={(e) => setImage(e.target.value)}
              placeholder="Auto-filled or paste image URL"
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-400 mb-1">Review & Notes</label>
            <textarea
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              rows={3}
              placeholder="Write your thoughts about this music..."
              className="w-full px-4 py-3 bg-neutral-950 border border-neutral-800 rounded-xl text-sm text-white focus:outline-none focus:border-neutral-600 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-white text-neutral-950 py-3.5 rounded-full font-bold text-sm hover:bg-neutral-200 transition shadow"
          >
            {loading ? 'Saving...' : 'Save Music Archive'}
          </button>
        </form>
      </div>
    </main>
  );
}