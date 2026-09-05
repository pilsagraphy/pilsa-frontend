'use client';

import React, { useState } from 'react';
import { getFile } from '@/apis/file';
import { getErrorMessage } from '@/apis/auth';

function Divider() {
  return <div className="w-full h-px bg-[#DEDEDE]" />;
}

// 첨부파일 목록 (없으면 렌더하지 않는다)
//
// 첨부 정적 서빙은 폐지됐다 — fileUrl 은 Authorization 이 필요한 API 주소라서
// <a href> 나 <img src> 에 그대로 넣으면 열리지 않는다.
// 그래서 클릭 시 fetch(+토큰) → blob 으로 받아 내려준다.
export default function BoardAttachments({ attachments = [] }) {
  const [downloadingId, setDownloadingId] = useState(null);

  const list = Array.isArray(attachments) ? attachments : [];
  if (list.length === 0) return null;

  const handleDownload = async (file) => {
    const fileId = file?.attachmentId;
    if (!fileId || downloadingId != null) return;

    try {
      setDownloadingId(fileId);

      const blob = await getFile(fileId);

      // blob URL 은 쓰고 나서 바로 회수한다 (안 하면 탭이 살아 있는 동안 메모리에 남는다)
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = file?.originName ?? '첨부파일';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      alert(getErrorMessage(error, '파일을 내려받지 못했습니다.'));
    } finally {
      setDownloadingId(null);
    }
  };

  return (
    <section className="flex w-full flex-col gap-4 md:gap-[20px]">
      <Divider />

      <div className="flex flex-col gap-2 text-[15px] tracking-[-0.32px] md:flex-row md:items-start md:gap-6 md:text-[16px]">
        <span className="shrink-0 text-[#919191]">첨부파일</span>

        <div className="flex min-w-0 flex-col items-start gap-2 md:gap-[8px]">
          {list.map((file) => {
            const fileName = file?.originName ?? '첨부파일';
            const fileId = file?.attachmentId;
            const isDownloading = downloadingId === fileId;

            return (
              <button
                key={fileId ?? fileName}
                type="button"
                onClick={() => handleDownload(file)}
                disabled={downloadingId != null}
                className="flex items-center gap-1 break-all text-left text-[#454545] hover:underline disabled:opacity-60"
              >
                {fileName}
                {isDownloading && <span className="text-[#919191]">(받는 중...)</span>}
              </button>
            );
          })}
        </div>
      </div>

      <Divider />
    </section>
  );
}
