package kr.co.pilsa.pilsagraphy;

import android.content.pm.ActivityInfo;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.os.Build;
import android.os.Bundle;
import android.util.Log;
import android.widget.Toast;

import com.google.androidbrowserhelper.trusted.ChromeLegacyUtils;
import com.google.androidbrowserhelper.trusted.TwaLauncher;

/**
 * Bubblewrap 이 생성하는 LauncherActivity 에 "앱을 여는 브라우저(provider)는 Chrome 우선" 규칙을 얹은 것.
 *
 * android-browser-helper 의 기본 선택(TwaProviderPicker.pickProvider)은 **폰의 기본 브라우저**가 TWA 를 지원하면
 * 그것을 쓴다. 갤럭시는 기본 브라우저가 삼성 인터넷인 경우가 많아 앱이 삼성 인터넷으로 열렸고, 그러면
 *  - 웹푸시 구독·알림 표시가 삼성 인터넷 몫이 된다 — 알림이 "삼성 브라우저" 이름으로 뜨고, 앱은 알림 채널을
 *    만든 적이 없어 설정 > 알림 의 앱 목록에도 없다
 *  - 알림을 눌러도 앱이 아니라 삼성 인터넷 탭이 열린다
 *  - Android 13+ 알림 권한 위임(POST_NOTIFICATIONS 를 앱이 받는 것)도 동작하지 않는다
 * Chrome 은 이 세 가지(알림 위임·권한 위임·알림 클릭 시 앱 재진입)를 모두 지원하므로 Chrome 이 있으면 Chrome 으로 연다.
 * Chrome 이 없거나·사용 중지됐거나·너무 오래됐으면 기본 선택으로 물러선다(예전과 같은 동작).
 *
 * 이 파일은 twa/overrides/ 에 보관되고 `bubblewrap update` 뒤 twa/apply-overrides.ps1 이 생성 프로젝트 위에 덮어쓴다
 * (생성 프로젝트 twa/app/ 은 커밋하지 않는다 — twa/README.md 참고).
 * onCreate 는 Bubblewrap 템플릿과 같아야 한다 — 템플릿이 바뀌면 여기도 맞춘다.
 */
public class LauncherActivity
        extends com.google.androidbrowserhelper.trusted.LauncherActivity {

    private static final String TAG = "PilsaLauncher";

    // android-browser-helper 의 ChromeLegacyUtils.SUPPORTED_CHROME_PACKAGES 와 같은 순서 (안정 → 베타 → 개발 → 카나리)
    private static final String[] CHROME_PACKAGES = {
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.chrome.canary",
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // (Bubblewrap 템플릿 그대로) Oreo 이하에서는 투명 배경 + 방향 고정이 크래시라 Oreo 초과에서만 고정한다.
        // 스플래시에만 영향이 있고 Chrome 은 어차피 orientation 을 따로 지킨다.
        // See https://github.com/GoogleChromeLabs/bubblewrap/issues/496 for details.
        if (Build.VERSION.SDK_INT > Build.VERSION_CODES.O) {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_USER_PORTRAIT);
        } else {
            setRequestedOrientation(ActivityInfo.SCREEN_ORIENTATION_UNSPECIFIED);
        }
    }

    /**
     * provider 를 Chrome 으로 고정한다. 라이브러리가 이 메서드를 protected 로 열어 둔 것이 유일한 주입 지점이다
     * (TwaLauncher(Context, providerPackage) 는 주어진 패키지를 그대로 쓴다).
     */
    @Override
    protected TwaLauncher createTwaLauncher() {
        String chrome = findUsableChrome();
        if (chrome == null) {
            // Chrome 이 없는 폰 — 기본 선택(대개 삼성 인터넷)으로 앱은 뜨지만 알림은 브라우저 몫이 되고 눌러도 브라우저가 열린다.
            // 웹 쪽에서는 이 상황을 확실히 알 수 없어(삼성 인터넷은 display-mode 도 다르게 보고) 앱이 직접 한 줄 알려 준다.
            Log.i(TAG, "usable Chrome not found - falling back to default provider selection");
            Toast.makeText(this,
                    "Chrome 앱을 사용 설정하면 알림을 앱으로 받을 수 있어요 (설정 → 애플리케이션 → Chrome)",
                    Toast.LENGTH_LONG).show();
            return super.createTwaLauncher();
        }
        Log.i(TAG, "pinning TWA provider to " + chrome);
        return new TwaLauncher(this, chrome);
    }

    /** 설치돼 있고, 사용 중지되지 않았고, TWA 를 지원하는 버전(72+)의 Chrome 패키지. 없으면 null. */
    private String findUsableChrome() {
        PackageManager pm = getPackageManager();
        for (String pkg : CHROME_PACKAGES) {
            try {
                ApplicationInfo info = pm.getApplicationInfo(pkg, 0);
                if (!info.enabled) continue;
            } catch (PackageManager.NameNotFoundException e) {
                continue;
            }
            // Android 11+ 패키지 가시성: 라이브러리 매니페스트의 <queries>(VIEW/BROWSABLE https) 덕에 브라우저는 보인다
            if (ChromeLegacyUtils.supportsTrustedWebActivities(pm, pkg)) {
                return pkg;
            }
        }
        return null;
    }
}
