# TWA 빌드 절차

Bubblewrap 으로 웹앱을 Android 앱(TWA)으로 감싸 Play 스토어에 올리는 과정.
`twa-manifest.json` 이 그 입력값이고, 이 디렉터리는 **생성물이 아니라 설정만** 담는다
(생성된 Android 프로젝트는 커밋하지 않는다 — `twa-manifest.json` 만 있으면 2번으로 다시 만들어진다).

TWA 는 `https://pilsa.co.kr` 을 그대로 여는 껍데기라 **웹 코드가 앱 안에 들어가지 않는다.**
프론트를 재배포하면 앱을 다시 만들지 않아도 그대로 반영된다. 앱을 새로 빌드해야 하는 건
`twa-manifest.json` 이 바뀔 때뿐이다 (패키지명·이름·아이콘·버전·서명키·알림 설정 등).

## 0. 현재 값

| 항목 | 값 |
|---|---|
| `packageId` | `kr.co.pilsa.app` |
| `host` · `iconUrl` · `webManifestUrl` · `fullScopeUrl` | `pilsa.co.kr` |
| `signingKey` | `../../app-key/pilsa-upload.jks`, alias `pilsa-upload` |
| `appVersionName` / `appVersionCode` | `1.0.0` / `1` (아직 Play 업로드 전) |
| `assetlinks.json` 지문 | 업로드 키 SHA-256 반영됨 — **Play 앱 서명 키 지문은 아직 없다** (4번) |

> 업로드 키는 `pilsa-upload.jks` 다. 예전 `v_1_release_key.jks` 는 비밀번호를 아는 사람이 없어
> 열 수 없었고 스토어에 올린 적도 없어서 새 키로 교체했다 (52ac55e).

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

## 3. 빌드

비밀번호는 명령줄에 쓰지 말고 같은 셸의 환경변수로 넘긴다:

```powershell
$env:BUBBLEWRAP_KEYSTORE_PASSWORD = '<pilsa-upload.jks 비밀번호>'
$env:BUBBLEWRAP_KEY_PASSWORD      = '<같은 값>'
bubblewrap build
```

`app-release-bundle.aab`(Play 업로드용)와 `app-release-signed.apk`(직접 설치 테스트용)가 나온다.

> Windows 에서 `'gradlew.bat' is not recognized` 가 나면 환경에 `NoDefaultCurrentDirectoryInExePath=1`
> 이 걸려 있어 cmd 가 현재 디렉터리의 배치 파일을 못 찾는 것이다. 그 셸에서만 지우고 다시 실행한다:
> `Remove-Item Env:\NoDefaultCurrentDirectoryInExePath`

## 4. Play Console 업로드 → **여기서 앱 서명 키 지문이 나온다**

Play 신규 앱은 AAB + Play App Signing 이 강제된다. 그래서 로컬 `pilsa-upload.jks` 는
**업로드 키**로만 쓰이고, 실제 배포되는 앱은 Play 가 만든 **앱 서명 키**로 재서명된다.
`assetlinks.json` 에는 **두 지문이 다 들어가야 한다** — 업로드 키로 서명한 로컬 APK 도,
Play 를 통해 설치된 앱도 검증에 통과해야 하기 때문이다. 뒤쪽 값은 한 번 올리기 전에는 존재하지 않는다.

1. Play Console → 앱 만들기 (패키지명 `kr.co.pilsa.app`)
2. 내부 테스트 트랙에 `app-release-bundle.aab` 업로드
3. **설정 → 앱 서명 → 앱 서명 키 인증서 → SHA-256 인증서 지문** 복사

## 5. assetlinks.json 반영

`public/.well-known/assetlinks.json` 의 `sha256_cert_fingerprints` 배열에
4번에서 복사한 지문을 **두 번째 항목으로 추가**한다. 기존 업로드 키 지문은 지우지 않는다.

```json
"sha256_cert_fingerprints": [
  "F3:67:61:67:...:EB:14",
  "<Play 앱 서명 키 지문>"
]
```

고친 뒤 프론트를 재배포한다. 배포 후 반드시 확인 — 리다이렉트 없이 `200` 과 `application/json` 이어야 한다:

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
