import { NextResponse } from 'next/server';
import { XMLParser } from 'fast-xml-parser';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const keyword = searchParams.get('keyword') || '';

    // 인코딩된 키를 변형없이 그대로 사용
    const serviceKey = process.env.CULTURE_API_KEY || '';

    if (!serviceKey) {
      return NextResponse.json(
        { success: false, error: 'CULTURE_API_KEY가 설정되지 않았습니다.' },
        { status: 500 }
      );
    }

    const baseUrl = 'https://apis.data.go.kr/B553457/cultureinfo/period2';
    // serviceKey를 그대로 쿼리 스트링에 조합
    const url = `${baseUrl}?serviceKey=${serviceKey}&from=20260101&to=20261231&keyword=${encodeURIComponent(keyword)}&rows=10&cPage=1`;

    const response = await fetch(url);
    const xmlData = await response.text();

    const parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
    });
    const jsonResult = parser.parse(xmlData);

    // 디버깅을 위한 응답 로그
    console.log('--- API 응답 데이터 구조 ---', JSON.stringify(jsonResult, null, 2));

    return NextResponse.json({ success: true, data: jsonResult });
  } catch (error: any) {
    console.error('API 연동 에러:', error);
    return NextResponse.json(
      { success: false, error: error.message || '데이터를 불러오는 데 실패했습니다.' },
      { status: 500 }
    );
  }
}