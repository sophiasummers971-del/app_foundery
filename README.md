# App Foundry: unified web and Android

This is the real unified client with Creator Forge, Alpha automation, Bravo paperwork and Charlie business admin. It is not the earlier four-card mobile prototype.

- web/: browser application, static assets and module engines; deployed on Cloudflare Pages
- mobile/: Expo SDK 58 mobile WebView application
- test/: original business-logic tests, adapted to the web directory layout

No server-side user accounts, remote data sync, AI text generation, payments, business registration or cloud backups exist. These modules organise local work only. Public hosting serves static assets and does not receive a user's workspaces.

**Privacy:** notes, document metadata, profile, ventures and invoice records are stored in browser/WebView localStorage on each device. Windows, Android, and browser copies are separate. Use Settings export/import to migrate records. Exported JSON is unencrypted and needs secure handling. Clearing browser or app data may erase work.

**Release warning:** Android file-import/export, calendar downloads, and profile image picker have not been validated on real devices. A successful APK build is not evidence of full production readiness.

The original Windows-only server at 127.0.0.1:4195 is unchanged.

From the repository root: npm test. Hosting uses Cloudflare Pages static deployment of the web folder under the project named app-foundery.
