<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://ai.google.dev/static/site-assets/images/share-ais-513315318.png" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/bf241ab9-3d15-40c4-8a1e-542a092153f8

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

Environment variables — local and Vercel
- Local setup:
   - Copy `.env.local.example` to `.env.local` and fill in your keys.
      ```powershell
      Copy-Item .env.local.example .env.local
      ```
   - For local dev, the app includes a built-in Firebase fallback configuration in source, but set `VITE_` vars in `.env.local` if you want to use your own Firebase project.

- Vercel (production):
   - Add these variables in your Vercel Project → Settings → Environment Variables.
      - Client/build-time (exposed to client JS at build): prefix with `VITE_`
         - `VITE_FIREBASE_API_KEY`
         - `VITE_FIREBASE_AUTH_DOMAIN`
         - `VITE_FIREBASE_PROJECT_ID`
         - `VITE_FIREBASE_STORAGE_BUCKET`
         - `VITE_FIREBASE_MESSAGING_SENDER_ID`
         - `VITE_FIREBASE_APP_ID`
         - `VITE_FIREBASE_MEASUREMENT_ID`
         - `VITE_FIRESTORE_DB_ID`
      - Server-only (do NOT prefix with `VITE_` if you wish to keep them secret):
         - `GEMINI_API_KEY`
         - `APP_URL` (set to your Vercel app URL for callbacks)
   - After adding vars, trigger a redeploy so build-time `VITE_` values are included.

Notes:
- The app reads `import.meta.env.VITE_*` variables. If they are missing, it falls back to a built-in Firebase config in source.
- Keep `.env.local` out of version control. Use `.env.local.example` for sharing templates.
