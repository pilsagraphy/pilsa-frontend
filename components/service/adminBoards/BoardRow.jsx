'use client';

import { ChevronUp, Menu } from 'lucide-react';

import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { TableCell, TableRow } from '@/components/ui/table';
import {
  BOARD_READ_ROLE_OPTIONS,
  BOARD_WRITE_ROLE_OPTIONS,
  fromWriteRoleGroup,
  toWriteRoleGroup,
} from '@/constants/adminBoards';

// 권한 변경 드롭박스 (디자인: 높이 36px, 회색 외곽선, 14px, 화살표는 위 방향)
// SelectTrigger 기본 아이콘(아래 화살표)은 숨기고 디자인대로 위 화살표를 직접 넣는다.
function PermissionSelect({ label, value, options, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="mx-auto h-[36px] w-[98px] justify-between rounded-[4px] border-[#b9b9b9] px-[10px] text-[14px] tracking-[-0.28px] text-[#454545] shadow-none [&>svg]:hidden"
      >
        <SelectValue placeholder="선택" />
        <span className="shrink-0">
          <ChevronUp className="size-5 text-[#212121]" />
        </span>
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem key={option} value={option} className="text-[14px] text-[#454545]">
            {option}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

// board: id, boardName, postCount, readPermission, writePermission, priority
export default function BoardRow({
  board,
  selected = false,
  onSelectChange,
  onFieldChange,
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
    // 행은 '놓는 곳'만 담당한다.
    // 행 전체를 draggable로 두면 체크박스·권한 Select를 조작할 때 드래그가 시작되어
    // 드롭다운이 열리지 않는 문제가 생기므로, 끄는 동작은 오른쪽 핸들에만 건다.
    <TableRow
      onDragOver={(e) => {
        // preventDefault를 해줘야 drop이 허용된다
        e.preventDefault();
        onDragOver?.(board.id);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDrop?.(board.id);
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
      {/* 1. 선택 체크박스
          table.jsx의 [&>[role=checkbox]]:translate-y-[2px]가 직계 자식에만 걸리므로,
          헤더(연한 체크를 겹쳐 놓느라 span으로 감쌈)와 위치를 맞추려고 같은 구조로 감싼다. */}
      <TableCell className="text-center">
        <span className="relative inline-flex">
          <Checkbox
            checked={selected}
            onCheckedChange={(checked) => onSelectChange?.(board.id, checked === true)}
            aria-label={`${board.boardName} 선택`}
            className="size-6 rounded-[4px] border-[#919191] data-[state=checked]:border-[#212121] data-[state=checked]:bg-[#212121]"
          />
        </span>
      </TableCell>

      {/* 2. 게시판 명 · 게시글 수 */}
      <TableCell className="whitespace-nowrap text-center">{board.boardName}</TableCell>
      <TableCell className="whitespace-nowrap text-center">
        {board.postCount?.toLocaleString() ?? 0}
      </TableCell>

      {/* 3. 열람 권한 */}
      <TableCell className="whitespace-nowrap text-center">
        <PermissionSelect
          label={`${board.boardName} 열람 권한`}
          value={board.readPermission}
          options={BOARD_READ_ROLE_OPTIONS}
          onChange={(next) => onFieldChange?.(board.id, 'readPermission', next)}
        />
      </TableCell>

      {/* 4. 작성 권한 (관리 Lv.1~3은 '관리자' 하나로 묶어 보여준다) */}
      <TableCell className="whitespace-nowrap text-center">
        <PermissionSelect
          label={`${board.boardName} 작성 권한`}
          value={toWriteRoleGroup(board.writePermission)}
          options={BOARD_WRITE_ROLE_OPTIONS}
          onChange={(next) =>
            onFieldChange?.(
              board.id,
              'writePermission',
              fromWriteRoleGroup(next, board.writePermission)
            )
          }
        />
      </TableCell>

      {/* 5. 순서 변경 핸들 - 실제로 끄는 동작은 여기서만 시작된다
          마우스 드래그 전용이라(키보드·터치 미지원) 보조기기에는 노출하지 않는다.
          TODO: 키보드/터치로도 순서를 바꿔야 하면 방향키 조작이나 위·아래 버튼을 추가할 것 */}
      <TableCell className="text-center">
        <span
          aria-hidden
          draggable
          onDragStart={() => onDragStart?.(board.id)}
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
