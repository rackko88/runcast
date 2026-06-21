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
  {
    id: 'hangang',
    label: '한강사업본부',
    color: '#22c55e',
    url: 'https://hangang.seoul.go.kr/www/board/list.do?boardSid=77&menuSid=113',
    baseUrl: 'https://hangang.seoul.go.kr',
    encoding: 'utf-8',
  },
];

const EMERGENCY_KEYWORDS = ['통제', '차단', '접근금지', '출입금지', '폐쇄', '위험', '경보', '주의보', '해제'];

function decodeHtmlEntities(str) {
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, ' ');
}

async function fetchHtml(url, encoding, referer) {
  const headers = {
    'User-Agent': 'Mozilla/5.0 (compatible; RuncastBot/1.0)',
    'Accept': 'text/html,application/xhtml+xml',
    'Accept-Language': 'ko-KR,ko;q=0.9',
  };
  if (referer) headers['Referer'] = referer;
  const res = await fetch(url, { headers, signal: AbortSignal.timeout(6000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const buf = await res.arrayBuffer();
  return new TextDecoder(encoding).decode(buf);
}

async function fetchNoticeContent(url, listUrl) {
  try {
    const html = await fetchHtml(url, 'utf-8', listUrl);
    const match = html.match(/class="view_contents"[^>]*>([\s\S]*?)<\/td>/i);
    if (!match) return null;
    return decodeHtmlEntities(
      match[1]
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<[^>]+>/g, '')
        .replace(/\t/g, ' ')
        .replace(/[ \t]+/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim()
    );
  } catch {
    return null;
  }
}

function parseNotices(html, baseUrl, label, color) {
  const notices = [];
  const seen = new Set();

  const rowPattern = /<tr[\s\S]*?<\/tr>/gi;
  const rows = [...html.matchAll(rowPattern)].map(m => m[0]);

  for (const row of rows) {
    if (/<th[\s\S]*?>/i.test(row)) continue;

    const linkMatch = row.match(/<a[^>]+href="([^"#][^"]*)"[^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;

    const href = decodeHtmlEntities(linkMatch[1].trim());
    const title = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();

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

  // Fallback: article/li style
  if (notices.length === 0) {
    const blockPattern = /(?:<article|<li)[^>]*>([\s\S]*?)(?:<\/article>|<\/li>)/gi;
    for (const m of html.matchAll(blockPattern)) {
      const block = m[1];
      const linkMatch = block.match(/<a[^>]+href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
      if (!linkMatch) continue;
      const href = decodeHtmlEntities(linkMatch[1].trim());
      const title = linkMatch[2].replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
      if (!title || title.length < 4) continue;
      if (seen.has(title)) continue;
      seen.add(title);
      const dateMatch = block.match(/(\d{4})[.\-\/](\d{1,2})[.\-\/](\d{1,2})/);
      const date = dateMatch
        ? `${dateMatch[1]}.${dateMatch[2].padStart(2, '0')}.${dateMatch[3].padStart(2, '0')}` : '';
      const url = href.startsWith('http') ? href : notices[0]?.url?.split('/').slice(0,3).join('/') + href;
      const isEmergency = EMERGENCY_KEYWORDS.some(kw => title.includes(kw));
      notices.push({ source: label, color, title, date, url, isEmergency });
    }
  }

  return notices;
}

async function fetchSource(src) {
  const html = await fetchHtml(src.url, src.encoding);
  const notices = parseNotices(html, src.baseUrl, src.label, src.color);
  // 각 공지 본문을 병렬로 fetch (최대 10개)
  const withContent = await Promise.all(
    notices.slice(0, 10).map(async n => ({
      ...n,
      content: await fetchNoticeContent(n.url, src.url),
    }))
  );
  return withContent;
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Cache-Control', 's-maxage=300, stale-while-revalidate=60');

  const results = await Promise.allSettled(SOURCES.map(fetchSource));

  const notices = [];
  const errors = [];

  results.forEach((r, i) => {
    if (r.status === 'fulfilled') notices.push(...r.value);
    else {
      errors.push({ source: SOURCES[i].label, error: r.reason?.message });
      console.error(`[notices] ${SOURCES[i].label} 실패:`, r.reason?.message);
    }
  });

  const seoulNow = new Date(new Date().toLocaleString('en', { timeZone: 'Asia/Seoul' }));
  const todayStr = `${seoulNow.getFullYear()}.${String(seoulNow.getMonth()+1).padStart(2,'0')}.${String(seoulNow.getDate()).padStart(2,'0')}`;

  const todayNotices = notices.filter(n => !n.date || n.date === todayStr || n.date.startsWith(todayStr));
  const filtered = todayNotices.length > 0 ? todayNotices : notices.slice(0, 10);

  filtered.sort((a, b) => {
    if (a.isEmergency !== b.isEmergency) return a.isEmergency ? -1 : 1;
    return b.date.localeCompare(a.date);
  });

  res.json({ notices: filtered, errors, updatedAt: new Date().toISOString() });
}
