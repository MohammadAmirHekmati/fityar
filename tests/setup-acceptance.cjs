const fs=require('fs');
fs.appendFileSync('android/settings.gradle',"\ninclude ':acceptance'\n");
fs.mkdirSync('android/acceptance/src/androidTest/java/fityar/test',{recursive:true});
fs.mkdirSync('android/acceptance/src/main',{recursive:true});
fs.writeFileSync('android/acceptance/build.gradle',`apply plugin: 'com.android.application'
android { namespace 'fityar.acceptance'; compileSdk 35
 defaultConfig { applicationId 'fityar.acceptance'; minSdk 26; targetSdk 35; versionCode 1; versionName '1'; testInstrumentationRunner 'androidx.test.runner.AndroidJUnitRunner' }
}
dependencies { androidTestImplementation 'androidx.test:runner:1.6.2'; androidTestImplementation 'androidx.test.uiautomator:uiautomator:2.3.0'; androidTestImplementation 'junit:junit:4.13.2' }
`);
fs.writeFileSync('android/acceptance/src/main/AndroidManifest.xml','<manifest xmlns:android="http://schemas.android.com/apk/res/android"><application android:label="FitYar acceptance"/></manifest>');
fs.writeFileSync('android/acceptance/src/androidTest/java/fityar/test/Dump.java',`package fityar.test;
import androidx.test.platform.app.InstrumentationRegistry;
import androidx.test.uiautomator.*;
import org.junit.Test;
import java.io.File;
public class Dump {
 @Test public void dump() throws Exception {
  Configurator.getInstance().setWaitForIdleTimeout(0).setWaitForSelectorTimeout(0);
  UiDevice.getInstance(InstrumentationRegistry.getInstrumentation()).dumpWindowHierarchy(new File("/sdcard/window.xml"));
 }
}
`);
