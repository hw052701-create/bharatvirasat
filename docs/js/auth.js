// ── auth.js — Login, Register, Session Management ───────────────────────────
const Auth = {
  currentUser: null,

  // ─── Initialize ───────────────────────────────────────────────────────────
  async init() {
    const token = localStorage.getItem('bv_token');
    if (token) {
      try {
        const res = await API.getMe();
        Auth.currentUser = res.user;
        return true;
      } catch {
        localStorage.removeItem('bv_token');
        localStorage.removeItem('bv_user');
        return false;
      }
    }
    return false;
  },

  // ─── Login ────────────────────────────────────────────────────────────────
  async login() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    const btn = document.getElementById('login-btn');

    if (!email || !password) {
      Auth.showError('Please enter email and password');
      return;
    }

    btn.innerHTML = '<span>Signing in...</span><div class="typing-dot"></div>';
    btn.disabled = true;

    try {
      const res = await API.login({ email, password });
      localStorage.setItem('bv_token', res.token);
      localStorage.setItem('bv_user', JSON.stringify(res.user));
      Auth.currentUser = res.user;
      App.start();
    } catch (err) {
      Auth.showError(err.message || 'Login failed. Please try again.');
    } finally {
      btn.innerHTML = '<span>Sign In</span><i class="fas fa-arrow-right"></i>';
      btn.disabled = false;
    }
  },

  // ─── Register ─────────────────────────────────────────────────────────────
  async register() {
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    const state = document.getElementById('reg-state').value;
    const btn = document.getElementById('register-btn');

    if (!name || !email || !password) {
      Auth.showError('Please fill all required fields');
      return;
    }
    if (password.length < 6) {
      Auth.showError('Password must be at least 6 characters');
      return;
    }

    btn.innerHTML = '<span>Creating account...</span>';
    btn.disabled = true;

    try {
      const res = await API.register({ name, email, password, state });
      localStorage.setItem('bv_token', res.token);
      localStorage.setItem('bv_user', JSON.stringify(res.user));
      Auth.currentUser = res.user;

      // Auto-seed heritage data for new user (one-time)
      try { await API.seedHeritage(); } catch {}

      App.start();
    } catch (err) {
      Auth.showError(err.message || 'Registration failed. Please try again.');
    } finally {
      btn.innerHTML = '<span>Create Account</span><i class="fas fa-arrow-right"></i>';
      btn.disabled = false;
    }
  },

  // ─── Logout ───────────────────────────────────────────────────────────────
  logout() {
    localStorage.removeItem('bv_token');
    localStorage.removeItem('bv_user');
    Auth.currentUser = null;
    document.getElementById('main-app').classList.add('hidden');
    document.getElementById('auth-screen').classList.remove('hidden');
    Auth.showLogin();
    App.showToast('Logged out successfully', 'info');
  },

  // ─── UI Helpers ───────────────────────────────────────────────────────────
  showLogin() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
    document.getElementById('auth-error').classList.add('hidden');
  },

  showRegister() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
    document.getElementById('auth-error').classList.add('hidden');
  },

  showError(msg) {
    const el = document.getElementById('auth-error');
    el.textContent = msg;
    el.classList.remove('hidden');
  },

  getInitials(name) {
    return name ? name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?';
  }
};
