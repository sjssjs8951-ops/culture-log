import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q');

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  const apiKey = process.env.TMDB_API_KEY; // .env.local에 TMDB_API_KEY 설정 필요

  if (!apiKey) {
    // API 키가 없을 경우를 대비한 안전한 폴백(샘플 데이터)
    return NextResponse.json({
      results: [
        { title: query, subtitle: 'TMDB API Key Required', image: 'https://images.unsplash.com/photo-1485846234645-a62644f84728?auto=format&fit=crop&w=800&q=80' }
      ]
    });
  }

  try {
    const res = await fetch(`https://api.themoviedb.org/3/search/movie?api_key=${apiKey}&query=${encodeURIComponent(query)}&language=ko-KR`);
    const data = await res.json();

    const results = (data.results || []).map((item: any) => ({
      title: item.title,
      subtitle: `Released: ${item.release_date || 'N/A'}`,
      image: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : '',
    }));

    return NextResponse.json({ results });
  } catch (err) {
    console.error('TMDB API Error:', err);
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}