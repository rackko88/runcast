import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '@runcast/ui';
import type { Notice } from '@/types';

const shimmer = keyframes`0%,100%{opacity:.5} 50%{opacity:1}`;

const Board = styled.div`display: flex; flex-direction: column; height: 100%;`;
const BoardHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;`;
const BoardTitle = styled.span`font-size: 11px; font-weight: 700; color: ${theme.colors.gray400}; letter-spacing: 0.5px; text-transform: uppercase;`;
const BoardMeta = styled.div`display: flex; align-items: center; gap: 6px;`;
const UpdateTime = styled.span`font-size: 11px; color: ${theme.colors.gray400};`;
const RefreshBtn = styled.button`background: ${theme.colors.gray100}; border: none; color: ${theme.colors.gray800}; width: 28px; height: 28px; border-radius: 8px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;`;
const List = styled.ul`list-style: none; display: flex; flex-direction: column; gap: 2px;`;
const Item = styled.li<{ $emergency: boolean }>`
  a {
    display: flex; align-items: center; gap: 8px; padding: 9px 6px;
    text-decoration: none; border-radius: 8px; transition: background 0.15s;
    ${p => p.$emergency && `background: rgba(240,68,82,0.05);`}
    &:hover { background: ${theme.colors.gray100}; }
  }
`;
const SkeletonItem = styled.div`height: 38px; border-radius: 8px; background: ${theme.colors.gray100}; animation: ${shimmer} 1.4s infinite; margin-bottom: 4px;`;
const Source = styled.span<{ $bg?: string }>`
  flex-shrink: 0; font-size: 10px; font-weight: 700; color: #fff;
  padding: 2px 7px; border-radius: 5px; line-height: 1.6;
  background: ${p => p.$bg ?? theme.colors.gray400};
`;
const Title = styled.span<{ $emergency: boolean }>`
  flex: 1; font-size: 12px; line-height: 1.4;
  white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
  color: ${p => p.$emergency ? theme.colors.red : theme.colors.gray800};
  font-weight: ${p => p.$emergency ? 600 : 400};
`;
const Date = styled.span`flex-shrink: 0; font-size: 10px; color: ${theme.colors.gray400}; white-space: nowrap;`;
const Empty = styled.div`font-size: 12px; color: ${theme.colors.gray400}; text-align: center; padding: 24px 0;`;

interface Props {
  notices: Notice[];
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void;
}

export default function NoticeBoard({ notices, loading, lastUpdated, onRefresh }: Props) {
  return (
    <Board>
      <BoardHeader>
        <BoardTitle>공지사항</BoardTitle>
        <BoardMeta>
          {lastUpdated && (
            <UpdateTime>{lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</UpdateTime>
          )}
          <RefreshBtn onClick={onRefresh}>↻</RefreshBtn>
        </BoardMeta>
      </BoardHeader>

      {loading ? (
        [1,2,3].map(i => <SkeletonItem key={i} />)
      ) : notices.length === 0 ? (
        <Empty>새 공지사항이 없습니다</Empty>
      ) : (
        <List>
          {notices.map((n, i) => (
            <Item key={i} $emergency={n.isEmergency}>
              <a href={n.url} target="_blank" rel="noopener noreferrer">
                <Source $bg={n.color}>{n.source}</Source>
                <Title $emergency={n.isEmergency}>{n.title}</Title>
                {n.date && <Date>{n.date}</Date>}
              </a>
            </Item>
          ))}
        </List>
      )}
    </Board>
  );
}
