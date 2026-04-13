// ── Auth Module ─────────────────────────────────
const Auth = {
  currentUser: null,

  init() {
    auth.onAuthStateChanged(user => {
      this.currentUser = user;
      if (user) {
        App.onLogin(user);
      } else {
        App.onLogout();
      }
    });
  },

  async signUp(email, password, displayName) {
    const cred = await auth.createUserWithEmailAndPassword(email, password);
    await cred.user.updateProfile({ displayName });
    return cred.user;
  },

  async signIn(email, password) {
    const cred = await auth.signInWithEmailAndPassword(email, password);
    return cred.user;
  },

  async signInWithGoogle() {
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await auth.signInWithPopup(provider);
    return result.user;
  },

  async signOut() {
    await auth.signOut();
  },

  getUid() {
    return this.currentUser?.uid || null;
  },

  isLoggedIn() {
    return !!this.currentUser;
  }
};
