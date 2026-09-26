'use client';

import { useCallback, useEffect, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getPolicies, updatePolicySetting } from '@/apis/admin/policies';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from '@/lib/toast';

// 운영 관리 > 알림 설정 — 어떤 사건에 알림을 보낼지 켜고 끈다 (policy_settings notify_* = 1/0).
// 서버(NotificationPublisher)가 발행 직전에 이 값을 읽어 꺼진 유형은 저장도 발송도 하지 않는다 (30초 안에 반영).

const EDIT_LEVEL = 3;

const SWITCHES = [
  {
    code: 'notify_comment',
    title: '내 글에 댓글',
    detail: '회원이 쓴 글에 다른 회원이 댓글을 달면 글쓴이에게. 본인 댓글은 제외.',
  },
  {
    code: 'notify_reply',
    title: '내 댓글에 답글',
    detail: '댓글에 답글이 달리면 댓글 쓴 사람에게. 글쓴이에게는 댓글 알림이 함께 간다(동일인이면 하나만).',
  },
  {
    code: 'notify_pinned_post',
    title: '중요 글 등록 · 수정',
    detail: '관리자가 ‘중요’ 글을 올리면 그 게시판을 볼 수 있는 회원 전원에게. 글쓰기 화면의 ‘회원에게 알림 보내기’ 체크는 이 스위치 아래에서 건별로 끌 수 있다.',
  },
  {
    code: 'notify_event',
    title: '일정 등록 · 수정',
    detail: '관리자가 일정을 등록·수정하면 회원 전원에게. 일정 폼의 알림 체크는 이 스위치 아래에서 건별로 끌 수 있다.',
  },
];

// 스위치가 없는 유형(신고 처리 결과 등)은 아직 발행 자체를 하지 않아 여기 두지 않는다.

export default function NotificationSettingsSection() {
  const adminLevel = useAuthStore((s) => s.adminLevel);
  const canEdit = adminLevel >= EDIT_LEVEL;
  const [values, setValues] = useState(null); // { code: '1' | '0' }
  const [busy, setBusy] = useState(null); // 저장 중인 code
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPolicies();
      const map = {};
      for (const s of data.settings ?? []) {
        if (s.code.startsWith('notify_')) map[s.code] = s.settingValue;
      }
      setValues(map);
    } catch (err) {
      setError(getErrorMessage(err, '알림 설정을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const toggle = async (code) => {
    if (!canEdit || busy) return;
    const next = values?.[code] === '0' ? '1' : '0';
    setBusy(code);
    try {
      const updated = await updatePolicySetting(code, { settingValue: next });
      setValues((v) => ({ ...v, [code]: updated.settingValue }));
      toast.success(next === '1' ? '알림을 켰습니다' : '알림을 껐습니다');
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className={`${listSectionClass} gap-6`}>
      <div>
        <h2 className={listTitleClass}>알림 설정</h2>
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
          어떤 일이 생겼을 때 회원에게 알림(알림함 + 푸시)을 보낼지 정합니다. 끄면 그 유형은 저장도 발송도 하지 않습니다.
          {!canEdit && ' 변경은 관리 레벨 3 관리자만 할 수 있어 지금은 읽기 전용입니다.'}
        </p>
      </div>

      {isLoading && <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>}
      {!isLoading && error && <p className="py-6 text-center text-[14px] text-[#919191]">{error}</p>}

      {!isLoading && !error && values && (
        <ul className="divide-y divide-[#F3F3F3] rounded-[8px] border border-[#EEEEEE]">
          {SWITCHES.map((s) => {
            const on = values[s.code] == null ? true : values[s.code] !== '0';
            const missing = values[s.code] == null;
            return (
              <li key={s.code} className="flex items-center gap-4 px-4 py-4">
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-medium text-[#212121]">{s.title}</p>
                  <p className="text-[12px] leading-[1.6] text-[#919191]">{s.detail}</p>
                  {missing && (
                    <p className="text-[12px] text-[#d93025]">설정 행이 없어 기본값(보냄)으로 동작합니다. DB 에 {s.code} 를 넣어 주세요.</p>
                  )}
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={on}
                  aria-label={`${s.title} 알림 ${on ? '켜짐' : '꺼짐'}`}
                  disabled={!canEdit || missing || busy === s.code}
                  onClick={() => toggle(s.code)}
                  className={`relative h-[28px] w-[50px] shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                    on ? 'bg-[#212121]' : 'bg-[#dedede]'
                  }`}
                >
                  <span
                    className={`absolute top-[3px] size-[22px] rounded-full bg-white shadow transition-all ${
                      on ? 'left-[25px]' : 'left-[3px]'
                    }`}
                  />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
