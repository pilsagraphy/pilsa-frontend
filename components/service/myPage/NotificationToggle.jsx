'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  canShowPushToggle,
  getPushToggleState,
  enablePushOnThisDevice,
  disablePushOnThisDevice,
} from '@/lib/push';

// "이 기기에서 알림 받기" 토글
// - 기기별 설정 (브라우저 구독 + 서버 기기 등록)으로 동작
// - 모바일 && 푸시 지원 환경에서만 노출. PC 웹은 알림함(종 아이콘)만 제공.
export default function NotificationToggle() {
  const [supported, setSupported] = useState(false);
  const [on, setOn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const init = async () => {
      const visible = canShowPushToggle();
      setSupported(visible);
      if (!visible) {
        setLoading(false);
        return;
      }
      try {
        // 서버 기기 목록과 대조
        const { on: initialOn } = await getPushToggleState();
        setOn(initialOn);
      } catch {
        setOn(false);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  const handleToggle = async () => {
    if (busy || loading) return;
    setBusy(true);
    try {
      if (on) {
        const result = await disablePushOnThisDevice();
        setOn(false);
        toast.success(result?.message ?? '이 기기에서는 알림을 받지 않습니다.');
      } else {
        // on=false인데 브라우저 구독이 남아있는 경우(서버 행 유실) 재등록하여 복구
        const result = await enablePushOnThisDevice();
        setOn(true);
        toast.success(result?.message ?? '이 기기로 알림을 받습니다.');
      }
    } catch (err) {
      if (err?.code === 'PERMISSION_DENIED') {
        toast.error('브라우저에서 알림이 차단되어 있어요');
      } else {
        toast.error('알림 설정에 실패했어요. 잠시 후 다시 시도해주세요.');
      }
    } finally {
      setBusy(false);
    }
  };

  // PC 웹에서 토글은 렌더링하지 않음
  if (!supported) {
    return null;
  }

  return (
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-[#212121]">
          이 기기에서 알림 받기
        </p>
        <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-[#919191]">
          새 댓글·답글이 달리면 알려드려요
        </p>
      </div>

      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-label="이 기기에서 알림 받기"
        disabled={loading || busy}
        onClick={handleToggle}
        className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${
          on ? 'bg-[#212121]' : 'bg-[#D6D6D6]'
        }`}
      >
        <span
          className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${
            on ? 'translate-x-[20px]' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}
