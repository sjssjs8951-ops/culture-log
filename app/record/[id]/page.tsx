'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { supabase } from '../../supabase';
import Link from 'next/link';

interface CultureRecord {
  id: number;
  title: string;
  place: string;
  visit_date: string;
  image: string;
  user_images: string[];
  memo: string;
  created_at: string;
}

export default function DetailPage() {
  const params = useParams();
  const rawId = params?.id;
  const idStr = Array.isArray(rawId) ? rawId[0] : rawId;
  const id = idStr ? Number(idStr) : null;

  const [record, setRecord] = useState<CultureRecord | null>(null);
  const [memo, setMemo] = useState('');
  const [visitDate, setVisitDate] = useState('');
  const [userImages, setUserImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!id || isNaN(id)) {
      setLoading(false);
      setErrorMsg('유효하지 않은 ID입니다.');
      return;
    }

    const fetchRecord = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('culture_records')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        if (data) {
          setRecord(data);
          setMemo(data.memo || '');
          setVisitDate(data.visit_date || '');
          setUserImages(data.user_images || (data.user_image ? [data.user_image] : []));
        }
      } catch (err: any) {
        console.error('데이터를 불러오지 못했습니다:', err);
        setErrorMsg(err.message || '데이터를 찾을 수 없습니다.');
      } finally {
        setLoading(false);
      }
    };

    fetchRecord();
  }, [id]);

  // 여러 장의 사진 파일을 한 번에 업로드하는 함수
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const files = e.target.files;
      if (!files || files.length === 0) return;

      setUploading(true);
      const newImageUrls: string[] = [];

      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random()}.${fileExt}`;
        const filePath = `${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('culture-photos')
          .upload(filePath, file);

        if (uploadError) throw uploadError;

        const { data } = supabase.storage
          .from('culture-photos')
          .getPublicUrl(filePath);

        if (data?.publicUrl) {
          newImageUrls.push(data.publicUrl);
        }
      }

      setUserImages((prev) => [...prev, ...newImageUrls]);
    } catch (err: any) {
      console.error('파일 업로드 에러:', err);
      alert(`업로드 실패: ${err.message}`);
    } finally {
      setUploading(false);
    }
  };

  // 특정 사진 삭제 함수
  const handleRemoveImage = (indexToRemove: number) => {
    setUserImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleUpdate = async () => {
    if (!id) return;
    try {
      const { error } = await supabase
        .from('culture_records')
        .update({ 
          memo, 
          visit_date: visitDate,
          user_images: userImages 
        })
        .eq('id', id);

      if (error) throw error;
      alert('기록이 저장되었습니다! ✨');
    } catch (err: any) {
      console.error(err);
      alert(`저장 실패: ${err.message}`);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-500 text-sm">로딩 중...</div>;
  }

  if (!record) {
    return (
      <div className="min-h-screen bg-neutral-950 flex flex-col items-center justify-center text-neutral-100 p-6 text-center">
        <p className="text-neutral-400 mb-2 text-sm font-semibold">기록을 찾을 수 없습니다.</p>
        <Link href="/" className="text-white font-medium hover:underline text-sm bg-neutral-900 px-6 py-2.5 rounded-full border border-neutral-800 transition">
          &larr; 홈으로 돌아가기
        </Link>
      </div>
    );
  }

  // 표시할 이미지 목록 (내가 올린 사진들이 있으면 그것들을 나열하고, 없으면 공식 포스터 1장을 보여줌)
  const displayImages = userImages.length > 0 ? userImages : (record.image ? [record.image] : []);

  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-100 py-10 px-4 sm:px-6">
      <div className="max-w-xl mx-auto">
        
        {/* 상단 네비게이션 */}
        <div className="flex justify-between items-center mb-6 px-2">
          <Link href="/" className="text-neutral-400 hover:text-white font-medium text-sm transition">
            &larr; 피드로 돌아가기
          </Link>
          <span className="text-xs text-neutral-500">{record.visit_date ? `${record.visit_date} 방문` : '방문일 미지정'}</span>
        </div>

        {/* 인스타그램 피드 스타일 카드 */}
        <article className="bg-neutral-900 border border-neutral-800/80 rounded-3xl overflow-hidden shadow-2xl">
          
          {/* 피드 헤더 (타이틀 & 장소) */}
          <div className="px-6 py-5 flex items-center justify-between border-b border-neutral-800/60">
            <div>
              <h1 className="text-base font-bold text-white tracking-tight">{record.title}</h1>
              <p className="text-xs text-neutral-400 mt-0.5">📍 {record.place || '장소 정보 없음'}</p>
            </div>
          </div>

          {/* 인스타그램 피드 스타일 사진 나열 (여러 장일 경우 아래로 연속 배치) */}
          <div className="w-full bg-neutral-950 space-y-2">
            {displayImages.length > 0 ? (
              displayImages.map((imgUrl, index) => (
                <div key={index} className="relative w-full aspect-square sm:aspect-[4/5] bg-neutral-950 overflow-hidden flex items-center justify-center group">
                  <img src={imgUrl} alt={`관람 인증 사진 ${index + 1}`} className="w-full h-full object-cover" />
                  {/* 사진 위에 마우스 올렸을 때 개별 삭제 버튼 */}
                  <button
                    onClick={() => handleRemoveImage(index)}
                    className="absolute top-4 right-4 bg-black/70 hover:bg-red-600 text-white text-xs px-3 py-1.5 rounded-full opacity-0 group-hover:opacity-100 transition shadow-lg"
                  >
                    사진 삭제
                  </button>
                  <div className="absolute bottom-4 right-4 bg-black/60 text-white text-[10px] px-2.5 py-1 rounded-full font-mono">
                    {index + 1} / {displayImages.length}
                  </div>
                </div>
              ))
            ) : (
              <div className="w-full h-48 flex items-center justify-center text-neutral-600 text-xs">등록된 사진이 없습니다</div>
            )}
          </div>

          {/* 피드 내용 및 편집 영역 */}
          <div className="p-6 space-y-6">
            
            {/* 감상 메모 (캡션) */}
            <div className="space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-xs font-bold text-neutral-200 shrink-0">my_archive</span>
                <span className="text-xs text-neutral-400 font-light leading-relaxed">{memo ? memo : '작성된 감상 메모가 없습니다.'}</span>
              </div>
            </div>

            <hr className="border-neutral-800" />

            {/* 기록 편집 및 사진 추가 구역 */}
            <div className="space-y-4 bg-neutral-950/60 p-5 rounded-2xl border border-neutral-800/50">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-400">✏️ 아카이브 기록 관리</h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">방문 날짜</label>
                  <input
                    type="date"
                    value={visitDate}
                    onChange={(e) => setVisitDate(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-800 rounded-xl bg-neutral-900 text-white text-xs focus:outline-none focus:border-neutral-600"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-neutral-400 mb-1">사진 추가하기 (여러 장 선택 가능)</label>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading}
                    className="w-full text-[11px] text-neutral-400 file:mr-2 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[11px] file:font-semibold file:bg-white file:text-neutral-950 hover:file:bg-neutral-200 file:cursor-pointer cursor-pointer"
                  />
                </div>
              </div>

              {uploading && <p className="text-xs text-indigo-400 animate-pulse">사진들을 업로드하는 중입니다...</p>}

              <div>
                <label className="block text-[11px] text-neutral-400 mb-1">감상 메모</label>
                <textarea
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  rows={3}
                  className="w-full px-3.5 py-2.5 border border-neutral-800 rounded-xl focus:outline-none focus:border-neutral-600 bg-neutral-900 text-neutral-100 text-xs resize-none placeholder:text-neutral-600"
                  placeholder="이 전시/공연에 대한 감상을 적어보세요..."
                />
              </div>

              <button
                onClick={handleUpdate}
                className="w-full bg-white text-neutral-950 py-3 rounded-full font-bold hover:bg-neutral-200 transition text-xs shadow"
              >
                변경사항 저장하기
              </button>
            </div>

          </div>
        </article>

      </div>
    </main>
  );
}