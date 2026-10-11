# OAuth 검토 메일 대응 — Pilsagraphy

2026-09-26. 9월 26일에 받은 메일은 거절 메일이 아니라, 모든 신청자에게 보내는 자동 점검표입니다. 점검 후 "확인했다"고 **답장해야** 검토가 계속됩니다.

---

## 1. 점검 결과

| 항목 | 상태 | 근거 |
|---|---|---|
| 최소 범위 | ✅ | calendar.events만 사용. 읽기 전용은 쓰기가 안 되고, app.created는 기본 캘린더에 못 넣음 (범위 사용 설명에 적음) |
| 범위 일치 | ✅ | 코드가 요청하는 범위 = `openid email profile` + `calendar.events`. 콘솔 등록 범위와 같음 |
| 범위 사용 설명 | ✅ | 제출함 |
| 영상 공개 설정 | ✅ | 일부 공개 |
| 동의 화면에 전체 범위 표시 | ✅ | 로그인 화면(이름·이메일)과 캘린더 화면 모두 영어로 나옴 |
| 쓰기 결과를 구글 계정에서 보여 주기 | ✅ | 영상에 구글 캘린더에 일정이 들어간 장면 있음 |
| 테스트 계정 | ✅ | 추가 정보에 testtest 계정 적음 |
| 가입 장벽(휴대폰 인증·결제) | ✅ | 없음 |
| 개인정보처리방침 — 수집·이용·제3자 제공·보호·보관·파기 | ✅ | 이미 한국어로 다 있음 |
| 개인정보처리방침 — **Limited Use 문구** | ⚠️ 추가 권장 | 구글 캘린더는 Workspace API라 이 문구를 넣어 두는 게 안전함 |
| 개인정보처리방침 — 영어 | ⚠️ 추가 권장 | 검토자가 영어로 읽음. 필수는 아니지만 보완 요청을 줄여 줌 |
| AI 학습, Gmail·Drive 등 금지 용도, CASA | 해당 없음 | 사용하지 않음 |

코드로 확인한 사실: 구글에서 받는 정보 중 저장하는 것은 **이메일과 구글 계정 고유 ID(sub)뿐**입니다. 이름은 받지만 저장하지 않습니다. 연동을 해제하면 토큰을 폐기하고, 넣어 둔 일정까지 지울지 선택할 수 있습니다.

---

## 2. 개인정보처리방침에 추가할 내용

help.pilsa.co.kr/privacy-policy.html 의 **6번(보유 및 파기)과 7번(이용자 권리) 사이**나 맨 끝에 넣으면 됩니다.

```html
<h2>구글 사용자 데이터 처리 (Google User Data)</h2>
<p>앱이 구글 API로부터 받은 정보를 사용하거나 다른 앱으로 전송하는 것은
<a href="https://developers.google.com/terms/api-services-user-data-policy">Google API 서비스 사용자 데이터 정책</a>의
제한적 사용(Limited Use) 요구사항을 포함한 내용을 준수합니다.</p>

<p lang="en"><strong>English summary for Google user data</strong></p>
<ul lang="en">
  <li><strong>Data accessed:</strong> When a member links a Google account, we store only the Google account email address and the unique Google account ID. The name shared at sign-in is not stored. When a member turns on Google Calendar sync (calendar.events), the app only creates, updates and deletes the club events it created in the member's primary calendar. It does not read or change the member's other events, and it does not access Gmail, Drive or any other Google service.</li>
  <li><strong>Data use:</strong> Google user data is used only to let the member sign in with Google and to sync club events to the member's Google Calendar.</li>
  <li><strong>Data sharing:</strong> We do not sell or share Google user data with third parties, do not use it for advertising, and do not use it to train AI/ML models. Data is stored on our servers hosted on Amazon Web Services.</li>
  <li><strong>Data protection:</strong> All traffic uses HTTPS (TLS). Google access tokens are encrypted at rest, and access to user data is limited to authorized operators.</li>
  <li><strong>Retention and deletion:</strong> When a member unlinks Google or deletes their account, we delete the stored Google data immediately and ask Google to revoke the access token. When unlinking Calendar sync, the member can also choose to remove the club events the app added.</li>
  <li><strong>Limited Use:</strong> Pilsagraphy's use and transfer of information received from Google APIs will adhere to the <a href="https://developers.google.com/terms/api-services-user-data-policy">Google API Services User Data Policy</a>, including the Limited Use requirements.</li>
</ul>
```

---

## 3. 답장 초안 (영어)

받은 메일에 그대로 **답장**으로 보냅니다. 새 메일로 보내면 안 됩니다.

```
Hello Third Party Data Safety Team,

Thank you for the checklist. We have reviewed our app, Cloud Console configuration and submission against every item. Summary:

- Scopes: The app requests only openid, email, profile and calendar.events, which exactly match the scopes configured in the Cloud Console. calendar.events is the narrowest scope that works: the app must create, update and delete club events in the member's primary calendar. calendar.events.readonly cannot write, and calendar.app.created only allows a separate secondary calendar.
- Production-ready: Google sign-in and Calendar sync are live, user-facing features of our club community app.
- Demo video (https://youtu.be/SL2pgSByb8E, unlisted): shows the consent screen in English with all requested scopes, connecting Google Calendar from My Page, club events appearing in the user's Google Calendar, and unlinking.
- Test access: Test account (general member) ID testtest / PW test1234! at https://pilsa.co.kr. After logging in, open My Page to connect Google Calendar. There is no phone verification or payment step.
- Privacy policy (https://help.pilsa.co.kr/privacy-policy.html): discloses what Google user data is accessed, how it is used, that it is not shared or sold, how it is protected, and how it is retained and deleted. We added an English summary and a Limited Use statement.
- Limited Use: Google user data is used only to provide the sign-in and calendar sync features. It is not used for advertising, not transferred to third parties, and not used to train AI/ML models. The app does not use Gmail, Drive, Photos, YouTube or Data Portability APIs, and does not request restricted scopes.

Please let us know if you need anything else.

Best regards,
Pilsagraphy
```

⚠️ 답장에 "We added an English summary and a Limited Use statement"라고 적었으니, **2번을 실제로 반영한 뒤에** 보내야 합니다.
