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
  BOARD_READ_SCOPE_OPTIONS,
  BOARD_WRITE_LEVEL_OPTIONS,
  fromWriteLevelValue,
  toWriteLevelValue,
} from '@/constants/adminBoards';

// 모달의 권한 드롭박스 (디자인: 높이 40px, 폭 120px, 아래 화살표는 SelectTrigger 기본 아이콘)
// 열람 · 작성 두 칸이 같은 모양이라 하나로 묶어 쓴다.
function FormSelect({ label, value, options, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-[40px] w-[120px] justify-between rounded-[4px] border-[#b9b9b9] px-[10px] text-[14px] tracking-[-0.28px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9] [&>svg]:size-5 [&>svg]:opacity-100"
      >
        <SelectValue placeholder="선택" />
      </SelectTrigger>
      <SelectContent>
        {options.map((option) => (
          <SelectItem
            key={option.value}
            value={option.value}
            className="text-[14px] text-[#454545]"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

/**
 * 게시판 수정 / 생성 모달
 * mode에 따라 제목과 초기값만 달라진다. 저장 처리(API 호출)는 부모가 담당.
 * onSubmit에는 서버가 받는 형식({ name, readScope, writeLevel })으로 넘긴다.
 *
 * 저장에 실패해도 모달은 열어 둔다. 이름 중복(409)처럼 한 글자만 고치면 되는 실패가 흔한데
 * 닫아 버리면 이름 · 열람 권한 · 작성 권한을 처음부터 다시 채워야 한다.
 * 실패 사유는 부모가 errorMessage로 내려주고, 여기서는 확인 버튼 위에 보여주기만 한다.
 */
export default function BoardFormModal({
  open,
  mode = 'create',
  board = null,
  errorMessage = '',
  onClose,
  onSubmit,
}) {
  const isEdit = mode === 'edit';

  const [boardName, setBoardName] = useState('');
  const [readScope, setReadScope] = useState('');
  // select 값은 문자열로 들고 있다가 보낼 때 숫자로 바꾼다 (Radix Select 제약)
  const [writeLevelValue, setWriteLevelValue] = useState('');
  // 저장 중에 확인을 두 번 눌러 요청이 겹치는 것을 막는다
  const [submitting, setSubmitting] = useState(false);

  // 열릴 때마다 초기값을 채운다 (수정은 기존 값, 생성은 빈 값)
  useEffect(() => {
    if (!open) return;
    setBoardName(isEdit ? (board?.boardName ?? '') : '');
    setReadScope(isEdit ? (board?.readScope ?? '') : '');
    setWriteLevelValue(isEdit && board ? toWriteLevelValue(board.writeLevel) : '');
    setSubmitting(false);
  }, [open, isEdit, board]);

  const canSubmit =
    boardName.trim().length > 0 && Boolean(readScope) && writeLevelValue !== '' && !submitting;

  const handleConfirm = async () => {
    if (!canSubmit) return;
    setSubmitting(true);

    await onSubmit?.({
      name: boardName.trim(),
      readScope,
      writeLevel: fromWriteLevelValue(writeLevelValue),
    });

    setSubmitting(false);
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
          게시판 이름과 열람 · 작성 권한을 {isEdit ? '수정' : '입력'}합니다.
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
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            열람 권한
          </span>
          <FormSelect
            label="열람 권한 선택"
            value={readScope}
            options={BOARD_READ_SCOPE_OPTIONS}
            onChange={setReadScope}
          />
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            작성 권한
          </span>
          <FormSelect
            label="작성 권한 선택"
            value={writeLevelValue}
            options={BOARD_WRITE_LEVEL_OPTIONS}
            onChange={setWriteLevelValue}
          />
        </div>

        {/* 저장 실패 사유 (예: 이미 존재하는 게시판 이름입니다.)
            role="alert"로 넣어 스크린리더가 뜨는 즉시 읽어 주게 한다. */}
        {errorMessage && (
          <p
            role="alert"
            className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#f44336]"
          >
            {errorMessage}
          </p>
        )}

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
