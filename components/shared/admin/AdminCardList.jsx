'use client';

import { useState } from 'react';
import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';

/**
 * 좁은 화면에서 관리자 표를 대신하는 카드 목록.
 *
 * 관리자 표는 열이 8~12개라 가로 915px 을 잡는다. 폰에서는 좌우로 밀어야 겨우 한 칸씩 보였고,
 * 어느 줄을 보고 있는지도 잃어버렸다. 그래서 한 줄을 카드 하나로 세운다.
 *
 * 한 장의 배치 (회원 카드와 같은 틀):
 *   [선택] 제목(링크) ····· [상태] [조치 버튼들]
 *          [자세히]  → 누르면 게시판·글쓴이·수치·작성일이 펼쳐진다
 * 자주 보는 것(제목·상태·조치)만 접기 전에 두고, 나머지는 접어 둔다 — 카드가 길어지면 한 화면에 두 장도 안 들어간다.
 *
 * 게시글·댓글·신고 목록이 생김새가 같아 여기서 한 벌만 만든다. md 이상에서는 기존 표가 그대로 쓰인다.
 */

/** 전체 선택 줄 — 표의 머리글 체크박스 자리 */
export function AdminSelectAllBar({
  checked = false,
  disabled = false,
  onCheckedChange,
  label,
  selectedCount = 0,
}) {
  return (
    <div className="flex items-center gap-[10px] border-b border-[#B9B9B9] px-1 py-[10px]">
      <SelectAllCheckbox
        checked={checked}
        disabled={disabled}
        onCheckedChange={onCheckedChange}
        label={label}
      />
      <span className="text-[13px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
        {checked ? '전체 해제' : '전체 선택'}
        {selectedCount > 0 && ` · ${selectedCount}개 선택됨`}
      </span>
    </div>
  );
}

/** 목록 껍데기. 비었거나 불러오는 중이면 그 문구만 보여 준다 */
export function AdminCardList({ emptyMessage = '', children }) {
  if (emptyMessage) {
    return (
      <p
        suppressHydrationWarning
        className="border-b border-[#B9B9B9] py-10 text-center text-[14px] text-[#919191]"
      >
        {emptyMessage}
      </p>
    );
  }
  return <div className="flex flex-col">{children}</div>;
}

/** 상태 배지 — 관리자 상세의 StateChip 과 같은 둥근 모양 */
export function AdminStatePill({ label }) {
  if (!label) return null;
  return (
    <span className="shrink-0 rounded-full border border-[#B9B9B9] px-[9px] py-[1px] text-[12px] leading-[1.5] text-[#454545]">
      {label}
    </span>
  );
}

/**
 * 카드 한 장.
 *
 * @param title      무엇에 대한 줄인가 (글 제목·댓글 내용·신고 대상 미리보기)
 * @param titleHref  (안 쓴다) 제목은 글자만 둔다 — 갈 곳은 '자세히' 안에 '원글 보기'로 넣는다
 * @param metaRows   [{ label, value }] — '자세히'를 누르면 펼쳐진다. 값이 비면 그 줄은 없다
 * @param stateLabel 제목 오른쪽 상태 배지 (공개/블라인드/삭제 등)
 * @param actions    상태 옆 조치 버튼들
 */
export function AdminCard({
  selected = false,
  onSelectChange,
  selectLabel,
  title,
  titleHref,
  metaRows = [],
  stateLabel,
  actions,
}) {
  const [open, setOpen] = useState(false);
  const rows = metaRows.filter(
    (row) => row && row.value !== null && row.value !== undefined && row.value !== ''
  );

  const titleClass =
    'line-clamp-2 text-[15px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]';

  return (
    <div className="border-b border-[#B9B9B9] px-1 py-[12px]">
      <div className="flex items-start gap-[10px]">
        {onSelectChange && (
          <span className="pt-[2px]">
            <RowCheckbox checked={selected} onCheckedChange={onSelectChange} label={selectLabel} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          <p className={titleClass}>{title}</p>

          {rows.length > 0 && (
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              aria-expanded={open}
              className="mt-[6px] text-[12px] leading-[1.6] text-[#919191] underline underline-offset-2"
            >
              {open ? '접기' : '자세히'}
            </button>
          )}
        </div>

        {/* 오른쪽: 상태 위, 조치 아래 — 제목 줄과 같은 높이에서 시작한다 */}
        <div className="flex shrink-0 flex-col items-end gap-[6px]">
          <AdminStatePill label={stateLabel} />
          {actions && <div className="flex gap-[6px]">{actions}</div>}
        </div>
      </div>

      {open && rows.length > 0 && (
        <dl className="mt-[8px] flex flex-col gap-[2px] rounded-[6px] bg-[#FAFAFA] px-[12px] py-[8px]">
          {rows.map((row) => (
            <div key={row.label} className="flex items-start justify-between gap-3">
              <dt className="shrink-0 text-[12px] leading-[1.6] tracking-[-0.02em] text-[#919191]">
                {row.label}
              </dt>
              <dd
                suppressHydrationWarning
                className="min-w-0 flex-1 truncate text-right text-[13px] leading-[1.6] tracking-[-0.02em] text-[#454545]"
              >
                {row.value}
              </dd>
            </div>
          ))}
        </dl>
      )}
    </div>
  );
}
