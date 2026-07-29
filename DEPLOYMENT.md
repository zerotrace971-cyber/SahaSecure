# Deploy Saha to Vercel

Saha is static hosting only. Vercel serves the Vite bundle and `public/zk/saha`; wallet connection, proving, fee balancing, submission, and Preview indexer requests run in the browser.

## 1. Verify locally

```bash
npm ci
npm run contract:format:check
npm run contract:compile
npm test
npm run typecheck
npm run build
```

Confirm `dist/zk/saha/keys` and `dist/zk/saha/zkir` exist after the build. The `.bzkir` files, prover keys, and verifier keys must be deployable static assets.

## 2. Configure Vercel

Import the repository in Vercel and use:

- Framework preset: **Vite**
- Install command: `npm ci`
- Build command: `npm run build`
- Output directory: `dist`
- Node version: 22

`vercel.json` provides SPA routing plus immutable caching for ZK artifacts. It creates no serverless functions.

Do not set wallet secrets, user credentials, private eligibility secrets, settlement secrets, Preview endpoints, or Gemini/API keys in Vercel. This app does not need them. If optional server-side AI is added later, isolate it into a separate service with a server-only secret and a privacy review; never forward wallet addresses or witness data to it.

## 3. Deploy

Use the Vercel dashboard or the free CLI:

```bash
npx vercel
npx vercel --prod
```

After deployment, open `<your-domain>/zk/saha/manifest.json`. A successful response confirms the runtime can fetch its static artifacts from the same origin.

## 4. Preview transaction checklist

1. Use a DApp Connector v4-compatible 1AM wallet connected to **Preview**.
2. Deploy only with generated/test secrets; this contract is not for real funds.
3. Confirm the wallet retrieves static circuit materials, performs proving, balances the unsealed transaction, and submits it.
4. Wait for wallet confirmation before treating the derived address as deployed.
5. Use the wallet’s own history as the source of transaction IDs and statuses.

## Artifact cache busting

Keys are immutable for a given compiled circuit. Any Compact source/compiler change must regenerate `contracts/managed/saha`, then run `npm run contract:sync` before deployment. The `manifest.json` lists the copied circuit assets, while cache-busted Vercel deployments ensure the HTML/JS points to the release’s static artifact set.
