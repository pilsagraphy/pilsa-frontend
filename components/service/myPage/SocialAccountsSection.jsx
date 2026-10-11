'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { SOCIAL_PROVIDERS, getSocialLinkStatus, getSocialLinkUrl, unlinkSocialAccount } from '@/apis/social';

// 네이버·카카오 계정 연결 (PM 2026-10-11) — 구글 계정 연결(GoogleIntegrationSection)과 같은 줄 모양.
// 연결해 두면 로그인 화면의 [네이버로 로그인]/[카카오로 로그인]으로 바로 들어온다. 서버에 키가 아직 없으면 '준비 중'.
export default function SocialAccountsSection() {
  const [status, setStatus] = useState({}); // { naver: { linked, email, configured }, kakao: ... }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
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
    </div>
  );
}
