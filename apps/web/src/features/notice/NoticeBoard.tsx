import { useState } from 'react';
import styled from '@emotion/styled';
import { keyframes } from '@emotion/react';
import { theme } from '@runcast/ui';
import { useRefreshFeedback } from '@/shared/useRefreshFeedback';
import type { Notice } from '@/types';

const shimmer = keyframes`0%,100%{opacity:.5} 50%{opacity:1}`;
const spin = keyframes`to { transform: rotate(360deg); }`;
const fadeIn  = keyframes`from{opacity:0} to{opacity:1}`;
const slideUp = keyframes`from{transform:translateY(100%)} to{transform:translateY(0)}`;

/* ── 목록 ── */
const Board = styled.div`display: flex; flex-direction: column; height: 100%;`;
const BoardHeader = styled.div`display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;`;
const BoardTitle = styled.span`font-size: 11px; font-weight: 700; color: ${theme.colors.gray400}; letter-spacing: 0.5px; text-transform: uppercase;`;
const BoardMeta = styled.div`display: flex; align-items: center; gap: 6px;`;
const UpdateTime = styled.span`font-size: 11px; color: ${theme.colors.gray400};`;
const RefreshBtn = styled.button`background: ${theme.colors.gray100}; border: none; color: ${theme.colors.gray800}; width: 28px; height: 28px; border-radius: 8px; font-size: 14px; cursor: pointer; display: flex; align-items: center; justify-content: center;
  &:disabled { cursor: default; opacity: 0.7; }
`;
const RefreshIcon = styled.span<{ $spin: boolean }>`
  display: inline-block; line-height: 1;
  animation: ${p => p.$spin ? spin : 'none'} 0.7s linear infinite;
`;
const DoneTag = styled.span`
  font-size: 10px; font-weight: 700; color: ${theme.colors.green};
  background: #E7F9F0; padding: 2px 7px; border-radius: 6px;
`;
const List = styled.ul`list-style: none; display: flex; flex-direction: column; gap: 2px;`;
const Item = styled.li<{ $emergency: boolean }>`
  a, button {
    display: flex; align-items: center; gap: 8px; padding: 9px 6px;
    text-decoration: none; border-radius: 8px; transition: background 0.15s;
    width: 100%; background: none; border: none; cursor: pointer; text-align: left;
    ${p => p.$emergency && `background: rgba(240,68,82,0.05);`}
    &:hover { background: ${theme.colors.gray100}; }
  }
`;
const SkeletonItem = styled.div`height: 38px; border-radius: 8px; background: ${theme.colors.gray100}; animation: ${shimmer} 1.4s infinite; margin-bottom: 4px;`;
const Source = styled.span<{ $bg?: string }>`flex-shrink: 0; font-size: 10px; font-weight: 700; color: #fff; padding: 2px 7px; border-radius: 5px; line-height: 1.6; background: ${p => p.$bg ?? theme.colors.gray400};`;
const NewBadge = styled.span`
  flex-shrink: 0; font-size: 9px; font-weight: 800; color: #fff;
  background: #EC4899; padding: 1px 5px; border-radius: 5px;
  letter-spacing: 0.3px; line-height: 1.6;
`;
const Title = styled.span<{ $emergency: boolean }>`flex: 1; font-size: 12px; line-height: 1.4; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; color: ${p => p.$emergency ? theme.colors.red : theme.colors.gray800}; font-weight: ${p => p.$emergency ? 600 : 400};`;
const DateLabel = styled.span`flex-shrink: 0; font-size: 10px; color: ${theme.colors.gray400}; white-space: nowrap;`;
const Empty = styled.div`font-size: 12px; color: ${theme.colors.gray400}; text-align: center; padding: 24px 0;`;

/* ── 모달 ── */
const Backdrop = styled.div`
  position: fixed; inset: 0; background: rgba(0,0,0,0.45);
  z-index: 200; animation: ${fadeIn} 0.2s ease;
  display: flex; align-items: flex-end;
  @media (min-width: ${theme.bp.pc}) { align-items: center; justify-content: center; }
`;
const Sheet = styled.div`
  background: ${theme.colors.white}; width: 100%; max-height: 80dvh;
  border-radius: 20px 20px 0 0; overflow: hidden; display: flex; flex-direction: column;
  animation: ${slideUp} 0.25s ease;
  @media (min-width: ${theme.bp.pc}) {
    max-width: 520px; max-height: 70vh; border-radius: 20px;
    animation: ${fadeIn} 0.2s ease;
  }
`;
const SheetHeader = styled.div<{ $emergency: boolean }>`
  padding: 20px 20px 16px; border-bottom: 1px solid ${theme.colors.gray100};
  background: ${p => p.$emergency ? 'rgba(240,68,82,0.04)' : theme.colors.white};
`;
const SheetMeta = styled.div`display: flex; align-items: center; gap: 8px; margin-bottom: 10px;`;
const SheetDate = styled.span`font-size: 11px; color: ${theme.colors.gray400};`;
const SheetTitle = styled.h2<{ $emergency: boolean }>`
  font-size: 16px; font-weight: 700; line-height: 1.5;
  color: ${p => p.$emergency ? theme.colors.red : theme.colors.black};
`;
const SheetBody = styled.div`
  flex: 1; overflow-y: auto; padding: 20px;
`;
const ContentText = styled.p`
  font-size: 14px; color: ${theme.colors.gray800}; line-height: 1.8;
  white-space: pre-wrap; word-break: keep-all;
`;
const NoContent = styled.p`font-size: 13px; color: ${theme.colors.gray400}; text-align: center; padding: 24px 0;`;
const SheetFooter = styled.div`padding: 12px 20px; border-top: 1px solid ${theme.colors.gray100}; display: flex; gap: 8px;`;
const ExternalBtn = styled.a`
  flex: 1; text-align: center; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600;
  text-decoration: none; border: 1px solid ${theme.colors.gray200}; color: ${theme.colors.gray600};
  &:hover { background: ${theme.colors.gray50}; }
`;
const CloseBtn = styled.button`
  flex: 1; padding: 10px; border-radius: 10px; font-size: 13px; font-weight: 600; border: none;
  background: ${theme.colors.blue}; color: #fff; cursor: pointer;
  &:hover { opacity: 0.9; }
`;

interface Props {
  notices: Notice[];
  loading: boolean;
  lastUpdated: Date | null;
  onRefresh: () => void | Promise<unknown>;
}

export default function NoticeBoard({ notices, loading, lastUpdated, onRefresh }: Props) {
  const [selected, setSelected] = useState<Notice | null>(null);
  const { refreshing, justDone, handleRefresh } = useRefreshFeedback(onRefresh);

  return (
    <>
      <Board>
        <BoardHeader>
          <BoardTitle>공지사항</BoardTitle>
          <BoardMeta>
            {refreshing ? (
              <UpdateTime>갱신 중…</UpdateTime>
            ) : justDone ? (
              <DoneTag>✓ 갱신됨</DoneTag>
            ) : lastUpdated && (
              <UpdateTime>{lastUpdated.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}</UpdateTime>
            )}
            <RefreshBtn onClick={handleRefresh} disabled={refreshing} title="새로고침">
              <RefreshIcon $spin={refreshing}>↻</RefreshIcon>
            </RefreshBtn>
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
                <button onClick={() => setSelected(n)}>
                  <Source $bg={n.color}>{n.source}</Source>
                  {n.isNew && <NewBadge>NEW</NewBadge>}
                  <Title $emergency={n.isEmergency}>{n.title}</Title>
                  {n.date && <DateLabel>{n.date}</DateLabel>}
                </button>
              </Item>
            ))}
          </List>
        )}
      </Board>

      {selected && (
        <Backdrop onClick={() => setSelected(null)}>
          <Sheet onClick={e => e.stopPropagation()}>
            <SheetHeader $emergency={selected.isEmergency}>
              <SheetMeta>
                <Source $bg={selected.color}>{selected.source}</Source>
                <SheetDate>{selected.date}</SheetDate>
              </SheetMeta>
              <SheetTitle $emergency={selected.isEmergency}>{selected.title}</SheetTitle>
            </SheetHeader>

            <SheetBody>
              {selected.content
                ? <ContentText>{selected.content}</ContentText>
                : <NoContent>본문을 불러올 수 없습니다</NoContent>
              }
            </SheetBody>

            <SheetFooter>
              {selected.url && (
                <ExternalBtn href={selected.url} target="_blank" rel="noopener noreferrer">
                  원문 보기 ↗
                </ExternalBtn>
              )}
              <CloseBtn onClick={() => setSelected(null)}>닫기</CloseBtn>
            </SheetFooter>
          </Sheet>
        </Backdrop>
      )}
    </>
  );
}
