import styled from '@emotion/styled';
import { theme } from '@runcast/ui';
import { useLocation, useNavigate } from 'react-router-dom';

const TABS = [
  { id: 'map',    icon: '🗺️', label: '지도'  },
  { id: 'notice', icon: '📋', label: '공지'  },
  { id: 'weather',icon: '🌤️', label: '날씨'  },
  { id: 'river',  icon: '💧', label: '하천'  },
];

const Nav = styled.nav`
  height: ${theme.sizes.tabsH}; flex-shrink: 0;
  display: flex; background: ${theme.colors.white};
  border-top: 1px solid ${theme.colors.gray200};
  @media (min-width: ${theme.bp.pc}) { display: none; }
`;
const Btn = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 3px; background: none; border: none; cursor: pointer; position: relative; padding: 0;
  color: ${p => p.$active ? theme.colors.blue : theme.colors.gray400};
  transition: color 0.15s;
`;
const Icon = styled.span<{ $active: boolean }>`font-size: 20px; line-height: 1; transition: transform 0.15s; ${p => p.$active && 'transform: scale(1.1);'}`;
const Label = styled.span`font-size: 10px; font-weight: 600; letter-spacing: -0.2px;`;
const Badge = styled.span`
  position: absolute; top: 6px; right: calc(50% - 20px);
  background: ${theme.colors.red}; color: #fff;
  font-size: 9px; font-weight: 700; min-width: 14px;
  padding: 1px 3px; border-radius: 8px; line-height: 1.4; text-align: center;
`;

interface Props { alertCount: number; hasEmergency: boolean; }

export default function BottomTabBar({ alertCount, hasEmergency }: Props) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const activeTab = pathname === '/' ? 'map' : pathname.slice(1);

  return (
    <Nav>
      {TABS.map(tab => (
        <Btn
          key={tab.id}
          $active={activeTab === tab.id}
          onClick={() => navigate(tab.id === 'map' ? '/' : `/${tab.id}`)}
        >
          <Icon $active={activeTab === tab.id}>{tab.icon}</Icon>
          <Label>{tab.label}</Label>
          {tab.id === 'river' && alertCount > 0 && <Badge>{alertCount}</Badge>}
          {tab.id === 'notice' && hasEmergency && <Badge>!</Badge>}
        </Btn>
      ))}
    </Nav>
  );
}
