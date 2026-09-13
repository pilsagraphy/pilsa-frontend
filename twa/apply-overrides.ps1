# twa/overrides/ 아래 파일을 Bubblewrap 이 생성한 twa/app/ 위에 덮어쓴다.
#
# `bubblewrap update` 는 LauncherActivity.java 등을 템플릿에서 다시 만들기 때문에 우리 쪽 수정(provider 를 Chrome 으로 고정)이
# 사라진다. 생성 프로젝트(twa/app/)는 커밋하지 않으므로 수정본은 twa/overrides/ 에 두고, update 뒤 · build 전에 이 스크립트로 덮어쓴다.
# 경로는 overrides/ 아래 상대 경로가 twa/ 아래 같은 위치로 간다 (overrides/app/src/... → app/src/...).
#
# AndroidManifest.xml 만은 통째로 덮어쓰지 않고 <activity> 한 조각을 끼워 넣는다 — 매니페스트는 twa-manifest.json 설정
# (색·아이콘·알림 등)이 그대로 반영되는 생성물이라, 파일째 고정해 두면 설정을 바꿔도 반영되지 않기 때문이다.
$ErrorActionPreference = 'Stop'

$twaDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$src = Join-Path $twaDir 'overrides'

if (-not (Test-Path (Join-Path $twaDir 'app'))) {
    throw "twa/app 이 없습니다. 먼저 'bubblewrap update --skipVersionUpgrade' 로 프로젝트를 만드세요."
}

Get-ChildItem -Path $src -Recurse -File | ForEach-Object {
    $rel = $_.FullName.Substring($src.Length).TrimStart('\', '/')
    $target = Join-Path $twaDir $rel
    New-Item -ItemType Directory -Force -Path (Split-Path -Parent $target) | Out-Null
    Copy-Item -Path $_.FullName -Destination $target -Force
    Write-Host "override -> $rel"
}

# ── AndroidManifest.xml 에 ChromeNotificationSettingsActivity 를 끼워 넣는다 ──────────────────
# 웹(마이페이지)에서 pilsa://chrome-notification 으로 이동하면 이 액티비티가 열려서
# 크롬의 알림 설정 화면으로 데려다준다 ("Chrome에서 실행 중" 고지를 끄는 길).
$manifestPath = Join-Path $twaDir 'app/src/main/AndroidManifest.xml'
$manifest = Get-Content -Path $manifestPath -Raw -Encoding UTF8

if ($manifest -match 'ChromeNotificationSettingsActivity') {
    Write-Host "manifest -> ChromeNotificationSettingsActivity (이미 있음)"
} else {
    $activity = @'
        <activity android:name="ChromeNotificationSettingsActivity"
            android:exported="true"
            android:excludeFromRecents="true"
            android:noHistory="true"
            android:theme="@android:style/Theme.Translucent.NoTitleBar">
            <intent-filter>
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data android:scheme="pilsa" android:host="chrome-notification" />
            </intent-filter>
        </activity>

    </application>
'@
    $manifest = $manifest -replace '(?s)\s*</application>', ("`r`n" + $activity)
    Set-Content -Path $manifestPath -Value $manifest -Encoding UTF8 -NoNewline
    Write-Host "manifest -> ChromeNotificationSettingsActivity 추가"
}
