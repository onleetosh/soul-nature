export function SiteFooter() {
  return (
    <footer className="site-footer">
      <a className="wordmark footer-wordmark" href="/#home">
        <span className="wordmark-icon" aria-hidden="true">s</span>
        <span>SOUL <span className="wordmark-of">OF</span> NATURE</span>
      </a>
      <p>Rooted in nature. Made with intention.</p>
      <span className="footer-copyright">© {new Date().getFullYear()} Soul of Nature</span>
    </footer>
  );
}
