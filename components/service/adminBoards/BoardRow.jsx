'use client';

import { Menu } from 'lucide-react';

import RowActionButton from '@/components/shared/admin/RowActionButton';
import { TableCell, TableRow } from '@/components/ui/table';
import { getReadScopeLabel, getWriteLevelLabel } from '@/constants/adminBoards';

// board: 서버 응답 그대로 — boardId, boardName, postCount, readScope, writeLevel, displayOrder
//
// 권한은 표에서 바로 바꾸지 않고 읽기 전용으로 보여준다 (시안).
// 값을 바꾸려면 관리 열의 '수정'으로 모달을 연다.
export default function BoardRow({
  board,
  onEdit,
  onManageCategories,
  onDelete,
  // 저장 중에는 행 버튼을 잠근다 (연달아 눌러 요청이 겹치는 것을 막는다)
  disabled = false,
  // 드래그로 순서 변경
  isDragging = false,
  isDropTarget = false,
  dropPosition = null, // 'above' | 'below' - 놓았을 때 들어갈 자리
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}) {
  return (
    // 행은 '놓는 곳'만 담당한다. 끄는 동작은 오른쪽 핸들에만 건다.
    <TableRow
      onDragOver={(e) => {
        // preventDefault를 해줘야 drop이 허용된다
        e.preventDefault();
        onDragOver?.(board.boardId);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(board.boardId);
      }}
      className={`h-[46px] border-b border-[#b9b9b9] text-[16px] leading-[1.6] tracking-[-0.02em] text-[#212121] ${
        isDragging ? 'opacity-40' : ''
      } ${
        // 행에 이미 border-b(회색)가 있어 아래쪽 표시선이 묻힌다.
        // 표시선은 항상 보여야 하므로 !(important)로 우선순위를 확실히 준다.
        isDropTarget
          ? dropPosition === 'below'
            ? '!border-b-2 !border-b-[#212121]'
            : '!border-t-2 !border-t-[#212121]'
          : ''
      }`}
    >
      {/* 1. 게시판 명 · 게시글 수 */}
      <TableCell className="whitespace-nowrap text-center">{board.boardName}</TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {board.postCount?.toLocaleString() ?? 0}
      </TableCell>

      {/* 2. 열람 · 작성 권한 (읽기 전용) */}
      <TableCell className="whitespace-nowrap text-center">
        {getReadScopeLabel(board.readScope)}
      </TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {getWriteLevelLabel(board.writeLevel)}
      </TableCell>

      {/* 3. 카테고리 - 이 게시판에서 쓸 태그를 등록·수정·삭제한다.
             게시판을 만들어도 태그는 DB 를 직접 고쳐야 했던 것을 여기로 꺼냈다 */}
      <TableCell className="text-center">
        <RowActionButton
          className="min-w-[44px]"
          disabled={disabled}
          onClick={() => onManageCategories?.(board)}
        >
          카테고리 수정
        </RowActionButton>
      </TableCell>

      {/* 4. 관리 - 수정 모달 · 삭제. 공지사항은 지울 수 없어 삭제 버튼 자체를 두지 않는다 (서버도 막는다) */}
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-[6px]">
          <RowActionButton
            className="min-w-[44px]"
            disabled={disabled}
            onClick={() => onEdit?.(board)}
          >
            정보 수정
          </RowActionButton>
          {/* 공지사항은 지울 수 없다 — 버튼은 두되 눌리지 않게 (서버도 막는다) */}
          <RowActionButton
            filled
            className="min-w-[44px]"
            disabled={disabled || board.boardName === '공지사항'}
            title={board.boardName === '공지사항' ? '공지사항 게시판은 삭제할 수 없어요' : undefined}
            onClick={() => onDelete?.(board)}
          >
            삭제
          </RowActionButton>
        </div>
      </TableCell>

      {/* 5. 순서 변경 핸들 - 실제로 끄는 동작은 여기서만 시작된다
          마우스 드래그 전용이라(키보드·터치 미지원) 보조기기에는 노출하지 않는다.
          TODO: 키보드/터치로도 순서를 바꿔야 하면 방향키 조작이나 위·아래 버튼을 추가할 것 */}
      <TableCell className="text-center">
        <span
          aria-hidden
          draggable={!disabled}
          onDragStart={() => onDragStart?.(board.boardId)}
          onDragEnd={() => onDragEnd?.()}
          title="드래그해서 순서 변경"
          className="inline-flex cursor-grab text-[#dedede] active:cursor-grabbing"
        >
          <Menu className="size-5" />
        </span>
      </TableCell>
    </TableRow>
  );
}
