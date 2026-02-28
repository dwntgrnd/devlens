export default function Home() {
  return (
    <main
      style={{
        maxWidth: '48rem',
        margin: '0 auto',
        padding: 'var(--spacing-xl)',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 'var(--font-size-4xl)',
          fontWeight: 700,
          color: 'var(--color-foreground)',
          marginBottom: 'var(--spacing-md)',
        }}
      >
        DevLens Example
      </h1>
      <p
        style={{
          fontSize: 'var(--font-size-lg)',
          color: 'var(--color-muted-foreground)',
          marginBottom: 'var(--spacing-xl)',
        }}
      >
        This page uses CSS custom properties that DevLens auto-detects. Click the
        floating button in the bottom-right corner to open the panel.
      </p>

      {/* Sample cards using token-driven styles */}
      <div style={{ display: 'grid', gap: 'var(--spacing-lg)' }}>
        <div
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600,
              color: 'var(--color-foreground)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Token Editing
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-muted-foreground)' }}>
            Adjust colors, font sizes, spacing, and shadows in real time. Changes
            are reflected immediately and can be exported as CSS.
          </p>
        </div>

        <div
          style={{
            padding: 'var(--spacing-lg)',
            background: 'var(--color-secondary)',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--color-border)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <h2
            style={{
              fontSize: 'var(--font-size-xl)',
              fontWeight: 600,
              color: 'var(--color-foreground)',
              marginBottom: 'var(--spacing-sm)',
            }}
          >
            Element Inspector
          </h2>
          <p style={{ fontSize: 'var(--font-size-base)', color: 'var(--color-muted-foreground)' }}>
            Select any element to view and edit its CSS classes, add custom styles,
            and see migration suggestions for hardcoded values.
          </p>
        </div>

        <button
          style={{
            padding: 'var(--spacing-sm) var(--spacing-lg)',
            background: 'var(--color-primary)',
            color: 'var(--color-primary-foreground)',
            border: 'none',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--font-size-base)',
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: 'var(--shadow-md)',
          }}
        >
          Sample Button
        </button>
      </div>
    </main>
  );
}
