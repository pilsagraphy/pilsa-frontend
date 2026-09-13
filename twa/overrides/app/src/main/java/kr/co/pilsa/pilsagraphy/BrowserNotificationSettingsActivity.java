package kr.co.pilsa.pilsagraphy;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

import java.util.LinkedHashMap;
import java.util.Map;

/**
 * "○○에서 실행 중" 고지 알림을 끌 수 있는 설정 화면으로 데려다주는 다리.
 *
 * <p>이 알림은 앱을 그리고 있는 브라우저가 직접 띄우는 것이고, <b>안드로이드에는 다른 앱의 알림을 대신 꺼 주는 API 가 없다</b>
 * (있다면 어떤 앱이든 남의 알림을 마음대로 끌 수 있게 되므로 당연히 막혀 있다).
 * 그래서 우리가 할 수 있는 최선은 "동의를 받고 그 화면까지 한 번에 데려다주는 것"이다 —
 * 마지막 스위치만 사용자가 누른다.
 *
 * <p>어느 브라우저인지는 <b>웹 쪽이 판별해서 알려 준다.</b> 앱은 Chrome 을 우선으로 고정하지만(LauncherActivity)
 * Chrome 이 없는 폰은 삼성 인터넷 등으로 열리고, 그때 고지를 띄우는 것도 그 브라우저이기 때문이다.
 * 화면을 그리는 주체가 자기 정체를 UA 로 알고 있으니 그쪽이 정확하다.
 * <pre>pilsa://browser-notification?pkg=com.sec.android.app.sbrowser</pre>
 *
 * <p>넘어온 패키지는 아래 목록에 있는 것만 받는다 — 웹에서 온 값을 그대로 설정 화면에 넘기지 않기 위해서다.
 * 값이 없거나 모르는 값이면 설치된 브라우저 중 하나를 찾아 쓴다.
 *
 * <p>채널 단위로 바로 열 수도 있지만(ACTION_CHANNEL_NOTIFICATION_SETTINGS) 채널 ID 는 브라우저·버전마다 달라
 * 틀리면 빈 화면이 뜬다. 확실히 존재하는 앱 단위 알림 설정으로 보낸다.
 */
public class BrowserNotificationSettingsActivity extends Activity {

    private static final String TAG = "PilsaBrowserSettings";

    /** 설정 화면을 열어 줄 수 있는 브라우저. 값은 사용자에게 보여 줄 이름. 순서가 곧 자동 탐색 우선순위. */
    private static final Map<String, String> KNOWN_BROWSERS = new LinkedHashMap<>();

    static {
        KNOWN_BROWSERS.put("com.android.chrome", "Chrome");
        KNOWN_BROWSERS.put("com.sec.android.app.sbrowser", "삼성 인터넷");
        KNOWN_BROWSERS.put("com.microsoft.emmx", "Edge");
        KNOWN_BROWSERS.put("com.naver.whale", "웨일");
        KNOWN_BROWSERS.put("com.chrome.beta", "Chrome 베타");
        KNOWN_BROWSERS.put("com.chrome.dev", "Chrome 개발자");
        KNOWN_BROWSERS.put("com.chrome.canary", "Chrome 카나리");
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String target = resolveTarget();
        if (target == null) {
            Toast.makeText(this, "브라우저 앱을 찾지 못했어요", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // 무엇을 눌러야 하는지 먼저 알려 준다. 설정 화면에는 알림 항목이 여럿이라 안내 없이 보내면 헤맨다.
        // 항목 이름이 브라우저·버전마다 달라 하나로 못 박지 않고 후보를 함께 준다.
        Toast.makeText(this,
                KNOWN_BROWSERS.get(target) + " 알림 목록에서 '웹 앱' 또는 '실행 중' 항목을 꺼 주세요",
                Toast.LENGTH_LONG).show();

        if (!open(appNotificationSettings(target)) && !open(appDetails(target))) {
            Toast.makeText(this, "설정 화면을 열지 못했어요. 설정 → 앱 → 알림 에서 꺼 주세요", Toast.LENGTH_LONG).show();
        }
        finish();
    }

    /** 웹이 알려 준 패키지를 쓰되, 목록에 없거나 설치돼 있지 않으면 설치된 브라우저를 찾아 대신 쓴다. */
    private String resolveTarget() {
        Uri data = getIntent() != null ? getIntent().getData() : null;
        String requested = data != null ? data.getQueryParameter("pkg") : null;
        if (requested != null && KNOWN_BROWSERS.containsKey(requested) && isInstalled(requested)) {
            return requested;
        }
        if (requested != null) {
            Log.i(TAG, "ignoring unusable pkg from web: " + requested);
        }
        for (String pkg : KNOWN_BROWSERS.keySet()) {
            if (isInstalled(pkg)) return pkg;
        }
        return null;
    }

    /** Android 8.0+ 는 앱별 알림 설정 화면이 따로 있다. 그 아래에서는 앱 정보 화면으로 대신 보낸다. */
    private Intent appNotificationSettings(String pkg) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return appDetails(pkg);
        }
        return new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, pkg);
    }

    private Intent appDetails(String pkg) {
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.fromParts("package", pkg, null));
    }

    private boolean open(Intent intent) {
        try {
            startActivity(intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK));
            return true;
        } catch (Exception e) {
            Log.w(TAG, "failed to open " + intent.getAction(), e);
            return false;
        }
    }

    private boolean isInstalled(String pkg) {
        try {
            // Android 11+ 패키지 가시성: 라이브러리 매니페스트의 <queries>(VIEW/BROWSABLE https) 덕에 브라우저는 보인다
            getPackageManager().getApplicationInfo(pkg, 0);
            return true;
        } catch (Exception e) {
            return false;
        }
    }
}
