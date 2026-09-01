'use client';

import { useCallback, useState } from 'react';
import { getErrorMessage } from '@/apis/auth';

/**
 * 화면 지역(local) 비동기 요청 상태 관리 훅.
 *
 * 한 화면에서만 쓰고 나가면 버리는 서버 데이터(목록·상세·댓글·카테고리 등)에 쓴다.
 * 여러 화면이 공유하거나 네비게이션을 넘어 유지돼야 하는 값은 zustand 스토어를 쓴다.
 *
 * { isLoading, data, error } 를 항상 세트로 관리한다.
 *  - 요청 시작: isLoading = true, error = null
 *  - 요청 종료: 성공이든 실패든 반드시 isLoading = false
 *  - 실패: error 에 사용자용 한국어 문장을 담는다 (fallbackMessage)
 *
 * @param {*} initialData data 초기값 (기본 null)
 * @returns {{
 *   isLoading: boolean,
 *   data: *,
 *   error: string|null,
 *   run: (task: () => Promise<*>, options?: { fallbackMessage?: string }) => Promise<*|undefined>,
 *   setData: (value: *) => void,
 *   reset: () => void,
 * }}
 */
export default function useApiRequest(initialData = null) {
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState(initialData);
  const [error, setError] = useState(null);

  // task: 실제 통신을 수행하는 함수 (예: () => getBoardPost(boardId, postId))
  // 성공하면 응답을 data 에 담고 그 값을 반환한다. 실패하면 error 를 채우고 undefined 를 반환한다.
  const run = useCallback(async (task, { fallbackMessage } = {}) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await task();
      setData(result);
      return result;
    } catch (err) {
      setError(getErrorMessage(err, fallbackMessage ?? '요청을 처리하지 못했습니다.'));
      return undefined;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setIsLoading(false);
    setData(initialData);
    setError(null);
  }, [initialData]);

  return { isLoading, data, error, run, setData, reset };
}
