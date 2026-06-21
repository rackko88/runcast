import styled from '@emotion/styled';
import { theme } from '@runcast/ui';
import { useLocation, useNavigate } from 'react-router-dom';
import { Map, Bell, Cloud, Waves } from 'lucide-react';

const TABS = [
  { id: 'map',     Icon: Map,   label: '지도' },
  { id: 'weather', Icon: Cloud, label: '날씨' },
  { id: 'river',   Icon: Waves, label: '하천' },
  { id: 'notice',  Icon: Bell,  label: '공지' },
];

const Nav = styled.nav`
  flex-shrink: 0;
  display: flex; background: ${theme.colors.white};
  border-top: 1px solid ${theme.colors.gray200};
  padding-bottom: env(safe-area-inset-bottom, 0px);
  @media (min-width: ${theme.bp.pc}) { display: none; }
`;
const BtnInner = styled.div`
  display: flex; flex-direction: column; align-items: center; justify-content: center;
  gap: 4px; height: ${theme.sizes.tabsH};
`;
const Btn = styled.button<{ $active: boolean }>`
  flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-start;
  background: none; border: none; cursor: pointer; position: relative; padding: 0;
  color: ${p => p.$active ? theme.colors.blue : theme.colors.gray400};
  transition: color 0.15s;
`;
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
      {TABS.map(({ id, Icon, label }) => (
        <Btn
          key={id}
          $active={activeTab === id}
          onClick={() => navigate(id === 'map' ? '/' : `/${id}`)}
        >
          <BtnInner>
            <Icon size={22} strokeWidth={activeTab === id ? 2.2 : 1.8} />
            <Label>{label}</Label>
            {id === 'river'  && alertCount > 0  && <Badge>{alertCount}</Badge>}
            {id === 'notice' && hasEmergency     && <Badge>!</Badge>}
          </BtnInner>
        </Btn>
      ))}
    </Nav>
  );
}
