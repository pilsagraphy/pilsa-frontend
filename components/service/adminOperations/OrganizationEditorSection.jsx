'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import { orgPhotoSrc } from '@/apis/org';
import {
  createPresident,
  deleteOrgTerm,
  deletePresident,
  renameOrgTerm,
  saveOrgTerm,
  updatePresident,
  uploadPresidentPhoto,
} from '@/apis/admin/org';
import useOrganization from '@/hooks/useOrganization';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import ConfirmModal from '@/components/common/ConfirmModal';
import AppLoading from '@/components/common/AppLoading';
import { toast } from '@/lib/toast';

// 운영 관리 > 조직도 편집 (PM 2026-10-10)
// 기수(역대 회장) 를 고르고 → 그 기수의 학기를 고르고 → 회장단 · 팀 · 자문 명단을 고쳐 저장한다.
// 소개 페이지 조직도는 가장 최근 기수의 가장 최근 학기를, 역대 회장 페이지는 기수 전부를 그린다.
// 이름 여러 명은 쉼표로 적는다 ("김서현, 김성은"). 순서는 적은 차례 그대로 화면에 나온다.

const NEW = 'new';
const splitNames = (s) =>
  String(s ?? '')
    .split(/[,，·\n]+/)
    .map((x) => x.trim())
    .filter(Boolean);
const joinNames = (arr) => (arr ?? []).join(', ');

const inputClass =
  'h-[36px] min-w-0 rounded-[6px] border border-[#dedede] bg-white px-3 text-[13px] text-[#212121] outline-none transition-colors focus:border-[#919191] disabled:bg-[#F7F8F9]';
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-[#212121] text-white' : 'bg-[#F5F5F5] text-[#454545] hover:bg-[#EDEDED]'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-[#dedede] bg-white px-2 text-[12px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const primaryBtn = 'h-[36px] shrink-0 rounded-[6px] bg-[#212121] px-4 text-[13px] text-white transition-opacity disabled:opacity-30';
const ghostBtn = 'h-[36px] shrink-0 rounded-[6px] border border-[#dedede] bg-white px-4 text-[13px] text-[#454545] hover:bg-[#f5f5f5] disabled:opacity-30';
const dangerBtn = 'h-[36px] shrink-0 rounded-[6px] border border-[#dedede] bg-white px-4 text-[13px] text-[#b3261e] hover:bg-[#fff5f5] disabled:opacity-30';
const labelClass = 'text-[12px] text-[#919191]';
const boxClass = 'flex flex-col gap-3 rounded-[10px] border border-[#dedede] bg-white p-4';

export default function OrganizationEditorSection() {
  const { data, loading, error, reload } = useOrganization();
  const presidents = useMemo(() => data?.presidents ?? [], [data]);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedTerm, setSelectedTerm] = useState(null);
  // 아직 저장하지 않은 새 학기 — 저장(PUT)되면 서버 목록에 생긴다
  const [draftTerm, setDraftTerm] = useState(null);

  // 처음엔 가장 최근 기수 · 가장 최근 학기
  useEffect(() => {
    if (!presidents.length) return;
    if (selectedId == null || (selectedId !== NEW && !presidents.some((p) => p.presidentId === selectedId))) {
      const last = presidents[presidents.length - 1];
      setSelectedId(last.presidentId);
      setSelectedTerm(last.officers?.[last.officers.length - 1]?.term ?? null);
    }
  }, [presidents, selectedId]);

  const president = selectedId === NEW ? null : presidents.find((p) => p.presidentId === selectedId) ?? null;
  const terms = president?.officers ?? [];
  const term = draftTerm ?? terms.find((t) => t.term === selectedTerm) ?? null;

  const pickPresident = (p) => {
    setDraftTerm(null);
    setSelectedId(p.presidentId);
    setSelectedTerm(p.officers?.[p.officers.length - 1]?.term ?? null);
  };

  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>조직도 편집</h1>
      <p className="mb-5 text-[13px] leading-[1.6] text-[#919191]">
        소개 페이지의 조직도는 <b className="font-medium text-[#454545]">가장 최근 기수의 가장 최근 학기</b>
        {data?.currentTerm ? ` (지금은 ${data.currentTerm})` : ''}를, 역대 회장 페이지는 기수 전부를 보여 줍니다. 이름이 여러 명이면 쉼표로
        적고, 적은 순서대로 화면에 나옵니다.
      </p>

      {loading ? (
        <AppLoading />
      ) : error ? (
        <p className="py-10 text-center text-[14px] text-[#919191]">{error}</p>
      ) : (
        <div className="flex flex-col gap-5">
          {/* 기수 고르기 */}
          <div className="flex flex-wrap items-center gap-2">
            {presidents.map((p) => (
              <button key={p.presidentId} type="button" className={chipClass(p.presidentId === selectedId)} onClick={() => pickPresident(p)}>
                {p.order} {p.name}
              </button>
            ))}
            <button
              type="button"
              className={chipClass(selectedId === NEW)}
              onClick={() => {
                setDraftTerm(null);
                setSelectedId(NEW);
                setSelectedTerm(null);
              }}
            >
              + 기수 추가
            </button>
          </div>

          {/* 기수 정보 */}
          <PresidentForm
            key={selectedId ?? 'none'}
            president={president}
            isNew={selectedId === NEW}
            nextSeqNo={(presidents[presidents.length - 1]?.seqNo ?? 0) + 1}
            onSaved={async (saved) => {
              await reload();
              setSelectedId(saved.presidentId);
              setSelectedTerm(saved.officers?.[saved.officers.length - 1]?.term ?? null);
            }}
            onDeleted={async () => {
              setSelectedId(null);
              setSelectedTerm(null);
              setDraftTerm(null);
              await reload();
            }}
          />

          {/* 학기 고르기 + 명단 */}
          {president && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                {terms.map((t) => (
                  <button
                    key={t.term}
                    type="button"
                    className={chipClass(!draftTerm && t.term === selectedTerm)}
                    onClick={() => {
                      setDraftTerm(null);
                      setSelectedTerm(t.term);
                    }}
                  >
                    {t.term}
                  </button>
                ))}
                {draftTerm && (
                  <button type="button" className={chipClass(true)}>
                    {draftTerm.term} (저장 전)
                  </button>
                )}
                <NewTermButton
                  president={president}
                  onCreate={(label) => {
                    // 새 학기는 회장 한 줄만 채워서 시작한다 — 나머지는 적어서 저장
                    setDraftTerm({
                      term: label,
                      roles: [{ role: '회장', names: [president.name] }],
                      teams: [],
                      advisors: [],
                    });
                    setSelectedTerm(label);
                  }}
                />
              </div>

              {term ? (
                <TermEditor
                  key={`${president.presidentId}-${term.term}-${draftTerm ? 'draft' : 'saved'}`}
                  president={president}
                  term={term}
                  isDraft={Boolean(draftTerm)}
                  onSaved={async (saved) => {
                    setDraftTerm(null);
                    await reload();
                    setSelectedTerm(saved.term);
                  }}
                  onDiscardDraft={() => {
                    setDraftTerm(null);
                    setSelectedTerm(terms[terms.length - 1]?.term ?? null);
                  }}
                  onDeleted={async () => {
                    setDraftTerm(null);
                    setSelectedTerm(null);
                    await reload();
                  }}
                />
              ) : (
                <p className="text-[13px] text-[#919191]">학기가 없습니다. 「+ 학기 추가」로 시작하세요.</p>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

// 기수(회장) 한 칸 — 기수 번호 · 이름 · 재임 연도 · 사진
function PresidentForm({ president, isNew, nextSeqNo, onSaved, onDeleted }) {
  const [seqNo, setSeqNo] = useState(president?.seqNo ?? nextSeqNo);
  const [name, setName] = useState(president?.name ?? '');
  const [startYear, setStartYear] = useState(president?.startYear ?? new Date().getFullYear());
  const [endYear, setEndYear] = useState(president?.endYear ?? '');
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const fileRef = useRef(null);
  if (!president && !isNew) return null;

  const body = () => ({
    seqNo: Number(seqNo),
    name: name.trim(),
    startYear: Number(startYear),
    endYear: String(endYear).trim() === '' ? null : Number(endYear),
  });

  const save = async () => {
    setSaving(true);
    try {
      const saved = isNew ? await createPresident(body()) : await updatePresident(president.presidentId, body());
      toast.success(isNew ? '기수를 추가했습니다.' : '기수 정보를 저장했습니다.');
      await onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    setSaving(true);
    try {
      await deletePresident(president.presidentId);
      toast.success('기수를 삭제했습니다.');
      await onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const upload = async (file) => {
    if (!file) return;
    setSaving(true);
    try {
      const saved = await uploadPresidentPhoto(president.presidentId, file);
      toast.success('사진을 바꿨습니다.');
      await onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, '사진을 올리지 못했습니다.'));
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const photo = orgPhotoSrc(president?.photoUrl);
  return (
    <div className={`${boxClass} md:flex-row md:items-start md:gap-5`}>
      {/* 사진 — 역대 회장 카드와 같은 비율 */}
      <div className="flex shrink-0 flex-col items-center gap-2">
        <div className="relative aspect-[227/280] w-[110px] overflow-hidden bg-[#D9D9D9]">
          {photo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={`${photo}${photo.startsWith('/images/') ? '' : `?v=${encodeURIComponent(president?.photoUrl ?? '')}`}`} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-[11px] text-[#919191]">사진 없음</div>
          )}
        </div>
        {!isNew && (
          <>
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => upload(e.target.files?.[0])} />
            <button type="button" className={smallBtn} disabled={saving} onClick={() => fileRef.current?.click()}>
              사진 바꾸기
            </button>
          </>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className={labelClass}>기수</span>
            <input type="number" min={1} value={seqNo} onChange={(e) => setSeqNo(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>이름</span>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="회장 이름" />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>시작 연도</span>
            <input type="number" value={startYear} onChange={(e) => setStartYear(e.target.value)} className={inputClass} />
          </label>
          <label className="flex flex-col gap-1">
            <span className={labelClass}>종료 연도 (비우면 현재)</span>
            <input type="number" value={endYear} onChange={(e) => setEndYear(e.target.value)} className={inputClass} placeholder="현재" />
          </label>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" className={primaryBtn} disabled={saving || !name.trim()} onClick={save}>
            {saving ? '저장 중' : isNew ? '기수 추가' : '기수 정보 저장'}
          </button>
          {!isNew && (
            <button type="button" className={dangerBtn} disabled={saving} onClick={() => setConfirmDelete(true)}>
              기수 삭제
            </button>
          )}
          {!isNew && president?.officers?.length > 0 && (
            <span className="text-[12px] text-[#919191]">학기 {president.officers.length}개</span>
          )}
        </div>
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={`${president?.order ?? ''} ${president?.name ?? ''} 기수를 삭제할까요? 학기 명단도 함께 숨겨집니다.`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

// '+ 학기 추가' — 라벨을 적는 작은 입력
function NewTermButton({ president, onCreate }) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState('');
  const submit = () => {
    const v = label.trim();
    if (!v) return;
    if ((president.officers ?? []).some((t) => t.term === v)) {
      toast.error('이미 있는 학기입니다.');
      return;
    }
    onCreate(v);
    setLabel('');
    setOpen(false);
  };
  if (!open) {
    return (
      <button type="button" className={chipClass(false)} onClick={() => setOpen(true)}>
        + 학기 추가
      </button>
    );
  }
  return (
    <span className="flex items-center gap-1">
      <input
        type="text"
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') submit();
          if (e.key === 'Escape') setOpen(false);
        }}
        placeholder={`${new Date().getFullYear()}-1학기`}
        className={`${inputClass} h-[32px] w-[140px]`}
      />
      <button type="button" className={smallBtn} onClick={submit}>
        추가
      </button>
      <button type="button" className={smallBtn} onClick={() => setOpen(false)}>
        취소
      </button>
    </span>
  );
}

// 한 학기의 명단 — 회장단(직책별 줄) · 팀(팀 이름 · 팀장 · 팀원) · 자문. 저장하면 통째로 바뀐다
function TermEditor({ president, term, isDraft, onSaved, onDiscardDraft, onDeleted }) {
  const [roles, setRoles] = useState(() => (term.roles ?? []).map((r) => ({ role: r.role, names: joinNames(r.names) })));
  const [teams, setTeams] = useState(() =>
    (term.teams ?? []).map((t) => ({ title: t.title, leader: t.leader ?? '', members: joinNames(t.members) }))
  );
  const [advisors, setAdvisors] = useState(joinNames(term.advisors));
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newLabel, setNewLabel] = useState(term.term);

  const move = (list, setList, i, d) => {
    const j = i + d;
    if (j < 0 || j >= list.length) return;
    const next = [...list];
    [next[i], next[j]] = [next[j], next[i]];
    setList(next);
  };
  const patch = (list, setList, i, part) => setList(list.map((row, k) => (k === i ? { ...row, ...part } : row)));
  const removeAt = (list, setList, i) => setList(list.filter((_, k) => k !== i));

  const save = async () => {
    setSaving(true);
    try {
      const saved = await saveOrgTerm(president.presidentId, term.term, {
        roles: roles.map((r) => ({ role: r.role.trim(), names: splitNames(r.names) })).filter((r) => r.role && r.names.length),
        teams: teams
          .map((t) => ({ title: t.title.trim(), leader: t.leader.trim() || null, members: splitNames(t.members) }))
          .filter((t) => t.title && (t.leader || t.members.length)),
        advisors: splitNames(advisors),
      });
      toast.success(`${saved.term} 명단을 저장했습니다.`);
      await onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const rename = async () => {
    const v = newLabel.trim();
    if (!v || v === term.term) {
      setRenaming(false);
      return;
    }
    setSaving(true);
    try {
      const saved = await renameOrgTerm(president.presidentId, term.term, v);
      toast.success(`학기 이름을 '${saved.term}'(으)로 바꿨습니다.`);
      setRenaming(false);
      await onSaved(saved);
    } catch (err) {
      toast.error(getErrorMessage(err, '이름을 바꾸지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  const remove = async () => {
    setConfirmDelete(false);
    setSaving(true);
    try {
      await deleteOrgTerm(president.presidentId, term.term);
      toast.success('학기를 삭제했습니다.');
      await onDeleted();
    } catch (err) {
      toast.error(getErrorMessage(err, '삭제하지 못했습니다.'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={boxClass}>
      {/* 학기 제목 줄 */}
      <div className="flex flex-wrap items-center gap-2">
        {renaming ? (
          <>
            <input
              type="text"
              autoFocus
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') rename();
                if (e.key === 'Escape') setRenaming(false);
              }}
              className={`${inputClass} w-[160px]`}
            />
            <button type="button" className={smallBtn} disabled={saving} onClick={rename}>
              적용
            </button>
            <button type="button" className={smallBtn} onClick={() => setRenaming(false)}>
              취소
            </button>
          </>
        ) : (
          <>
            <h2 className="text-[16px] font-semibold text-[#212121]">
              {president.order} {president.name} · {term.term}
              {isDraft && <span className="ml-2 text-[12px] font-normal text-[#919191]">저장 전</span>}
            </h2>
            {!isDraft && (
              <button type="button" className={smallBtn} onClick={() => setRenaming(true)}>
                학기 이름 변경
              </button>
            )}
          </>
        )}
      </div>

      {/* 회장단 */}
      <Group
        title="회장단"
        hint="직책마다 한 줄. 첫 줄은 보통 회장"
        onAdd={() => setRoles([...roles, { role: '', names: '' }])}
        addLabel="+ 직책 추가"
      >
        {roles.map((r, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 md:flex-nowrap">
            <input
              type="text"
              value={r.role}
              onChange={(e) => patch(roles, setRoles, i, { role: e.target.value })}
              placeholder="직책 (회장·부회장·총무·임원)"
              className={`${inputClass} w-[140px]`}
            />
            <input
              type="text"
              value={r.names}
              onChange={(e) => patch(roles, setRoles, i, { names: e.target.value })}
              placeholder="이름 (여러 명이면 쉼표)"
              className={`${inputClass} flex-1`}
            />
            <RowButtons onUp={() => move(roles, setRoles, i, -1)} onDown={() => move(roles, setRoles, i, 1)} onRemove={() => removeAt(roles, setRoles, i)} />
          </div>
        ))}
      </Group>

      {/* 팀 */}
      <Group title="팀" hint="팀장이 없으면 비워 두면 됩니다" onAdd={() => setTeams([...teams, { title: '', leader: '', members: '' }])} addLabel="+ 팀 추가">
        {teams.map((t, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-[6px] border border-[#ededed] p-3">
            <div className="flex flex-wrap items-center gap-2 md:flex-nowrap">
              <input
                type="text"
                value={t.title}
                onChange={(e) => patch(teams, setTeams, i, { title: e.target.value })}
                placeholder="팀 이름 (제작스터디·정기모임…)"
                className={`${inputClass} w-[180px]`}
              />
              <input
                type="text"
                value={t.leader}
                onChange={(e) => patch(teams, setTeams, i, { leader: e.target.value })}
                placeholder="팀장"
                className={`${inputClass} w-[120px]`}
              />
              <RowButtons onUp={() => move(teams, setTeams, i, -1)} onDown={() => move(teams, setTeams, i, 1)} onRemove={() => removeAt(teams, setTeams, i)} />
            </div>
            <input
              type="text"
              value={t.members}
              onChange={(e) => patch(teams, setTeams, i, { members: e.target.value })}
              placeholder="팀원 (여러 명이면 쉼표)"
              className={inputClass}
            />
          </div>
        ))}
      </Group>

      {/* 자문 */}
      <Group title="자문">
        <input type="text" value={advisors} onChange={(e) => setAdvisors(e.target.value)} placeholder="자문 (여러 명이면 쉼표, 없으면 비움)" className={inputClass} />
      </Group>

      <div className="flex flex-wrap items-center gap-2 border-t border-[#ededed] pt-3">
        <button type="button" className={primaryBtn} disabled={saving} onClick={save}>
          {saving ? '저장 중' : isDraft ? '학기 만들고 저장' : '명단 저장'}
        </button>
        {isDraft ? (
          <button type="button" className={ghostBtn} disabled={saving} onClick={onDiscardDraft}>
            취소
          </button>
        ) : (
          <button type="button" className={dangerBtn} disabled={saving} onClick={() => setConfirmDelete(true)}>
            학기 삭제
          </button>
        )}
      </div>

      <ConfirmModal
        open={confirmDelete}
        title={`${term.term} 명단을 삭제할까요?`}
        onConfirm={remove}
        onCancel={() => setConfirmDelete(false)}
      />
    </div>
  );
}

function Group({ title, hint, onAdd, addLabel, children }) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <span className="text-[14px] font-medium text-[#212121]">{title}</span>
        {hint && <span className="text-[12px] text-[#919191]">{hint}</span>}
        {onAdd && (
          <button type="button" className={`${smallBtn} ml-auto`} onClick={onAdd}>
            {addLabel}
          </button>
        )}
      </div>
      {children}
    </div>
  );
}

function RowButtons({ onUp, onDown, onRemove }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <button type="button" className={smallBtn} onClick={onUp} aria-label="위로">
        ↑
      </button>
      <button type="button" className={smallBtn} onClick={onDown} aria-label="아래로">
        ↓
      </button>
      <button type="button" className={smallBtn} onClick={onRemove} aria-label="삭제">
        삭제
      </button>
    </span>
  );
}
