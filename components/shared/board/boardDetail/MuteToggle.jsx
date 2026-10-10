'use client';

import { useEffect, useState } from 'react';
import { Bell, BellOff } from 'lucide-react';
import { toast } from '@/lib/toast';
import { getErrorMessage } from '@/apis/auth';
import { getNotificationMute, setNotificationMute } from '@/apis/notification';

// 글/댓글별 알림 끄기 (PM 2026-10-10). 작성자에게만 보인다 — 알림이 작성자에게만 가므로.
//   targetType 'post'    = 이 글에 달리는 댓글 알림
//   targetType 'comment' = 이 댓글에 달리는 답글 알림
// 상태는 서버(notification_mutes)에 있다. 처음엔 조회해서 그리고, 누르면 바로 저장한다.
export default function MuteToggle({ targetType, targetId, className = '', iconOnly = false }) {
  const [muted, setMuted] = useState(null); // null = 조회 중
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let alive = true;
    getNotificationMute(targetType, targetId)
      .then((value) => {
        if (alive) setMuted(value);
      })
      .catch(() => {
        if (alive) setMuted(false);
      });
    return () => {
      alive = false;
    };
  }, [targetType, targetId]);

  const toggle = async () => {
    if (muted === null || busy) return;
    setBusy(true);
    try {
      const next = await setNotificationMute(targetType, targetId, !muted);
      setMuted(next);
      toast.success(
        next
          ? `이 ${targetType === 'post' ? '글의 댓글' : '댓글의 답글'} 알림을 껐어요.`
          : `이 ${targetType === 'post' ? '글의 댓글' : '댓글의 답글'} 알림을 다시 받아요.`
      );
    } catch (error) {
      toast.error(getErrorMessage(error, '알림 설정을 저장하지 못했습니다.'));
    } finally {
      setBusy(false);
    }
  };

  const label = muted ? '알림 켜기' : '알림 끄기';
  const Icon = muted ? BellOff : Bell;

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={muted === null || busy}
      aria-pressed={Boolean(muted)}
      aria-label={label}
      title={muted ? '이 글·댓글의 알림이 꺼져 있어요' : '이 글·댓글의 알림을 끕니다'}
      className={className}
    >
      <Icon size={iconOnly ? 18 : 16} strokeWidth={1.6} aria-hidden />
      {!iconOnly && <span>{label}</span>}
    </button>
  );
}
