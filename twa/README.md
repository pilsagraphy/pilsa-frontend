# TWA 빌드 절차

Bubblewrap 으로 웹앱을 Android 앱(TWA)으로 감싸 Play 스토어에 올리는 과정.
`twa-manifest.json` 이 그 입력값이고, 이 디렉터리는 **생성물이 아니라 설정만** 담는다
(생성된 Android 프로젝트는 커밋하지 않는다 — `twa-manifest.json` 만 있으면 2번으로 다시 만들어진다).

생성물 위에 덮어쓰는 **우리 쪽 수정본은 `overrides/`** 에 있다 (현재 `LauncherActivity.java` 하나 — 앱을 여는 브라우저를
Chrome 으로 고정). `bubblewrap update` 가 템플릿으로 다시 만들어 버리므로 update 뒤에 `apply-overrides.ps1` 로 덮어쓴다 (2-1번).

TWA 는 `https://pilsa.co.kr` 을 그대로 여는 껍데기라 **웹 코드가 앱 안에 들어가지 않는다.**
프론트를 재배포하면 앱을 다시 만들지 않아도 그대로 반영된다. 앱을 새로 빌드해야 하는 건
`twa-manifest.json` 이 바뀔 때뿐이다 (패키지명·이름·아이콘·버전·서명키·알림 설정 등).

## 0. 현재 값

| 항목 | 값 |
|---|---|
| `packageId` | `kr.co.pilsa.pilsagraphy` — **Play Console 에 2026-08-16 에 만들어 둔 앱의 패키지명.** 다른 값으로 빌드하면 업로드가 거부된다 |
| `name` · `launcherName` | `Pilsagraphy` — 설치된 앱·홈 화면에 보이는 이름 (스토어 등록정보 이름과 맞춤) |
| `host` · `webManifestUrl` · `fullScopeUrl` | `pilsa.co.kr` |
| `startUrl` | `/?launch=app` — 앱을 켤 때마다 시계 게이트를 보이기 위한 표식. middleware 가 이 진입만 통과 쿠키가 있어도 게이트로 둔다 (크롬은 앱 종료 후에도 세션 쿠키를 복원해 쿠키 수명으로는 구분이 안 된다) |
| `iconUrl` | `/icons/icon-splash-512.png` — **스플래시 전용** (흰 바탕에 검정 로고, 배경 투명). 아래 '스플래시' 참고 |
| `maskableIconUrl` · `monochromeIconUrl` | `/icons/icon-maskable-512.png` · `/icons/icon-monochrome-512.png` — 홈 화면 아이콘(검정 네모) |
| `signingKey` | `../../app-key/pilsa-upload.jks`, alias `pilsa-upload` (2026-09-09 재생성) |
| `appVersionName` / `appVersionCode` | `1.0.4` / `5` — v1(`1.0.0`/`1`) 2026-09-09 비공개 테스트, v3(`1.0.2`/`3`) 알림 수정, v4(`1.0.3`/`4`) provider 를 Chrome 으로 고정(아래 '웹 푸시에 대해'), **v5 는 시작 URL `/?launch=app`** (v4 는 시작 URL 없는 빌드가 올라갔을 수 있어 번호를 올림) |
| `assetlinks.json` 지문 | 업로드 키 `20:7E:A7:E9:…:9B:8A` + Play 앱 서명 키 `95:08:85:FC:…:46:38` 두 개 |

> 업로드 키는 `pilsa-upload.jks` 다. 예전 `v_1_release_key.jks` 는 비밀번호를 아는 사람이 없어
> 열 수 없었고 스토어에 올린 적도 없어서 새 키로 교체했다 (52ac55e). 그 키도 Play 에 올리기 전에
> 비밀번호가 노출돼 2026-09-09 에 다시 만들었다 (옛 파일은 `app-key/old/`). 비밀번호는 키스토어 옆
> 파일·비밀번호 관리자에만 두고 **레포·채팅·로그에 쓰지 않는다.**

## 스플래시 (앱 켤 때 뜨는 화면)

Bubblewrap 은 `iconUrl` 이미지를 **스플래시와 (API 25 이하) 레거시 런처 아이콘** 양쪽에 쓰고,
API 26+ 의 홈 화면 아이콘은 `maskableIconUrl` 로 따로 만든다. 그래서 `iconUrl` 만 바꾸면
홈 화면 아이콘(검정 네모)은 그대로 두고 스플래시만 바꿀 수 있다.

- `public/icons/icon-splash-512.png` — 검정 로고만 있고 배경은 투명. 스플래시는 이걸 `backgroundColor`(흰색) 위에 그린다.
- 이 파일은 프론트 배포에 포함돼야 한다. `bubblewrap update` 가 `https://pilsa.co.kr/icons/icon-splash-512.png` 를
  **실제로 내려받아** 5개 해상도 `splash.png` 를 만들기 때문에, **프론트를 먼저 배포하고 나서** 2번을 돌린다.
- Android 12+ 는 앱이 뜨기 전에 OS 가 런처 아이콘(검정 네모)을 잠깐 먼저 보여준다. 이건 OS 동작이라
  `iconUrl` 로는 안 바뀐다 — 그것까지 없애려면 홈 화면 아이콘 자체를 바꿔야 한다.

## 1. 사전 준비

```bash
npm install -g @bubblewrap/cli
```

Bubblewrap 은 전용 JDK·Android SDK 를 `~/.bubblewrap/` 아래에 두고 쓴다.
**시스템 `JAVA_HOME` 은 백엔드가 쓰므로 건드리지 않는다.**

자동 설치에 기대면 대화형 프롬프트에 걸리므로, 아래 세 가지는 직접 맞춰 두는 편이 확실하다.

### (a) `~/.bubblewrap/config.json` 을 직접 쓴다

설정이 비어 있으면 `bubblewrap --version` 이나 `updateConfig` 조차 "JDK 를 설치할까요?" 를 먼저 묻고,
비대화형 셸에서는 `ERR_USE_AFTER_CLOSE` 로 죽는다. JSON 이라 경로의 `\` 는 `\\` 로 이스케이프한다:

```json
{"jdkPath":"C:\\Users\\<사용자>\\.bubblewrap\\jdk\\jdk-17.0.20.1+1","androidSdkPath":"C:\\Users\\<사용자>\\.bubblewrap\\android_sdk"}
```

### (b) JDK 는 `17` 이 아니라 `17.0.x` 여야 한다

`JdkHelper.validatePath` 가 `<jdk>/release` 안에 `JAVA_VERSION="17.0` 이라는 문자열이 있는지만 본다.
Oracle OpenJDK 17 GA(17+35)는 `JAVA_VERSION="17"` 이라 `Unsupported jdk version` 으로 거절된다.
Temurin 17.0.x 를 받아 `~/.bubblewrap/jdk/` 에 풀고 그 폴더를 `jdkPath` 로 잡는다:

```
https://github.com/adoptium/temurin17-binaries/releases/download/jdk-17.0.20.1%2B1/OpenJDK17U-jdk_x64_windows_hotspot_17.0.20.1_1.zip
```

### (c) `androidSdkPath` 는 SDK 루트가 아니라 `tools/`(또는 `bin/`)가 바로 아래 있는 폴더다

Android Studio 의 SDK 는 `cmdline-tools` 가 없으면 못 쓴다. 따로 받아 `~/.bubblewrap/android_sdk/` 에 푼다:

```
https://dl.google.com/android/repository/commandlinetools-win-6609375_latest.zip
```

풀면 `android_sdk/tools/bin/sdkmanager.bat` 가 생긴다. 라이선스를 비대화형으로 수락한다:

```powershell
$bw = "$env:USERPROFILE\.bubblewrap"
$env:JAVA_HOME = "$bw\jdk\jdk-17.0.20.1+1"
(1..60 | ForEach-Object { 'y' }) | & "$bw\android_sdk\tools\bin\sdkmanager.bat" --licenses --sdk_root="$bw\android_sdk"
```

빌드에 필요한 build-tools 36.1.0 은 `bubblewrap build` 가 알아서 받는다.

### 확인

```bash
bubblewrap doctor    # "Your jdkpath and androidSdkPath are valid." 가 나와야 한다
```

## 2. 프로젝트 생성

이 디렉터리에는 `twa-manifest.json` 만 커밋돼 있고 Android 프로젝트가 없다. 그것을 만드는 명령:

```bash
bubblewrap update --skipVersionUpgrade
```

- **`bubblewrap init` 을 쓰지 않는다.** 매니페스트를 대화형으로 다시 받아 덮어쓴다.
- `--skipVersionUpgrade` 를 빼면 `versionName` 을 대화형으로 묻고 `versionCode` 를 1 올린다.
  버전을 올릴 때만 `--appVersionName 1.0.1` 처럼 명시한다.

## 2-1. 수정본 덮어쓰기 (update 뒤 · build 전, 매번)

```powershell
.\apply-overrides.ps1
```

`overrides/` 아래 파일을 같은 경로의 생성물 위에 복사한다. 지금은 `app/src/main/java/kr/co/pilsa/pilsagraphy/LauncherActivity.java`
하나로, `createTwaLauncher()` 를 오버라이드해 **Chrome 이 있으면 Chrome 으로** 앱을 연다. 이걸 빼먹고 빌드하면 갤럭시에서
삼성 인터넷으로 열리는 옛 동작으로 돌아간다(알림이 "삼성 브라우저" 로 오고 누르면 브라우저가 열림).
Bubblewrap 템플릿의 `LauncherActivity.java` 가 바뀌면(onCreate 등) `overrides/` 쪽도 맞춘다.

## 3. 빌드

비밀번호는 명령줄에 쓰지 말고 같은 셸의 환경변수로 넘긴다 (키스토어 옆에 둔 비밀번호 파일을 읽어서):

```powershell
$pw = (Get-Content "..\..\app-key\pilsa-upload.password.txt" -Raw).Trim()
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = $pw
$env:BUBBLEWRAP_KEY_PASSWORD      = $pw
bubblewrap build
```

`app-release-bundle.aab`(Play 업로드용)와 `app-release-signed.apk`(직접 설치 테스트용)가 나온다.

> Windows 에서 `'gradlew.bat' is not recognized` 가 나면 환경에 `NoDefaultCurrentDirectoryInExePath=1`
> 이 걸려 있어 cmd 가 현재 디렉터리의 배치 파일을 못 찾는 것이다. 그 셸에서만 지우고 다시 실행한다:
> `Remove-Item Env:\NoDefaultCurrentDirectoryInExePath`

빌드가 끝나면 패키지명과 서명이 맞는지 확인한다 (`~/.bubblewrap/android_sdk/build-tools/36.1.0/`):

```powershell
aapt2 dump badging app-release-signed.apk | Select-String "package:"       # kr.co.pilsa.pilsagraphy
apksigner verify --print-certs app-release-signed.apk | Select-String SHA-256  # assetlinks 의 업로드 키 지문과 같아야 한다
```

## 4. Play Console 업로드

Play 신규 앱은 AAB + Play App Signing 이 강제된다. 로컬 `pilsa-upload.jks` 는 **업로드 키**로만 쓰이고,
실제 배포되는 앱은 Play 가 만든 **앱 서명 키**로 재서명된다. 그래서 `assetlinks.json` 에는
**두 지문이 다 들어가 있다** — 업로드 키로 서명한 로컬 APK 도, Play 를 통해 설치된 앱도 검증에 통과해야 한다.

Play Console 의 앱(`kr.co.pilsa.pilsagraphy`)은 이미 만들어져 있고 앱 서명 키도 발급돼 있다
(설정 → 앱 서명 → 앱 서명 키 인증서 SHA-256 = `95:08:85:FC:…:46:38`). 남은 것은 업로드뿐이다:

1. 테스트 및 출시 → 테스트 → **비공개 테스트**(내부 테스트는 프로덕션 조건인 12명/14일 카운트에 안 잡힌다) → 새 버전 만들기
2. `app-release-bundle.aab` 업로드 — 첫 업로드 때 업로드 키 인증서가 자동 등록된다 (2026-09-09 v1 로 완료, 지문 `20:7E:…:9B:8A` 확인)
3. 테스터 목록에 본인 계정을 넣고 참여 링크로 설치한다

다음 버전을 올릴 때는 `appVersionCode` 를 올려야 한다. `twa-manifest.json` 의 `appVersionCode`/`appVersionName` 을
직접 올린 뒤 `bubblewrap update --skipVersionUpgrade` → `.\apply-overrides.ps1` → `bubblewrap build` 순서면 된다.

> 검토 중인 버전이 있을 때 새 버전을 올리면 앞 검토가 대체돼 다시 기다린다.
> 비공개 테스트 중 새 버전을 올려도 12명/14일 카운터는 리셋되지 않는다 — 리셋되는 건 **트랙 일시중지** 뿐이다.

## 5. assetlinks.json

`public/.well-known/assetlinks.json` 의 `package_name` 은 `kr.co.pilsa.pilsagraphy`,
`sha256_cert_fingerprints` 는 업로드 키와 Play 앱 서명 키 두 개다. 키를 다시 만들었거나 Play 서명 키가 바뀌면 여기를 고치고 프론트를 재배포한다.

```json
"sha256_cert_fingerprints": [
  "20:7E:A7:E9:DE:CD:BD:F9:08:41:FC:85:6E:0C:4C:28:3E:FA:AC:46:F7:BF:14:1E:BD:CB:05:47:F5:78:9B:8A",
  "95:08:85:FC:4E:2A:97:B9:93:BF:46:7B:44:76:64:47:53:1B:E4:A7:8F:8F:FD:5B:8E:98:D4:43:5A:F6:46:38"
]
```

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
> 로컬 APK(업로드 키 서명)를 깔아 둔 폰에 Play 버전을 설치하려면 서명이 달라 먼저 지워야 한다.

> 앱 안에서 화면이 **PC 레이아웃**으로 보이면 Chrome 의 "데스크톱 사이트" 모드가 켜진 것이다.
> TWA 는 폰의 Chrome 으로 렌더링되므로 Chrome 설정(사이트 설정 → 데스크톱 사이트)을 따른다. 앱 문제가 아니다.

## 웹 푸시에 대해

`public/push-sw.js` 의 웹 푸시가 TWA 안에서도 그대로 동작한다 — 단, **앱을 여는 브라우저가 Chrome 일 때**다.

### 앱을 여는 브라우저(provider)는 Chrome 으로 고정한다 (v4, `overrides/LauncherActivity.java`)

TWA 는 껍데기고 실제 화면·서비스 워커·푸시 구독은 폰에 깔린 브라우저가 맡는다. android-browser-helper 의 기본 선택은
**폰의 기본 브라우저**가 TWA 를 지원하면 그것을 쓰는데, 갤럭시는 기본 브라우저가 삼성 인터넷인 경우가 많다. 그러면:

- 푸시 구독·알림 표시가 삼성 인터넷 몫이 된다 → 알림이 **"삼성 브라우저"** 이름으로 뜨고, 앱은 알림 채널을 만든 적이 없어
  **설정 > 알림 의 앱 목록에 없다** (알림을 켜고 끌 수도 없다). 앱 정보의 알림 스위치는 이 경우 아무 영향이 없다.
- 알림을 눌러도 **앱이 아니라 삼성 인터넷 탭**이 열린다 (앱이 켜져 있을 때만 앱 창이 잡혀 "가끔 앱으로" 열렸다).
- Android 13+ 알림 권한 위임(웹의 `Notification.requestPermission()` → 앱의 `POST_NOTIFICATIONS` 프롬프트)도 없다.

Chrome 은 위 세 가지를 모두 지원한다(알림 위임 `DelegationService`, 권한 위임 `NotificationPermissionRequestActivity`,
알림 클릭 시 검증된 TWA 로 URL 전달). 그래서 `createTwaLauncher()` 에서 Chrome(안정→베타→개발→카나리)이 설치·활성·TWA 지원
버전이면 그것을 provider 로 넘기고, 아니면 기본 선택으로 물러선다.

### Android 13+ 알림 권한 — OS 프롬프트를 한 번 거부하면 웹에서 다시 못 묻는다

Chrome 은 TWA 를 열 때 앱의 알림 권한 상태를 **조회만** 해서 사이트 권한에 복사한다(자동으로 묻지 않는다). 프롬프트는 웹이
`Notification.requestPermission()` 을 부를 때(알림 유도 바텀시트·마이페이지 토글) Chrome 이 앱의
`NotificationPermissionRequestActivity` 로 위임해 뜨는 **OS 다이얼로그**다. android-browser-helper 는 **한 번이라도 물어본 뒤
허용이 아니면 영구 `BLOCK`** 을 답하므로(`NotificationDelegationExtraCommandHandler`), 거기서 거부하면 그 뒤 웹의
`Notification.permission` 은 `denied` 로 고정되고 `requestPermission()` 은 프롬프트 없이 `denied` 를 돌려준다.
(설치 전에 Chrome 브라우저에서 알림을 허용해 둔 사람도 TWA 를 한 번 열면 앱 권한(기본 꺼짐)이 사이트 권한을 덮어쓴다.)

유일한 복구 경로는 사용자가 **앱 정보 → 알림** 에서 직접 켜는 것이다. 단 Chrome 은 이 상향 동기화를 **Chrome 프로세스가 다시 뜬 뒤
TWA 를 열어 검증할 때** 한 번만 하므로, 켠 뒤 앱을 완전히 닫았다가 다시 열어야 하고 그래도 안 되면 휴대폰을 껐다 켜야 한다.
프론트는 권한이 `granted` 로 살아나면 자동으로 구독·서버 등록까지 한다(`lib/push.js` 의 `restorePushAfterLogin`/
`recoverPushIfNewlyGranted`)와, `denied` 인 사람에게 그 절차를 안내한다(`PushPromptBottomSheet`).

`enableNotifications: true` 가 `POST_NOTIFICATIONS`·`DelegationService`·`NotificationPermissionRequestActivity` 를 매니페스트에 넣는다.

### v4 로 올라간 뒤 기존 사용자 (삼성 인터넷으로 쓰던 사람)

앱이 Chrome 으로 열리므로 Chrome 프로필에는 로그인·구독이 없다 → 다시 로그인해야 하고, 로그인하면 프론트가 구독을 만들어
서버에 `replaceOthers: true` 로 등록한다. 서버는 그 회원의 다른 안드로이드 기기 행(삼성 인터넷 구독)을 지워 **알림이 두 번 오지 않게**
한다. 삼성 인터넷 쪽 구독은 브라우저 안에 남지만 서버가 더 보내지 않으므로 조용하다.
