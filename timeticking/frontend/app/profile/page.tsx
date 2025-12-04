'use client';

import { useTheme } from '@/components/ThemeProvider';
import { Bell, BellOff, ShieldCheck, Upload, Wand2 } from 'lucide-react';
import { ChangeEvent, useMemo, useState } from 'react';

type StatusState = 'online' | 'offline';

function buildGeneratedAvatar(seed = Date.now()) {
  const colors = [
    ['#FF8A00', '#FF3D54'],
    ['#5C7CFA', '#70E1F5'],
    ['#34D399', '#10B981'],
    ['#F59E0B', '#F97316'],
    ['#6366F1', '#A855F7'],
  ];
  const pair = colors[seed % colors.length];
  const noise = seed % 7;

  const svg = `
    <svg width="320" height="320" viewBox="0 0 320 320" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="grad" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${pair[0]}" />
          <stop offset="100%" stop-color="${pair[1]}" />
        </linearGradient>
      </defs>
      <rect width="320" height="320" rx="120" fill="url(#grad)" />
      <circle cx="160" cy="140" r="${70 + noise * 2}" fill="rgba(0,0,0,0.08)" />
      <circle cx="120" cy="130" r="20" fill="rgba(255,255,255,0.9)" />
      <circle cx="200" cy="130" r="20" fill="rgba(255,255,255,0.9)" />
      <circle cx="120" cy="130" r="8" fill="rgba(0,0,0,0.7)" />
      <circle cx="200" cy="130" r="8" fill="rgba(0,0,0,0.7)" />
      <path d="M110 200 Q160 ${220 + noise * 2} 210 200" stroke="rgba(0,0,0,0.7)" stroke-width="10" fill="none" stroke-linecap="round" />
      <path d="M60 140 Q160 ${120 - noise * 2} 260 140" stroke="rgba(255,255,255,0.35)" stroke-width="18" fill="none" stroke-linecap="round" />
    </svg>
  `;

  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
}

export default function ProfilePage() {
  const { theme } = useTheme();
  const [avatarSrc, setAvatarSrc] = useState<string>(() => buildGeneratedAvatar());
  const [avatarError, setAvatarError] = useState('');
  const [username, setUsername] = useState('Alex Timer');
  const [email, setEmail] = useState('alex@timeisticking.com');
  const [notificationsOn, setNotificationsOn] = useState(true);
  const [status, setStatus] = useState<StatusState>('online');
  const [passwordFields, setPasswordFields] = useState({ current: '', next: '', confirm: '' });
  const [passwordMessage, setPasswordMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [savingPassword, setSavingPassword] = useState(false);
  const [identityMessage, setIdentityMessage] = useState('');

  const baseText = theme === 'dark' ? 'text-beige' : 'text-navy';
  const mutedText = theme === 'dark' ? 'text-beige/70' : 'text-navy/70';
  const cardClasses =
    theme === 'dark'
      ? 'bg-[#1f2d3a]/80 border border-beige/20 shadow-[0_15px_45px_rgba(0,0,0,0.35)]'
      : 'bg-[#f2e9e2] border border-navy/10 shadow-[0_20px_40px_rgba(47,65,86,0.12)]';
  const inputClasses =
    theme === 'dark'
      ? 'bg-[#1f2d3a] border-beige/30 text-beige placeholder:text-beige/50'
      : 'bg-white border-navy/20 text-navy placeholder:text-navy/50';
  const pillActive = theme === 'dark' ? 'bg-beige text-navy' : 'bg-navy text-beige';
  const pillIdle = theme === 'dark' ? 'bg-beige/10 text-beige' : 'bg-navy/10 text-navy';

  const handleAvatarUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!['image/jpeg', 'image/png'].includes(file.type)) {
      setAvatarError('Please upload a JPG or PNG file.');
      return;
    }

    const url = URL.createObjectURL(file);
    setAvatarError('');
    setAvatarSrc(url);
  };

  const handleGenerateAvatar = () => {
    setAvatarError('');
    setAvatarSrc(buildGeneratedAvatar(Date.now()));
  };

  const validatePassword = (password: string) => {
    if (password.length < 8) return 'Password must be at least 8 characters.';
    if (!/[A-Z]/.test(password)) return 'Include at least one capital letter.';
    if (!/[!@#$&*]/.test(password)) return 'Include one special character (!@#$&*).';
    return '';
  };

  const handlePasswordSave = () => {
    setPasswordMessage('');
    setPasswordError('');
    const { current, next, confirm } = passwordFields;

    if (!current || !next || !confirm) {
      setPasswordError('Fill out old, new, and confirm password.');
      return;
    }
    if (next !== confirm) {
      setPasswordError('New passwords do not match.');
      return;
    }
    const policyError = validatePassword(next);
    if (policyError) {
      setPasswordError(policyError);
      return;
    }

    setSavingPassword(true);
    setTimeout(() => {
      setSavingPassword(false);
      setPasswordMessage('Password updated. You will need to log back in on other devices.');
      setPasswordFields({ current: '', next: '', confirm: '' });
    }, 900);
  };

  const handleForgotPassword = () => {
    setPasswordMessage(`Password reset email sent to ${email}.`);
    setPasswordError('');
  };

  const saveIdentity = () => {
    setIdentityMessage('Profile details saved locally.');
    setTimeout(() => setIdentityMessage(''), 1500);
  };

  const statusPill = (label: string, value: StatusState) => (
    <button
      type="button"
      onClick={() => setStatus(value)}
      className={`rounded-full px-4 py-2 text-sm transition ${
        status === value ? pillActive : pillIdle
      }`}
    >
      {label}
    </button>
  );

  const bellToggle = (
    <button
      type="button"
      onClick={() => setNotificationsOn((prev) => !prev)}
      className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${
        notificationsOn ? pillActive : pillIdle
      }`}
    >
      {notificationsOn ? <Bell size={16} /> : <BellOff size={16} />}
      {notificationsOn ? 'Bell ON' : 'Bell OFF'}
    </button>
  );

  const avatarBorder = useMemo(
    () => (theme === 'dark' ? 'ring-beige/40' : 'ring-navy/30'),
    [theme],
  );

  return (
    <section className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <p className={`text-sm tracking-wide ${mutedText}`}>Identity, security, and alerts</p>
          <h1 className="text-4xl font-semibold">Profile Control</h1>
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wide">
          <span className={`${mutedText} rounded-full border px-3 py-2`}>
            JPG/PNG uploads + generated avatars
          </span>
          <span className={`${mutedText} rounded-full border px-3 py-2`}>
            Password policy enforced
          </span>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <div className="space-y-6">
          <div className={`rounded-2xl p-6 ${cardClasses}`}>
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold">Profile Picture</h2>
                <p className={`text-sm ${mutedText}`}>Upload JPG/PNG or let Codex create one.</p>
              </div>
              <ShieldCheck className={`${mutedText}`} size={20} />
            </div>

            <div className="mt-6 flex flex-col items-center gap-4">
              <div className="relative">
                <div
                  className={`h-32 w-32 overflow-hidden rounded-3xl ring-4 ${avatarBorder}`}
                  style={{ backgroundImage: `url(${avatarSrc})`, backgroundSize: 'cover' }}
                  aria-label="Profile avatar preview"
                />
              </div>
              <div className="flex w-full flex-col gap-3 sm:flex-row">
                <label
                  className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl border px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-lg ${inputClasses}`}
                >
                  <Upload size={16} />
                  <span>Upload JPG/PNG</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </label>
                <button
                  type="button"
                  onClick={handleGenerateAvatar}
                  className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-rose-500 px-4 py-3 text-sm font-semibold text-navy shadow-lg transition hover:brightness-110"
                >
                  <Wand2 size={16} />
                  Generate Character
                </button>
              </div>
              {avatarError && <p className="text-sm text-rose-400">{avatarError}</p>}
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${cardClasses}`}>
            <h2 className="text-xl font-semibold">Status & Notifications</h2>
            <p className={`mt-1 text-sm ${mutedText}`}>Control bell icon alerts and presence.</p>
            <div className="mt-4 space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                {bellToggle}
                <span className={`text-xs ${mutedText}`}>
                  {notificationsOn ? 'Alerts enabled' : 'Alerts paused'}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                {statusPill('Online', 'online')}
                {statusPill('Offline', 'offline')}
              </div>
              <div className={`text-xs ${mutedText}`}>
                Status will display on Social and Planner views.
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-6 xl:col-span-2">
          <div className={`rounded-2xl p-6 ${cardClasses}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Identity</h2>
                <p className={`text-sm ${mutedText}`}>Update username and contact email.</p>
              </div>
              <div className="text-xs uppercase tracking-wide text-emerald-400">
                Live Profile
              </div>
            </div>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`text-sm ${mutedText}`} htmlFor="username">
                  Username
                </label>
                <input
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-amber-400 ${inputClasses}`}
                  placeholder="Enter username"
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm ${mutedText}`} htmlFor="email">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-amber-400 ${inputClasses}`}
                  placeholder="you@example.com"
                />
              </div>
            </div>
            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={saveIdentity}
                className="rounded-xl bg-navy px-4 py-3 text-sm font-semibold text-beige transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                Save Profile
              </button>
              <span className={`text-xs ${mutedText}`}>
                Email changes will require re-authentication.
              </span>
            </div>
            {identityMessage && <p className="mt-3 text-sm text-emerald-400">{identityMessage}</p>}
          </div>

          <div className={`rounded-2xl p-6 ${cardClasses}`}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Password & Recovery</h2>
                <p className={`text-sm ${mutedText}`}>
                  Old + new required. Enforces 8 chars, 1 capital, 1 special (!@#$&*).
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className={`text-sm ${mutedText}`} htmlFor="current-password">
                  Old Password
                </label>
                <input
                  id="current-password"
                  type="password"
                  value={passwordFields.current}
                  onChange={(e) =>
                    setPasswordFields((prev) => ({ ...prev, current: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-amber-400 ${inputClasses}`}
                  placeholder="Current password"
                />
              </div>
              <div className="space-y-2">
                <label className={`text-sm ${mutedText}`} htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={passwordFields.next}
                  onChange={(e) =>
                    setPasswordFields((prev) => ({ ...prev, next: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-amber-400 ${inputClasses}`}
                  placeholder="New password"
                />
              </div>
              <div className="space-y-2 md:col-span-2">
                <label className={`text-sm ${mutedText}`} htmlFor="confirm-password">
                  Confirm New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={passwordFields.confirm}
                  onChange={(e) =>
                    setPasswordFields((prev) => ({ ...prev, confirm: e.target.value }))
                  }
                  className={`w-full rounded-xl border px-4 py-3 text-base outline-none transition focus:ring-2 focus:ring-amber-400 ${inputClasses}`}
                  placeholder="Repeat new password"
                />
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handlePasswordSave}
                className="flex items-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-navy transition hover:-translate-y-0.5 hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingPassword}
              >
                {savingPassword ? (
                  <>
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-navy/50 border-t-navy" />
                    Saving...
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    Save Password
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleForgotPassword}
                className={`rounded-xl border px-4 py-3 text-sm transition hover:-translate-y-0.5 hover:shadow-lg ${inputClasses}`}
              >
                Forgot password? Send email
              </button>
            </div>
            {passwordError && <p className="mt-3 text-sm text-rose-400">{passwordError}</p>}
            {passwordMessage && <p className="mt-3 text-sm text-emerald-400">{passwordMessage}</p>}
          </div>
        </div>
      </div>
    </section>
  );
}
