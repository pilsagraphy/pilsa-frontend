'use client';

import { useEffect, useState } from 'react';
import { toast } from '@/lib/toast';
import { ROUTES } from '@/constants/routes';
import { getErrorMessage } from '@/apis/auth';
import { SOCIAL_PROVIDERS, getSocialLinkStatus, getSocialLinkUrl, unlinkSocialAccount } from '@/apis/social';
import { getNaverCalendarLinkUrl, getNaverCalendarStatus, unlinkNaverCalendar } from '@/apis/naverCalendar';
import { getKakaoCalendarLinkUrl, getKakaoCalendarStatus, unlinkKakaoCalendar } from '@/apis/kakaoCalendar';
import { confirmDialog } from '@/stores/useDialogStore';

// 네이버·카카오 — 구글 상자(GoogleIntegrationSection)처럼 제공자마다 한 상자: 계정 연결 줄 + 캘린더 줄 (PM 2026-10-13 "네이버랑 네이버 캘린더 하나로").
// 계정 연결은 간편로그인용. 네이버 캘린더는 '새 일정 넣기'만(추가 API 뿐), 톡캘린더는 구글처럼 등록·수정·삭제 반영.
// 계정 연결과 캘린더 연동은 별개(토큰이 따로) — 계정을 끊어도 캘린더는 계속 간다 (PM 2026-10-13 결정).
const Switch = ({ on, label, disabled, onClick }) => (
  <button
    type="button"
    role="switch"
    aria-checked={on}
    aria-label={label}
    disabled={disabled}
    onClick={onClick}
    className={`relative h-[26px] w-[46px] shrink-0 rounded-full transition-colors duration-200 disabled:opacity-50 ${on ? 'bg-inverse' : 'bg-line'}`}
  >
    <span className={`absolute left-[3px] top-[3px] size-5 rounded-full bg-white shadow transition-transform duration-200 ${on ? 'translate-x-[20px]' : 'translate-x-0'}`} />
  </button>
);

export default function SocialAccountsSection() {
  const [status, setStatus] = useState({}); // { naver: { linked, email, configured }, kakao: ... }
  const [naverCal, setNaverCal] = useState(null); // { linked, naverEmail, sentCount, configured }
  const [kakaoCal, setKakaoCal] = useState(null); // { linked, kakaoName, failedCount, configured }
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);

  useEffect(() => {
    let alive = true;
    getNaverCalendarStatus().then((r) => alive && setNaverCal(r)).catch(() => alive && setNaverCal({ linked: false, configured: false }));
    getKakaoCalendarStatus().then((r) => alive && setKakaoCal(r)).catch(() => alive && setKakaoCal({ linked: false, configured: false }));
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


  // 동의 화면에 갔다가 뒤로 오면 브라우저(bfcache)가 이 화면을 그대로 복원해 busy 가 켜진 채 남아 토글이 비활성으로 보였다 — 복원·복귀 때 푼다 (PM 2026-10-13)
  useEffect(() => {
    const release = () => setBusy(null);
    const onPageShow = (e) => {
      if (e.persisted) release();
    };
    const onVisible = () => {
      if (document.visibilityState === 'visible') release();
    };
    window.addEventListener('pageshow', onPageShow);
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      window.removeEventListener('pageshow', onPageShow);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, []);

  const goTo = async (fetchUrl, failMessage, key) => {
    if (busy) return;
    setBusy(key);
    try {
      const url = await fetchUrl();
      if (!url) throw new Error('authorizeUrl 없음');
      window.location.href = url;
    } catch (err) {
      toast.error(err?.response?.data?.message ?? failMessage);
      setBusy(null);
    }
  };

  const unlinkAccount = async (p) => {
    if (busy) return;
    const calOn = p.key === 'naver' ? naverCal?.linked : kakaoCal?.linked;
    const go = await confirmDialog(
      calOn ? `${p.label} 계정 연결을 해제할까요?\n${p.label} 캘린더 연동은 그대로 유지돼요 (캘린더 줄에서 따로 끌 수 있어요).` : `${p.label} 계정 연결을 해제할까요?`,
      { confirmText: '해제', cancelText: '취소' }
    );
    if (!go) return;
    setBusy(p.key);
    try {
      await unlinkSocialAccount(p.key);
      setStatus((prev) => ({ ...prev, [p.key]: { ...prev[p.key], linked: false, email: '' } }));
      toast.success(`${p.label} 계정 연결을 해제했어요`);
    } catch (err) {
      // 비밀번호 없는 소셜 전용 계정의 마지막 연결이면 서버가 409 로 막는다 — 그 문구를 그대로 보여 준다
      toast.error(getErrorMessage(err, '연결 해제에 실패했어요. 잠시 후 다시 시도해주세요.'));
    } finally {
      setBusy(null);
    }
  };

  const toggleNaverCal = async () => {
    if (busy || !naverCal) return;
    if (!naverCal.linked) {
      await goTo(() => getNaverCalendarLinkUrl(ROUTES.MY_PAGE_SETTINGS), '네이버 캘린더 연동을 시작하지 못했어요', 'ncal');
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

  const toggleKakaoCal = async () => {
    if (busy || !kakaoCal) return;
    if (!kakaoCal.linked) {
      await goTo(() => getKakaoCalendarLinkUrl(ROUTES.MY_PAGE_SETTINGS), '톡캘린더 연동을 시작하지 못했어요', 'kcal');
      return;
    }
    const removeEvents = await confirmDialog('톡캘린더 연동을 해제합니다.\n그동안 등록된 일정도 톡캘린더에서 삭제할까요?', { confirmText: '일정도 삭제', cancelText: '일정은 두기' });
    setBusy('kcal');
    try {
      const result = await unlinkKakaoCalendar(removeEvents);
      setKakaoCal((prev) => ({ ...prev, linked: false, kakaoName: '' }));
      toast.success(removeEvents && result?.removedEvents ? `연동을 해제하고 일정 ${result.removedEvents}건을 삭제했어요` : '톡캘린더 연동을 해제했어요');
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

  const accountRow = (p) => {
    const s = status[p.key] ?? { linked: false, configured: false };
    return (
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <div className="min-w-0">
          <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">{p.label} 계정</p>
          <p className="mt-0.5 truncate text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3">
            {s.linked ? s.email || '연결됨' : s.configured ? `연결하면 ${p.label}로 로그인할 수 있어요` : '준비 중이에요'}
          </p>
        </div>
        <button
          type="button"
          disabled={busy != null || (!s.linked && !s.configured)}
          onClick={() => (s.linked ? unlinkAccount(p) : goTo(() => getSocialLinkUrl(p.key, ROUTES.MY_PAGE_SETTINGS), `${p.label} 계정 연결을 시작하지 못했어요`, p.key))}
          className="shrink-0 rounded-[6px] border border-line px-3 py-1.5 text-[12px] font-medium text-ink-2 transition hover:border-line-strong hover:text-ink disabled:opacity-50"
        >
          {s.linked ? '해제' : '연결'}
        </button>
      </div>
    );
  };

  const naver = SOCIAL_PROVIDERS.find((p) => p.key === 'naver');
  const kakao = SOCIAL_PROVIDERS.find((p) => p.key === 'kakao');

  return (
    <>
      {/* 네이버 — 계정 + 캘린더(새 일정 넣기) */}
      <div className="rounded-[8px] border border-line">
        {accountRow(naver)}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
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
          <Switch on={!!naverCal?.linked} label="내 네이버 캘린더에 새 일정 넣기" disabled={busy != null || !naverCal || (!naverCal.linked && naverCal.configured === false)} onClick={toggleNaverCal} />
        </div>
      </div>

      {/* 카카오 — 계정 + 톡캘린더(자동 업데이트) */}
      <div className="rounded-[8px] border border-line">
        {accountRow(kakao)}
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-[1.5] tracking-[-0.02em] text-ink">내 톡캘린더에 일정 자동 등록</p>
            <p className="mt-0.5 text-[12px] leading-[1.5] tracking-[-0.02em] text-ink-3 [word-break:keep-all]">
              {kakaoCal?.linked && kakaoCal?.failedCount > 0
                ? '일부 일정을 반영하지 못했어요. 연동을 해제한 뒤 다시 켜주세요.'
                : kakaoCal?.configured === false && !kakaoCal?.linked
                  ? '준비 중이에요'
                  : '동아리 일정을 내 캘린더에 자동으로 업데이트해요 (수정·삭제도 반영)'}
            </p>
          </div>
          <Switch on={!!kakaoCal?.linked} label="내 톡캘린더에 일정 자동 등록" disabled={busy != null || !kakaoCal || (!kakaoCal.linked && kakaoCal.configured === false)} onClick={toggleKakaoCal} />
        </div>
      </div>
    </>
  );
}
