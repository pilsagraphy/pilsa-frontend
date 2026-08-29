# TWA 빌드 절차

Bubblewrap 으로 웹앱을 Android 앱(TWA)으로 감싸 Play 스토어에 올리는 과정.
`twa-manifest.json` 이 그 입력값이고, 이 디렉터리는 **생성물이 아니라 설정만** 담는다
(생성된 Android 프로젝트는 `.gitignore` 에 두는 것을 권장).

## 0. 먼저 채워야 하는 값

| 위치 | 항목 | 현재 |
|---|---|---|
| `twa-manifest.json` | `host` · `iconUrl` · `webManifestUrl` · `fullScopeUrl` | `pilsa.co.kr` 로 가정해 둠 — **실제 배포 도메인 확인 필요** |
| `twa-manifest.json` | `signingKey.alias` | `REPLACE_ME_KEY_ALIAS` |
| `public/.well-known/assetlinks.json` | `sha256_cert_fingerprints` | `REPLACE_ME:...` |

## 1. 사전 준비

```bash
npm install -g @bubblewrap/cli
```

첫 실행 시 JDK 와 Android SDK 를 자동으로 내려받는다(수 GB, 시간이 걸린다).

## 2. 프로젝트 생성

`twa-manifest.json` 이 있는 이 디렉터리에서:

```bash
bubblewrap init --manifest ./twa-manifest.json
```

키스토어 비밀번호를 물어본다. `../../app-key/v_1_release_key.jks` 의 비밀번호를 입력한다.
alias 를 모르면 먼저 확인:

```bash
keytool -list -v -keystore "D:/Program/java/pilsa/app-key/v_1_release_key.jks"
```

## 3. 빌드

```bash
bubblewrap build
```

`app-release-bundle.aab`(Play 업로드용)와 `app-release-signed.apk`(직접 설치 테스트용)가 나온다.

## 4. Play Console 업로드 → **여기서 지문이 나온다**

Play 신규 앱은 AAB + Play App Signing 이 강제된다. 그래서 로컬 `v_1_release_key.jks` 는
**업로드 키**로만 쓰이고, `assetlinks.json` 에 넣어야 하는 값은 **Play 가 재서명한 앱 서명 키의 SHA-256** 이다.
이 값은 앱을 한 번 올리기 전에는 존재하지 않는다.

1. Play Console → 앱 만들기 (패키지명 `kr.co.pilsa.app`)
2. 내부 테스트 트랙에 `app-release-bundle.aab` 업로드
3. **앱 무결성 → 앱 서명 키 인증서 → SHA-256 인증서 지문** 복사

## 5. assetlinks.json 반영

`public/.well-known/assetlinks.json` 의 `REPLACE_ME:...` 를 4번에서 복사한 지문으로 교체하고 배포한다.

배포 후 반드시 확인 — 리다이렉트 없이 `200` 과 `application/json` 이어야 한다:

```bash
curl -sSIL https://pilsa.co.kr/.well-known/assetlinks.json
```

구글의 공식 검증기로도 확인할 수 있다:

```
https://developers.google.com/digital-asset-links/tools/generator
```

## 6. 최종 확인

내부 테스트로 실기기에 설치한 뒤 앱을 연다.

- **주소창이 보이지 않으면** 검증 성공 (TWA 로 동작)
- **주소창이 보이면** 검증 실패 — 그냥 Custom Tab 으로 뜬 것이다.
  원인은 대부분 (a) 지문 불일치 (b) assetlinks.json 이 리다이렉트됨 (c) 패키지명 불일치.

> 검증은 앱 설치 시점에 캐시된다. assetlinks 를 고친 뒤에는 **앱을 지웠다 다시 설치**해야 반영된다.

## 웹 푸시에 대해

`public/push-sw.js` 의 웹 푸시가 TWA 안에서도 그대로 동작한다.
Bubblewrap 의 `enableNotifications: true` 는 Android 13+ 의 알림 권한(`POST_NOTIFICATIONS`)을
매니페스트에 넣어 주는 역할이라 켜 두었다.
