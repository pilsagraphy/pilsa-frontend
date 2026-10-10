'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { createDonation, deleteDonation, getAdminDonations, updateDonation, uploadDonationPhoto } from '@/apis/admin/donations';
import { getUsers } from '@/apis/admin/users';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import ConfirmModal from '@/components/common/ConfirmModal';
import { toast } from '@/lib/toast';

// 운영 관리 > 명예의 전당 관리 (PM 2026-10-11) — 후원 행 등록·수정·사진·삭제. 후원자는 회원 중에서 이름으로 찾아 고른다.
const inputClass =
  'h-[34px] w-full min-w-0 rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191]';
const smallBtn =
  'h-[30px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-3 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const primaryBtn = 'h-[30px] shrink-0 rounded-[4px] bg-[#212121] px-3 text-[12px] text-white disabled:opacity-30';
const labelClass = 'text-[11px] text-[#919191]';
const won = (v) => `${Number(v ?? 0).toLocaleString('ko-KR')}원`;
const toLocalInput = (iso) => (iso ? String(iso).slice(0, 16) : '');

export default function DonationAdminSection() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);
  const [adding, setAdding] = useState(false);
  const [confirm, setConfirm] = useState(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      setRows(await getAdminDonations());
    } catch (err) {
      setError(getErrorMessage(err, '불러오지 못했습니다.'));
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const remove = async () => {
    const d = confirm;
    setConfirm(null);
    try {
      await deleteDonation(d.donationId);
      toast.success('삭제했습니다.');
      await load();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    }
  };

  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>명예의 전당 관리</h1>
      <p className="mb-5 text-[13px] leading-[1.6] text-[#919191]">후원자는 회원 중에서 고릅니다. 익명이면 화면에 「익명후원자」로 나갑니다. 사진은 올리면 바로 공개됩니다.</p>
      {!adding && (
        <button type="button" onClick={() => setAdding(true)} className={`${primaryBtn} mb-4 self-start`}>
          + 후원 등록
        </button>
      )}
      {adding && (
        <DonationForm
          onCancel={() => setAdding(false)}
          onSaved={async () => {
            setAdding(false);
            await load();
          }}
        />
      )}
      {error && <p className="py-6 text-center text-[13px] text-[#919191]">{error}</p>}
      {rows == null && !error ? (
        <AppLoading />
      ) : (
        <div className="mt-4 flex flex-col gap-3">
          {rows?.map((d) => (
            <DonationForm key={d.donationId} donation={d} onSaved={load} onDelete={() => setConfirm(d)} />
          ))}
          {rows?.length === 0 && <p className="py-6 text-center text-[13px] text-[#919191]">등록된 후원이 없습니다.</p>}
        </div>
      )}
      <ConfirmModal open={Boolean(confirm)} title={`'${confirm?.displayName ?? ''}' 후원을 삭제할까요?`} onConfirm={remove} onCancel={() => setConfirm(null)} />
    </section>
  );
}

// 회원 찾기 — 이름·아이디로 검색해 고른다 (회원 목록 API)
function MemberPicker({ value, onPick }) {
  const [keyword, setKeyword] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const search = async () => {
    if (!keyword.trim()) return;
    setSearching(true);
    try {
      const res = await getUsers({ page: 1, size: 8, keyword: keyword.trim() });
      setResults(res?.members ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, '회원을 찾지 못했습니다.'));
    } finally {
      setSearching(false);
    }
  };
  return (
    <div className="flex flex-col gap-1">
      <span className={labelClass}>후원 회원 {value ? `— ${value.name} (${value.loginId})` : '(필수)'}</span>
      <div className="flex gap-1">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search();
          }}
          placeholder="이름 또는 아이디로 찾기"
          className={inputClass}
        />
        <button type="button" className={smallBtn} disabled={searching} onClick={search}>
          찾기
        </button>
      </div>
      {results.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {results.map((m) => (
            <button
              key={m.userId}
              type="button"
              onClick={() => {
                onPick(m);
                setResults([]);
              }}
              className="h-[26px] rounded-full bg-[#F5F5F5] px-2 text-[12px] text-[#454545] hover:bg-[#EDEDED]"
            >
              {m.name} ({m.loginId})
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function DonationForm({ donation = null, onSaved, onCancel, onDelete }) {
  const isNew = !donation;
  const [member, setMember] = useState(donation ? { userId: donation.userId, name: donation.userName, loginId: donation.userLoginId } : null);
  const [displayName, setDisplayName] = useState(donation?.displayName ?? '');
  const [amount, setAmount] = useState(donation?.amount ?? '');
  const [affiliation, setAffiliation] = useState(donation?.affiliation ?? '');
  const [major, setMajor] = useState(donation?.major ?? '');
  const [message, setMessage] = useState(donation?.message ?? '');
  const [donatedAt, setDonatedAt] = useState(toLocalInput(donation?.donatedAt));
  const [isAnonymous, setIsAnonymous] = useState(Boolean(donation?.isAnonymous));
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);

  const save = async () => {
    if (!member?.userId) {
      toast.error('후원 회원을 골라 주세요.');
      return;
    }
    if (!displayName.trim() || !Number(amount)) {
      toast.error('표시 이름과 금액을 확인해 주세요.');
      return;
    }
    setSaving(true);
    try {
      const body = {
        userId: member.userId,
        displayName: displayName.trim(),
        amount: Number(amount),
        affiliation: affiliation.trim() || null,
        major: major.trim() || null,
        message: message.trim() || null,
        donatedAt: donatedAt ? `${donatedAt}:00` : null,
        isAnonymous,
      };
      if (isNew) await createDonation(body);
      else await updateDonation(donation.donationId, body);
      toast.success(isNew ? '등록했습니다.' : '저장했습니다.');
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file || isNew) return;
    setSaving(true);
    try {
      await uploadDonationPhoto(donation.donationId, file);
      toast.success('사진을 바꿨습니다.');
      await onSaved();
    } catch (err) {
      toast.error(getErrorMessage(err, '사진을 올리지 못했습니다.'));
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  return (
    <div className="flex flex-col gap-3 rounded-[10px] border border-[#dedede] bg-white p-4 md:flex-row md:items-start">
      {!isNew && (
        <div className="flex shrink-0 flex-col items-center gap-2">
          <div className="h-[96px] w-[96px] overflow-hidden rounded-full bg-[#D9D9D9]">
            {donation.photoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={`${donation.photoUrl}?v=${encodeURIComponent(donation.photoUrl)}`} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center text-[11px] text-[#919191]">사진 없음</div>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
          <button type="button" className={smallBtn} disabled={saving} onClick={() => fileRef.current?.click()}>
            사진 바꾸기
          </button>
          <span className="text-[12px] font-semibold text-[#212121]">{won(donation.amount)}</span>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <MemberPicker
          value={member}
          onPick={(m) => {
            setMember(m);
            if (!displayName.trim()) setDisplayName(m.name ?? '');
          }}
        />
        <div className="grid grid-cols-2 gap-2 md:grid-cols-3">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>표시 이름</span>
            <input type="text" value={displayName} maxLength={50} onChange={(e) => setDisplayName(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>금액 (원)</span>
            <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>후원 일시</span>
            <input type="datetime-local" value={donatedAt} onChange={(e) => setDonatedAt(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>소속 (선택)</span>
            <input type="text" value={affiliation} maxLength={50} onChange={(e) => setAffiliation(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>학과 (선택)</span>
            <input type="text" value={major} maxLength={50} onChange={(e) => setMajor(e.target.value)} className={inputClass} />
          </label>
          <label className="flex items-center gap-2 self-end text-[12px] text-[#454545]">
            <input type="checkbox" checked={isAnonymous} onChange={(e) => setIsAnonymous(e.target.checked)} className="accent-[#212121]" />
            익명 후원 (화면에 「익명후원자」)
          </label>
        </div>
        <label className="flex flex-col gap-1">
          <span className={labelClass}>한마디 (선택)</span>
          <input type="text" value={message} maxLength={255} onChange={(e) => setMessage(e.target.value)} className={inputClass} />
        </label>
        <div className="flex justify-end gap-2">
          {isNew && onCancel && (
            <button type="button" className={smallBtn} onClick={onCancel}>
              취소
            </button>
          )}
          {!isNew && onDelete && (
            <button type="button" className={`${smallBtn} mr-auto text-[#b3261e]`} onClick={onDelete}>
              삭제
            </button>
          )}
          <button type="button" className={primaryBtn} disabled={saving} onClick={save}>
            {saving ? '저장 중' : isNew ? '등록' : '저장'}
          </button>
        </div>
      </div>
    </div>
  );
}
