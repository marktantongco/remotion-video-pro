export default function Home() {
  return (
    <div style={styles.page}>
      {/* Hero Section */}
      <header style={styles.hero}>
        <div style={styles.heroGlow} />
        <nav style={styles.nav}>
          <div style={styles.logo}>
            <span style={styles.logoIcon}>▶</span>
            <span style={styles.logoText}>Remotion Video Pro</span>
          </div>
          <div style={styles.navLinks}>
            <a href="#features" style={styles.navLink}>Features</a>
            <a href="#api" style={styles.navLink}>API</a>
            <a href="#quickstart" style={styles.navLink}>Quick Start</a>
            <a href="#architecture" style={styles.navLink}>Architecture</a>
          </div>
        </nav>

        <div style={styles.heroContent}>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>v2.0 — A/B Testing</span>
            <span style={{ ...styles.badge, ...styles.badgeGreen }}>Production Ready</span>
          </div>
          <h1 style={styles.heroTitle}>
            Video Personalization<br />
            <span style={styles.gradientText}>Engine</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Programmatic video rendering API with real-time personalization,
            A/B testing, Stripe integration, and batch processing.
            Render millions of unique videos at scale.
          </p>
          <div style={styles.heroActions}>
            <a href="#quickstart" style={styles.btnPrimary}>Get Started →</a>
            <a href="#api" style={styles.btnSecondary}>API Reference</a>
          </div>
          <div style={styles.statsRow}>
            <div style={styles.stat}>
              <span style={styles.statValue}>10K+</span>
              <span style={styles.statLabel}>Batch Limit</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statValue}>&lt;60s</span>
              <span style={styles.statLabel}>Avg Render</span>
            </div>
            <div style={styles.statDivider} />
            <div style={styles.stat}>
              <span style={styles.statValue}>99.9%</span>
              <span style={styles.statLabel}>Uptime</span>
            </div>
          </div>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" style={styles.section}>
        <h2 style={styles.sectionTitle}>Why Remotion Video Pro?</h2>
        <div style={styles.featuresGrid}>
          {[
            {
              icon: '⚡',
              title: 'Real-Time Rendering',
              desc: 'AWS Lambda-powered renders with progress tracking. Sub-60s delivery for 1080p videos.',
            },
            {
              icon: '🧪',
              title: 'A/B Testing',
              desc: 'Built-in experiment framework with statistical significance testing (chi-square). Track conversions, LTV, and engagement.',
            },
            {
              icon: '💳',
              title: 'Stripe Integration',
              desc: 'Dual-layer security: Stripe signature verification + per-checkout HMAC. Trigger personalized thank-you videos on purchase.',
            },
            {
              icon: '📦',
              title: 'Batch Processing',
              desc: 'Up to 10,000 videos per batch with cost guards ($500 limit), priority queues, and webhook callbacks.',
            },
            {
              icon: '🔒',
              title: 'Enterprise Security',
              desc: 'Timing-safe auth, SSRF protection, rate limiting, security headers, and PII sanitization.',
            },
            {
              icon: '🔄',
              title: 'Version Management',
              desc: 'Atomic version activation with zero-downtime swaps. Test new compositions before going live.',
            },
          ].map((feature, i) => (
            <div key={i} style={styles.featureCard}>
              <span style={styles.featureIcon}>{feature.icon}</span>
              <h3 style={styles.featureTitle}>{feature.title}</h3>
              <p style={styles.featureDesc}>{feature.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* API Reference */}
      <section id="api" style={styles.section}>
        <h2 style={styles.sectionTitle}>API Reference</h2>
        <p style={styles.sectionSubtitle}>All endpoints require authentication via headers. Rate limits are enforced per IP.</p>
        <div style={styles.apiGrid}>
          {[
            {
              method: 'POST',
              path: '/api/render',
              auth: 'x-webhook-secret',
              desc: 'Trigger a single render job. Supports version pinning.',
              rateLimit: '60/min',
              color: '#22c55e',
            },
            {
              method: 'GET',
              path: '/api/render?jobId=xxx',
              auth: 'x-webhook-secret',
              desc: 'Poll job status. PII is sanitized in responses.',
              rateLimit: '120/min',
              color: '#3b82f6',
            },
            {
              method: 'POST',
              path: '/api/batch',
              auth: 'x-webhook-secret',
              desc: 'Batch render up to 10K videos with callbacks.',
              rateLimit: '10/min',
              color: '#22c55e',
            },
            {
              method: 'POST',
              path: '/api/stripe-webhook',
              auth: 'Stripe signature + HMAC',
              desc: 'Stripe webhook handler. Dual-layer verification.',
              rateLimit: '100/min',
              color: '#22c55e',
            },
            {
              method: 'POST',
              path: '/api/composition/activate',
              auth: 'x-admin-secret',
              desc: 'Activate a composition version atomically.',
              rateLimit: '30/min',
              color: '#22c55e',
            },
            {
              method: 'POST',
              path: '/api/ab',
              auth: 'x-admin-secret',
              desc: 'Create an A/B test for a composition.',
              rateLimit: '30/min',
              color: '#22c55e',
            },
            {
              method: 'GET',
              path: '/api/ab',
              auth: 'x-admin-secret',
              desc: 'List all A/B tests with aggregated results.',
              rateLimit: '120/min',
              color: '#3b82f6',
            },
            {
              method: 'POST',
              path: '/api/analytics/track',
              auth: 'x-analytics-token',
              desc: 'Track email opens, video plays, conversions.',
              rateLimit: '100/min',
              color: '#22c55e',
            },
          ].map((endpoint, i) => (
            <div key={i} style={styles.apiCard}>
              <div style={styles.apiCardHeader}>
                <span style={{
                  ...styles.methodBadge,
                  backgroundColor: endpoint.method === 'POST' ? 'rgba(34,197,94,0.15)' : 'rgba(59,130,246,0.15)',
                  color: endpoint.method === 'POST' ? '#22c55e' : '#3b82f6',
                }}>
                  {endpoint.method}
                </span>
                <code style={styles.apiPath}>{endpoint.path}</code>
              </div>
              <p style={styles.apiDesc}>{endpoint.desc}</p>
              <div style={styles.apiMeta}>
                <span style={styles.metaTag}>🔑 {endpoint.auth}</span>
                <span style={styles.metaTag}>⏱ {endpoint.rateLimit}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Quick Start */}
      <section id="quickstart" style={styles.section}>
        <h2 style={styles.sectionTitle}>Quick Start</h2>
        <div style={styles.stepsGrid}>
          {[
            {
              step: '1',
              title: 'Configure Environment',
              code: `WEBHOOK_SECRET=your-secret
ADMIN_SECRET=your-admin-secret
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...
CHECKOUT_HMAC_SECRET=<64-char-hex>`,
            },
            {
              step: '2',
              title: 'Trigger a Render',
              code: `curl -X POST https://your-api.com/api/render \\
  -H "x-webhook-secret: your-secret" \\
  -H "Content-Type: application/json" \\
  -d '{
    "event": "order.completed",
    "data": {
      "customerName": "Alice",
      "email": "alice@example.com",
      "productName": "Widget Pro",
      "amount": "49.99"
    }
  }'`,
            },
            {
              step: '3',
              title: 'Poll for Results',
              code: `curl https://your-api.com/api/render?jobId=xxx \\
  -H "x-webhook-secret: your-secret"

# Response: {
#   "status": "done",
#   "progress": 1.0,
#   "outputUrl": "https://bucket.s3.amazonaws.com/..."
# }`,
            },
          ].map((item, i) => (
            <div key={i} style={styles.stepCard}>
              <div style={styles.stepNumber}>{item.step}</div>
              <h3 style={styles.stepTitle}>{item.title}</h3>
              <pre style={styles.codeBlock}>{item.code}</pre>
            </div>
          ))}
        </div>
      </section>

      {/* Architecture */}
      <section id="architecture" style={styles.section}>
        <h2 style={styles.sectionTitle}>Architecture</h2>
        <div style={styles.archContainer}>
          <pre style={styles.archDiagram}>{`
┌─────────────────────────────────────────────────────────┐
│                    INCOMING EVENTS                        │
│  ┌──────────┐  ┌──────────────┐  ┌──────────────────┐   │
│  │ Webhooks │  │ Stripe       │  │ Batch API        │   │
│  │ (custom) │  │ checkout     │  │ (up to 10K)      │   │
│  └────┬─────┘  └──────┬───────┘  └────────┬─────────┘   │
└───────┼───────────────┼───────────────────┼──────────────┘
        │               │                   │
        ▼               ▼                   ▼
┌───────────────────────────────────────────────────────────┐
│                    API LAYER (Next.js)                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│  │ Auth     │  │ Rate     │  │ SSRF     │  │ Security │  │
│  │ (timing- │  │ Limiter  │  │ Guard    │  │ Headers  │  │
│  │  safe)   │  │ (sliding)│  │          │  │          │  │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    A/B TEST ENGINE                         │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────┐   │
│  │ Variant      │  │ Analytics    │  │ Chi-Square    │   │
│  │ Assignment   │  │ Tracking     │  │ Significance  │   │
│  │ (50/50)      │  │ (events)     │  │ Test          │   │
│  └──────────────┘  └──────────────┘  └───────────────┘   │
└───────────────────────┬──────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    BULLMQ QUEUE                            │
│         ┌────────────────────────────┐                    │
│         │  Priority Queues          │                    │
│         │  high → normal → low      │                    │
│         └────────────┬──────────────┘                    │
└──────────────────────┼───────────────────────────────────┘
                        │
                        ▼
┌───────────────────────────────────────────────────────────┐
│                    LAMBDA RENDERERS                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐   │
│  │ Remotion     │  │ AWS Lambda   │  │ S3 Output    │   │
│  │ Compositions │  │ (parallel)   │  │ (public URL) │   │
│  └──────────────┘  └──────────────┘  └──────────────┘   │
└──────────────────────────────────────────────────────────┘
`}</pre>
        </div>
      </section>

      {/* Security Section */}
      <section style={styles.section}>
        <h2 style={styles.sectionTitle}>Security</h2>
        <div style={styles.securityGrid}>
          {[
            { icon: '🛡️', title: 'Timing-Safe Auth', desc: 'All secret comparisons use crypto.timingSafeEqual — no timing leaks.' },
            { icon: '🔗', title: 'Dual HMAC', desc: 'Stripe webhook signature + per-checkout HMAC prevents replay attacks.' },
            { icon: '🚫', title: 'SSRF Protection', desc: 'Callback URLs are validated against private IPs and blocked domains.' },
            { icon: '📊', title: 'Rate Limiting', desc: 'Sliding-window rate limiter per IP. Different limits per endpoint.' },
            { icon: '🔒', title: 'Security Headers', desc: 'CSP, HSTS, X-Frame-Options, X-Content-Type-Options on all responses.' },
            { icon: '👁️', title: 'PII Sanitization', desc: 'API responses mask emails, names, and amounts. Full props never exposed.' },
          ].map((item, i) => (
            <div key={i} style={styles.securityCard}>
              <span style={styles.securityIcon}>{item.icon}</span>
              <div>
                <h3 style={styles.securityTitle}>{item.title}</h3>
                <p style={styles.securityDesc}>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.footerContent}>
          <div style={styles.footerLeft}>
            <span style={styles.footerLogo}>▶ Remotion Video Pro</span>
            <p style={styles.footerTagline}>Video Personalization Engine</p>
          </div>
          <div style={styles.footerCenter}>
            <p style={styles.footerText}>
              Built with Next.js · Remotion · BullMQ · Stripe · AWS Lambda · Prisma
            </p>
          </div>
          <div style={styles.footerRight}>
            <span style={styles.footerAuthor}>by marktantongco</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  page: {
    backgroundColor: '#0a0a0b',
    color: '#e4e4e7',
    minHeight: '100vh',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    lineHeight: 1.6,
  },
  hero: {
    position: 'relative' as const,
    overflow: 'hidden' as const,
    padding: '0 2rem',
    paddingBottom: '4rem',
  },
  heroGlow: {
    position: 'absolute' as const,
    top: '-200px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '800px',
    height: '500px',
    background: 'radial-gradient(ellipse, rgba(255,0,85,0.12) 0%, rgba(139,92,246,0.08) 40%, transparent 70%)',
    pointerEvents: 'none' as const,
  },
  nav: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '1.5rem 0',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  logoIcon: {
    fontSize: '1.5rem',
    background: 'linear-gradient(135deg, #ff0055, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  logoText: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#fafafa',
    letterSpacing: '-0.02em',
  },
  navLinks: {
    display: 'flex',
    gap: '2rem',
  },
  navLink: {
    color: '#a1a1aa',
    textDecoration: 'none',
    fontSize: '0.9rem',
    fontWeight: 500,
    transition: 'color 0.2s',
  },
  heroContent: {
    maxWidth: '800px',
    margin: '4rem auto 0',
    textAlign: 'center' as const,
  },
  badgeRow: {
    display: 'flex',
    justifyContent: 'center',
    gap: '0.75rem',
    marginBottom: '1.5rem',
  },
  badge: {
    display: 'inline-block',
    padding: '0.25rem 0.75rem',
    borderRadius: '999px',
    fontSize: '0.75rem',
    fontWeight: 600,
    backgroundColor: 'rgba(139,92,246,0.15)',
    color: '#a78bfa',
    border: '1px solid rgba(139,92,246,0.25)',
  },
  badgeGreen: {
    backgroundColor: 'rgba(34,197,94,0.15)',
    color: '#4ade80',
    borderColor: 'rgba(34,197,94,0.25)',
  },
  heroTitle: {
    fontSize: 'clamp(2.5rem, 6vw, 4rem)',
    fontWeight: 800,
    color: '#fafafa',
    lineHeight: 1.1,
    letterSpacing: '-0.03em',
    marginBottom: '1.5rem',
  },
  gradientText: {
    background: 'linear-gradient(135deg, #ff0055, #ff6b35, #8b5cf6)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
  },
  heroSubtitle: {
    fontSize: '1.15rem',
    color: '#a1a1aa',
    maxWidth: '600px',
    margin: '0 auto 2rem',
    lineHeight: 1.7,
  },
  heroActions: {
    display: 'flex',
    justifyContent: 'center',
    gap: '1rem',
    marginBottom: '3rem',
    flexWrap: 'wrap' as const,
  },
  btnPrimary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.75rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #ff0055, #cc0044)',
    color: '#fff',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    transition: 'transform 0.2s, box-shadow 0.2s',
    boxShadow: '0 4px 15px rgba(255,0,85,0.3)',
  },
  btnSecondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.75rem 1.75rem',
    borderRadius: '8px',
    backgroundColor: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: '#e4e4e7',
    fontWeight: 600,
    fontSize: '0.95rem',
    textDecoration: 'none',
    transition: 'background-color 0.2s',
  },
  statsRow: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '2.5rem',
    padding: '1.5rem',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: '12px',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stat: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'center',
  },
  statValue: {
    fontSize: '1.75rem',
    fontWeight: 800,
    color: '#fafafa',
    letterSpacing: '-0.02em',
  },
  statLabel: {
    fontSize: '0.8rem',
    color: '#71717a',
    fontWeight: 500,
    marginTop: '0.25rem',
  },
  statDivider: {
    width: '1px',
    height: '40px',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  section: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: '5rem 2rem',
  },
  sectionTitle: {
    fontSize: '2rem',
    fontWeight: 700,
    color: '#fafafa',
    textAlign: 'center' as const,
    marginBottom: '0.75rem',
    letterSpacing: '-0.02em',
  },
  sectionSubtitle: {
    textAlign: 'center' as const,
    color: '#71717a',
    marginBottom: '2.5rem',
    fontSize: '1rem',
  },
  featuresGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  featureCard: {
    padding: '1.75rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
    transition: 'border-color 0.2s',
  },
  featureIcon: {
    fontSize: '2rem',
    display: 'block',
    marginBottom: '1rem',
  },
  featureTitle: {
    fontSize: '1.1rem',
    fontWeight: 600,
    color: '#fafafa',
    marginBottom: '0.5rem',
  },
  featureDesc: {
    fontSize: '0.9rem',
    color: '#a1a1aa',
    lineHeight: 1.6,
  },
  apiGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
    gap: '1rem',
  },
  apiCard: {
    padding: '1.25rem',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  apiCardHeader: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    marginBottom: '0.5rem',
  },
  methodBadge: {
    display: 'inline-block',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
    fontSize: '0.7rem',
    fontWeight: 700,
    fontFamily: 'monospace',
    letterSpacing: '0.05em',
  },
  apiPath: {
    fontSize: '0.85rem',
    color: '#e4e4e7',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    backgroundColor: 'rgba(255,255,255,0.05)',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
  },
  apiDesc: {
    fontSize: '0.85rem',
    color: '#a1a1aa',
    marginBottom: '0.75rem',
    lineHeight: 1.5,
  },
  apiMeta: {
    display: 'flex',
    gap: '0.75rem',
    flexWrap: 'wrap' as const,
  },
  metaTag: {
    fontSize: '0.75rem',
    color: '#71717a',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  stepsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1.5rem',
  },
  stepCard: {
    padding: '1.75rem',
    borderRadius: '12px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  stepNumber: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '2rem',
    height: '2rem',
    borderRadius: '8px',
    background: 'linear-gradient(135deg, #ff0055, #8b5cf6)',
    color: '#fff',
    fontWeight: 700,
    fontSize: '0.9rem',
    marginBottom: '1rem',
  },
  stepTitle: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: '#fafafa',
    marginBottom: '1rem',
  },
  codeBlock: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '8px',
    padding: '1rem',
    fontSize: '0.78rem',
    lineHeight: 1.6,
    color: '#a1a1aa',
    fontFamily: '"SF Mono", "Fira Code", monospace',
    overflowX: 'auto' as const,
    whiteSpace: 'pre-wrap' as const,
  },
  archContainer: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '12px',
    padding: '2rem',
    overflowX: 'auto' as const,
  },
  archDiagram: {
    fontFamily: '"SF Mono", "Fira Code", monospace',
    fontSize: '0.72rem',
    lineHeight: 1.5,
    color: '#a1a1aa',
    whiteSpace: 'pre' as const,
    overflow: 'auto',
  },
  securityGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '1rem',
  },
  securityCard: {
    display: 'flex',
    gap: '1rem',
    padding: '1.25rem',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.03)',
    border: '1px solid rgba(255,255,255,0.06)',
  },
  securityIcon: {
    fontSize: '1.5rem',
    flexShrink: 0,
  },
  securityTitle: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#fafafa',
    marginBottom: '0.25rem',
  },
  securityDesc: {
    fontSize: '0.85rem',
    color: '#a1a1aa',
    lineHeight: 1.5,
  },
  footer: {
    borderTop: '1px solid rgba(255,255,255,0.06)',
    padding: '2rem',
    marginTop: '2rem',
  },
  footerContent: {
    maxWidth: '1200px',
    margin: '0 auto',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
  },
  footerLeft: {
    display: 'flex',
    flexDirection: 'column' as const,
  },
  footerLogo: {
    fontWeight: 700,
    color: '#fafafa',
    fontSize: '1rem',
  },
  footerTagline: {
    fontSize: '0.8rem',
    color: '#71717a',
  },
  footerCenter: {},
  footerText: {
    fontSize: '0.8rem',
    color: '#52525b',
  },
  footerRight: {},
  footerAuthor: {
    fontSize: '0.8rem',
    color: '#52525b',
  },
};
