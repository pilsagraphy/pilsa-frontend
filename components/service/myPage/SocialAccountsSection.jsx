'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { SOCIAL_PROVIDERS, getSocialLinkStatus, getSocialLinkUrl, unlinkSocialAccount } from '@/apis/social';
import { getNaverCalendarLinkUrl, getNaverCalendarStatus, unlinkNaverCalendar } from '@/apis/naverCalendar';
import { confirmDialog } from '@/stores/useDialogStore';

// 네이버·카카오 계정 연결 (PM 2026-10-11) — 구글 계정 연결(GoogleIntegrationSection)과 같은 줄 모양.
// 연결해 두면 로그인 화면의 [네이버로 로그인]/[카카오로 로그인]으로 바로 들어온다. 서버에 키가 아직 없으면 '준비 중'.
export default function SocialAccountsSection() {
  const [status, setStatus] = useState({}); // { naver: { linked, email, configured }, kakao: ... }
  // 네이버 캘린더 — 새 일정 넣기 (추가만 되는 서비스, 2026-10-12). { linked, naverEmail, sentCount, configured }
  const [naverCal, setNaverCal] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
    getNaverCalendarStatus().then((r) => alive && setNaverCal(r)).catch(() => alive && setNaverCal({ linked: false, configured: false }));
    Promise.all(SOCIAL_PROVIDERS.map((p) => getSocialLinkStatus(p.key).catch(() => ({ linked: false, configured: false }))))
      .then((list) => {
        if (!alive) return;
        setStatus(Object.fromEntries(SOCIAL_PROVIDERS.map((p, i) => [p.key, list[i]])));
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, []);

  const link = async (p) => {
    if (busy) return;
    setBusy(p.key);
    try {
      const url = await getSocialLinkUrl(p.key);
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? `${p.label} 계정 연결을 시작하지 못했어요`);
      setBusy(null);
    }
  };

  const unlink = async (p) => {
    if (busy) return;
    setBusy(p.key);
    try {
      await unlinkSocialAccount(p.key);
      setStatus((prev) => ({ ...prev, [p.key]: { ...prev[p.key], linked: false, email: '' } }));
      toast.success(`${p.label} 계정 연결을 해제했어요`);
    } catch {
      toast.error('연결 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  const toggleNaverCal = async () => {
    if (busy || !naverCal) return;
    if (!naverCal.linked) {
      setBusy('ncal');
      try {
        const url = await getNaverCalendarLinkUrl();
        if (!url) throw new Error('authorizeUrl 없음');
        window.location.href = url;
      } catch (err) {
        toast.error(err?.response?.data?.message ?? '네이버 캘린더 연동을 시작하지 못했어요');
        setBusy(null);
      }
      return;
    }
    const go = await confirmDialog('네이버 캘린더 연동을 해제할까요?\n이미 넣은 일정은 네이버 캘린더에 남아 있어요. 필요하면 직접 지워 주세요.', { confirmText: '해제', cancelText: '취소' });
    if (!go) return;
    setBusy('ncal');
    try {
      await unlinkNaverCalendar();
      setNaverCal((prev) => ({ ...prev, linked: false, naverEmail: '' }));
      toast.success('네이버 캘린더 연동을 해제했어요');
    } catch {
      toast.error('연동 해제에 실패했어요. 잠시 후 다시 시도해주세요.');
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return (
      <div className="rounded-[8px] border border-line px-4 py-3">
        <p className="text-[13px] tracking-[-0.02em] text-ink-4">불러오는 중…</p>
      </div>
    );
  }

  return (
    <div className="rounded-[8px] border border-line">
      {SOCIAL_PROVIDERS.map((p, i) => {
        const s = status[p.key] ?? { linked: false, configured: false };
        return (
          <div key={p.key} className={`flex items-center justify-between gap-3 px-4 py-3 ${i > 0 ? 'border-t border-line' : ''}`}>
            <div className="min-w-0">
              <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">{p.label} 계정</p>
              <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3">
                {s.linked ? s.email || '연결됨' : s.configured ? `연결하면 ${p.label}로 로그인할 수 있어요` : '준비 중이에요'}
              </p>
            </div>
            <button
              type="button"
              disabled={busy != null || (!s.linked && !s.configured)}
              onClick={() => (s.linked ? unlink(p) : link(p))}
              className="shrink-0 rounded-[6px] border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink disabled:opacity-50"
            >
              {s.linked ? '해제' : '연결'}
            </button>
          </div>
        );
      })}
      {/* 네이버 캘린더 — 구글처럼 자동 업데이트가 아니라 새 일정만 넣는다 */}
      <div className="flex items-center justify-between gap-3 border-t border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">내 네이버 캘린더에 새 일정 넣기</p>
          <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3 [word-break:keep-all]">
            {naverCal?.linked
              ? `${naverCal.naverEmail ? `${naverCal.naverEmail} 캘린더에 ` : ''}동아리 일정을 자동으로 업데이트해요 (추가만 — 수정·삭제는 직접)`
              : naverCal?.configured === false
                ? '준비 중이에요'
                : '동아리 일정을 내 캘린더에 자동으로 업데이트해요 (추가만 — 수정·삭제는 직접)'}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={!!naverCal?.linked}
          aria-label="내 네이버 캘린더에 새 일정 넣기"
          disabled={busy != null || !naverCal || (!naverCal.linked && naverCal.configured === false)}
          onClick={toggleNaverCal}
          className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${naverCal?.linked ? 'bg-inverse' : 'bg-line'}`}
        >
          <span className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${naverCal?.linked ? 'translate-x-[20px]' : 'translate-x-0'}`} />
        </button>
      </div>
    </div>
  );
}
