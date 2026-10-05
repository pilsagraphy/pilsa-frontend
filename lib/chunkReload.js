// 배포 뒤 옛 청크(/_next/static/<옛 빌드>/…)가 사라져 화면이 그리다 죽는 경우의 자동 복구.
//
// 서버는 새 릴리스의 정적 파일만 서빙하므로, 오래 켜 둔 화면이 배포 전 번들의 청크를 뒤늦게 요구하면 404 → ChunkLoadError.
// 새 번들을 받으면 바로 낫는 문제라 한 번만 새로고침한다. 무한 새로고침이 되지 않게 세션에 표시를 남기고,
// 정상 화면이 뜨면(AuthBootstrap) 표시를 지워 다음 배포 때 또 동작하게 한다. (테스터 "가끔 오류 화면", 2026-10-02)
export const CHUNK_RELOADED_KEY = 'pilsa:chunkReloaded';

export const isChunkLoadError = (e) =>
  e?.name === 'ChunkLoadError' ||
  /Loading chunk|Loading CSS chunk|Failed to fetch dynamically imported module|ChunkLoadError/i.test(
    String(e?.message ?? '')
  );

// 새로고침했으면 true. 이미 한 번 했거나 저장소를 못 쓰면 false (호출자가 오류 화면을 그대로 보여 준다)
export function reloadOnceForChunkError(error) {
  if (!isChunkLoadError(error)) return false;
  try {
    if (sessionStorage.getItem(CHUNK_RELOADED_KEY) === '1') return false;
    sessionStorage.setItem(CHUNK_RELOADED_KEY, '1');
  } catch {
    return false;
  }
  window.location.reload();
  return true;
}

export function clearChunkReloadMark() {
  try {
    sessionStorage.removeItem(CHUNK_RELOADED_KEY);
  } catch {
    /* 비공개 모드 등 — 표시가 없으면 그만 */
  }
}
