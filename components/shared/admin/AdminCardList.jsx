'use client';

import Link from 'next/link';

import RowCheckbox from '@/components/shared/admin/RowCheckbox';
import SelectAllCheckbox from '@/components/shared/admin/SelectAllCheckbox';

/**
 * 좁은 화면에서 관리자 표를 대신하는 카드 목록.
 *
 * 관리자 표는 열이 8~12개라 가로 915px 을 잡는다. 폰에서는 좌우로 밀어야 겨우 한 칸씩 보였고,
 * 어느 줄을 보고 있는지도 잃어버렸다. 그래서 한 줄을 카드 하나로 세운다 —
 * 무엇인지(제목)를 맨 위에, 나머지는 '이름 값' 짝으로, 조치 버튼은 맨 아래 한 줄에 둔다.
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

/**
 * 카드 한 장.
 *
 * @param title      무엇에 대한 줄인가 (글 제목·댓글 내용·신고 대상 미리보기)
 * @param titleHref  제목을 누르면 갈 곳. 없으면 글자만 보여 준다
 * @param metaRows   [{ label, value }] — 값이 비면 그 줄은 그리지 않는다
 * @param stateLabel 오른쪽 위 상태 배지 (정상/블라인드/삭제 등)
 * @param actions    맨 아래 버튼 줄
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
  return (
    <div className="border-b border-[#B9B9B9] px-1 py-[14px]">
      <div className="flex items-start gap-[10px]">
        {onSelectChange && (
          <span className="pt-[3px]">
            <RowCheckbox checked={selected} onCheckedChange={onSelectChange} label={selectLabel} />
          </span>
        )}

        <div className="min-w-0 flex-1">
          {titleHref ? (
            <Link
              href={titleHref}
              className="line-clamp-2 text-[15px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121] underline-offset-2 hover:underline"
            >
              {title}
            </Link>
          ) : (
            <p className="line-clamp-2 text-[15px] font-semibold leading-[1.5] tracking-[-0.02em] text-[#212121]">
              {title}
            </p>
          )}

          <dl className="mt-[6px] flex flex-col gap-[2px]">
            {metaRows
              .filter((row) => row && row.value !== null && row.value !== undefined && row.value !== '')
              .map((row) => (
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
        </div>

        {stateLabel && (
          <span className="shrink-0 rounded-[13px] border border-[#B9B9B9] px-2 py-[1px] text-[12px] leading-[1.5] text-[#454545]">
            {stateLabel}
          </span>
        )}
      </div>

      {actions && <div className="mt-[10px] flex flex-wrap justify-end gap-2">{actions}</div>}
    </div>
  );
}
