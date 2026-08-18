'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { Bell, X } from 'lucide-react';
import { toast } from 'sonner';
import useAuthStore from '@/stores/useAuthStore';
import {
  getToastList,
  getUnreadCount,
  readToast,
  readAllToasts,
  deleteToast,
} from '@/apis/notification';
import { resolveNotificationUrl } from '@/lib/notificationRoute';

const TYPE_LABELS = {
  COMMENT: '댓글',
  REPLY: '답글',
  NOTICE: '공지',
};

const formatCreatedAt = (value) => {
  if (!value) return '';
  const date = new Date(String(value).replace(' ', 'T'));
  if (Number.isNaN(date.getTime())) return String(value);

  const diffMs = Date.now() - date.getTime();

  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return '방금 전';
  if (diffMin < 60) return `${diffMin}분 전`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour}시간 전`;

  const pad = (n) => String(n).padStart(2, '0');
  return `${date.getFullYear()}.${pad(date.getMonth() + 1)}.${pad(date.getDate())}`;
};

// 헤더 우측 종 아이콘 + 알림함 드롭다운
export default function NotificationBell() {
  const router = useRouter();
  const pathname = usePathname(); // SPA 이동 시 ?toastId= 재검사 트리거
  const isLoggedIn = useAuthStore((s) => s.isLoggedIn);
  const [open, setOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const panelRef = useRef(null);

  const applyBadge = useCallback((count) => {
    setUnreadCount(count ?? 0);
    // 앱 배지 (iOS PWA·데스크톱만 지원 — 미지원 환경은 조용히 건너뜀)
    try {
      if ('setAppBadge' in navigator) {
        if (count > 0) navigator.setAppBadge(count);
        else navigator.clearAppBadge();
      }
    } catch {
      // ignore
    }
  }, []);

  const refreshUnreadCount = useCallback(async () => {
    try {
      const data = await getUnreadCount();
      applyBadge(data?.unreadCount ?? 0);
    } catch {
      applyBadge(0);
    }
  }, [applyBadge]);

  const loadList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getToastList();
      const list = data?.toasts ?? [];
      setItems(list);
      if (data?.unreadCount != null) applyBadge(data.unreadCount);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [applyBadge]);

  // 로그인 시 미읽음 뱃지 조회 + 창 포커스 시 갱신
  useEffect(() => {
    if (!isLoggedIn) {
      setUnreadCount(0);
      setItems([]);
      return undefined;
    }
    refreshUnreadCount();
    const onFocus = () => refreshUnreadCount();
    window.addEventListener('focus', onFocus);
    return () => window.removeEventListener('focus', onFocus);
  }, [isLoggedIn, refreshUnreadCount]);

  // OS 알림 클릭 진입(?toastId=) 처리 — 읽음 API 호출로 뱃지를 줄인다
  useEffect(() => {
    if (!isLoggedIn) return;
    const params = new URLSearchParams(window.location.search);
    const toastId = params.get('toastId');
    if (!toastId) return;

    (async () => {
      try {
        const data = await readToast(toastId);
        if (data?.unreadCount != null) applyBadge(data.unreadCount);
      } catch {
        // 미배포/이미 삭제된 알림 — 무시
      } finally {
        // 새로고침 시 중복 호출되지 않도록 쿼리 제거 (읽음 API는 멱등이라 안전하지만 URL 정리 목적)
        params.delete('toastId');
        const rest = params.toString();
        window.history.replaceState(null, '', window.location.pathname + (rest ? `?${rest}` : ''));
      }
    })();
  }, [isLoggedIn, pathname, applyBadge]);

  // 서비스 워커 인앱 토스트 브리지 — 앱을 보는 중 수신된 푸시(포그라운드 분기)
  useEffect(() => {
    if (!isLoggedIn || !('serviceWorker' in navigator)) return undefined;

    const onMessage = (event) => {
      if (event.data?.type !== 'toast') return;
      const { title, body, toastId, targetType, targetId, boardId } = event.data;
      toast(title ?? '새 알림', {
        description: body,
        action: {
          label: '보기',
          // SPA 이동은 컴포넌트가 재마운트되지 않으므로 ?toastId= 처리에 기대지 않고
          // 여기서 직접 읽음 처리 후 이동한다 (읽음 API는 멱등)
          onClick: async () => {
            try {
              const data = await readToast(toastId);
              if (data?.unreadCount != null) applyBadge(data.unreadCount);
              router.push(resolveNotificationUrl({ ...data, toastId: undefined }));
            } catch {
              router.push(resolveNotificationUrl({ targetType, targetId, boardId }));
            }
          },
        },
      });
      refreshUnreadCount();
    };

    navigator.serviceWorker.addEventListener('message', onMessage);
    return () => navigator.serviceWorker.removeEventListener('message', onMessage);
  }, [isLoggedIn, refreshUnreadCount, applyBadge, router]);

  // 패널 밖 클릭 시 닫기
  useEffect(() => {
    if (!open) return undefined;
    const onClickOutside = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, [open]);

  if (!isLoggedIn) return null;

  const togglePanel = () => {
    const next = !open;
    setOpen(next);
    if (next) loadList();
  };

  const handleItemClick = async (item) => {
    setOpen(false);
    try {
      // 읽음 응답 하나로 이동까지 — 목록 재조회 불필요 (계약 확정)
      const data = await readToast(item.toastId);
      if (data?.unreadCount != null) applyBadge(data.unreadCount);
      // 이미 읽음 처리했으므로 ?toastId= 는 붙이지 않는다 (잔존 쿼리 방지)
      router.push(resolveNotificationUrl({ ...data, toastId: undefined }));
    } catch {
      // 읽음 실패 시에도 목록의 정보로 이동은 시도
      router.push(resolveNotificationUrl({ ...item, toastId: undefined }));
    }
  };

  const handleReadAll = async () => {
    try {
      const data = await readAllToasts();
      if (data?.unreadCount != null) applyBadge(data.unreadCount);
      setItems((prev) => prev.map((item) => ({ ...item, isRead: true })));
    } catch {
      toast.error('알림 읽음 처리에 실패했어요.');
    }
  };

  const handleDelete = async (event, item) => {
    event.stopPropagation();
    try {
      const data = await deleteToast(item.toastId);
      if (data?.unreadCount != null) applyBadge(data.unreadCount);
      setItems((prev) => prev.filter((it) => it.toastId !== item.toastId));
    } catch {
      toast.error('알림 삭제에 실패했어요.');
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        aria-label="알림함 열기"
        onClick={togglePanel}
        className="relative grid size-10 place-items-center rounded-full transition hover:bg-[#F5F5F5]"
      >
        <Bell size={22} className="text-[#212121]" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 grid min-w-[16px] place-items-center rounded-full bg-[#E53935] px-1 text-[10px] font-bold leading-[16px] text-white">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-[48px] z-[70] w-[320px] overflow-hidden rounded-[12px] border border-black/10 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)]">
          <div className="flex items-center justify-between border-b border-[#EEEEEE] px-4 py-3">
            <h3 className="text-[15px] font-semibold text-black">알림</h3>
            <button
              type="button"
              onClick={handleReadAll}
              className="text-[13px] text-[#919191] transition hover:text-[#212121]"
            >
              모두 읽음
            </button>
          </div>

          <div className="max-h-[360px] overflow-y-auto">
            {loading ? (
              <p className="py-10 text-center text-[13px] text-[#919191]">불러오는 중...</p>
            ) : items.length === 0 ? (
              <p className="py-10 text-center text-[13px] text-[#919191]">새 알림이 없습니다.</p>
            ) : (
              items.map((item) => (
                <button
                  key={item.toastId}
                  type="button"
                  onClick={() => handleItemClick(item)}
                  className={`group flex w-full items-start gap-2 border-b border-[#F5F5F5] px-4 py-3 text-left transition hover:bg-[#FAFAFA] ${
                    item.isRead ? 'opacity-60' : ''
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      {!item.isRead && (
                        <span className="size-1.5 shrink-0 rounded-full bg-[#E53935]" />
                      )}
                      <span className="text-[12px] font-semibold text-[#757575]">
                        {TYPE_LABELS[item.type] ?? '알림'}
                      </span>
                      <span className="ml-auto shrink-0 text-[11px] text-[#B9B9B9]">
                        {formatCreatedAt(item.createdAt)}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-[13px] font-medium text-[#212121]">
                      {item.title}
                    </p>
                    {item.message && (
                      <p className="mt-0.5 truncate text-[12px] text-[#757575]">{item.message}</p>
                    )}
                  </div>
                  <span
                    role="button"
                    tabIndex={-1}
                    aria-label="알림 삭제"
                    onClick={(event) => handleDelete(event, item)}
                    className="mt-0.5 hidden shrink-0 rounded p-0.5 text-[#B9B9B9] transition hover:text-[#212121] group-hover:block"
                  >
                    <X size={14} />
                  </span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
