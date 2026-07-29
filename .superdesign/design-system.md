# Saha — confidential savings circles

## Product intent

Saha is a Midnight Preview dApp for private savings circles and confidential profit-sharing pools. It must make advanced privacy technology feel gentle, legible, and financially trustworthy. The product helps a member discover a pool, prove eligibility privately, contribute without exposing an individual amount, and later claim a share. Public information is intentionally limited to each pool's published rules, open/settled status, participant count when disclosed, and aggregate totals.

Primary audiences are privacy-aware community savers, small investment clubs, and developers evaluating Midnight's Compact and browser-side proving flows. The UI must never invent connected wallets, balances, transaction hashes, deployed contract addresses, or on-chain activity.

## Core pages and jobs

- **Dashboard** — orient a connected or unconnected visitor, show active pools and a calm overview of public pool health.
- **Pool details** — show public rules, aggregate accounting, an eligibility explanation, and an honest call-to-action for the private join/contribution flow.
- **Privacy model** — explain public state, private witnesses, and intentional disclosure in plain language.
- **Activity & history** — show public pool events and local, opt-in wallet activity; never claim that private data is visible on the ledger.
- **Guide & help** — walk through wallet, eligibility, contribution, claim, and troubleshooting in short steps.
- **Developer launchpad** — surface the Compact contract, managed artifacts, Preview deployment prerequisites, and verified deployment status.

## Experience principles

1. **Private by design, explicit by language.** State what becomes public and what stays private beside every consequential action.
2. **Calm over spectacle.** Prefer wide breathing room, clear hierarchy, and gentle feedback over attention-grabbing crypto aesthetics.
3. **Proof is a process.** Explain eligibility proof, browser proving, signing, and ledger submission as distinct steps.
4. **Honesty before optimism.** Show an empty state, unavailable capability, or connection requirement rather than mock status data.
5. **Responsive first.** Navigation folds into a compact control at small widths; primary actions remain thumb reachable.

## Visual direction

This is a modern, minimal finance dashboard with a subtle Arabic-inspired visual language. It should evoke quiet courtyards and moonlit ceramic rather than ornament-heavy cultural pastiche. Use geometric tile segments, pointed arches, soft crescent cutouts, and eight-point-star line motifs sparingly as atmosphere. Avoid neon, cyberpunk, manga/anime styling, fake glass cards, and noisy charts.

### Color tokens

Light theme:

- `--ink: #173B3A` deep teal text and anchors
- `--ink-strong: #102D2C` deep teal CTA
- `--sand: #E9D6B5` warm sand support surface
- `--ivory: #FBF8F0` primary page background
- `--paper: #FFFCF6` card surface
- `--gold: #B58A49` muted gold accent, focus halo, selected state
- `--sage: #8EA39A` quiet sage status accent
- `--terracotta: #B66C55` cautious/warning accent, used sparingly
- `--line: rgba(23, 59, 58, 0.13)` calm borders
- `--muted: #667976` secondary text

Dark theme:

- `--ink: #EAF1EC` primary text
- `--ink-strong: #D6E4DC` light text on dark control
- `--sand: #3B4540` support surface
- `--ivory: #112A29` primary page background
- `--paper: #183635` card surface
- `--gold: #D4AF6A` muted gold accent
- `--sage: #9DB9AB` quiet positive accent
- `--terracotta: #D3896D` cautious accent
- `--line: rgba(234, 241, 236, 0.14)`
- `--muted: #AFC0B9`

Use a background gradient from ivory through a translucent sand glow to a very subtle pale teal, then layer a low-opacity geometric tile SVG / CSS pattern. Include a minimal crescent at the far edge of hero-like sections. Color contrast must remain WCAG AA.

### Typography

- Primary: `Manrope`, fallback `Inter, system-ui, sans-serif`.
- Editorial accent only in oversized page titles: `Cormorant Garamond`, fallback `Georgia, serif`; never use for dense UI or numbers.
- Default body: 15–16px, line-height 1.55.
- Dashboard title: 40–52px desktop / 32–38px mobile, sentence case, tight but breathable tracking.
- Numeric totals: Manrope semibold with tabular numerals.

### Layout and components

- Desktop app shell: a 256px quietly textured left sidebar or a top header for public/home screens; main content max width 1280px with 24–40px gutters.
- Mobile shell: compact branded header, hamburger/menu sheet, 16px page gutters, persistent primary action only when contextually useful.
- Cards: mostly 18–24px radius, 1px quiet border, paper surface, 0 14px 40px rgba(16,45,44,.06) light shadow. Avoid excessive floating elevation.
- Buttons: 12–14px radius, medium weight. Primary is deep teal with a tiny gold inset or crescent glyph; secondary is transparent/paper with teal border.
- Tags/status: small rounded capsules; prefer text plus icon, never rely on color alone.
- Tables: card-contained, roomy 48px rows; collapse into labelled record cards on small screens.
- Data visualisations: a simple concentric aggregate ring, a rules timeline, or key-value ledger cards. No misleading individual balances.
- Icons: refined 1.75px line icons, clear and accessible labels/tooltips.

### Motion and feedback

- Page entry: opacity 0 → 1 with 12px upward travel, 280–420ms, `cubic-bezier(.2,.8,.2,1)`.
- Hover: 1–2px lift or warm shadow expansion, 180ms; no springy or flashy effects.
- Private action progress: a three-step inline sequence—prepare private witness, prove locally, sign & submit—using honest pending/complete/error states.
- Respect `prefers-reduced-motion`: no floating pattern, no automatic motion, immediate state changes.

### Distinct visual motifs

- An eight-point-star tile pattern at 3–6% opacity in backgrounds only.
- A single crescent cutout used in the logo mark and hero/empty-state art.
- Fine muted-gold rule lines and corner tile brackets for section framing.
- Never use direct religious text, sacred symbols, costume-like imagery, or dense ornamental patterns.

## Sample dashboard composition

At desktop, present a slim sidebar with Saha logo, navigation, theme control, and a privacy indicator. The main area begins with a warm welcome title and one sentence explaining that all member identities and individual amounts remain private. A large "Your circle at a glance" paper card contains the selected pool's public status, published schedule, eligible member window, and aggregate pool total (only if available from chain data). To the side, a crescent-shaped empty wallet panel asks the user to connect a 1AM wallet. Below it, show 2–3 pool cards with rule summaries and status chips. A short "privacy checkpoint" callout links to the model page. The experience must remain useful without a wallet.

## Implementation constraints

- React + Vite + TypeScript. Keep wallet and transaction logic in the browser.
- Do not create a fake connection, balance, address, hash, or deployment status in any view.
- Any sample pools must be labelled clearly as local examples and cannot be shown as live on-chain data.
- Light/dark mode follows system preference on first visit and can be overridden locally.
- Use free packages and no client-exposed API keys.
