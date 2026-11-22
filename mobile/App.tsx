import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, BackHandler, Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';
import WebView, { type WebViewNavigation, type WebViewProps } from 'react-native-webview';

// Hosted static copy of the real unified App Foundry: Forge, Alpha, Bravo, Charlie.
// Work is stored in this device's WebView localStorage, not sent to the host.
const SITE_URL = 'https://app-foundery.pages.dev/';
const SITE_ORIGIN = new URL(SITE_URL).origin;

// Work around a react-native-webview 14 / RN 0.88 TypeScript JSX typing mismatch.
// Runtime must still be checked on a real device.
const MobileWebView = WebView as unknown as React.ComponentType<WebViewProps & React.RefAttributes<WebView>>;

export default function App() {
  const browser = useRef<WebView<undefined> | null>(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);

  useEffect(() => {
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!canGoBack) return false;
      browser.current?.goBack();
      return true;
    });
    return () => subscription.remove();
  }, [canGoBack]);

  const retry = () => {
    setFailed(false);
    setLoading(true);
  };

  return <SafeAreaProvider>
    <SafeAreaView edges={['top','bottom']} style={styles.screen}>
      <StatusBar style="light" />
      {failed ? <View style={styles.error}>
        <Text style={styles.errorHeading}>App Foundry cannot connect</Text>
        <Text style={styles.errorBody}>Check your internet connection. Your previous work is stored locally on this device and has not been deleted.</Text>
        <TouchableOpacity onPress={retry} style={styles.button} accessibilityRole="button">
          <Text style={styles.buttonText}>Try again</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => Linking.openURL(SITE_URL)} accessibilityRole="button">
          <Text style={styles.browserLink}>Open website in browser</Text>
        </TouchableOpacity>
      </View> : <MobileWebView
        ref={browser}
        source={{ uri: SITE_URL }}
        style={styles.web}
        originWhitelist={['https://app-foundery.pages.dev']}
        javaScriptEnabled
        domStorageEnabled
        incognito={false}
        sharedCookiesEnabled={false}
        thirdPartyCookiesEnabled={false}
        mixedContentMode="never"
        setSupportMultipleWindows={false}
        startInLoadingState
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onNavigationStateChange={(event: WebViewNavigation) => setCanGoBack(event.canGoBack)}
        onShouldStartLoadWithRequest={(request) => {
          try {
            const url = new URL(request.url);
            if (url.origin === SITE_ORIGIN || request.url === 'about:blank') return true;
            if (url.protocol === 'https:') Linking.openURL(request.url).catch(() => {});
          } catch {
            // Reject unknown schemes and malformed navigation requests.
          }
          return false;
        }}
        onError={() => { setLoading(false); setFailed(true); }}
        onHttpError={(event) => {
          if (event.nativeEvent.statusCode >= 400 && event.nativeEvent.url === SITE_URL) {
            setLoading(false);
            setFailed(true);
          }
        }}
        renderLoading={() => <View style={styles.spinner}><ActivityIndicator size="large" color="#8ce7dc" /></View>}
      />}
      {loading && !failed && <View pointerEvents="none" style={styles.loading}><Text style={styles.loadingText}>Loading Foundry…</Text></View>}
    </SafeAreaView>
  </SafeAreaProvider>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#0b1018' },
  web: { flex: 1, backgroundColor: '#0b1018' },
  error: { flex: 1, justifyContent: 'center', padding: 24, gap: 18 },
  errorHeading: { color: '#fff', fontSize: 24, fontWeight: '700' },
  errorBody: { color: '#c9d2e0', lineHeight: 23, fontSize: 15 },
  button: { backgroundColor: '#8ce7dc', padding: 16, borderRadius: 12, alignItems: 'center' },
  buttonText: { color: '#071017', fontWeight: '700' },
  browserLink: { color: '#8ce7dc', padding: 10, textAlign: 'center' },
  spinner: { flex: 1, justifyContent: 'center', backgroundColor: '#0b1018' },
  loading: { position: 'absolute', bottom: 20, alignSelf: 'center' },
  loadingText: { color: '#8ce7dc', fontSize: 13 },
});
