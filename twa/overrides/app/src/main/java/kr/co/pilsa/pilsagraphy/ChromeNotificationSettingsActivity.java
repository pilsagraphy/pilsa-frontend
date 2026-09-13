package kr.co.pilsa.pilsagraphy;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.provider.Settings;
import android.util.Log;
import android.widget.Toast;

/**
 * "Chrome에서 실행 중" 고지 알림을 끌 수 있는 설정 화면으로 데려다주는 다리.
 *
 * <p>이 알림은 크롬이 직접 띄우는 것이고, <b>안드로이드에는 다른 앱의 알림을 대신 꺼 주는 API 가 없다</b>
 * (있다면 어떤 앱이든 남의 알림을 마음대로 끌 수 있게 되므로 당연히 막혀 있다).
 * 그래서 우리가 할 수 있는 최선은 "동의를 받고 그 화면까지 한 번에 데려다주는 것"이다 —
 * 마지막 스위치만 사용자가 누른다.
 *
 * <p>웹(마이페이지 알림 설정)에서 아래 주소로 이동하면 이 액티비티가 열린다. 크롬은 모르는 스킴을 만나면
 * 그 스킴을 처리하는 앱을 띄우는데, 그 앱이 바로 우리 자신이다. 앱이 낡아 이 액티비티가 없으면
 * intent: 링크의 browser_fallback_url 로 되돌아가므로 화면이 깨지지 않는다.
 * <pre>pilsa://chrome-notification</pre>
 *
 * <p>채널 단위로 바로 열 수도 있지만(ACTION_CHANNEL_NOTIFICATION_SETTINGS) 크롬의 채널 ID 는
 * 버전에 따라 달라질 수 있어, 틀리면 빈 화면이 뜬다. 확실히 존재하는 앱 단위 알림 설정으로 보낸다.
 */
public class ChromeNotificationSettingsActivity extends Activity {

    private static final String TAG = "PilsaChromeSettings";

    /** 안정 → 베타 → 개발 → 카나리. LauncherActivity 와 같은 순서. */
    private static final String[] CHROME_PACKAGES = {
            "com.android.chrome",
            "com.chrome.beta",
            "com.chrome.dev",
            "com.chrome.canary",
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        String chrome = installedChrome();
        if (chrome == null) {
            Toast.makeText(this, "Chrome 앱을 찾지 못했어요", Toast.LENGTH_SHORT).show();
            finish();
            return;
        }

        // 무엇을 눌러야 하는지 먼저 알려 준다. 설정 화면에는 채널이 여럿이라 안내 없이 보내면 헤맨다.
        Toast.makeText(this, "'알림 카테고리'에서 웹 앱(Web apps) 항목을 꺼 주세요", Toast.LENGTH_LONG).show();

        if (!open(appNotificationSettings(chrome)) && !open(appDetails(chrome))) {
            Toast.makeText(this, "설정 화면을 열지 못했어요. 설정 → 앱 → Chrome → 알림 에서 꺼 주세요", Toast.LENGTH_LONG).show();
        }
        finish();
    }

    /** Android 8.0+ 는 앱별 알림 설정 화면이 따로 있다. 그 아래에서는 앱 정보 화면으로 대신 보낸다. */
    private Intent appNotificationSettings(String chrome) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) {
            return appDetails(chrome);
        }
        return new Intent(Settings.ACTION_APP_NOTIFICATION_SETTINGS)
                .putExtra(Settings.EXTRA_APP_PACKAGE, chrome);
    }

    private Intent appDetails(String chrome) {
        return new Intent(Settings.ACTION_APPLICATION_DETAILS_SETTINGS)
                .setData(Uri.fromParts("package", chrome, null));
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

    private String installedChrome() {
        for (String pkg : CHROME_PACKAGES) {
            try {
                getPackageManager().getApplicationInfo(pkg, 0);
                return pkg;
            } catch (Exception ignored) {
                // 다음 후보로
            }
        }
        return null;
    }
}
