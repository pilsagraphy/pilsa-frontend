'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';
import {
  getAdminGalleryPhotos,
  hideGalleryPhoto,
  reorderGalleryPhotos,
  restoreGalleryPhoto,
  updateGalleryPhotoMeta,
  updateGalleryPhotoRegistration,
} from '@/apis/admin/gallery';
import { getUsers } from '@/apis/admin/users';
import { listSectionClass, listTitleClass } from '@/components/shared/admin/CommunityListStyles';
import AppLoading from '@/components/common/AppLoading';
import { apiUrl } from '@/lib/apiBase';
import { toast } from '@/lib/toast';

// 메뉴 관리 > 활동 사진 관리 (PM 2026-10-10 밤) — 회원이 올린 사진을 학기별로 훑고 숨기기/복원, 제목·해시태그 수정(둘 다 필수).
// 10/11 추가: 검색(제목·해시태그·올린 사람 이름·아이디, 전체 학기) · 순서 바꾸기(↑↓, 그 학기 전체를 0..n-1 로 다시 매김) · 등록 정보(학기·올린 사람) 수정.
// 본인이 지운 사진(deleted)은 목록에 없다. 올린 사람이 없는 사진(사이트를 만들 때 코드에 있던 것)은 따로 표시하지 않는다.
const STATE_LABEL = { normal: '보임', hidden: '숨김' };
const chipClass = (active) =>
  `h-[32px] shrink-0 rounded-full px-3 text-[13px] font-medium tracking-[-0.26px] transition ${
    active ? 'bg-inverse text-inverse-fg' : 'bg-surface-2 text-ink-2 hover:bg-surface-3'
  }`;
const smallBtn =
  'h-[28px] shrink-0 rounded-[4px] border border-line bg-surface px-2 text-[12px] text-ink-2 hover:bg-surface-2 disabled:opacity-30';
const inputClass =
  'h-[30px] min-w-0 w-full rounded-[4px] border border-line bg-surface px-2 text-[12px] text-ink outline-none transition-colors focus:border-ink-3';
const src = (url) => (url?.startsWith('/api/') ? apiUrl(url) : url);
const fmtDate = (iso) => (iso ? String(iso).slice(0, 16).replace('T', ' ') : '');

export default function GalleryAdminSection() {
  const [semester, setSemester] = useState(null);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(null);
  // 검색 — 입력 중인 글자(keyword)와 실제로 찾은 글자(query). query 가 있으면 학기와 무관하게 전체에서 찾는다 (PM 10/11)
  const [keyword, setKeyword] = useState('');
  const [query, setQuery] = useState('');
  // 빠르게 연달아 찾을 때 늦게 온 옛 응답이 새 결과를 덮지 않게 (검토 지적)
  const seq = useRef(0);

  const load = useCallback(async (sem, quiet = false, kw = '') => {
    const my = ++seq.current;
    if (!quiet) setLoading(true);
    setError(null);
    try {
      const res = await getAdminGalleryPhotos(kw ? null : sem, kw);
      if (my === seq.current) setData(res);
    } catch (err) {
      if (my === seq.current) setError(getErrorMessage(err, '불러오지 못했습니다.'));
    } finally {
      if (my === seq.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(semester, false, query);
  }, [load, semester, query]);

  const toggle = async (photo) => {
    setBusy(photo.photoId);
    try {
      if (photo.state === 'normal') {
        await hideGalleryPhoto(photo.photoId);
        toast.success('숨겼습니다.');
      } else {
        await restoreGalleryPhoto(photo.photoId);
        toast.success('복원했습니다.');
      }
      await load(semester, true, query);
    } catch (err) {
      toast.error(getErrorMessage(err, '처리하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const saveMeta = async (photo, title, hashtags) => {
    setBusy(photo.photoId);
    try {
      await updateGalleryPhotoMeta(photo.photoId, { title, hashtags });
      toast.success('저장했습니다.');
      await load(semester, true, query);
    } catch (err) {
      toast.error(getErrorMessage(err, '저장하지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const saveRegistration = async (photo, body) => {
    setBusy(photo.photoId);
    try {
      await updateGalleryPhotoRegistration(photo.photoId, body);
      toast.success('등록 정보를 고쳤습니다.');
      await load(semester, true, query);
    } catch (err) {
      toast.error(getErrorMessage(err, '고치지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const photos = data?.photos ?? [];

  // 순서 — 이웃과 자리를 바꾼 뒤 그 학기 전체를 0..n-1 로 다시 매긴다. 검색 결과(여러 학기 섞임)에서는 못 바꾼다
  const move = async (index, dir) => {
    const j = index + dir;
    if (j < 0 || j >= photos.length || !data?.semester) return;
    const list = [...photos];
    [list[index], list[j]] = [list[j], list[index]];
    setBusy(list[j].photoId);
    try {
      await reorderGalleryPhotos(data.semester, list.map((p) => p.photoId));
      await load(semester, true, query);
    } catch (err) {
      toast.error(getErrorMessage(err, '순서를 바꾸지 못했습니다.'));
    } finally {
      setBusy(null);
    }
  };

  const search = () => setQuery(keyword.trim());
  return (
    <section className={listSectionClass}>
      <h1 className={listTitleClass}>활동 사진 관리</h1>
      {/* 검색 — 제목·해시태그·올린 사람 이름·아이디. 찾는 동안은 학기 칩 대신 결과 수를 보여 주고 순서는 못 바꾼다 */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search();
          }}
          placeholder="제목 · 해시태그 · 올린 사람 이름 · 아이디로 찾기"
          className="h-[36px] min-w-0 flex-1 rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink outline-none transition-colors focus:border-ink-3"
        />
        <button type="button" onClick={search} className="h-[36px] shrink-0 rounded-[6px] bg-inverse px-4 text-[13px] text-inverse-fg">
          찾기
        </button>
        {query && (
          <button
            type="button"
            onClick={() => {
              setKeyword('');
              setQuery('');
            }}
            className="h-[36px] shrink-0 rounded-[6px] border border-line bg-surface px-3 text-[13px] text-ink-2"
          >
            지우기
          </button>
        )}
      </div>
      {loading ? (
        <AppLoading />
      ) : error ? (
        <div className="flex flex-col items-center gap-3 py-10">
          <p className="text-[14px] text-ink-3">{error}</p>
          <button type="button" className={smallBtn} onClick={() => load(semester, false, query)}>
            다시 불러오기
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {query ? (
            <p className="text-[13px] text-ink-3">
              전체 학기에서 &lsquo;{query}&rsquo; 검색 결과 {photos.length}장 (검색 중에는 순서를 바꿀 수 없어요)
            </p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {(data?.semesters ?? []).map((label) => (
                <button key={label} type="button" className={chipClass(label === data.semester)} onClick={() => setSemester(label)}>
                  {label}
                </button>
              ))}
            </div>
          )}
          {photos.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-ink-3">{query ? '검색 결과가 없습니다.' : '이 학기에는 사진이 없습니다.'}</p>
          ) : (
            <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {photos.map((p, i) => (
                <PhotoCard
                  key={p.photoId}
                  photo={p}
                  busy={busy === p.photoId}
                  showSemester={Boolean(query)}
                  canReorder={!query}
                  first={i === 0}
                  last={i === photos.length - 1}
                  onMove={(d) => move(i, d)}
                  onToggle={() => toggle(p)}
                  onSave={(t, h) => saveMeta(p, t, h)}
                  semesters={data?.semesters ?? []}
                  onSaveRegistration={(body) => saveRegistration(p, body)}
                />
              ))}
            </ul>
          )}
        </div>
      )}
    </section>
  );
}

// 사진 한 장 — 제목·해시태그를 바로 고쳐 저장하고, 순서(↑↓)·등록 정보(학기·올린 사람)도 여기서 바꾼다
function PhotoCard({ photo, busy, showSemester, canReorder, first, last, onMove, onToggle, onSave, semesters, onSaveRegistration }) {
  const [title, setTitle] = useState(photo.title ?? '');
  const [hashtags, setHashtags] = useState((photo.hashtags ?? []).join(', '));
  const [regOpen, setRegOpen] = useState(false);
  useEffect(() => {
    setTitle(photo.title ?? '');
    setHashtags((photo.hashtags ?? []).join(', '));
  }, [photo.title, photo.hashtags]);
  const dirty = title !== (photo.title ?? '') || hashtags !== (photo.hashtags ?? []).join(', ');
  // 올린 사람이 없는 사진(코드에 있던 것)은 따로 표시하지 않는다 (PM 10/11)
  const uploader = photo.userId == null ? '' : photo.uploaderName ?? `회원 ${photo.userId}`;
  const canSave = dirty && title.trim() && hashtags.trim();

  return (
    <li className={`flex flex-col gap-2 rounded-[8px] border border-line p-2 ${photo.state === 'normal' ? '' : 'opacity-60'}`}>
      <div className="relative w-full overflow-hidden rounded-[6px] bg-surface-2" style={{ aspectRatio: String(photo.ratio || 1) }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src(photo.imageUrl)} alt={photo.title ?? ''} loading="lazy" className="h-full w-full object-cover" />
      </div>
      <div className="flex items-center justify-between gap-2 text-[11px] text-ink-3">
        <span className="min-w-0 truncate">
          #{photo.photoId} · {STATE_LABEL[photo.state] ?? photo.state}
          {showSemester ? ` · ${photo.semesterLabel}` : ''}
          {uploader ? ` · ${uploader}` : ''}
        </span>
        <span className="flex shrink-0 gap-1">
          {canReorder && (
            <>
              <button type="button" className={smallBtn} disabled={busy || first} onClick={() => onMove(-1)} aria-label="앞으로">
                ↑
              </button>
              <button type="button" className={smallBtn} disabled={busy || last} onClick={() => onMove(1)} aria-label="뒤로">
                ↓
              </button>
            </>
          )}
          <button type="button" className={smallBtn} disabled={busy} onClick={onToggle}>
            {photo.state === 'normal' ? '숨기기' : '복원'}
          </button>
        </span>
      </div>
      <input type="text" value={title} maxLength={100} onChange={(e) => setTitle(e.target.value)} placeholder="제목 (필수)" className={inputClass} />
      <div className="flex gap-1">
        <input type="text" value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="해시태그 (필수, 쉼표 구분)" className={inputClass} />
        <button type="button" className={smallBtn} disabled={busy || !canSave} onClick={() => onSave(title, hashtags)}>
          저장
        </button>
      </div>
      {/* 등록 정보 — 학기 · 올린 사람 · 올린 때. 펼치면 학기와 올린 사람을 바꿀 수 있다 */}
      <button type="button" onClick={() => setRegOpen((v) => !v)} className="text-left text-[11px] text-ink-3 underline underline-offset-2">
        등록 정보 {regOpen ? '닫기' : '수정'} · {photo.semesterLabel} · {fmtDate(photo.createdAt)}
      </button>
      {regOpen && <RegistrationEditor photo={photo} semesters={semesters} busy={busy} onSave={onSaveRegistration} />}
    </li>
  );
}

// 등록 정보 편집 — 학기는 목록에서 고르거나 '2026-2학기' 꼴로 직접, 올린 사람은 회원 검색으로 고르거나 '없음'
function RegistrationEditor({ photo, semesters, busy, onSave }) {
  const [label, setLabel] = useState(photo.semesterLabel ?? '');
  const [member, setMember] = useState(photo.userId ? { userId: photo.userId, name: photo.uploaderName } : null);
  const [kw, setKw] = useState('');
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const options = Array.from(new Set([...(semesters ?? []), photo.semesterLabel].filter(Boolean)));
  const search = async () => {
    if (!kw.trim()) return;
    setSearching(true);
    try {
      const res = await getUsers({ page: 1, size: 8, keyword: kw.trim() });
      setResults(res?.members ?? []);
    } catch (err) {
      toast.error(getErrorMessage(err, '회원을 찾지 못했습니다.'));
    } finally {
      setSearching(false);
    }
  };
  return (
    <div className="flex flex-col gap-2 rounded-[6px] border border-line bg-surface-2 p-2 text-[11px] text-ink-2">
      <label className="flex items-center gap-2">
        <span className="w-[52px] shrink-0 text-ink-3">학기</span>
        <input list={`sem-${photo.photoId}`} value={label} onChange={(e) => setLabel(e.target.value)} placeholder="2026-2학기" className={inputClass} />
        <datalist id={`sem-${photo.photoId}`}>
          {options.map((o) => (
            <option key={o} value={o} />
          ))}
        </datalist>
      </label>
      <div className="flex items-center gap-2">
        <span className="w-[52px] shrink-0 text-ink-3">올린 사람</span>
        <span className="min-w-0 flex-1 truncate">{member ? `${member.name ?? '회원'}${member.loginId ? ` (${member.loginId})` : ''}` : '없음'}</span>
        {member && (
          <button type="button" className={smallBtn} onClick={() => setMember(null)}>
            없음으로
          </button>
        )}
      </div>
      <div className="flex gap-1">
        <input
          type="text"
          value={kw}
          onChange={(e) => setKw(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') search();
          }}
          placeholder="이름 또는 아이디로 회원 찾기"
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
                setMember(m);
                setResults([]);
              }}
              className="h-[24px] rounded-full bg-surface px-2 text-[11px] text-ink-2 ring-1 ring-line hover:bg-surface-3"
            >
              {m.name} ({m.loginId})
            </button>
          ))}
        </div>
      )}
      <div className="flex justify-end">
        <button type="button" className={smallBtn} disabled={busy || !label.trim()} onClick={() => onSave({ semesterLabel: label.trim(), userId: member?.userId ?? null })}>
          등록 정보 저장
        </button>
      </div>
    </div>
  );
}
