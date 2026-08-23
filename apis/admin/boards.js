// 관리자 - 게시판 관리 API 처리
import axiosInstance from '@/apis/axiosInstance';

// 1. 게시판 목록 (GET /api/admin/boards) [ADMIN]
//    응답: [{ boardId, boardName, postCount, readScope, writeLevel, displayOrder }]

// 2. 게시판 생성 (POST /api/admin/boards) [ADMIN]
//    요청: { name, readScope, writeLevel }
//      readScope: MEMBER(재학+졸업) | STUDENT(재학) | ALUMNI(졸업)
//      writeLevel: 0~3 (0 = 일반회원)
//    응답: 201 { boardId, boardName, postCount, readScope, writeLevel, displayOrder }
//    생성 즉시 사용자 게시판 API 가 동작한다 (코드 수정 불필요)
//    실패: 409 이미 존재하는 게시판 이름

// 3. 게시판 수정 (PATCH /api/admin/boards/{boardId}) [ADMIN]
//    요청: 전달한 필드만 수정 — name, readScope, writeLevel, displayOrder,
//          allowComment, allowAttachment, categoryMode, defaultCategoryId,
//          allowAnonymous, allowPrivateComment
//    응답: 게시판 정보 전체 → 프론트가 재조회할 필요 없다
//    실패: 404 없는 게시판 / 409 이름 중복 / 400 readScope 값 오류

// 4. 게시판 삭제 (PATCH /api/admin/boards/{boardId}/delete) [ADMIN]
//    응답: { message } — 소프트 삭제
//    실패: 409 '게시글이 N건 남아 있어 삭제할 수 없습니다.'
