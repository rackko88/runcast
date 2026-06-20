// 주요 하천 감시 지점 (한강홍수통제소 관측소 코드)
export const STATIONS = [
  { id: '1018680', name: '청계천(고산자교)', river: '청계천', lat: 37.5692, lng: 127.0321, warnLevel: 2.5, dangerLevel: 3.5 },
  { id: '1018660', name: '청계천(마전교)', river: '청계천', lat: 37.5739, lng: 127.0047, warnLevel: 2.5, dangerLevel: 3.5 },
  { id: '1018290', name: '중랑천(군자교)', river: '중랑천', lat: 37.5608, lng: 127.0825, warnLevel: 4.0, dangerLevel: 5.5 },
  { id: '1018280', name: '중랑천(면목교)', river: '중랑천', lat: 37.5752, lng: 127.0813, warnLevel: 4.0, dangerLevel: 5.5 },
  { id: '1018670', name: '중랑천(망우교)', river: '중랑천', lat: 37.6054, lng: 127.0917, warnLevel: 3.5, dangerLevel: 5.0 },
  { id: '1017680', name: '한강(한강대교)', river: '한강', lat: 37.5156, lng: 126.9743, warnLevel: 7.5, dangerLevel: 9.5 },
  { id: '1017770', name: '한강(청담대교)', river: '한강', lat: 37.5193, lng: 127.0539, warnLevel: 6.0, dangerLevel: 8.0 },
  { id: '1017650', name: '한강(가양대교)', river: '한강', lat: 37.5663, lng: 126.8571, warnLevel: 7.0, dangerLevel: 9.0 },
  { id: '1018490', name: '안양천(안양대교)', river: '안양천', lat: 37.5282, lng: 126.8745, warnLevel: 3.0, dangerLevel: 4.5 },
  { id: '1018000', name: '탄천(탄천교)', river: '탄천', lat: 37.4953, lng: 127.0923, warnLevel: 2.5, dangerLevel: 3.5 },
];

// 하천별 폴리라인 좌표 (지도에 표시할 경로)
export const RIVER_PATHS = {
  한강: [
    [37.5663, 126.8571], [37.5427, 126.8748], [37.5292, 126.8977],
    [37.5213, 126.9231], [37.5156, 126.9743], [37.5146, 127.0089],
    [37.5193, 127.0539], [37.5247, 127.0882], [37.5301, 127.1203],
  ],
  청계천: [
    [37.5700, 126.9787], [37.5706, 126.9923], [37.5712, 127.0089],
    [37.5705, 127.0214], [37.5698, 127.0321], [37.5692, 127.0432],
  ],
  중랑천: [
    [37.6054, 127.0917], [37.5950, 127.0896], [37.5845, 127.0867],
    [37.5752, 127.0813], [37.5608, 127.0825], [37.5490, 127.0789],
    [37.5372, 127.0756],
  ],
  안양천: [
    [37.5782, 126.8598], [37.5630, 126.8630], [37.5490, 126.8690],
    [37.5350, 126.8716], [37.5282, 126.8745],
  ],
  탄천: [
    [37.5447, 127.1052], [37.5302, 127.0994], [37.5148, 127.0965],
    [37.4953, 127.0923],
  ],
};

export const RIVER_COLORS = {
  정상: '#22c55e',
  주의: '#f59e0b',
  경계: '#f97316',
  위험: '#ef4444',
  통제: '#7c3aed',
  오류: '#6b7280',
};

export function getStatusFromLevel(waterLevel, warnLevel, dangerLevel) {
  if (waterLevel === null || waterLevel === undefined) return '오류';
  if (waterLevel >= dangerLevel) return '통제';
  if (waterLevel >= warnLevel) return '경계';
  if (waterLevel >= warnLevel * 0.8) return '주의';
  return '정상';
}
