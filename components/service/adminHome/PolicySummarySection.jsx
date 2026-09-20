'use client';

import { useEffect, useState } from 'react';

import { getErrorMessage } from '@/apis/auth';
import { getDashboardPolicies } from '@/apis/admin/dashboard';

// 관리자 홈의 '운영 정책' 칸.
//
// 값은 서버의 policy_settings · ban_policy 에서 온다 — 코드가 실제로 읽어 쓰는 값이라 여기 적힌 것과
// 실제 동작이 어긋나지 않는다. 화면에 숫자를 박아 두면 정책을 바꿨을 때 이 칸만 옛날 것이 된다.
//
// 서술형이 아니라 '조건 → 결과' 한 줄씩. 운영진이 조치하기 전에 훑어보는 용도다.

const num = (settings, code, fallback = '?') => settings?.[code] ?? fallback;

// 정지 기간 문구. 영구는 일수가 없다
const banText = (policy) => {
  if (policy.banType === 'permanent') return '영구 차단';
  const days = Number(policy.banDays);
  if (days === 7) return '1주 정지';
  if (days === 30) return '한 달 정지';
  return `${days}일 정지`;
};

function PolicyGroup({ title, rows }) {
  return (
    <div className="flex flex-col">
      <h4 className="mb-[6px] text-[14px] font-semibold leading-[1.5] tracking-[-0.28px] text-[#212121]">
        {title}
      </h4>
      <ul className="flex flex-col gap-[4px]">
        {rows.map(([condition, result]) => (
          <li
            key={condition}
            className="flex items-baseline justify-between gap-3 text-[14px] leading-[1.6] tracking-[-0.28px]"
          >
            <span className="min-w-0 text-[#757575]">{condition}</span>
            <span className="shrink-0 whitespace-nowrap font-medium text-[#212121]">{result}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function PolicySummarySection() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let alive = true;
    getDashboardPolicies()
      .then((res) => alive && setData(res))
      .catch((err) => alive && setError(getErrorMessage(err, '정책을 불러오지 못했습니다.')));
    return () => {
      alive = false;
    };
  }, []);

  const s = data?.settings;
  const bans = data?.banPolicies ?? [];
  const perWarning = Number(num(s, 'cautions_per_warning', 10));
  const perDelete = Number(num(s, 'caution_per_delete', 2));

  const reportRows = [
    [`같은 글·댓글 신고 ${num(s, 'auto_blind_threshold')}건`, '자동 블라인드'],
    ['신고 처리(삭제·반려)', '대상의 대기 신고 전부 종료'],
    ['관리자가 직접 블라인드·삭제', '신고 없이도 가능 (기록 남음)'],
  ];

  const penaltyRows = [
    ['관리자 삭제 1건', `주의 +${perDelete}점`],
    [`주의 ${perWarning}점 누적`, '경고 1회'],
    ...bans.map((b) => [`경고 ${b.warningNo}회`, banText(b)]),
    ['주의 시효', `${num(s, 'caution_ttl_days')}일`],
    ['경고 시효', `${num(s, 'warning_ttl_days')}일`],
    ['관리자 수동 정지·해제', '경고 횟수에 안 셈'],
  ];

  const withdrawRows = [
    ['탈퇴 후 재가입', `${num(s, 'rejoin_cooldown_days')}일 뒤부터`],
    ['정지 중 탈퇴 후 재가입', '정지 종료일까지 거부'],
    ['영구 차단자 재가입', '영구 거부 (학번으로 대조)'],
    ['강제 탈퇴', '관리 Lv.3 만 · 되돌릴 수 없음'],
    ['활동·제재 없는 탈퇴 기록', `${num(s, 'withdrawn_purge_days')}일 뒤 삭제`],
  ];

  return (
    <div className="flex w-full flex-col">
      <div className="flex h-[44px] items-center justify-between">
        <h3 className="text-[20px] font-semibold leading-[1.5] tracking-[-0.4px] text-[#212121]">
          운영 정책
        </h3>
        <span className="text-[13px] leading-[1.6] tracking-[-0.26px] text-[#B9B9B9]">
          서버 설정값 기준
        </span>
      </div>

      {error ? (
        <p className="border-t border-[#B9B9B9] py-[16px] text-center text-[14px] text-[#919191]">
          {error}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-[20px] border-t border-[#B9B9B9] pt-[16px] md:grid-cols-3 md:gap-[28px]">
          <PolicyGroup title="신고" rows={reportRows} />
          <PolicyGroup title="제재 (주의 → 경고 → 정지)" rows={penaltyRows} />
          <PolicyGroup title="탈퇴 · 재가입" rows={withdrawRows} />
        </div>
      )}
    </div>
  );
}
