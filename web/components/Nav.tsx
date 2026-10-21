import Link from 'next/link';

import { WalletButton } from './Wallet';

/** The site's mark, the same drawing as app/icon.svg without its ground: two pages, the front one checked. */
export function Mark({ size = 26 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="106 106 300 300" aria-hidden style={{ flexShrink: 0 }}>
      <rect x="106" y="106" width="300" height="300" rx="46" fill="#17171e" stroke="#34343f" strokeWidth="8" />
      <rect x="166" y="150" width="128" height="166" rx="10" fill="none" stroke="#2dd4bf" strokeWidth="12" />
      <rect x="218" y="196" width="128" height="166" rx="10" fill="#2dd4bf" />
      <path d="M248 282 L272 306 L318 254" fill="none" stroke="#042f2a" strokeWidth="16" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Nav() {
  return (
    <header className="c-nav">
      <div className="c-wrap c-nav-row">
        <Link href="/" className="c-brand" aria-label="Samepage home">
          <Mark />
          <span className="c-word">samepage</span>
        </Link>
        <nav className="c-links" aria-label="Main">
          <Link href="/pages">Pages</Link>
          <Link href="/templates">Templates</Link>
          <Link href="/#how">How it works</Link>
          <Link href="/docs">Docs</Link>
        </nav>
        <div className="c-nav-right">
          <span className="c-pill hidden sm:inline-flex" title="GenLayer Studio Next, chain 61997">
            <span className="dot" />
            Studio Next
          </span>
          <WalletButton />
          <Link href="/new" className="c-btn small solid hidden sm:inline-flex">
            Open a page
          </Link>
        </div>
      </div>
    </header>
  );
}
