export const theme = {
  colors: {
    blue:    '#3182F6',
    red:     '#F04452',
    orange:  '#F5A623',
    green:   '#12B968',
    purple:  '#7248D9',
    gray50:  '#F9FAFB',
    gray100: '#F2F4F6',
    gray200: '#E5E8EB',
    gray400: '#B0B8C1',
    gray600: '#6B7684',
    gray800: '#333D4B',
    black:   '#191F28',
    white:   '#FFFFFF',
  },
  shadows: {
    sm: '0 2px 8px rgba(0,0,0,0.08)',
    md: '0 4px 20px rgba(0,0,0,0.10)',
  },
  radius: {
    sm: '10px',
    md: '16px',
    lg: '20px',
  },
  sizes: {
    headerH: '56px',
    tabsH:   '60px',
    sidebar: '360px',
  },
  bp: {
    pc: '768px',
  },
} as const;

export type Theme = typeof theme;
