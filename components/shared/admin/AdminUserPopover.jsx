'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { getErrorMessage } from '@/apis/auth';
import { getUserDetail } from '@/apis/admin/users';
import { ROUTES } from '@/constants/routes';
import { MEMBER_TYPE_LABELS } from '@/constants/adminMembers';

// 관리자 화면에서 작성자 이름을 누르면 뜨는 작은 회원 요약 팝업 (PM 2026-10-10).
// 회원 상세 API 를 그대로 쓰고, 핵심만 보여 준 뒤 '상세 보기' 로 잇는다. 탈퇴 회원·id 없는 행(익명 마스킹)은 그냥 글자.
// 표 안에 absolute 로 두면 overflow 에 잘려서 body 에 fixed 로 띄운다 (ScheduleActionMenu 와 같은 이유).
const WIDTH = 280;
const GAP = 6;

const fmt = (iso) => (iso ? String(iso).slice(0, 10) : '-');
const daysAgo = (iso) => (iso ? Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 86400000)) : null);

export default function AdminUserPopover({ userId, name, className = '' }) {
  const [pos, setPos] = useState(null);
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const anchorRef = useRef(null);
  const panelRef = useRef(null);

  const open = () => {
    const rect = anchorRef.current?.getBoundingClientRect();
    if (!rect) return;
    const left = Math.max(8, Math.min(rect.left, window.innerWidth - WIDTH - 8));
    const below = window.innerHeight - rect.bottom;
    setPos(below > 260 ? { top: rect.bottom + GAP, left } : { bottom: window.innerHeight - rect.top + GAP, left });
    if (!data && !error) {
      getUserDetail(userId)
        .then(setData)
        .catch((err) => setError(getErrorMessage(err, '회원 정보를 불러오지 못했습니다.')));
    }
  };
  const close = () => setPos(null);

  useEffect(() => {
    if (!pos) return undefined;
    const onDown = (event) => {
      if (anchorRef.current?.contains(event.target) || panelRef.current?.contains(event.target)) return;
      close();
    };
    const onKey = (event) => {
      if (event.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    window.addEventListener('scroll', close, true);
    window.addEventListener('resize', close);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('scroll', close, true);
      window.removeEventListener('resize', close);
    };
  }, [pos]);

  if (!userId) return <span className={className}>{name}</span>;

  const panel =
    pos && typeof document !== 'undefined'
      ? createPortal(
          <div
            ref={panelRef}
            role="dialog"
            aria-label={`${name} 회원 요약`}
            style={{ position: 'fixed', width: WIDTH, ...pos }}
            className="z-[70] rounded-[8px] border border-[#dedede] bg-white p-4 text-left shadow-[0_6px_20px_rgba(0,0,0,0.12)]"
            onClick={(event) => event.stopPropagation()}
          >
            {error && <p className="text-[13px] text-[#919191]">{error}</p>}
            {!error && !data && <p className="text-[13px] text-[#919191]">불러오는 중...</p>}
            {data && (
              <div className="flex flex-col gap-2 text-[13px] leading-[1.6] tracking-[-0.26px] text-[#454545]">
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[15px] font-semibold text-[#212121]">
                    {data.isDeleted ? '탈퇴한 회원' : data.name}
                  </span>
                  <span className="text-[12px] text-[#919191]">{data.loginId}</span>
                </div>
                <div className="flex flex-wrap gap-1 text-[11px]">
                  <span className="rounded-full border border-[#dedede] px-2">{MEMBER_TYPE_LABELS[data.memberType] ?? data.memberType}</span>
                  <span className="rounded-full border border-[#dedede] px-2">{data.adminLevel > 0 ? `관리 Lv.${data.adminLevel}` : '일반회원'}</span>
                  {data.banStatus && data.banStatus !== 'none' && (
                    <span className="rounded-full bg-[#ae0000] px-2 text-white">{data.banStatus === 'permanent' ? '영구 차단' : '정지'}</span>
                  )}
                </div>
                <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-[2px]">
                  <dt className="text-[#919191]">가입일</dt>
                  <dd className="text-right">{fmt(data.joinedAt)}</dd>
                  <dt className="text-[#919191]">마지막 접속</dt>
                  <dd className="text-right">
                    {daysAgo(data.lastAccessAt) == null ? '-' : daysAgo(data.lastAccessAt) === 0 ? '오늘' : `${daysAgo(data.lastAccessAt)}일 전`}
                  </dd>
                  <dt className="text-[#919191]">글 · 댓글</dt>
                  <dd className="text-right">
                    {data.postCount} · {data.commentCount}
                  </dd>
                  <dt className="text-[#919191]">주의 · 경고</dt>
                  <dd className="text-right">
                    {data.cautionPoints}점 · {data.warningCount}회
                  </dd>
                  <dt className="text-[#919191]">푸시 기기</dt>
                  <dd className="text-right">{data.deviceCount > 0 ? `${data.deviceCount}대` : '없음'}</dd>
                </dl>
                <Link
                  href={ROUTES.ADMIN_MEMBER_DETAIL(userId)}
                  className="mt-1 block rounded-[4px] bg-[#212121] py-[6px] text-center text-[13px] text-white hover:bg-black"
                >
                  회원 상세 보기
                </Link>
              </div>
            )}
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        ref={anchorRef}
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          if (pos) close();
          else open();
        }}
        aria-haspopup="dialog"
        aria-expanded={Boolean(pos)}
        className={`underline decoration-dotted underline-offset-2 hover:text-[#212121] ${className}`}
      >
        {name}
      </button>
      {panel}
    </>
  );
}
