// Vercel serverless function: scrapes public notice boards and aggregates results

const SOURCES = [
  {
    id: 'cheonggye',
    label: '청계천',
    color: '#3182F6',
    url: 'https://www.sisul.or.kr/open_content/cheonggye/notice/noticeList.do',
    baseUrl: 'https://www.sisul.or.kr',
    encoding: 'euc-kr',
  },
  {
    id: 'hangang',
    label: '한강공원',
    color: '#00a878',
    url: 'https://hangang.seoul.go.kr/archives/category/notice',
    baseUrl: 'https://hangang.seoul.go.kr',
    encoding: 'utf-8',
  },
  {
    id: 'hangang-safety',
    label: '한강안전',
    color: '#f97316',
    url: 'https://hangang.seoul.go.kr/archives/category/safety',
    baseUrl: 'https://hangang.seoul.go.kr',
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
    if (notices.length >= 6) break;
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
      if (notices.length >= 6) break;
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

  // Sort: emergencies first, then by date desc
  notices.sort((a, b) => {
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  res.json({ notices, errors, updatedAt: new Date().toISOString() });
}
