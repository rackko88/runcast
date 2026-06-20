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

  const data = await fetchHrfco('waterlevel/list/10M.json') as { content?: Array<{ WLOBSCD: string; WL: string }> };
  const items = data?.content ?? [];

  const levelMap: Record<string, number> = {};
  for (const item of items) {
    if (!levelMap[item.WLOBSCD]) {
      levelMap[item.WLOBSCD] = parseFloat(item.WL);
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
    '1018680': 0.42, '1018660': 0.38,
    '1018290': 1.82, '1018280': 1.54, '1018670': 1.23,
    '1017680': 3.21, '1017770': 2.87, '1017650': 3.05,
    '1018490': 0.95, '1018000': 0.61,
  };
  return stationIds.map(id => ({ stationId: id, waterLevel: mock[id] ?? 0.5, isMock: true }));
}
