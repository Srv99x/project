import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff } from 'lucide-react';
import './AuthPage.css';

type AuthTab = 'signin' | 'signup';

/* ── Password strength helper ── */
const getPasswordStrength = (pw: string): number => {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;             // 0-4
};

/* ── Inline SVG icons for social buttons ── */
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" fill="none">
    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
  </svg>
);

const GitHubIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor">
    <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
  </svg>
);

export const AuthPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState<AuthTab>('signin');
  const [showSuccess, setShowSuccess] = useState(false);

  /* ── Sign In state ── */
  const [siEmail, setSiEmail] = useState('');
  const [siPassword, setSiPassword] = useState('');
  const [siShowPw, setSiShowPw] = useState(false);
  const [siErrors, setSiErrors] = useState<Record<string,string>>({});

  /* ── Sign Up state ── */
  const [suName, setSuName] = useState('');
  const [suEmail, setSuEmail] = useState('');
  const [suPassword, setSuPassword] = useState('');
  const [suConfirm, setSuConfirm] = useState('');
  const [suShowPw, setSuShowPw] = useState(false);
  const [suShowConfirm, setSuShowConfirm] = useState(false);
  const [suErrors, setSuErrors] = useState<Record<string,string>>({});

  const passwordStrength = useMemo(() => getPasswordStrength(suPassword), [suPassword]);

  /* ── Validation ── */
  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSignIn = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string,string> = {};
    if (!validateEmail(siEmail)) errors.email = 'Valid email address required';
    if (siPassword.length < 8) errors.password = 'Minimum 8 characters required';
    setSiErrors(errors);
    if (Object.keys(errors).length > 0) return;

    console.log('Sign In:', { email: siEmail, password: siPassword });
    localStorage.setItem('eduq_user', JSON.stringify({ email: siEmail, name: siEmail.split('@')[0] }));
    setShowSuccess(true);
    setTimeout(() => window.location.reload(), 600);
  };

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string,string> = {};
    if (!suName.trim()) errors.name = 'Operative name required';
    if (!validateEmail(suEmail)) errors.email = 'Valid email address required';
    if (suPassword.length < 8) errors.password = 'Minimum 8 characters required';
    if (suPassword !== suConfirm) errors.confirm = 'Passwords do not match';
    setSuErrors(errors);
    if (Object.keys(errors).length > 0) return;

    console.log('Sign Up:', { name: suName, email: suEmail, password: suPassword });
    localStorage.setItem('eduq_user', JSON.stringify({ name: suName, email: suEmail }));
    setShowSuccess(true);
    setTimeout(() => window.location.reload(), 600);
  };

  /* ── Slide animation direction ── */
  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };
  const direction = tab === 'signup' ? 1 : -1;

  /* ── Shared input renderer ── */
  const renderField = (
    label: string,
    value: string,
    onChange: (v: string) => void,
    error?: string,
    opts?: { type?: string; placeholder?: string; showPw?: boolean; togglePw?: () => void },
  ) => (
    <div className="auth-field">
      <label className="auth-label">{label}</label>
      <div className="auth-input-wrapper">
        <input
          className={`auth-input${error ? ' auth-input--error' : ''}`}
          type={opts?.showPw === false ? 'password' : opts?.type || 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={opts?.placeholder || ''}
          autoComplete="off"
        />
        {opts?.togglePw && (
          <button type="button" className="auth-eye-toggle" onClick={opts.togglePw}>
            {opts.showPw ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        )}
      </div>
      <AnimatePresence>
        {error && (
          <motion.p
            className="auth-error-msg"
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="auth-page">
      {/* ───────── LEFT PANEL ───────── */}
      <div className="auth-left">
        <div>
          <div className="auth-left__brand">
            <img src="/logo.png" alt="EduQ" className="auth-left__logo" />
            <span className="auth-left__name">EduQ</span>
          </div>
          <p className="auth-left__tagline">Operative Authentication Required</p>
        </div>

        <img
          src="/dashboard-character.png"
          alt=""
          aria-hidden="true"
          className="auth-left__character"
        />

        <div className="auth-left__stats">
          <span className="auth-stat-pill">12,000+ Operatives</span>
          <span className="auth-stat-pill">500+ Missions</span>
          <span className="auth-stat-pill">Season 1 Live</span>
        </div>
      </div>

      {/* ───────── RIGHT PANEL ───────── */}
      <div className="auth-right">
        <motion.div
          className="auth-card"
          style={{ overflowY: 'auto', maxHeight: '90vh' }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
          {/* Tabs */}
          <div className="auth-tabs">
            {(['signin', 'signup'] as AuthTab[]).map((t) => (
              <button
                key={t}
                className={`auth-tab${tab === t ? ' auth-tab--active' : ''}`}
                onClick={() => { setTab(t); setSiErrors({}); setSuErrors({}); }}
              >
                {t === 'signin' ? 'SIGN IN' : 'SIGN UP'}
                {tab === t && (
                  <motion.div className="auth-tab__indicator" layoutId="tab-indicator" />
                )}
              </button>
            ))}
          </div>

          {/* Form area */}
          <AnimatePresence mode="wait" initial={false} custom={direction}>
            {tab === 'signin' ? (
              <motion.form
                key="signin"
                className="auth-form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.1 }}
                onSubmit={handleSignIn}
              >
                {renderField('Email Address', siEmail, (v) => { setSiEmail(v); if (siErrors.email) setSiErrors(p => ({ ...p, email: '' })); }, siErrors.email, {
                  type: 'email',
                  placeholder: 'operative@eduq.net',
                })}
                {renderField('Password', siPassword, (v) => { setSiPassword(v); if (siErrors.password) setSiErrors(p => ({ ...p, password: '' })); }, siErrors.password, {
                  type: siShowPw ? 'text' : 'password',
                  placeholder: '••••••••',
                  showPw: siShowPw,
                  togglePw: () => setSiShowPw(!siShowPw),
                })}

                <div className="auth-forgot">
                  <a href="#" onClick={(e) => e.preventDefault()}>
                    Forgot Credentials?
                  </a>
                </div>

                <motion.button
                  type="submit"
                  className={`auth-submit${showSuccess ? ' auth-submit--success' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  AUTHENTICATE
                </motion.button>
              </motion.form>
            ) : (
              <motion.form
                key="signup"
                className="auth-form"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.1 }}
                onSubmit={handleSignUp}
              >
                {renderField('Operative Name', suName, (v) => { setSuName(v); if (suErrors.name) setSuErrors(p => ({ ...p, name: '' })); }, suErrors.name, {
                  placeholder: 'ShadowByte_42',
                })}
                {renderField('Email Address', suEmail, (v) => { setSuEmail(v); if (suErrors.email) setSuErrors(p => ({ ...p, email: '' })); }, suErrors.email, {
                  type: 'email',
                  placeholder: 'operative@eduq.net',
                })}
                {renderField('Password', suPassword, (v) => { setSuPassword(v); if (suErrors.password) setSuErrors(p => ({ ...p, password: '' })); }, suErrors.password, {
                  type: suShowPw ? 'text' : 'password',
                  placeholder: '••••••••',
                  showPw: suShowPw,
                  togglePw: () => setSuShowPw(!suShowPw),
                })}

                {/* Password strength bar */}
                <div className="auth-strength">
                  {[1, 2, 3, 4].map((seg) => (
                    <div
                      key={seg}
                      className={`auth-strength__seg${passwordStrength >= seg ? ` auth-strength__seg--${seg}` : ''}`}
                    />
                  ))}
                </div>

                {renderField('Confirm Password', suConfirm, (v) => { setSuConfirm(v); if (suErrors.confirm) setSuErrors(p => ({ ...p, confirm: '' })); }, suErrors.confirm, {
                  type: suShowConfirm ? 'text' : 'password',
                  placeholder: '••••••••',
                  showPw: suShowConfirm,
                  togglePw: () => setSuShowConfirm(!suShowConfirm),
                })}

                <motion.button
                  type="submit"
                  className={`auth-submit${showSuccess ? ' auth-submit--success' : ''}`}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ duration: 0.15, ease: 'easeOut' }}
                >
                  DEPLOY OPERATIVE
                </motion.button>
              </motion.form>
            )}
          </AnimatePresence>

          {/* Divider */}
          <div className="auth-divider">
            <div className="auth-divider__line" />
            <span className="auth-divider__text">OR CONTINUE WITH</span>
            <div className="auth-divider__line" />
          </div>

          {/* Social buttons */}
          <div className="auth-socials">
            <button type="button" className="auth-social-btn" onClick={() => {}}>
              <GoogleIcon />
              Google
            </button>
            <button type="button" className="auth-social-btn" onClick={() => {}}>
              <GitHubIcon />
              GitHub
            </button>
          </div>

          {/* Footer toggle */}
          <div className="auth-footer">
            {tab === 'signin' ? (
              <>
                NEW OPERATIVE?
                <button onClick={() => { setTab('signup'); setSiErrors({}); }}>ENLIST NOW →</button>
              </>
            ) : (
              <>
                ALREADY ACTIVE?
                <button onClick={() => { setTab('signin'); setSuErrors({}); }}>SIGN IN →</button>
              </>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};
