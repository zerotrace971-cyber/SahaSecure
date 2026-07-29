import { useEffect, useMemo, useState, type FormEvent, type ReactNode } from 'react';
import type { WalletOption } from './lib/wallet';
import { connectPreviewWallet, listPreviewWallets, type ConnectedWallet } from './lib/wallet';
import {
  contributeConfidentially,
  deploySahaPool,
  deriveEligibilityDigest,
  deriveSettlementAuthorityDigest,
  humaniseMidnightError,
  inspectSahaPool,
  joinSahaPool,
  type PoolSnapshot,
} from './lib/saha-contract';
import { bytesToHex, errorMessage, hexToBytes, shortValue } from './lib/format';

type Page = 'dashboard' | 'pool' | 'privacy' | 'activity' | 'guide' | 'launchpad';
type Notice = { kind: 'success' | 'error' | 'info'; text: string } | null;

const pages: Array<{ id: Page; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Sanctuary', icon: '◒' },
  { id: 'pool', label: 'Pool details', icon: '◌' },
  { id: 'privacy', label: 'Privacy model', icon: '◈' },
  { id: 'activity', label: 'Activity', icon: '↗' },
  { id: 'guide', label: 'Guide', icon: '?' },
  { id: 'launchpad', label: 'Launchpad', icon: '✦' },
];

const getPage = (): Page => {
  const id = window.location.hash.replace('#/', '') as Page;
  return pages.some((page) => page.id === id) ? id : 'dashboard';
};

const iconUrl = (source: string) =>
  source.startsWith('https://') || source.startsWith('data:image/') ? source : undefined;

function App() {
  const [page, setPage] = useState<Page>(getPage);
  const [isDark, setIsDark] = useState(false);
  const [wallets, setWallets] = useState<WalletOption[]>([]);
  const [wallet, setWallet] = useState<ConnectedWallet | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const navigate = (next: Page) => {
    window.location.hash = `/${next}`;
    setPage(next);
  };

  useEffect(() => {
    const sync = () => setPage(getPage());
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = isDark ? 'dark' : 'light';
  }, [isDark]);

  useEffect(() => {
    const refresh = () => setWallets(listPreviewWallets());
    refresh();
    const timer = window.setInterval(refresh, 800);
    return () => window.clearInterval(timer);
  }, []);

  const connect = async (option: WalletOption) => {
    setBusy('connect');
    setNotice(null);
    try {
      const connected = await connectPreviewWallet(option);
      setWallet(connected);
      setNotice({ kind: 'success', text: `${connected.name} is connected to Midnight Preview.` });
    } catch (error) {
      setNotice({ kind: 'error', text: humaniseMidnightError(error) });
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a className="brand" href="#/dashboard" onClick={() => navigate('dashboard')}>
          <span className="brand-mark" aria-hidden="true">☾</span>
          <span>Saha</span>
        </a>
        <p className="brand-subtitle">Private circles for shared abundance</p>

        <nav className="navigation" aria-label="Main navigation">
          {pages.map((item) => (
            <button
              className={page === item.id ? 'nav-item active' : 'nav-item'}
              key={item.id}
              onClick={() => navigate(item.id)}
              type="button"
            >
              <span aria-hidden="true">{item.icon}</span>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="sidebar-foot">
          <span className="preview-dot" /> Preview network only
          <a href="https://midnight.network/" target="_blank" rel="noreferrer">Midnight ↗</a>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="eyebrow"><span className="preview-dot" /> Midnight Preview</div>
          <div className="top-actions">
            <button className="icon-button" type="button" onClick={() => setIsDark((value) => !value)} aria-label="Toggle colour theme">
              {isDark ? '☼' : '☾'}
            </button>
            <WalletButton wallets={wallets} wallet={wallet} busy={busy === 'connect'} onConnect={connect} />
          </div>
        </header>

        {notice && <div className={`notice ${notice.kind}`} role="status">{notice.text}<button onClick={() => setNotice(null)} aria-label="Dismiss notice">×</button></div>}

        {page === 'dashboard' && <Dashboard onNavigate={navigate} wallet={wallet} />}
        {page === 'pool' && <PoolDetails wallet={wallet} busy={busy} setBusy={setBusy} setNotice={setNotice} />}
        {page === 'privacy' && <Privacy />}
        {page === 'activity' && <Activity wallet={wallet} />}
        {page === 'guide' && <Guide onNavigate={navigate} />}
        {page === 'launchpad' && <Launchpad wallet={wallet} busy={busy} setBusy={setBusy} setNotice={setNotice} />}
      </main>
    </div>
  );
}

function WalletButton({ wallets, wallet, busy, onConnect }: { wallets: WalletOption[]; wallet: ConnectedWallet | null; busy: boolean; onConnect: (option: WalletOption) => void }) {
  if (wallet) {
    return <div className="wallet-chip"><span className="wallet-status" />{shortValue(wallet.unshieldedAddress, 8, 6)}</div>;
  }
  if (wallets.length === 0) return <a className="button ghost" href="https://1am.technology/" target="_blank" rel="noreferrer">Get a 1AM wallet ↗</a>;
  if (wallets.length === 1) return <button className="button primary" onClick={() => onConnect(wallets[0])} disabled={busy}>{busy ? 'Opening wallet…' : 'Connect wallet'}</button>;
  return (
    <details className="wallet-menu">
      <summary className="button primary">Connect wallet</summary>
      <div className="wallet-options">
        {wallets.map((option) => <button key={option.id} onClick={() => onConnect(option)} disabled={busy}>{iconUrl(option.wallet.icon) && <img src={iconUrl(option.wallet.icon)} alt="" />}{option.wallet.name}</button>)}
      </div>
    </details>
  );
}

function Dashboard({ onNavigate, wallet }: { onNavigate: (page: Page) => void; wallet: ConnectedWallet | null }) {
  return <>
    <section className="hero">
      <div className="moon-orbit one" /><div className="moon-orbit two" />
      <div className="hero-copy">
        <p className="kicker">Private savings circles</p>
        <h1>A quieter way to<br /><em>share what grows.</em></h1>
        <p className="lede">Saha lets a circle verify belonging, contribute, and settle a shared round with identities and individual entries held inside zero-knowledge proofs.</p>
        <div className="hero-actions">
          <button className="button primary" type="button" onClick={() => onNavigate('launchpad')}>Create a private pool <span>→</span></button>
          <button className="text-button" type="button" onClick={() => onNavigate('privacy')}>Read the privacy model</button>
        </div>
      </div>
      <div className="hero-seal" aria-label="Saha private by design"><span>☾</span><small>Private<br />by design</small></div>
    </section>

    <section className="stats-grid" aria-label="Private pool capabilities">
      <Stat label="Membership" value="Proven" caption="Secret-knowledge eligibility" />
      <Stat label="Contributions" value="Committed" caption="Amount stays in the proof" />
      <Stat label="Public ledger" value="Minimal" caption="Rules, status, aggregates" />
    </section>

    <section className="panel capability-panel">
      <div><p className="kicker">Your sanctuary</p><h2>{wallet ? 'Ready for a real Preview transaction.' : 'Connect only when you are ready.'}</h2><p>Saha never invents a balance, address, contract, or transaction result. The dashboard stays empty until your wallet or the Preview ledger provides the data.</p></div>
      <div className="quiet-steps"><span>01</span><p>Creator commits pool rules and private credentials.</p><span>02</span><p>Members prove eligibility without publishing identity.</p><span>03</span><p>Only opaque commitments and aggregate reporting enter the ledger.</p></div>
    </section>
  </>;
}

function Stat({ label, value, caption }: { label: string; value: string; caption: string }) {
  return <article className="stat-card"><p>{label}</p><strong>{value}</strong><span>{caption}</span></article>;
}

function PoolDetails({ wallet, busy, setBusy, setNotice }: PageProps) {
  const [address, setAddress] = useState('');
  const [eligibilitySecret, setEligibilitySecret] = useState('');
  const [amount, setAmount] = useState('');
  const [snapshot, setSnapshot] = useState<PoolSnapshot | null>(null);

  const inspect = async (event: FormEvent) => {
    event.preventDefault();
    if (!wallet) return setNotice({ kind: 'info', text: 'Connect a 1AM wallet on Midnight Preview before reading a real pool.' });
    setBusy('inspect'); setNotice(null);
    try { setSnapshot(await inspectSahaPool(wallet, address)); }
    catch (error) { setNotice({ kind: 'error', text: humaniseMidnightError(error) }); }
    finally { setBusy(null); }
  };
  const run = async (action: 'join' | 'contribute') => {
    if (!wallet) return setNotice({ kind: 'info', text: 'Connect a 1AM wallet on Midnight Preview before creating a proof.' });
    setBusy(action); setNotice(null);
    try {
      const secret = hexToBytes(eligibilitySecret, 'Eligibility secret');
      if (action === 'join') await joinSahaPool(wallet, { contractAddress: address, eligibilitySecret: secret });
      else await contributeConfidentially(wallet, { contractAddress: address, eligibilitySecret: secret, amount: BigInt(amount) });
      setNotice({ kind: 'success', text: 'The wallet accepted the transaction for submission. Check the wallet activity for its real network status.' });
    } catch (error) { setNotice({ kind: 'error', text: humaniseMidnightError(error) }); }
    finally { setBusy(null); }
  };
  return <section className="page-grid"><div>
    <p className="kicker">Pool details</p><h1>Read the public surface.<br /><em>Keep the personal one private.</em></h1>
    <p className="lede narrow">Enter an actual Preview contract address. Saha reads state from the connected wallet’s selected indexer; nothing below is sample chain data.</p>
    <form className="panel form-stack" onSubmit={inspect}>
      <label>Preview contract address<input value={address} onChange={(event) => setAddress(event.target.value)} placeholder="Hex-encoded Saha contract address" required /></label>
      <button className="button primary" disabled={busy === 'inspect'}>{busy === 'inspect' ? 'Reading ledger…' : 'Read public state'}</button>
    </form>
    {snapshot && <PoolSnapshotView snapshot={snapshot} />}
  </div>
  <aside className="action-card panel">
    <p className="kicker">Private actions</p><h2>Join or contribute</h2><p>Eligibility proof and amount are private witnesses. Secrets remain in this browser session and are never sent to Saha’s frontend.</p>
    <label>Eligibility secret<input type="password" value={eligibilitySecret} onChange={(event) => setEligibilitySecret(event.target.value)} placeholder="32-byte hexadecimal secret" /></label>
    <label>Contribution in smallest unit<input inputMode="numeric" value={amount} onChange={(event) => setAmount(event.target.value)} placeholder="For example: 1000000" /></label>
    <div className="button-row"><button className="button ghost" type="button" onClick={() => run('join')} disabled={busy !== null}>{busy === 'join' ? 'Proving…' : 'Join privately'}</button><button className="button primary" type="button" onClick={() => run('contribute')} disabled={busy !== null}>{busy === 'contribute' ? 'Proving…' : 'Contribute privately'}</button></div>
    <small>The current Compact primitive records a confidential contribution commitment; it is not a custody or token-escrow contract.</small>
  </aside></section>;
}

function PoolSnapshotView({ snapshot }: { snapshot: PoolSnapshot }) {
  return <div className="snapshot panel"><div className="state-line"><span className={`state-pill ${snapshot.status.toLowerCase()}`}>{snapshot.status}</span><span>Round {snapshot.round.toString()}</span></div><div className="snapshot-stats"><Stat label="Members" value={snapshot.memberCount.toString()} caption="Public counter" /><Stat label="Contributions" value={snapshot.contributionCount.toString()} caption="Public counter" /><Stat label="Claims" value={snapshot.claimCount.toString()} caption="Public counter" /></div><dl><div><dt>Rules digest</dt><dd>{shortValue(snapshot.rulesDigest)}</dd></div><div><dt>Eligibility commitment</dt><dd>{shortValue(snapshot.eligibilityDigest)}</dd></div><div><dt>Latest opaque contribution commitment</dt><dd>{shortValue(snapshot.commitment)}</dd></div></dl></div>;
}

function Privacy() { return <section><p className="kicker">Privacy model</p><h1>Deliberate disclosure,<br /><em>nothing by accident.</em></h1><p className="lede narrow">Every private Saha action is a Compact circuit. Witnesses are available to the proof, not copied to the public ledger. `disclose()` is used only where public state must receive a safe, one-way commitment or an expressly reported aggregate.</p><div className="privacy-grid"><PrivacyCard title="Private witnesses" icon="◈"><ul><li>Member secret and eligibility secret</li><li>Individual contribution and claim amounts</li><li>Blinding values and settlement authority secret</li></ul></PrivacyCard><PrivacyCard title="Public ledger" icon="◌"><ul><li>Pool rules and status</li><li>Round and action counters</li><li>Explicit aggregate reports and opaque commitments</li></ul></PrivacyCard><PrivacyCard title="Not yet in scope" icon="△"><ul><li>Token escrow or custody</li><li>Membership nullifier / anti-sybil accumulator</li><li>Audited production economics</li></ul></PrivacyCard></div><section className="panel disclosure"><div><p className="kicker">Why the commitments are public</p><h2>A commitment verifies continuity without revealing its input.</h2></div><p>Membership, contribution, and claim commitments are one-way hashes. The circuit deliberately calls `disclose()` on those commitments so the ledger can evolve while the identity, amount, and blinding input stay private. The aggregate fields are disclosed only by an authorized settlement proof.</p></section></section>; }

function PrivacyCard({ title, icon, children }: { title: string; icon: string; children: ReactNode }) { return <article className="privacy-card"><span className="privacy-icon">{icon}</span><h2>{title}</h2>{children}</article>; }

function Activity({ wallet }: { wallet: ConnectedWallet | null }) { return <section><p className="kicker">Activity & history</p><h1>No invented history.<br /><em>Only wallet-confirmed events.</em></h1><div className="empty-history panel"><span>☾</span><h2>{wallet ? 'Your wallet decides what is visible here.' : 'Connect Preview to read wallet activity.'}</h2><p>{wallet ? 'Saha does not create synthetic transaction rows. Use your 1AM wallet history to track the actual transaction identifiers and finalisation states.' : 'When a wallet is connected, Saha will continue to show only real, wallet-provided history.'}</p></div></section>; }

function Guide({ onNavigate }: { onNavigate: (page: Page) => void }) { return <section><p className="kicker">Guide & help</p><h1>Take the circle slowly.</h1><div className="guide-list"><GuideRow number="01" title="Connect 1AM on Preview" detail="Saha detects DApp Connector v4 wallets injected into your browser. Connection, balances, proving, fee balancing, and submission stay client-side." /><GuideRow number="02" title="Create credentials outside the chain" detail="A creator safeguards 32-byte eligibility and authority secrets, then commits their Compact hashes at deployment. Never paste real secrets into a shared chat or public config." /><GuideRow number="03" title="Deploy with the launchpad" detail="The browser downloads Saha’s compiled ZKIR and keys from this static frontend, asks the wallet for a proving provider, balances the proven transaction, then submits it." /><GuideRow number="04" title="Join or contribute privately" detail="Members provide the pool address and their private eligibility secret. A contribution amount becomes a witness and only a blinded commitment is persisted." /></div><button className="button primary" onClick={() => onNavigate('launchpad')}>Open developer launchpad →</button></section>; }
function GuideRow({ number, title, detail }: { number: string; title: string; detail: string }) { return <article className="guide-row"><span>{number}</span><div><h2>{title}</h2><p>{detail}</p></div></article>; }

function Launchpad({ wallet, busy, setBusy, setNotice }: PageProps) {
  const [rulesDigest, setRulesDigest] = useState('');
  const [eligibilitySecret, setEligibilitySecret] = useState('');
  const [authoritySecret, setAuthoritySecret] = useState('');
  const [eligibilityDigest, setEligibilityDigest] = useState('');
  const [authorityDigest, setAuthorityDigest] = useState('');
  const [deployedAddress, setDeployedAddress] = useState('');

  const derive = () => {
    try {
      setEligibilityDigest(bytesToHex(deriveEligibilityDigest(hexToBytes(eligibilitySecret, 'Eligibility secret'))));
      setAuthorityDigest(bytesToHex(deriveSettlementAuthorityDigest(hexToBytes(authoritySecret, 'Settlement authority secret'))));
      setNotice({ kind: 'success', text: 'Commitments were derived locally with the compiled Saha Compact circuit. Preserve the two source secrets yourself.' });
    } catch (error) { setNotice({ kind: 'error', text: errorMessage(error) }); }
  };
  const deploy = async (event: FormEvent) => {
    event.preventDefault();
    if (!wallet) return setNotice({ kind: 'info', text: 'Connect a 1AM wallet on Midnight Preview before deploying.' });
    setBusy('deploy'); setNotice(null);
    try {
      const address = await deploySahaPool(wallet, { rulesDigest: hexToBytes(rulesDigest, 'Rules digest'), eligibilityDigest: hexToBytes(eligibilityDigest, 'Eligibility digest'), settlementAuthorityDigest: hexToBytes(authorityDigest, 'Settlement authority digest'), settlementAuthoritySecret: hexToBytes(authoritySecret, 'Settlement authority secret') });
      setDeployedAddress(address);
      setNotice({ kind: 'success', text: 'The wallet accepted the deployment transaction for submission. The address below is the real address derived by the deployment builder; wait for wallet confirmation before sharing it.' });
    } catch (error) { setNotice({ kind: 'error', text: humaniseMidnightError(error) }); }
    finally { setBusy(null); }
  };
  return <section className="launchpad"><p className="kicker">Developer launchpad</p><h1>Start a pool with<br /><em>private roots.</em></h1><p className="lede narrow">This is a browser-only Preview deployment flow. The hosted frontend serves static artifacts; your wallet provides proving, balances fees, and submits. No API key is required or accepted.</p><form className="launchpad-form panel" onSubmit={deploy}><div className="form-columns"><label>Public rules digest<input value={rulesDigest} onChange={(event) => setRulesDigest(event.target.value)} placeholder="32-byte hex digest of the pool rules" required /><small>This is intentionally public. Produce it from the exact rules document your circle signs off on.</small></label><label>Eligibility secret<input type="password" value={eligibilitySecret} onChange={(event) => setEligibilitySecret(event.target.value)} placeholder="32-byte random hex secret" required /><small>Private. Derive a public Compact commitment below; distribute the source credential only to eligible members.</small></label><label>Settlement authority secret<input type="password" value={authoritySecret} onChange={(event) => setAuthoritySecret(event.target.value)} placeholder="32-byte random hex secret" required /><small>Private. Required by settlement state transitions and aggregate reporting.</small></label></div><button className="button ghost" type="button" onClick={derive}>Derive Compact commitments locally</button><div className="derived"><label>Eligibility commitment<input value={eligibilityDigest} onChange={(event) => setEligibilityDigest(event.target.value)} placeholder="Derived 32-byte public commitment" required /></label><label>Authority commitment<input value={authorityDigest} onChange={(event) => setAuthorityDigest(event.target.value)} placeholder="Derived 32-byte public commitment" required /></label></div><div className="launchpad-footer"><p>Alpha disclosure: Saha’s on-chain primitive records confidential membership and contribution commitments. It does not custody assets or enforce one-person-one-membership; do not use it with real funds.</p><button className="button primary" disabled={busy !== null}>{busy === 'deploy' ? 'Proving deployment…' : 'Deploy to Preview →'}</button></div></form>{deployedAddress && <div className="deployment-result panel"><p className="kicker">Derived deployment address</p><code>{deployedAddress}</code><p>Record this only after your wallet shows the transaction was submitted and later confirmed. Saha does not claim finalisation on the wallet’s behalf.</p></div>}</section>;
}

type PageProps = { wallet: ConnectedWallet | null; busy: string | null; setBusy: (value: string | null) => void; setNotice: (value: Notice) => void };
export default App;
