'use client';

import React, { useEffect, useState } from 'react';
import { getFile } from '@/apis/file';
import { extractFileId } from '@/lib/markdown';

// 우리 서버 파일(/api/user/files/{id})은 Authorization 헤더가 필요해서
// <img src> 에 주소를 그대로 넣으면 404 가 난다. fetch(+토큰) → blob URL 로 바꿔 표시한다.
//
// 같은 이미지가 본문에 여러 번 나오거나 글을 오갈 때 매번 다시 받지 않도록 캐시를 둔다.
// 캐시에 담은 blob URL 은 회수(revoke)하지 않는다 — 회수하면 캐시가 가리키는 주소가 죽는다.
// (탭을 닫으면 함께 정리된다)
const blobUrlCache = new Map(); // fileId -> Promise<string>

function loadFileUrl(fileId) {
  if (!blobUrlCache.has(fileId)) {
    const promise = getFile(fileId)
      .then((blob) => URL.createObjectURL(blob))
      .catch((error) => {
        // 실패한 요청은 캐시에 남기지 않는다 (다시 그릴 때 재시도할 수 있도록)
        blobUrlCache.delete(fileId);
        throw error;
      });

    blobUrlCache.set(fileId, promise);
  }

  return blobUrlCache.get(fileId);
}

// 마크다운 본문의 이미지 한 장.
// 우리 서버 파일이면 blob 으로 받아 보여주고, 외부 주소면 그대로 쓴다.
export default function AuthedImage({ src, alt = '', width, height, ...rest }) {
  const fileId = extractFileId(src);

  const [blobUrl, setBlobUrl] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!fileId) return;

    let isIgnore = false;
    setFailed(false);
    setBlobUrl(null);

    loadFileUrl(fileId)
      .then((url) => {
        if (!isIgnore) setBlobUrl(url);
      })
      .catch(() => {
        if (!isIgnore) setFailed(true);
      });

    return () => {
      isIgnore = true;
    };
  }, [fileId]);

  if (fileId && failed) {
    return (
      <span className="inline-block rounded-[4px] bg-[#f5f5f5] px-3 py-2 text-[14px] text-[#919191]">
        이미지를 불러오지 못했습니다{alt ? ` (${alt})` : ''}
      </span>
    );
  }

  // 우리 서버 파일인데 아직 받는 중이면 자리를 잡아 둔다 (본문이 덜컥거리지 않게)
  if (fileId && !blobUrl) {
    return (
      <span
        className="inline-block animate-pulse rounded-[4px] bg-[#f5f5f5]"
        style={{ width: width ? `${width}px` : '100%', height: height ? `${height}px` : '160px' }}
        aria-label={alt || '이미지 불러오는 중'}
      />
    );
  }

  return (
    // 외부/blob 주소를 그대로 쓰므로 next/image 대신 img 를 쓴다
    // eslint-disable-next-line @next/next/no-img-element
    <img
      {...rest}
      src={fileId ? blobUrl : src}
      alt={alt}
      width={width}
      height={height}
      loading="lazy"
      className="h-auto max-w-full rounded-[4px]"
    />
  );
}
