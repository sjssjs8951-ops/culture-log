import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=album&limit=10`);
    const data = await res.json();

    const results = (data.results || []).map((item: any) => ({
      title: item.collectionName || item.trackName,
      subtitle: item.artistName,
      // 저화질 썸네일을 고화질 앨범 아트 이미지 URL로 변환
      image: item.artworkUrl100 ? item.artworkUrl100.replace('100x100bb', '600x600bb') : '',
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('iTunes API Error:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}