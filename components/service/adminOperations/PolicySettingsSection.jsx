'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { getPolicies, updateBanPolicy, updatePolicySetting } from '@/apis/admin/policies';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import useAuthStore from '@/stores/useAuthStore';
import { toast } from '@/lib/toast';

// 운영 관리 > 정책 설정 — policy_settings 와 ban_policy 를 화면에서 바로 고친다.
// 값은 코드가 실행 중에 읽는 것이라(제재 수치 · 가입 형식 · 통계 기준) 저장 즉시 동작이 바뀐다. 수정은 admin_level 3 만.
// 알림 스위치(notify_*)는 '알림 설정' 화면이 맡으므로 여기서는 숨긴다.

const EDIT_LEVEL = 3;

// 키 접두어 → 묶음 이름. 새 키가 생겨도 접두어만 맞으면 제자리에 들어간다
const GROUPS = [
  { key: 'sanction', title: '신고 · 제재', match: (c) => /^(auto_blind|caution|cautions|warning|rejoin|withdrawn)/.test(c) },
  { key: 'signup', title: '가입 · 로그인 · 메일', match: (c) => /^(signup_|auto_login|mail_)/.test(c) },
  { key: 'board', title: '게시판 · 첨부', match: (c) => /^(draft_|upload_|pending_upload)/.test(c) },
  { key: 'notification', title: '알림함', match: (c) => /^notification_/.test(c) },
  { key: 'stats', title: '통계 · 급상승', match: (c) => /^(trending_|stats_|signup_stats)/.test(c) },
  { key: 'dashboard', title: '관리자 홈 · 마이페이지', match: (c) => /^(dashboard_|semester)/.test(c) },
];

const groupOf = (code) => GROUPS.find((g) => g.match(code))?.key ?? 'etc';

function SettingRow({ item, canEdit, onSaved }) {
  const [value, setValue] = useState(item.settingValue);
  const [saving, setSaving] = useState(false);
  useEffect(() => setValue(item.settingValue), [item.settingValue]);
  const dirty = value !== item.settingValue;

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updatePolicySetting(item.code, { settingValue: value });
      onSaved(updated);
      toast.success(`${item.code} 저장`);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const wide = item.code.endsWith('_regex') || item.code.endsWith('_extensions');
  return (
    <li className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-4">
      <div className="min-w-0 md:w-[46%]">
        <p className="truncate font-mono text-[13px] text-[#212121]">{item.code}</p>
        <p className="text-[12px] leading-[1.5] text-[#919191]">{item.description}</p>
      </div>
      <div className="flex min-w-0 flex-1 items-center gap-2">
        <input
          type="text"
          value={value}
          disabled={!canEdit}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && dirty && canEdit) save();
          }}
          className={`h-[36px] min-w-0 flex-1 rounded-[6px] border px-3 font-mono text-[13px] outline-none transition-colors focus:border-[#919191] disabled:bg-[#F7F8F9] disabled:text-[#919191] ${
            dirty ? 'border-[#1a73e8]' : 'border-[#dedede]'
          } ${wide ? '' : 'md:max-w-[200px]'}`}
        />
        <button
          type="button"
          onClick={save}
          disabled={!canEdit || !dirty || saving}
          className="h-[36px] shrink-0 rounded-[6px] bg-[#212121] px-3 text-[13px] text-white transition-opacity disabled:opacity-30"
        >
          {saving ? '저장 중' : '저장'}
        </button>
      </div>
    </li>
  );
}

function BanPolicyRow({ item, canEdit, onSaved }) {
  const [banType, setBanType] = useState(item.banType);
  const [banDays, setBanDays] = useState(item.banDays ?? '');
  const [description, setDescription] = useState(item.description ?? '');
  const [saving, setSaving] = useState(false);
  const dirty =
    banType !== item.banType || String(banDays) !== String(item.banDays ?? '') || description !== (item.description ?? '');

  const save = async () => {
    setSaving(true);
    try {
      const updated = await updateBanPolicy(item.warningNo, {
        banType,
        banDays: banType === 'temporary' ? Number(banDays) : null,
        description,
      });
      onSaved(updated);
      toast.success(`경고 ${item.warningNo}회 단계 저장`);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const field =
    'h-[36px] rounded-[6px] border border-[#dedede] px-3 text-[13px] outline-none focus:border-[#919191] disabled:bg-[#F7F8F9] disabled:text-[#919191]';
  return (
    <li className="flex flex-col gap-2 px-4 py-3 md:flex-row md:items-center md:gap-3">
      <span className="w-[80px] shrink-0 text-[14px] font-medium text-[#212121]">경고 {item.warningNo}회</span>
      <select value={banType} disabled={!canEdit} onChange={(e) => setBanType(e.target.value)} className={`${field} w-[120px]`}>
        <option value="temporary">기간 정지</option>
        <option value="permanent">영구 차단</option>
      </select>
      <label className="flex items-center gap-1 text-[13px] text-[#5f5f5f]">
        <input
          type="number"
          min="1"
          value={banType === 'temporary' ? banDays : ''}
          disabled={!canEdit || banType !== 'temporary'}
          onChange={(e) => setBanDays(e.target.value)}
          className={`${field} w-[80px]`}
        />
        일
      </label>
      <input
        type="text"
        value={description}
        disabled={!canEdit}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="설명"
        className={`${field} min-w-0 flex-1`}
      />
      <button
        type="button"
        onClick={save}
        disabled={!canEdit || !dirty || saving}
        className="h-[36px] shrink-0 rounded-[6px] bg-[#212121] px-3 text-[13px] text-white transition-opacity disabled:opacity-30"
      >
        {saving ? '저장 중' : '저장'}
      </button>
    </li>
  );
}

export default function PolicySettingsSection() {
  const adminLevel = useAuthStore((s) => s.adminLevel);
  const canEdit = adminLevel >= EDIT_LEVEL;
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await getPolicies());
    } catch (err) {
      setError(getErrorMessage(err, '정책을 불러오지 못했습니다.'));
    } finally {
      setIsLoading(false);
    }
  }, []);
  useEffect(() => {
    load();
  }, [load]);

  const onSettingSaved = (updated) =>
    setData((d) => ({ ...d, settings: d.settings.map((s) => (s.code === updated.code ? updated : s)) }));
  const onBanSaved = (updated) =>
    setData((d) => ({ ...d, banPolicies: d.banPolicies.map((b) => (b.warningNo === updated.warningNo ? updated : b)) }));

  const grouped = useMemo(() => {
    const settings = (data?.settings ?? []).filter((s) => !s.code.startsWith('notify_'));
    const map = new Map();
    for (const s of settings) {
      const g = groupOf(s.code);
      if (!map.has(g)) map.set(g, []);
      map.get(g).push(s);
    }
    const order = [...GROUPS.map((g) => g.key), 'etc'];
    return order.filter((k) => map.has(k)).map((k) => ({ key: k, title: GROUPS.find((g) => g.key === k)?.title ?? '기타', items: map.get(k) }));
  }, [data]);

  return (
    <div className={`${listSectionClass} gap-8`}>
      <div>
        <h2 className={listTitleClass}>정책 설정</h2>
        <p className="text-[14px] leading-[1.6] tracking-[-0.28px] text-[#919191]">
          서버가 실행 중에 읽는 값(policy_settings · ban_policy)입니다. 저장하면 바로 적용됩니다.
          {!canEdit && ' 수정은 관리 레벨 3 관리자만 할 수 있어 지금은 읽기 전용입니다.'}
        </p>
      </div>

      {isLoading && <p className="py-6 text-center text-[14px] text-[#919191]">불러오는 중...</p>}
      {!isLoading && error && <p className="py-6 text-center text-[14px] text-[#919191]">{error}</p>}

      {!isLoading && !error && data && (
        <>
          <section className="flex flex-col gap-3">
            <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121]">경고 → 정지 단계</h3>
            <ul className="divide-y divide-[#F3F3F3] rounded-[8px] border border-[#EEEEEE]">
              {data.banPolicies.map((b) => (
                <BanPolicyRow key={b.warningNo} item={b} canEdit={canEdit} onSaved={onBanSaved} />
              ))}
            </ul>
          </section>

          {grouped.map((g) => (
            <section key={g.key} className="flex flex-col gap-3">
              <h3 className="text-[18px] font-semibold leading-[1.5] tracking-[-0.36px] text-[#212121]">{g.title}</h3>
              <ul className="divide-y divide-[#F3F3F3] rounded-[8px] border border-[#EEEEEE]">
                {g.items.map((s) => (
                  <SettingRow key={s.code} item={s} canEdit={canEdit} onSaved={onSettingSaved} />
                ))}
              </ul>
            </section>
          ))}
        </>
      )}
    </div>
  );
}
