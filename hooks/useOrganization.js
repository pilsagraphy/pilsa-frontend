'use client';

import { useCallback, useEffect, useState } from 'react';
import { getOrganization } from '@/apis/org';
import { getErrorMessage } from '@/apis/auth';

// 조직 데이터(역대 회장 + 학기별 임원진) — 소개 페이지 조직도, 역대 회장, 관리자 조직도 편집이 같이 쓴다
export default function useOrganization() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const reload = useCallback(async () => {
    setError(null);
    try {
      const res = await getOrganization();
      setData(res);
    } catch (err) {
      setError(getErrorMessage(err, '조직 정보를 불러오지 못했습니다.'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  return { data, loading, error, reload };
}
