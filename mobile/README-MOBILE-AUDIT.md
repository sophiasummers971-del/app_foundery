# App Foundry Android 0.2.0 test build

The old 0.1.0 Expo preview was just navigation plus memory-only draft notes. That is **not** the application's actual functionality.

This 0.2.0 Expo package uses react-native-webview to open the published static client at https://app-foundery.pages.dev/. It includes the actual Creator Forge, Alpha automation, Bravo paperwork and Charlie business-admin modules.

The web content does not require a Supabase database or sign-in. Records are kept in the Android WebView's localStorage; this is a separate storage area from Windows desktop and the browser. Users must export from one device and import on the other to migrate records. The 0.1.0 native prototype's temporary drafts are not migrated.

This is still an internal test build, not store-ready. Android file import/export, ICS calendar downloads, profile image picker and device-specific WebView persistence remain to be tested. The site requires an internet connection to load; its local storage persists app records while the app's data remains installed.

Expo project ID c4ce5f46-b513-4468-b6a7-db9dea95ca57, owner sophiajade, Android package uk.co.sjinsides.appfoundry, versionCode 2.
