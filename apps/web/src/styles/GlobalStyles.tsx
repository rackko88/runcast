import { Global, css } from '@emotion/react';
import { theme } from '@runcast/ui';

const globals = css`
  *, *::before, *::after {
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    -webkit-tap-highlight-color: transparent;
  }
  html, body, #root { height: 100%; }
  body {
    -webkit-font-smoothing: antialiased;
    font-family: -apple-system, 'Noto Sans KR', 'Apple SD Gothic Neo', sans-serif;
  }

  /* Kakao Maps: injected via className in MapView */
  .user-dot {
    width: 16px;
    height: 16px;
    background: ${theme.colors.blue};
    border: 3px solid #fff;
    border-radius: 50%;
    box-shadow: 0 0 0 4px rgba(49,130,246,0.25);
  }
  .station-marker {
    width: 12px;
    height: 12px;
    border: 2px solid #fff;
    border-radius: 50%;
    box-shadow: 0 1px 4px rgba(0,0,0,0.25);
  }
`;

export function GlobalStyles() {
  return <Global styles={globals} />;
}
