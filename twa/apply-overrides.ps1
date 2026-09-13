# twa/overrides/ 아래 파일을 Bubblewrap 이 생성한 twa/app/ 위에 덮어쓴다.
#
# `bubblewrap update` 는 LauncherActivity.java 등을 템플릿에서 다시 만들기 때문에 우리 쪽 수정(provider 를 Chrome 으로 고정)이
# 사라진다. 생성 프로젝트(twa/app/)는 커밋하지 않으므로 수정본은 twa/overrides/ 에 두고, update 뒤 · build 전에 이 스크립트로 덮어쓴다.
# 경로는 overrides/ 아래 상대 경로가 twa/ 아래 같은 위치로 간다 (overrides/app/src/... → app/src/...).
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
