const API_KEY = import.meta.env.VITE_HRFCO_API_KEY as string | undefined;

export interface WaterLevelResult {
  stationId: string;
  waterLevel: number | null;
  isMock: boolean;
  error?: string;
}

async function fetchHrfco(path: string): Promise<unknown> {
  const res = await fetch(`/hrfco-api/${API_KEY}/${path}`);
  if (!res.ok) throw new Error(`HRFCO API 오류: ${res.status}`);
  return res.json();
}

export async function fetchWaterLevels(stationIds: string[]): Promise<WaterLevelResult[]> {
  if (!API_KEY) return getMockData(stationIds);

  const data = await fetchHrfco('waterlevel/list/10M.json') as { content?: Array<{ wlobscd: string; wl: string }> };
  const items = data?.content ?? [];

  const levelMap: Record<string, number> = {};
  for (const item of items) {
    if (item.wlobscd && !levelMap[item.wlobscd]) {
      levelMap[item.wlobscd] = parseFloat(item.wl);
    }
  }

  return stationIds.map(id => ({
    stationId: id,
    waterLevel: levelMap[id] ?? null,
    isMock: false,
  }));
}

function getMockData(stationIds: string[]): WaterLevelResult[] {
  const mock: Record<string, number> = {
    '1018640': 2.10, '1018662': 2.87, '1018680': 3.21, '1018683': 3.05,
    '1018670': 1.23, '1018675': 1.82,
    '1018697': 0.95, '1018695': 0.61,
    '1018658': 1.54, '1018655': 0.42,
  };
  return stationIds.map(id => ({ stationId: id, waterLevel: mock[id] ?? 0.5, isMock: true }));
}
