'use client';

import { useState } from 'react';
import { supabase } from '../../supabase';
import Link from 'next/link';

export default function NewRecordPage() {
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // 각 아이템별 방문 날짜와 메모를 관리하기 위한 상태
  const [visitDates, setVisitDates] = useState<{ [key: number]: string }>({});
  const [memos, setMemos] = useState<{ [key: number]: string }>({});

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyword.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/events/search?keyword=${encodeURIComponent(keyword)}`);
      const json = await res.json();
      
      if (json.success) {
        let rawItems = 
          json.data?.msgBody?.row || 
          json.data?.response?.body?.items?.item || 
          json.data?.NewServiceResponse?.row || [];

        if (!Array.isArray(rawItems)) {
          rawItems = rawItems ? [rawItems] : [];
        }
        setItems(rawItems);
      } else {
        alert('데이터를 불러오지 못했습니다.');
      }
    } catch (err) {
      console.error(err);
      alert('에러가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (item: any, index: number) => {
    const title = item.title || item.cultName || '제목 없음';
    const place = item.place || item.area || '';
    const visit_date = visitDates[index] || new Date().toISOString().split('T')[0]; // 날짜 미선택 시 오늘 날짜 기본값
    const image = item.imageUrl || item.imgUrl || item.thumbnail || '';
    const memo = memos[index] || '';

    try {
      const { error } = await supabase.from('culture_records').insert([
        { title, place, visit_date, image, memo }
      ]);

      if (error) throw error;
      alert('성공적으로 저장되었습니다! 🎉');
    } catch (err: any) {
      console.error(err);
      alert(`저장에 실패했습니다: ${err.message}`);
    }
  };

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-2xl font-extrabold text-white tracking-tight">문화 행사 검색 및 담기</h1>
          <Link href="/" className="text-neutral-400 hover:text-white text-sm transition">
            &larr; 목록으로
          </Link>
        </div>

        <form onSubmit={handleSearch} className="flex gap-3 mb-10">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="검색어를 입력하세요 (예: 미술, 전시, 공연)"
            className="flex-1 px-5 py-3.5 border border-neutral-800 rounded-full focus:outline-none focus:border-neutral-600 bg-neutral-900 text-white text-sm placeholder:text-neutral-600 shadow-inner"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-white text-neutral-950 px-7 py-3.5 rounded-full font-bold hover:bg-neutral-200 transition text-sm disabled:opacity-50"
          >
            {loading ? '검색 중...' : '검색'}
          </button>
        </form>

        <div className="space-y-6">
          {items.map((item, index) => (
            <div key={index} className="bg-neutral-900 border border-neutral-800/80 p-6 rounded-3xl shadow-xl flex flex-col md:flex-row gap-6">
              {item.imageUrl || item.imgUrl || item.thumbnail ? (
                <img
                  src={item.imageUrl || item.imgUrl || item.thumbnail}
                  alt={item.title || item.cultName}
                  className="w-full md:w-36 h-52 object-cover rounded-2xl bg-neutral-950"
                />
              ) : null}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h2 className="text-lg font-bold text-white mb-2">{item.title || item.cultName}</h2>
                  <p className="text-xs text-neutral-400 mb-1">장소: {item.place || item.area || '정보 없음'}</p>
                </div>

                <div className="mt-4 space-y-3">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-400 mb-1">내가 방문한 날짜</label>
                    <input
                      type="date"
                      value={visitDates[index] || ''}
                      onChange={(e) => setVisitDates({ ...visitDates, [index]: e.target.value })}
                      className="w-full sm:w-48 px-3 py-2 border border-neutral-800 rounded-xl text-xs bg-neutral-950 text-white focus:outline-none focus:border-neutral-600"
                    />
                  </div>

                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      placeholder="간단한 메모 남기기"
                      value={memos[index] || ''}
                      onChange={(e) => setMemos({ ...memos, [index]: e.target.value })}
                      className="flex-1 px-4 py-2.5 border border-neutral-800 rounded-full text-xs bg-neutral-950 text-white placeholder:text-neutral-600 focus:outline-none focus:border-neutral-600"
                    />
                    <button
                      onClick={() => handleSave(item, index)}
                      className="bg-white text-neutral-950 px-5 py-2.5 rounded-full text-xs font-semibold hover:bg-neutral-200 transition whitespace-nowrap shadow"
                    >
                      아카이브 담기
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}