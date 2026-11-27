import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  loginWithGoogle,
  loginWithGitHub,
} from "../services/authService";
function EntryPage() {
  const [theme, setTheme] = useState(
    () => localStorage.getItem("archpilot-theme") || "light",
  );

  useEffect(() => {
    localStorage.setItem("archpilot-theme", theme);
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }

  return (
    <main className="welcome-page" data-theme={theme}>
      <nav className="welcome-nav">
        <Link to="/" className="welcome-brand">
          <span className="welcome-logo">A</span>
          <span>ArchPilot</span>
        </Link>

        <div className="welcome-nav-actions">
          <span className="welcome-nav-label">SYSTEM DESIGN STUDIO</span>

          <button
            type="button"
            className="welcome-theme-toggle"
            onClick={toggleTheme}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
          >
            {theme === "dark" ? "☾" : "☀"}
          </button>
        </div>
      </nav>

      <section className="welcome-hero">
        <div className="welcome-content">
          <span className="welcome-eyebrow">
            <span className="welcome-eyebrow-dot"></span>
            THINK. DESIGN. BUILD.
          </span>

          <h1>
            Turn your ideas into
            <span> powerful architectures.</span>
          </h1>

          <p className="welcome-description">
            Design, organize, and visualize your system architecture in one
            workspace. Start with your requirements and build a system that
            makes sense.
          </p>
<div className="welcome-actions">
  <button
    type="button"
    className="welcome-start-btn welcome-google-btn"
    onClick={loginWithGoogle}
  >
    <svg
      className="auth-provider-icon"
      viewBox="0 0 48 48"
      aria-hidden="true"
    >
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.91c-.58 2.96-2.25 5.47-4.73 7.16l7.26 5.64c4.24-3.91 7.54-9.69 7.54-17.27z" />
      <path fill="#FBBC05" d="M10.54 28.59a14.4 14.4 0 0 1 0-9.18l-7.98-6.19a23.9 23.9 0 0 0 0 21.56l7.98-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.91-6.18l-7.26-5.64c-2.02 1.36-4.6 2.16-8.65 2.16-6.26 0-11.57-4.22-13.46-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
    Continue with Google
    <span aria-hidden="true">→</span>
  </button>

  <button
    type="button"
    className="welcome-start-btn welcome-github-btn"
    onClick={loginWithGitHub}
  >
    <svg
      className="auth-provider-icon github-icon"
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M12 .9a11.1 11.1 0 0 0-3.51 21.63c.56.1.76-.24.76-.54v-2.08c-3.1.67-3.75-1.32-3.75-1.32-.5-1.28-1.23-1.62-1.23-1.62-1.01-.69.08-.68.08-.68 1.12.08 1.7 1.15 1.7 1.15.99 1.69 2.6 1.2 3.23.92.1-.72.39-1.2.7-1.48-2.48-.28-5.08-1.24-5.08-5.5 0-1.22.44-2.22 1.15-3-.12-.28-.5-1.42.11-2.96 0 0 .94-.3 3.05 1.15a10.6 10.6 0 0 1 5.55 0c2.11-1.45 3.05-1.15 3.05-1.15.61 1.54.23 2.68.11 2.96.72.78 1.15 1.78 1.15 3.01 0 4.27-2.6 5.21-5.09 5.49.4.34.75 1.02.75 2.06v3.05c0 .3.2.65.77.54A11.1 11.1 0 0 0 12 .9z" />
    </svg>
    Continue with GitHub
    <span aria-hidden="true">→</span>
  </button>

  <span className="welcome-action-note">
    Your next great system starts here.
  </span>
</div>

          <div className="welcome-features">
            <div>
              <span className="welcome-feature-icon">⌘</span>
              <span>Design systems</span>
            </div>
            <div>
              <span className="welcome-feature-icon">◇</span>
              <span>Connect components</span>
            </div>
            <div>
              <span className="welcome-feature-icon">✓</span>
              <span>Plan with clarity</span>
            </div>
          </div>
        </div>

        <div
          className="welcome-visual"
          aria-label="Illustration of connected software architecture components"
        >
          <div className="visual-glow"></div>

          <div className="visual-orbit orbit-one"></div>
          <div className="visual-orbit orbit-two"></div>

          <div className="architecture-preview">
            <div className="preview-topbar">
              <div className="preview-dots">
                <span></span>
                <span></span>
                <span></span>
              </div>
              <span>ARCHITECTURE OVERVIEW</span>
              <span className="preview-status">● LIVE</span>
            </div>

            <div className="preview-canvas">
              <svg
                className="preview-connections"
                viewBox="0 0 500 350"
                preserveAspectRatio="none"
                aria-hidden="true"
              >
                <path d="M250 85 L250 135 L120 135 L120 190" />
                <path d="M250 135 L380 135 L380 190" />
                <path d="M120 245 L120 285 L250 285 L250 305" />
                <path d="M380 245 L380 285 L250 285" />
                <circle cx="250" cy="135" r="4" />
                <circle cx="250" cy="285" r="4" />
              </svg>

              <div className="preview-node preview-client">
                <span className="preview-node-icon">⌘</span>
                <div>
                  <strong>Web Client</strong>
                  <small>Frontend</small>
                </div>
              </div>

              <div className="preview-node preview-api">
                <span className="preview-node-icon">↔</span>
                <div>
                  <strong>API Gateway</strong>
                  <small>Backend service</small>
                </div>
              </div>

              <div className="preview-node preview-database">
                <span className="preview-node-icon">▤</span>
                <div>
                  <strong>Database</strong>
                  <small>Data storage</small>
                </div>
              </div>

              <div className="preview-node preview-external">
                <span className="preview-node-icon">◇</span>
                <div>
                  <strong>External API</strong>
                  <small>Integration</small>
                </div>
              </div>

              <div className="preview-center-label">SYSTEM FLOW</div>
            </div>

            <div className="preview-footer">
              <span>
                <i></i> 4 Components
              </span>
              <span>Architecture preview</span>
            </div>
          </div>

          <div className="floating-chip chip-top">
            <span>✦</span> Smart design
          </div>

          <div className="floating-chip chip-bottom">
            <span>✓</span> Built with clarity
          </div>
        </div>
      </section>

      <footer className="welcome-footer">
        <span>© {new Date().getFullYear()} ArchPilot</span>
        <span>Designed to make system thinking clearer.</span>
      </footer>
    </main>
  );
}
export default EntryPage;
