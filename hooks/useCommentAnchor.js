'use client';

import { useEffect, useRef, useState } from 'react';

import { COMMENT_ANCHOR_PREFIX } from '@/lib/utils';

// 강조를 거둘 계기가 되는 이벤트.
// scroll은 넣지 않는다 - scrollIntoView({ behavior: 'smooth' })가 스스로 발생시켜
// 대상에 닿기도 전에 꺼져버린다. 아래 넷은 사용자가 직접 만졌을 때만 일어난다.
const DISMISS_EVENTS = ['pointerdown', 'keydown', 'wheel', 'touchstart'];

/**
 * URL 해시(#comment-3)로 지목된 댓글로 스크롤하고, 그 댓글을 강조 대상으로 알려준다.
 * 관리자 신고 관리에서 링크를 타고 들어올 때 쓴다.
 *
 * 댓글 영역이 있는 게시판 상세는 모두 이 훅을 써야 한다.
 * (신고 관리가 게시판을 가리지 않고 #comment-{id} 링크를 만들기 때문이다.
 *  어느 게시판에 댓글이 있는지는 constants/adminPosts.js의 BOARD_DETAIL이 들고 있다)
 *
 * @param {Array} comments 원글의 댓글 목록. 서버에서 채워지면 그때 스크롤한다.
 * @returns {string|null} 강조할 댓글의 anchor id. 없으면 null.
 */
export default function useCommentAnchor(comments = []) {
  const [focusedAnchor, setFocusedAnchor] = useState(null);
  // 해시 이동은 처음 한 번만 한다. 댓글을 쓰거나 지워서 목록이 갱신될 때마다
  // 다시 스크롤되면 방금 쓴 댓글에서 화면이 튀어버린다.
  const hashHandledRef = useRef(false);

  // 댓글은 원글을 불러온 뒤에 그려지므로, 브라우저의 기본 해시 이동은
  // 대상이 아직 없는 시점에 일어나 아무 일도 하지 않는다. 댓글이 채워진 뒤 직접 한 번 옮겨준다.
  useEffect(() => {
    if (hashHandledRef.current || comments.length === 0) return;

    const anchor = window.location.hash.slice(1);
    if (!anchor.startsWith(COMMENT_ANCHOR_PREFIX)) return;

    // 아직 그려지지 않았으면 플래그를 쓰지 않고 다음 갱신에 다시 시도한다.
    // 여기서 미리 표시해 버리면 댓글이 나중에 붙는 경우(단계적 로딩 등) 영구히 못 찾는다.
    const target = document.getElementById(anchor);
    if (!target) return;

    hashHandledRef.current = true;

    // block: 'center'로 옮기면 상단 고정 영역에 가려지지 않는다
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
    setFocusedAnchor(anchor);
  }, [comments]);

  // 강조는 '여기로 왔다'는 안내라서 한 번 보고 나면 거둔다.
  // 남겨두면 답글 · 수정 중인 댓글과 같은 회색이 두 개가 되어 지금 뭘 하는 중인지 흐려진다.
  useEffect(() => {
    if (!focusedAnchor) return;

    const dismiss = () => setFocusedAnchor(null);
    DISMISS_EVENTS.forEach((type) =>
      window.addEventListener(type, dismiss, { once: true, passive: true })
    );

    return () => DISMISS_EVENTS.forEach((type) => window.removeEventListener(type, dismiss));
  }, [focusedAnchor]);

  return focusedAnchor;
}
