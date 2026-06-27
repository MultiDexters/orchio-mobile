/**
 * Config plugin to make the legacy @react-native-voice/voice native module
 * coexist with AndroidX.
 *
 * @react-native-voice/voice declares `com.android.support:appcompat-v7`
 * (the old Android Support Library). On a modern AndroidX build this collides
 * with `androidx.core:core` — the manifest merger fails on
 * `application@appComponentFactory`.
 *
 * Two-part fix:
 *  1) Enable Jetifier so Gradle rewrites com.android.support.* -> androidx.*
 *     at build time (removes the duplicate classes/attrs at the source).
 *  2) Belt-and-suspenders: force `android:appComponentFactory` on the
 *     <application> node with tools:replace so the merge can't fail.
 */
const {
  withGradleProperties,
  withAndroidManifest,
  AndroidConfig,
} = require('expo/config-plugins');

function withJetifier(config) {
  return withGradleProperties(config, (cfg) => {
    const setProp = (key, value) => {
      const existing = cfg.modResults.find(
        (item) => item.type === 'property' && item.key === key,
      );
      if (existing) existing.value = value;
      else cfg.modResults.push({ type: 'property', key, value });
    };
    setProp('android.useAndroidX', 'true');
    setProp('android.enableJetifier', 'true');
    return cfg;
  });
}

function withAppComponentFactoryFix(config) {
  return withAndroidManifest(config, (cfg) => {
    const manifest = cfg.modResults;
    manifest.manifest.$ = manifest.manifest.$ || {};
    manifest.manifest.$['xmlns:tools'] = 'http://schemas.android.com/tools';

    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(manifest);
    app.$['android:appComponentFactory'] = 'androidx.core.app.CoreComponentFactory';
    const replace = app.$['tools:replace'];
    app.$['tools:replace'] = replace
      ? Array.from(new Set(replace.split(',').concat('android:appComponentFactory'))).join(',')
      : 'android:appComponentFactory';
    return cfg;
  });
}

module.exports = function withVoiceAndroidFix(config) {
  config = withJetifier(config);
  config = withAppComponentFactoryFix(config);
  return config;
};
