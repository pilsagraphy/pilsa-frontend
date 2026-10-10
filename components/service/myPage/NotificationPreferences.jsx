'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/apis/auth';
import { getNotificationSettings, updateNotificationSetting } from '@/apis/notification';

// 마이페이지 설정 > 알림 — 어떤 알림을 받을지 유형별로 켜고 끈다 (PM 2026-10-10).
// 관리자 운영 관리 > 알림 설정과 같은 네 종류·같은 스위치 모양. 관리자가 끈 유형은 여기서 켜 둬도 오지 않는다.
// 기기 푸시 토글(NotificationToggle)과는 다르다 — 그쪽은 "이 기기에서 받을지", 이쪽은 "무엇을 받을지".
const SWITCHES = [
  { type: 'COMMENT', title: '댓글', detail: '내 글에 댓글이 달렸을 때' },
  { type: 'REPLY', title: '답글', detail: '내 댓글에 답글이 달렸을 때' },
  { type: 'PINNED_POST', title: '중요 글', detail: '운영진이 중요 글을 올렸을 때' },
  { type: 'EVENT', title: '일정', detail: '새 일정이 등록됐을 때' },
];

export default function NotificationPreferences() {
  const [settings, setSettings] = useState(null);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
    getNotificationSettings()
      .then((data) => {
        if (alive) setSettings(data);
      })
      .catch((error) => {
        if (alive) setSettings({});
        toast.error(getErrorMessage(error, '알림 설정을 불러오지 못했습니다.'));
      });
    return () => {
      alive = false;
    };
  }, []);

  const toggle = async (type) => {
    if (!settings || busy) return;
    const next = !(settings[type] ?? true);
    setBusy(type);
    try {
      setSettings(await updateNotificationSetting(type, next));
    } catch (error) {
      toast.error(getErrorMessage(error, '저장하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  return (
    <ul className="divide-y divide-black/10">
      {SWITCHES.map((s) => {
        const on = settings ? (settings[s.type] ?? true) : true;
        return (
          <li key={s.type} className="flex items-center gap-3 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-[14px] font-medium tracking-[-0.02em] text-black">{s.title}</p>
              <p className="text-[12px] leading-[1.5] tracking-[-0.02em] text-[#757575]">{s.detail}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={on}
              aria-label={`${s.title} 알림 ${on ? '켜짐' : '꺼짐'}`}
              disabled={!settings || busy === s.type}
              onClick={() => toggle(s.type)}
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
  );
}
