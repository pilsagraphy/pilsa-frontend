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
// 게시판별로 켜고 끄는 기능. 키 이름은 서버(BoardSaveRequest)와 같다
const BOARD_FEATURE_FIELDS = [
  { key: 'allowComment', label: '댓글 사용', hint: '끄면 이 게시판 글에는 댓글을 달 수 없어요' },
  { key: 'allowAttachment', label: '첨부파일 사용', hint: '끄면 파일·이미지 첨부 버튼이 사라져요' },
  {
    key: 'categoryMode',
    label: '카테고리(태그) 사용',
    hint: '끄면 글쓰기에서 카테고리를 고르지 않고, 목록에도 배지가 없어요',
  },
  {
    key: 'allowAnonymous',
    label: '익명 글·댓글 허용',
    hint: '작성자 이름을 가려요. 운영·신고 처리에는 실제 작성자가 남아요',
  },
  {
    key: 'allowPrivateComment',
    label: '비밀댓글 허용',
    hint: '글쓴이와 운영진만 볼 수 있는 댓글을 달 수 있어요',
  },
];

function FormSelect({ label, value, options, onChange }) {
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger
        aria-label={label}
        className="h-[40px] w-full justify-between rounded-[4px] border-[#b9b9b9] px-[10px] text-[14px] tracking-[-0.28px] text-[#454545] shadow-none data-[placeholder]:text-[#b9b9b9] [&>svg]:size-5 [&>svg]:opacity-100"
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

  // 게시판별 사용 여부. 서버는 처음부터 받고 있었는데 화면에 없어 DB 를 직접 고쳐야 했다 (2026-09-20)
  const [flags, setFlags] = useState({
    allowComment: true,
    allowAttachment: true,
    categoryMode: true,
    allowAnonymous: false,
    allowPrivateComment: false,
  });

  // 열릴 때마다 초기값을 채운다 (수정은 기존 값, 생성은 빈 값)
  useEffect(() => {
    if (!open) return;
    setBoardName(isEdit ? (board?.boardName ?? '') : '');
    setReadScope(isEdit ? (board?.readScope ?? '') : '');
    setWriteLevelValue(isEdit && board ? toWriteLevelValue(board.writeLevel) : '');
    // 새 게시판의 기본값은 '댓글·첨부·카테고리는 쓰고, 익명과 비밀댓글은 끈다' —
    // 익명은 운영 부담이 크고 비밀댓글은 정보게시판처럼 필요한 곳에서만 켜는 기능이다
    setFlags({
      allowComment: isEdit ? board?.allowComment !== false : true,
      allowAttachment: isEdit ? board?.allowAttachment !== false : true,
      categoryMode: isEdit ? board?.categoryMode !== false : true,
      allowAnonymous: isEdit ? Boolean(board?.allowAnonymous) : false,
      allowPrivateComment: isEdit ? Boolean(board?.allowPrivateComment) : false,
    });
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
      ...flags,
    });

    setSubmitting(false);
  };

  return (
    <Dialog open={open} onOpenChange={(next) => !next && onClose?.()}>
      <DialogContent
        // 열리자마자 이름 칸에 포커스가 가면서 글자가 통째로 선택돼 보였다 (폰에서는 키보드까지 올라온다).
        // 고치러 들어온 사람이 이름부터 바꾸는 일은 드물다 — 자동 포커스를 끈다
        onOpenAutoFocus={(event) => event.preventDefault()}
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

        {/* 열람·작성 권한은 짝이라 한 줄에 나란히 — 세로로 쌓으면 모달이 길어지기만 한다 */}
        <div className="flex gap-3">
        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
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

        <div className="flex min-w-0 flex-1 flex-col gap-[4px]">
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
        </div>

        <div className="flex flex-col gap-[4px]">
          <span className="text-[12px] leading-[1.4] tracking-[-0.24px] text-[#919191]">
            사용 기능
          </span>
          <div className="rounded-[4px] border border-[#b9b9b9]">
            {BOARD_FEATURE_FIELDS.map(({ key, label, hint }, index) => (
              <label
                key={key}
                className={`flex cursor-pointer items-start gap-[10px] px-[14px] py-[12px] ${
                  index > 0 ? 'border-t border-[#EEEEEE]' : ''
                }`}
              >
                <input
                  type="checkbox"
                  checked={flags[key]}
                  onChange={(e) => setFlags((prev) => ({ ...prev, [key]: e.target.checked }))}
                  className="mt-[2px] size-[18px] shrink-0 cursor-pointer rounded-[2px] border border-[#919191] accent-[#212121]"
                />
                <span className="min-w-0">
                  <span className="block text-[14px] tracking-[-0.28px] text-[#212121]">{label}</span>
                  <span className="mt-[2px] block text-[12px] leading-[1.5] tracking-[-0.24px] text-[#919191]">
                    {hint}
                  </span>
                </span>
              </label>
            ))}
          </div>
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
