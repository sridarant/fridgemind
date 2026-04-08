// src/components/jiff/AuthGate.jsx
// Sign-in gate + premium upgrade gate modals

export default function AuthGate({
  showSignInGate, showGate,
  TRIAL_DAYS, emailInput, emailSent, supabaseEnabled,
  gateReason, gatePlan, gateLoading, plans, razorpayEnabled,
  setEmailInput, setGateDismissed, setGatePlan, setShowGate,
  signInWithGoogle, handleEmailSignIn, handleGateUpgrade, activateTestPremium,
  PAID_RECIPE_CAP, navigate, t,
}) {
  return (
    <>
      {/* ── Mandatory sign-in gate ── */}
      {showSignInGate && (
        <div className="auth-gate">
          <div className="auth-card" style={{ position: 'relative' }}>
            <button
              onClick={() => navigate('/')}
              style={{
                position: 'absolute', top: 16, right: 16,
                background: 'none', border: 'none',
                fontSize: 20, cursor: 'pointer',
                color: 'rgba(28,10,0,0.3)', lineHeight: 1, padding: 4,
              }}
            >
              {'✕'}
            </button>
            <div className="auth-icon">{'⚡'}</div>
            <div className="auth-title">{t('auth_title')}</div>
            <div className="auth-sub">
              {'Sign in to start your free '}{TRIAL_DAYS}{'-day trial. No credit card needed.'}
            </div>
            <div className="auth-perks">
              <div className="auth-perk">
                <div className="auth-perk-icon">{'🎁'}</div>
                {'Free '}{TRIAL_DAYS}{'-day trial — full access'}
              </div>
              <div className="auth-perk">
                <div className="auth-perk-icon">{'☁️'}</div>
                {t('auth_perk_favs')}
              </div>
              <div className="auth-perk">
                <div className="auth-perk-icon">{'👤'}</div>
                {t('auth_perk_taste')}
              </div>
              <div className="auth-perk">
                <div className="auth-perk-icon">{'🔒'}</div>
                {'No spam — ever'}
              </div>
            </div>
            {supabaseEnabled ? (
              <>
                <button className="auth-google-btn" onClick={signInWithGoogle}>
                  <span style={{ fontSize: 18 }}>{'G'}</span>
                  {' Continue with Google'}
                </button>
                {emailSent ? (
                  <div className="auth-magic">{'✓ Check your email for the magic link!'}</div>
                ) : (
                  <div className="auth-email-row">
                    <input
                      className="auth-email-input"
                      placeholder="Or enter your email"
                      value={emailInput}
                      onChange={e => setEmailInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleEmailSignIn()}
                    />
                    <button className="auth-email-go" onClick={handleEmailSignIn}>
                      {t('auth_send')}
                    </button>
                  </div>
                )}
              </>
            ) : (
              <button
                className="auth-google-btn"
                onClick={activateTestPremium}
                style={{ background: 'var(--ink)' }}
              >
                {'Continue as guest (dev mode)'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* ── Upgrade gate modal ── */}
      {showGate && (
        <div className="gate-overlay" onClick={() => setShowGate(false)}>
          <div className="gate-card" onClick={e => e.stopPropagation()}>
            <div className="gate-icon">
              {gateReason === 'trial_expired' ? '⏰' : '⚡'}
            </div>
            <div className="gate-title">
              {gateReason === 'trial_expired' ? 'Your free trial has ended' : 'Unlock full access'}
            </div>
            <div className="gate-sub">
              {gateReason === 'trial_expired'
                ? 'Your 7-day free trial is complete. Choose a plan to continue cooking with Jiff.'
                : `Get ${PAID_RECIPE_CAP} recipes per search, unlimited weekly plans, cloud sync, and more.`}
            </div>
            <div className="gate-plans">
              {Object.values(plans).map(plan => (
                <div
                  key={plan.id}
                  className={'gate-plan ' + (gatePlan === plan.id ? 'selected' : '')}
                  onClick={() => setGatePlan(plan.id)}
                >
                  <div className="gate-plan-price">{plan.price}</div>
                  <div className="gate-plan-label">{plan.label}<br />{plan.period}</div>
                  {plan.saving && <div className="gate-plan-saving">{plan.saving}</div>}
                </div>
              ))}
            </div>
            <button className="gate-cta" disabled={gateLoading} onClick={handleGateUpgrade}>
              {gateLoading ? '⏳ Processing…' : '⚡ Upgrade now'}
            </button>
            {gateReason === 'trial_expired' && (
              <button className="gate-skip" onClick={() => navigate('/')}>{'← Home'}</button>
            )}
            {!razorpayEnabled && (
              <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 8 }}>
                {'Test mode — click to activate free premium'}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
