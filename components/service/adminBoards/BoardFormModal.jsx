'use client';

import { useEffect, useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BOARD_WRITE_ROLE_OPTIONS,
  fromWriteRoleGroup,
  toWriteRoleGroup,
} from '@/constants/adminBoards';

/**
 * 게시판 수정 / 생성 모달
 * mode에 따라 제목과 초기값만 달라진다. 저장 처리는 부모가 담당.
 */
export default function BoardFormModal({ open, mode = 'create', board = null, onClose, onSubmit }) {
  const isEdit = mode === 'edit';

  const [boardName, setBoardName] = useState('');
  const [writePermission, setWritePermission] = useState('');

  // 열릴 때마다 초기값을 채운다 (수정은 기존 값, 생성은 빈 값)
  // 작성 권한은 관리 Lv.1~3을 '관리자' 하나로 묶어서 보여준다.
  useEffect(() => {
    if (!open) return;
    setBoardName(isEdit ? (board?.boardName ?? '') : '');
    setWritePermission(isEdit && board ? toWriteRoleGroup(board.writePermission) : '');
  }, [open, isEdit, board]);

  const canSubmit = boardName.trim().length > 0 && Boolean(writePermission);

  const handleConfirm = () => {
    if (!canSubmit) return;
    onSubmit?.({
      boardName: boardName.trim(),
      // '관리자'를 골랐으면 기존 관리 Lv.N을 유지한 채 저장한다.
      writePermission: fromWriteRoleGroup(writePermission, board?.writePermission),
    });
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        hideCloseButton
        className="max-h-[90vh] max-w-[346px] gap-[20px] overflow-y-auto rounded-[4px] border-[#dedede] p-[25px]"
      >
        <DialogTitle className="text-[16px] font-semibold leading-[1.6] tracking-[-0.32px] text-[#212121]">
          {isEdit ? '게시판 수정' : '게시판 생성'}
        </DialogTitle>

        {/* 디자인상 보이는 설명은 없지만, 스크린리더 안내와 Radix 경고 방지를 위해 넣는다 */}
        <DialogDescription className="sr-only">
          게시판 이름과 작성 권한을 {isEdit ? '수정' : '입력'}합니다.
        </DialogDescription>

        <div className="flex flex-col gap-[4px]">
          <label
            htmlFor="board-form-name"
            className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]"
          >
            게시판 이름
          </label>
          <Input
            id="board-form-name"
            value={boardName}
            onChange={(e) => setBoardName(e.target.value)}
            placeholder="게시판 이름을 입력하세요."
            className="h-[52px] rounded-[4px] border-[#b9b9b9] text-[16px] tracking-[-0.32px] shadow-none placeholder:text-[#b9b9b9]"
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">권한</span>
          <Select value={writePermission} onValueChange={setWritePermission}>
            {/* 모달은 디자인대로 아래 화살표(SelectTrigger 기본 아이콘)를 그대로 쓴다 */}
            <SelectTrigger
              aria-label="작성 권한 선택"
              className="h-[40px] w-[120px] justify-between rounded-[4px] border-[#b9b9b9] px-[10px] text-[14px] tracking-[-0.28px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9] [&>svg]:size-5 [&>svg]:opacity-100"
            >
              <SelectValue placeholder="선택" />
            </SelectTrigger>
            <SelectContent>
              {BOARD_WRITE_ROLE_OPTIONS.map((option) => (
                <SelectItem key={option} value={option} className="text-[14px] text-[#454545]">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <DialogFooter className="flex flex-row justify-end gap-[12px] sm:space-x-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="h-[48px] w-[87px] rounded-[4px] border-[#b9b9b9] text-[16px] text-[#212121]"
          >
            취소
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={!canSubmit}
            className="h-[48px] w-[87px] rounded-[4px] bg-[#212121] text-[16px] text-white hover:bg-[#424242]"
          >
            확인
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
