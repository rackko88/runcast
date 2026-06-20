// Vercel serverless function: scrapes public notice boards and aggregates results

const SOURCES = [
  {
    id: 'sisul',
    label: '서울시설공단',
    color: '#3182F6',
    url: 'https://www.sisul.or.kr/open_content/cheonggye/community/notice.jsp',
    baseUrl: 'https://www.sisul.or.kr',
    encoding: 'utf-8',
  },
];

const EMERGENCY_KEYWORDS = ['통제', '차단', '접근금지', '출입금지', '폐쇄', '위험', '경보', '주의보', '해제'];

async function fetchHtml(url, encoding) {
  const res = await fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; RuncastBot/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
      'Accept-Language': 'ko-KR,ko;q=0.9',
    },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder(encoding).decode(buf);
}

// Generic parser: finds table rows with <a href> + date pattern
function parseNotices(html, baseUrl, label, color) {
  const notices = [];
  const seen = new Set();

  // Match table rows (most Korean government boards use tables)
  const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
  const rows = [...html.matchAll(rowPattern)].map(m => m[0]);

  for (const row of rows) {
    // Skip header rows
    if (/<th[\s\S]*?>/i.test(row)) continue;

    const linkMatch = row.match(/<a[^>]+href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const href = linkMatch[1].trim();
    const title = linkMatch[2]
      .replace(/<[^>]+>/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (!title || title.length < 4) continue;
    if (/^(이전|다음|처음|끝|목록|검색|로그인|홈)$/.test(title)) continue;
    if (seen.has(title)) continue;
    seen.add(title);

    const dateMatch = row.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
    if (!dateMatch) continue;

    const date = `${dateMatch[1]}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].padStart(2, '0')}`;
    const url = href.startsWith('http') ? href : baseUrl + href;
    const isEmergency = EMERGENCY_KEYWORDS.some(kw => title.includes(kw));

    notices.push({ source: label, color, title, date, url, isEmergency });
  }

  // Fallback: WordPress/blog style <article> or <li> with links
  if (notices.length === 0) {
    const blockPattern = /(?:<article|<li)[^>]*>([\s\S]*?)(?:<\/article>|<\/li>)/gi;
    const blocks = [...html.matchAll(blockPattern)].map(m => m[1]);

    for (const block of blocks) {
      const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;

      const href = linkMatch[1].trim();
      const title = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!title || title.length < 4) continue;
      if (seen.has(title)) continue;
      seen.add(title);

      const dateMatch = block.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
      const date = dateMatch
        ? `${dateMatch[1]}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].padStart(2, '0')}`
        : '';

      const url = href.startsWith('http') ? href : baseUrl + href;
      const isEmergency = EMERGENCY_KEYWORDS.some(kw => title.includes(kw));

      notices.push({ source: label, color, title, date, url, isEmergency });
    }
  }

  return notices;
}

async function fetchSource(src) {
  const html = await fetchHtml(src.url, src.encoding);
  return parseNotices(html, src.baseUrl, src.label, src.color);
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const results = await Promise.allSettled(SOURCES.map(fetchSource));

  const notices = [];
  const errors = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') {
      notices.push(...r.value);
    } else {
      errors.push({ source: SOURCES[i].label, error: r.reason?.message });
      console.error(`[notices] ${SOURCES[i].label} 실패:`, r.reason?.message);
    }
  });

  // 당일 공지만 표시 (날짜 필드가 없는 것도 포함)
  const seoulNow = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Seoul' }));
  const todayStr = `${seoulNow.getFullYear()}.${String(seoulNow.getMonth()+1).padStart(2,'0')}.${String(seoulNow.getDate()).padStart(2,'0')}`;

  const todayNotices = notices.filter(n => !n.date || n.date === todayStr || n.date.startsWith(todayStr));

  // 당일 공지 없으면 최근 3일치 fallback
  const filtered = todayNotices.length > 0
    ? todayNotices
    : notices.slice(0, 10);

  // Sort: emergencies first, then by date desc
  filtered.sort((a, b) => {
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  res.json({ notices: filtered, errors, updatedAt: new Date().toISOString() });
}
