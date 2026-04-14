// ── App Controller ──────────────────────────────
const App = {
  currentPage: 'home',
  userProfile: null,
  persons: [],

  async init() {
    // 스플래시 → 앱 전환
    setTimeout(() => {
      document.getElementById('splash-screen').classList.add('fade-out');
      setTimeout(() => {
        document.getElementById('splash-screen').style.display = 'none';
        document.getElementById('main-app').classList.remove('hidden');
      }, 600);
    }, 1800);

    // 초대 링크 파라미터 확인
    this.checkInviteParam();
    Auth.init();
    this.bindNav();
  },

  bindNav() {
    document.querySelectorAll('.nav-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const page = btn.dataset.page;
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        this.navigate(page);
      });
    });
  },

  navigate(page) {
    this.currentPage = page;
    if (!Auth.isLoggedIn()) {
      this.renderAuth();
      return;
    }
    switch (page) {
      case 'memorial': this.renderMemorial(); break;
      case 'home':     this.renderHome(); break;
      case 'profile':  this.renderProfile(); break;
    }
  },

  onLogin(user) {
    this.loadUserData(user.uid).then(() => {
      // personId가 없으면 가계도 연결 화면으로
      if (!this.userProfile?.personId) {
        this.renderLinkToTree();
      } else {
        this.navigate('memorial');
      }
    });
  },

  onLogout() {
    this.userProfile = null;
    this.renderAuth();
  },

  async loadUserData(uid) {
    this.userProfile = await DB.getUserProfile(uid);
  },

  // ── Auth Page ──────────────────────────────────
  renderAuth() {
    const el = document.getElementById('page-container');
    el.innerHTML = `
      <div class="auth-page">
        <div class="auth-header">
          <div class="auth-emblem">秋</div>
          <div class="auth-title">추담공원</div>
          <div class="auth-subtitle">우리 가문의 뿌리를 잇다</div>
        </div>
        <div class="auth-body">
          <div class="tabs">
            <button class="tab-btn active" id="tab-login">로그인</button>
            <button class="tab-btn" id="tab-signup">회원가입</button>
          </div>
          <div id="auth-form-area"></div>
        </div>
      </div>
    `;
    this.renderLoginForm();
    // 초대 링크로 접속 시 회원가입 탭 자동 선택 + 배너 표시
    const invite = this.getInviteInfo();
    if (invite) {
      document.getElementById('tab-signup').classList.add('active');
      document.getElementById('tab-login').classList.remove('active');
      this.renderSignupForm();
      // 배너 삽입
      const formArea = document.getElementById('auth-form-area');
      if (formArea) {
        const banner = document.createElement('div');
        banner.style.cssText = 'background:var(--moss);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:20px;display:flex;gap:12px;align-items:center';
        banner.innerHTML = '<div style="font-size:20px">👨‍👩‍👧‍👦</div>'
          + '<div><div style="font-family:var(--font-serif);font-size:14px;color:var(--paper);font-weight:500">' + invite.fromName + '님의 초대</div>'
          + '<div style="font-size:11px;color:rgba(248,245,239,0.65);margin-top:2px">가입 후 가계도에 자동 연결됩니다</div></div>';
        formArea.insertBefore(banner, formArea.firstChild);
      }
    }
    document.getElementById('tab-login').addEventListener('click', () => {
      document.getElementById('tab-login').classList.add('active');
      document.getElementById('tab-signup').classList.remove('active');
      this.renderLoginForm();
    });
    document.getElementById('tab-signup').addEventListener('click', () => {
      document.getElementById('tab-signup').classList.add('active');
      document.getElementById('tab-login').classList.remove('active');
      this.renderSignupForm();
    });
  },

  renderLoginForm() {
    document.getElementById('auth-form-area').innerHTML = `
      <div class="form-group">
        <label class="form-label">이메일</label>
        <input type="email" id="login-email" class="form-input" placeholder="email@example.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <div style="position:relative">
          <input type="password" id="login-pw" class="form-input" placeholder="비밀번호 입력" autocomplete="current-password" style="padding-right:44px" />
          <button type="button" id="toggle-login-pw" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-4);padding:4px">
            <svg id="eye-login" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <button class="btn btn-primary mt-16" id="btn-login">로그인</button>
      <div class="auth-divider mt-16">또는</div>
      <button class="btn btn-secondary w-full" id="btn-google">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        Google로 로그인
      </button>
      <div id="auth-error" class="text-center mt-12" style="color:var(--rust);font-size:13px;display:none"></div>
    `;
    // 비밀번호 마스킹 토글
    document.getElementById('toggle-login-pw').addEventListener('click', () => {
      const pw = document.getElementById('login-pw');
      const isText = pw.type === 'text';
      pw.type = isText ? 'password' : 'text';
      document.getElementById('eye-login').style.opacity = isText ? '1' : '0.4';
    });
    document.getElementById('btn-login').addEventListener('click', async () => {
      const email = document.getElementById('login-email').value.trim();
      const pw = document.getElementById('login-pw').value;
      if (!email || !pw) { this.showAuthError('이메일과 비밀번호를 입력해 주세요.'); return; }
      try {
        document.getElementById('btn-login').textContent = '로그인 중...';
        await Auth.signIn(email, pw);
      } catch (e) {
        this.showAuthError('이메일 또는 비밀번호가 올바르지 않습니다.');
        document.getElementById('btn-login').textContent = '로그인';
      }
    });
    document.getElementById('btn-google').addEventListener('click', async () => {
      try { await Auth.signInWithGoogle(); } catch (e) { this.showAuthError('Google 로그인 실패'); }
    });
  },

  renderSignupForm() {
    document.getElementById('auth-form-area').innerHTML = `
      <div style="background:var(--moss-pale);border-radius:var(--radius-lg);padding:12px 14px;margin-bottom:16px;font-size:12px;color:var(--moss);line-height:1.6">
        추담 남석하 할아버지의 후손이시면 가입해 주세요.<br/>
        <span style="color:var(--ink-3)">본관·파는 가입 후 관리자가 연결해 드립니다.</span>
      </div>
      <div class="form-group">
        <label class="form-label">성명 <span class="required">*</span></label>
        <input type="text" id="su-name" class="form-input" placeholder="예) 남○○" autocomplete="name" />
      </div>
      <div class="form-group">
          <label class="form-label">출생연도 <span class="required">*</span></label>
          <input type="number" id="su-birthyear" class="form-input" placeholder="예) 1975" min="1900" max="2025" />
      </div>
      <div class="form-group">
        <label class="form-label">이메일 <span class="required">*</span></label>
        <input type="email" id="su-email" class="form-input" placeholder="email@example.com" autocomplete="email" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호 <span class="required">*</span></label>
        <div style="position:relative">
          <input type="password" id="su-pw" class="form-input" placeholder="6자 이상" style="padding-right:44px" />
          <button type="button" id="toggle-su-pw" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-4);padding:4px">
            <svg id="eye-su" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호 확인 <span class="required">*</span></label>
        <div style="position:relative">
          <input type="password" id="su-pw2" class="form-input" placeholder="비밀번호 재입력" style="padding-right:44px" />
          <button type="button" id="toggle-su-pw2" style="position:absolute;right:12px;top:50%;transform:translateY(-50%);background:none;border:none;cursor:pointer;color:var(--ink-4);padding:4px">
            <svg id="eye-su2" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
          </button>
        </div>
        <div id="pw-match-hint" class="form-hint" style="display:none"></div>
      </div>
      <button class="btn btn-primary mt-16" id="btn-signup">가입하기</button>
      <div id="auth-error" class="text-center mt-12" style="color:var(--rust);font-size:13px;display:none"></div>
    `;
    // 비밀번호 마스킹 토글
    const togglePw = (inputId, eyeId) => {
      const el = document.getElementById(inputId);
      const eye = document.getElementById(eyeId);
      const isText = el.type === 'text';
      el.type = isText ? 'password' : 'text';
      eye.style.opacity = isText ? '1' : '0.4';
    };
    document.getElementById('toggle-su-pw').addEventListener('click', () => togglePw('su-pw', 'eye-su'));
    document.getElementById('toggle-su-pw2').addEventListener('click', () => togglePw('su-pw2', 'eye-su2'));

    // 비밀번호 일치 실시간 확인
    const checkMatch = () => {
      const pw = document.getElementById('su-pw').value;
      const pw2 = document.getElementById('su-pw2').value;
      const hint = document.getElementById('pw-match-hint');
      if (!pw2) { hint.style.display = 'none'; return; }
      hint.style.display = 'block';
      if (pw === pw2) {
        hint.style.color = 'var(--moss)';
        hint.textContent = '✓ 비밀번호가 일치합니다';
      } else {
        hint.style.color = 'var(--rust)';
        hint.textContent = '비밀번호가 일치하지 않습니다';
      }
    };
    document.getElementById('su-pw').addEventListener('input', checkMatch);
    document.getElementById('su-pw2').addEventListener('input', checkMatch);

    document.getElementById('btn-signup').addEventListener('click', async () => {
      const name    = document.getElementById('su-name').value.trim();
      const birthYear = parseInt(document.getElementById('su-birthyear').value) || 0;
      const email   = document.getElementById('su-email').value.trim();
      const pw      = document.getElementById('su-pw').value;
      const pw2     = document.getElementById('su-pw2').value;
      if (!name || !birthYear || !email || !pw) {
        this.showAuthError('모든 항목을 입력해 주세요.'); return;
      }
      if (pw !== pw2) {
        this.showAuthError('비밀번호가 일치하지 않습니다.'); return;
      }
      if (pw.length < 6) {
        this.showAuthError('비밀번호는 6자 이상이어야 합니다.'); return;
      }
      try {
        document.getElementById('btn-signup').textContent = '처리 중...';
        const user = await Auth.signUp(email, pw, name);
        await DB.saveUserProfile(user.uid, {
          name, birthYear,
          bongwan: '의령', pa: '사천백파', email,
          role: 'member', createdAt: new Date().toISOString()
        });
      } catch (e) {
        this.showAuthError(e.message || '회원가입에 실패했습니다.');
        document.getElementById('btn-signup').textContent = '가입하기';
      }
    });
  },

    showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
  },

  // ── 가계도 연결 화면 ──────────────────────────
  // 전략: 관리자가 등록한 persons에서 "나를 찾아 선택" → personId 연결
  // 없으면 아버지 선택 → 새 person 생성
  async renderLinkToTree() {
    const el = document.getElementById('page-container');
    const myName = this.userProfile?.name || '';
    el.innerHTML = `
      <div style="min-height:100dvh;background:var(--paper);display:flex;flex-direction:column">
        <div style="background:var(--moss);padding:36px 24px 28px;text-align:center">
          <div style="font-family:var(--font-serif);font-size:13px;color:rgba(248,245,239,0.55);letter-spacing:0.06em;margin-bottom:8px">추담공원</div>
          <div style="font-family:var(--font-serif);font-size:22px;color:var(--gold-light)">${myName}님, 환영합니다</div>
          <div style="font-size:13px;color:rgba(248,245,239,0.6);margin-top:8px;line-height:1.6">가계도에서 본인을 찾아 연결해 주세요</div>
        </div>
        <div style="padding:20px;flex:1">
          <div style="background:var(--moss-pale);border-radius:var(--radius-lg);padding:14px;margin-bottom:20px;font-size:12px;color:var(--moss);line-height:1.65">
            관리자가 등록한 인물 목록에서 <strong>본인</strong>을 선택하거나,<br/>
            없으면 <strong>아버지 이름</strong>으로 검색해 연결하세요.
          </div>

          <div class="tabs" style="margin-bottom:16px">
            <button class="tab-btn active" id="tab-find-me">내 이름 찾기</button>
            <button class="tab-btn" id="tab-find-dad">아버지로 찾기</button>
          </div>

          <div id="tab-content-me">
            <div class="form-group">
              <input type="text" id="me-search" class="form-input" placeholder="내 이름 검색..." />
            </div>
            <div id="me-list" style="max-height:45dvh;overflow-y:auto"></div>
          </div>

          <div id="tab-content-dad" style="display:none">
            <div class="form-group">
              <div style="display:flex;gap:8px">
                <input type="text" id="dad-search-input" class="form-input" placeholder="아버지 성함 입력..." style="flex:1"/>
                <button id="btn-search-dad" class="btn btn-primary" style="width:72px;border-radius:var(--radius-lg);flex-shrink:0">찾기</button>
              </div>
              <div class="form-hint">아버지 성함으로 검색 후 선택하세요</div>
            </div>
            <div id="dad-search-result"></div>
          </div>

          <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:0.5px solid var(--border)">
            <button onclick="App.skipLinkToTree()" style="background:none;border:none;color:var(--ink-4);font-size:13px;cursor:pointer;text-decoration:underline">나중에 연결하기</button>
          </div>
        </div>
      </div>
    `;

    const allPersons = await DB.getAllPersons(200);
    this._linkPersons = allPersons;

    // 내 이름 탭 렌더
    const renderMeList = (query) => {
      const el = document.getElementById('me-list');
      if (!el) return;
      const filtered = query
        ? allPersons.filter(p => (p.name||'').includes(query))
        : allPersons;
      if (!filtered.length) {
        el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">검색 결과 없음</div>';
        return;
      }
      el.innerHTML = '';
      // 세대별 그룹
      const byGen = {};
      filtered.forEach(p => { const g=p.generation||0; if(!byGen[g])byGen[g]=[]; byGen[g].push(p); });
      Object.keys(byGen).sort((a,b)=>a-b).forEach(g => {
        const header = document.createElement('div');
        header.style.cssText = 'font-size:11px;color:var(--ink-4);padding:8px 2px 4px';
        header.textContent = g+'세'+(g==1?' (7대조)':g==2?' (6대조)':'');
        el.appendChild(header);
        byGen[g].forEach(p => {
          const div = document.createElement('div');
          div.style.cssText = 'display:flex;align-items:center;gap:14px;padding:12px 14px;border:0.5px solid var(--border);border-radius:var(--radius-lg);margin-bottom:8px;cursor:pointer;background:var(--paper)';
          div.innerHTML = '<div class="person-avatar" style="width:40px;height:40px;font-size:16px;'+(p.deathYear?'background:var(--paper-3);color:var(--ink-3)':'background:var(--moss-pale);color:var(--moss)')+'">'
            +((p.name||'?')[0])+'</div>'
            +'<div style="flex:1"><div style="font-family:var(--font-serif);font-size:15px;font-weight:500">'+(p.name||'미상')+'</div>'
            +'<div style="font-size:12px;color:var(--ink-3);margin-top:2px">'+g+'세'+(p.birthYear?' · '+p.birthYear+'년':'')+(p.deathYear?' · 작고':'')+'</div></div>'
            +'<div style="color:var(--moss);font-size:18px">›</div>';
          div.addEventListener('mouseover', () => div.style.background='var(--paper-2)');
          div.addEventListener('mouseout', () => div.style.background='var(--paper)');
          div.addEventListener('click', () => App.confirmSelfLink(p.id, p.name, p.generation));
          el.appendChild(div);
        });
      });
    };
    renderMeList('');
    document.getElementById('me-search').addEventListener('input', e => renderMeList(e.target.value.trim()));

    // 탭 전환
    document.getElementById('tab-find-me').addEventListener('click', () => {
      document.getElementById('tab-find-me').classList.add('active');
      document.getElementById('tab-find-dad').classList.remove('active');
      document.getElementById('tab-content-me').style.display = '';
      document.getElementById('tab-content-dad').style.display = 'none';
    });
    document.getElementById('tab-find-dad').addEventListener('click', () => {
      document.getElementById('tab-find-dad').classList.add('active');
      document.getElementById('tab-find-me').classList.remove('active');
      document.getElementById('tab-content-me').style.display = 'none';
      document.getElementById('tab-content-dad').style.display = '';
    });

    // 아버지 검색
    const doSearch = async () => {
      const q = document.getElementById('dad-search-input').value.trim();
      if (!q) { App.showToast('아버지 성함을 입력해 주세요'); return; }
      await App.searchParentByName(q);
    };
    document.getElementById('btn-search-dad').addEventListener('click', doSearch);
    document.getElementById('dad-search-input').addEventListener('keydown', e => { if(e.key==='Enter') doSearch(); });
  },

  // 본인 노드 직접 선택 → personId 연결
  async confirmSelfLink(personId, personName, personGen) {
    const myName = this.userProfile?.name || '나';
    const nameMatch = (personName||'').includes(myName) || (myName||'').includes(personName||'');

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet';
    modal.innerHTML = '<div class="bottom-sheet-handle"></div>'
      + '<div style="text-align:center;padding:8px 0 20px">'
      + '<div style="font-size:13px;color:var(--ink-3);margin-bottom:16px">이 분이 본인이신가요?</div>'
      + '<div class="person-avatar" style="width:64px;height:64px;font-size:26px;background:var(--moss);color:var(--paper);margin:0 auto 12px">'+(personName||'?')[0]+'</div>'
      + '<div style="font-family:var(--font-serif);font-size:18px;font-weight:500">'+personName+'</div>'
      + '<div style="font-size:12px;color:var(--ink-3);margin-top:4px">'+personGen+'세</div>'
      + (!nameMatch ? '<div style="margin-top:12px;padding:10px;background:var(--gold-pale);border-radius:var(--radius-lg);font-size:12px;color:var(--gold)">가입 이름('+myName+')과 다릅니다. 맞으시면 연결하세요.</div>' : '')
      + '</div>'
      + '<div style="display:flex;gap:10px">'
      + '<button id="self-cancel" class="btn btn-secondary" style="flex:1">취소</button>'
      + '<button id="self-confirm" class="btn btn-primary" style="flex:2;border-radius:var(--radius-lg)">본인입니다 · 연결하기</button>'
      + '</div>';

    document.body.appendChild(modal);
    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open'); overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };
    overlay.addEventListener('click', close);
    document.getElementById('self-cancel').addEventListener('click', close);
    document.getElementById('self-confirm').addEventListener('click', async () => {
      const btn = document.getElementById('self-confirm');
      btn.textContent = '연결 중...'; btn.disabled = true;
      try {
        const allPersons = await DB.getAllPersons(200);
        const me = allPersons.find(p => p.id === personId);

        // parentId가 없으면 부모를 자동으로 찾아 연결
        let updateData = { linkedUid: Auth.getUid() };
        if (!me?.parentId && personGen > 1) {
          // 한 세대 위 인물 중 같은 rootAncestorId 우선, 없으면 세대만 맞는 것
          const rootId = me?.rootAncestorId;
          let parentCandidates = allPersons.filter(p =>
            p.generation === personGen - 1 && !p.isSpouse &&
            (rootId ? p.rootAncestorId === rootId : true)
          );
          // rootId로 못 찾으면 세대만으로 검색
          if (!parentCandidates.length) {
            parentCandidates = allPersons.filter(p => p.generation === personGen - 1 && !p.isSpouse);
          }
          if (parentCandidates.length >= 1) {
            // 부모 후보 중 첫 번째 사용 (관리자가 나중에 수정 가능)
            updateData.parentId = parentCandidates[0].id;
            updateData.rootAncestorId = parentCandidates[0].rootAncestorId || parentCandidates[0].id;
          }
        }

        await DB.updatePerson(personId, updateData);
        await DB.updateUserProfile(Auth.getUid(), {
          personId, saesu: personGen, daeson: personGen - 1
        });
        this.userProfile.personId = personId;
        this.userProfile.saesu = personGen;
        this.clearInviteInfo();
        close();
        this.showToast('"'+personName+'"으로 연결 완료!');
        setTimeout(() => this.navigate('memorial'), 800);
      } catch(e) {
        this.showToast('연결 실패: ' + e.message);
        btn.textContent = '본인입니다 · 연결하기'; btn.disabled = false;
      }
    });
  },

  // 아버지로 찾기 (persons에 본인이 없는 경우)
  async searchParentByName(query) {
    const resultEl = document.getElementById('dad-search-result');
    if (!resultEl) return;
    resultEl.innerHTML = '<div class="text-muted text-center" style="padding:16px 0">검색 중...</div>';
    try {
      const allPersons = await DB.getAllPersons(200);
      const matches = allPersons.filter(p => (p.name||'').includes(query)||(p.hanja||'').includes(query));
      if (!matches.length) {
        resultEl.innerHTML = '<div style="background:var(--rust-pale);border-radius:var(--radius-lg);padding:16px;text-align:center"><div style="font-size:14px;color:var(--rust)">"'+query+'"</div><div style="font-size:12px;color:var(--ink-3);margin-top:6px">등록된 인물을 찾지 못했습니다.<br/>관리자에게 먼저 등록을 요청해 주세요.</div></div>';
        return;
      }
      resultEl.innerHTML = '<div style="font-size:12px;color:var(--ink-3);margin-bottom:10px">'+matches.length+'명 발견. 아버지를 선택하세요.</div>';
      matches.forEach(p => {
        const div = document.createElement('div');
        div.style.cssText = 'display:flex;align-items:center;gap:14px;padding:14px 16px;border:0.5px solid var(--border);border-radius:var(--radius-lg);margin-bottom:8px;cursor:pointer;background:var(--paper)';
        div.innerHTML = '<div class="person-avatar" style="width:44px;height:44px;font-size:18px;'+(p.deathYear?'background:var(--paper-3);color:var(--ink-3)':'background:var(--moss-pale);color:var(--moss)')+'">'
          +((p.name||'?')[0])+'</div>'
          +'<div style="flex:1"><div style="font-family:var(--font-serif);font-size:16px;font-weight:500">'+(p.name||'미상')+'</div>'
          +'<div style="font-size:12px;color:var(--ink-3);margin-top:3px">'+p.generation+'세'+(p.birthYear?' · '+p.birthYear+'년':'')+(p.deathYear?' · 작고':'')+'</div></div>'
          +'<div style="color:var(--moss);font-size:22px">›</div>';
        div.addEventListener('mouseover', () => div.style.background='var(--paper-2)');
        div.addEventListener('mouseout', () => div.style.background='var(--paper)');
        div.addEventListener('click', () => App.confirmParentLink(p.id, p.name, p.generation));
        resultEl.appendChild(div);
      });
    } catch(e) {
      resultEl.innerHTML = '<div class="text-muted text-center" style="padding:16px 0">오류: '+e.message+'</div>';
    }
  },

  // 아버지 선택 → 새 person 생성 (persons에 본인이 없는 경우에만)
  async confirmParentLink(parentId, parentName, parentGen) {
    const myName = this.userProfile?.name || '나';
    const myGen = parentGen + 1;

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet';
    modal.innerHTML = '<div class="bottom-sheet-handle"></div>'
      + '<div style="text-align:center;padding:8px 0 20px">'
      + '<div style="font-size:13px;color:var(--ink-3);margin-bottom:16px">이렇게 연결하시겠습니까?</div>'
      + '<div style="display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:20px">'
      + '<div style="text-align:center"><div class="person-avatar" style="width:52px;height:52px;font-size:20px;background:var(--paper-3);color:var(--ink-3);margin:0 auto 6px">'+parentName[0]+'</div>'
      + '<div style="font-family:var(--font-serif);font-size:14px">'+parentName+'</div>'
      + '<div style="font-size:11px;color:var(--ink-4)">'+parentGen+'세 · 아버지</div></div>'
      + '<div style="font-size:24px;color:var(--border-strong)">↓</div>'
      + '<div style="text-align:center"><div class="person-avatar" style="width:52px;height:52px;font-size:20px;background:var(--moss);color:var(--paper);margin:0 auto 6px">'+myName[0]+'</div>'
      + '<div style="font-family:var(--font-serif);font-size:14px">'+myName+'</div>'
      + '<div style="font-size:11px;color:var(--ink-4)">'+myGen+'세 · 나 (신규 등록)</div></div></div>'
      + '<div style="font-size:11px;color:var(--ink-4);background:var(--paper-2);border-radius:var(--radius);padding:10px;margin-bottom:16px">⚠ 목록에 본인이 없는 경우에만 선택하세요.<br/>이미 등록된 분은 "내 이름 찾기" 탭에서 선택하세요.</div>'
      + '</div>'
      + '<div style="display:flex;gap:10px">'
      + '<button id="link-cancel" class="btn btn-secondary" style="flex:1">취소</button>'
      + '<button id="link-confirm" class="btn btn-primary" style="flex:2;border-radius:var(--radius-lg)">연결하기</button>'
      + '</div>';

    document.body.appendChild(modal);
    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open'); overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };
    overlay.addEventListener('click', close);
    document.getElementById('link-cancel').addEventListener('click', close);
    document.getElementById('link-confirm').addEventListener('click', async () => {
      const btn = document.getElementById('link-confirm');
      btn.textContent = '연결 중...'; btn.disabled = true;
      try {
        const allPersons = await DB.getAllPersons(200);
        const parent = allPersons.find(p => p.id === parentId);
        const rootAncestorId = parent?.rootAncestorId || parentId;
        const myNameSafe = this.userProfile?.name || Auth.currentUser?.displayName || '이름미입력';
        if (!myNameSafe || myNameSafe === '이름미입력') {
          throw new Error('이름 정보가 없습니다. 마이페이지에서 이름을 먼저 입력해 주세요.');
        }
        const personId = await DB.savePerson({
          name: myNameSafe,
          generation: myGen,
          birthYear: this.userProfile?.birthYear || null,
          parentId, rootAncestorId,
          bongwan: this.userProfile?.bongwan || '의령',
          pa: this.userProfile?.pa || '사천백파',
          addedByUid: Auth.getUid(),
          linkedUid: Auth.getUid()
        });
        await DB.updateUserProfile(Auth.getUid(), { personId, saesu: myGen, daeson: myGen-1 });
        this.userProfile.personId = personId;
        this.userProfile.saesu = myGen;
        this.clearInviteInfo();
        close();
        this.showToast('"'+parentName+'"의 자녀로 연결 완료!');
        setTimeout(() => this.navigate('memorial'), 800);
      } catch(e) {
        this.showToast('연결 실패: ' + e.message);
        btn.textContent = '연결하기'; btn.disabled = false;
      }
    });
  },

  skipLinkToTree() {
    this.navigate('memorial');
  },


  
    // ── Home (가계도) ──────────────────────────────
  async renderHome() {
    const p = this.userProfile;
    const selfGen = p?.saesu || 8; // 기본 8세대
    const el = document.getElementById('page-container');
    el.innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-title">나의 가계</div>
            <div class="page-subtitle">${p?.bongwan || ''}${p?.pa ? ' · '+p.pa : ''}</div>
          </div>
          <div style="display:flex;align-items:center;gap:8px">
            ${p?.role === 'admin' ? '<span class="admin-badge">관리자</span>' : ''}
          </div>
        </div>
      </div>
      <div id="match-alert-area" style="padding:12px 20px 0"></div>

      <!-- 나의 위치 카드 -->
      <div style="padding:12px 20px 0">
        <div class="card" style="display:flex;align-items:center;gap:14px;padding:14px 16px">
          <div class="person-avatar" style="width:48px;height:48px;font-size:20px">${(p?.name||'나')[0]}</div>
          <div style="flex:1">
            <div style="font-family:var(--font-serif);font-size:17px;font-weight:500">${p?.name || '—'}</div>
            <div class="text-muted" style="font-size:12px;margin-top:2px">${p?.bongwan||''} · ${p?.pa||''}</div>
          </div>
          <div style="text-align:center">
            <div class="gen-badge">${selfGen}세</div>
            <div style="font-size:10px;color:var(--ink-4);margin-top:3px">${p?.daeson||selfGen-1}대손</div>
          </div>
        </div>
      </div>

      <!-- 가계도 영역 -->
      <div class="section" style="padding-top:16px">
        <div class="section-title" style="margin-bottom:8px">
          가계도
          <span style="font-size:11px;color:var(--ink-4);font-weight:400;margin-left:4px">회색 노드를 눌러 정보를 추가하세요</span>
        </div>
        <div id="tree-wrap" style="background:var(--paper-2);border:0.5px solid var(--border);border-radius:var(--radius-lg);overflow:auto;height:56dvh;position:relative;cursor:grab">
          <div style="display:flex;align-items:center;justify-content:center;height:100%;color:var(--ink-4)">
            <div class="text-center">
              <div style="font-size:28px;margin-bottom:8px">🌲</div>
              <div style="font-size:13px">불러오는 중...</div>
            </div>
          </div>
        </div>
        <!-- 범례 -->
        <div style="display:flex;gap:16px;margin-top:10px;flex-wrap:wrap">
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-3)">
            <div style="width:14px;height:14px;background:#2C3A2B;border-radius:3px"></div> 나
          </div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-3)">
            <div style="width:14px;height:14px;background:#F5EDD8;border:1px solid rgba(154,123,58,0.4);border-radius:3px"></div> 7대조
          </div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-3)">
            <div style="width:14px;height:14px;background:#EDE8DF;border-radius:3px"></div> 작고하신 분
          </div>
          <div style="display:flex;align-items:center;gap:5px;font-size:11px;color:var(--ink-3)">
            <div style="width:14px;height:14px;border:1px dashed rgba(60,55,45,0.3);border-radius:3px;background:rgba(240,235,224,0.5)"></div> 미입력
          </div>
        </div>
      </div>
    `;

    await this.loadTree();
    if (p) this.checkMatchAlerts();
  },

  async loadTree() {
    const p = this.userProfile;
    if (!p) return;
    const selfGen = p.saesu || 8;
    const container = document.getElementById('tree-wrap');
    if (!container) return;

    try {
      let realPersons = await DB.getAllPersons(200);
      console.log('persons loaded:', realPersons.length);

      const meInTree = realPersons.find(pr => pr.id === p.personId);
      const selfPersonId = meInTree ? p.personId : 'self-temp';
      if (!meInTree) {
        realPersons.push({ id: 'self-temp', name: p.name, generation: selfGen });
      }

      const gens = realPersons.map(pr => pr.generation || 0).filter(g => g > 0);
      const maxGen = gens.length ? Math.max(...gens) : selfGen;
      const totalGens = Math.max(maxGen + 2, selfGen + 2, 9);

      Tree.render(container, realPersons, selfPersonId, selfGen, totalGens);
    } catch (e) {
      console.error('Tree load error:', e);
      Tree.render(container,
        [{ id: 'self-temp', name: p.name || '나', generation: selfGen }],
        'self-temp', selfGen, Math.max(selfGen + 2, 9));
    }
  },

  // ── 인물 추가 모달 ─────────────────────────────
  showAddPersonModal(targetGen) {
    const p = this.userProfile;
    const selfGen = p?.saesu || 8;
    const isAncestor = targetGen < selfGen;
    const isDescendant = targetGen > selfGen;
    const relLabel = targetGen === 1 ? '7대조' :
                     targetGen === selfGen - 1 ? '부모' :
                     targetGen === selfGen + 1 ? '자녀' :
                     isAncestor ? `${selfGen - targetGen}대 조상` : `${targetGen - selfGen}대 후손`;

    // 기존 모달 제거
    document.querySelector('.add-modal')?.remove();
    document.querySelector('.sheet-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet add-modal';
    modal.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div style="margin-bottom:18px">
        <div style="font-family:var(--font-serif);font-size:18px;font-weight:500">${relLabel} 정보 입력</div>
        <div style="font-size:12px;color:var(--ink-3);margin-top:3px">${targetGen}세 · ${isAncestor?'조상':'후손'} 등록</div>
      </div>
      <div class="form-group">
        <label class="form-label">성함 <span class="required">*</span></label>
        <input type="text" id="mp-name" class="form-input" placeholder="예) 홍길동" />
      </div>
      <div class="form-group">
        <label class="form-label">성함 (한자)</label>
        <input type="text" id="mp-hanja" class="form-input" placeholder="예) 洪吉童" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">출생년도</label>
          <input type="number" id="mp-birth" class="form-input" placeholder="예) 1940" />
        </div>
        <div class="form-group">
          <label class="form-label">사망년도</label>
          <input type="number" id="mp-death" class="form-input" placeholder="작고 시 입력" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">납골당/묘역 위치</label>
        <input type="text" id="mp-location" class="form-input" placeholder="예) 추담공원 3구역 A-15" />
      </div>
      <div class="form-group">
        <label class="form-label">기제사일</label>
        <input type="text" id="mp-jesa" class="form-input" placeholder="예) 음력 3월 15일" />
      </div>
      <div style="display:flex;gap:10px;margin-top:4px">
        <button class="btn btn-secondary" style="flex:1" id="mp-cancel">취소</button>
        <button class="btn btn-primary" style="flex:2;border-radius:var(--radius-lg)" id="mp-save">저장</button>
      </div>
    `;
    document.body.appendChild(modal);

    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open');
      overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };

    overlay.addEventListener('click', close);
    document.getElementById('mp-cancel').addEventListener('click', close);

    document.getElementById('mp-save').addEventListener('click', async () => {
      const name = document.getElementById('mp-name').value.trim();
      if (!name) { this.showToast('성함을 입력해 주세요'); return; }

      const btn = document.getElementById('mp-save');
      btn.textContent = '저장 중...'; btn.disabled = true;

      try {
        const data = {
          name,
          hanja: document.getElementById('mp-hanja').value.trim(),
          surname: p?.name?.slice(0,1) || '',
          bongwan: p?.bongwan || '',
          pa: p?.pa || '',
          generation: targetGen,
          birthYear: parseInt(document.getElementById('mp-birth').value) || null,
          deathYear: parseInt(document.getElementById('mp-death').value) || null,
          memorialLocation: document.getElementById('mp-location').value.trim(),
          jesaDate: document.getElementById('mp-jesa').value.trim(),
          parentId: null,
          rootAncestorId: null,
          addedByUid: Auth.getUid()
        };

        const id = await DB.savePerson(data);

        // 7대조이면 자기 자신이 루트
        if (targetGen === 1) {
          await DB.updatePerson(id, { rootAncestorId: id });
        }

        // 사용자 본인이면 personId 연결
        if (targetGen === selfGen && !p.personId) {
          await DB.updateUserProfile(Auth.getUid(), { personId: id });
          this.userProfile.personId = id;
        }

        this.showToast(`${relLabel} 등록 완료!`);
        close();
        setTimeout(() => this.loadTree(), 400);
      } catch (e) {
        this.showToast('저장 실패: ' + e.message);
        btn.textContent = '저장'; btn.disabled = false;
      }
    });
  },

  async checkMatchAlerts() {
    const requests = await DB.getMergeRequests(Auth.getUid());
    const area = document.getElementById('match-alert-area');
    if (!area || !requests.length) return;
    area.innerHTML = `
      <div class="match-banner" onclick="App.renderMatchDetail('${requests[0].id}')">
        <div class="match-banner-icon">🔗</div>
        <div class="match-banner-text">
          <div class="match-banner-title">가문 연결 요청이 있습니다</div>
          <div>동일한 7대조를 모시는 가문이 연결을 요청했습니다 →</div>
        </div>
      </div>`;
  },

  // ── Memorial Page ──────────────────────────────
  renderMemorial() {
    const p = this.userProfile;
    const isAdmin = p?.role === 'admin';
    document.getElementById('page-container').innerHTML = `
      <div style="position:relative;width:100%;background:#111a0f;min-height:calc(100dvh - 68px);overflow:hidden">

        <div style="position:relative;width:100%;overflow:hidden;cursor:pointer" id="memorial-scene">
          <svg width="100%" viewBox="0 0 400 420" xmlns="http://www.w3.org/2000/svg" style="display:block;max-height:60vh;">
            <defs>
              <linearGradient id="msky" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#7ba8c4"/><stop offset="55%" stop-color="#b8d4e8"/><stop offset="100%" stop-color="#d4e8d4"/></linearGradient>
              <linearGradient id="mmtn" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#5a7a5a"/><stop offset="100%" stop-color="#3a5a3a"/></linearGradient>
              <linearGradient id="mgnd" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#8a9e70"/><stop offset="100%" stop-color="#5a7040"/></linearGradient>
            </defs>
            <rect width="400" height="420" fill="url(#msky)"/>
            <ellipse cx="200" cy="148" rx="130" ry="90" fill="url(#mmtn)" opacity="0.7"/>
            <ellipse cx="320" cy="162" rx="90" ry="70" fill="#4a6a4a" opacity="0.6"/>
            <ellipse cx="78" cy="167" rx="80" ry="65" fill="#3d5e3d" opacity="0.65"/>
            <rect x="0" y="232" width="400" height="188" fill="url(#mgnd)"/>
            <ellipse cx="200" cy="232" rx="230" ry="18" fill="#7a9060" opacity="0.8"/>
            <g opacity="0.9"><rect x="18" y="128" width="9" height="112" fill="#3d2a1a"/><ellipse cx="23" cy="122" rx="24" ry="30" fill="#2d5a2d"/><ellipse cx="14" cy="140" rx="15" ry="21" fill="#3a6e3a"/><ellipse cx="32" cy="144" rx="17" ry="23" fill="#2d5a2d"/></g>
            <g opacity="0.9"><rect x="354" y="118" width="10" height="122" fill="#3d2a1a"/><ellipse cx="360" cy="110" rx="29" ry="36" fill="#2d5a2d"/><ellipse cx="347" cy="128" rx="19" ry="26" fill="#3a6e3a"/><ellipse cx="373" cy="124" rx="21" ry="29" fill="#2d5a2d"/></g>
            <g opacity="0.7"><rect x="318" y="153" width="7" height="87" fill="#3d2a1a"/><ellipse cx="322" cy="146" rx="21" ry="27" fill="#4a7a4a"/></g>
            <g opacity="0.7"><rect x="58" y="163" width="7" height="77" fill="#3d2a1a"/><ellipse cx="62" cy="156" rx="19" ry="23" fill="#4a7a4a"/></g>
            <rect x="128" y="190" width="144" height="88" rx="4" fill="#c8cec8" stroke="#a0a8a0" stroke-width="0.5"/>
            <rect x="128" y="190" width="144" height="13" rx="4" fill="#b0b6b0"/>
            <rect x="134" y="203" width="52" height="70" rx="2" fill="#a8b0a8"/>
            <rect x="214" y="203" width="52" height="70" rx="2" fill="#a8b0a8"/>
            <rect x="186" y="196" width="28" height="67" fill="#1a1a1a"/>
            <rect x="188" y="198" width="24" height="63" rx="1" fill="#0f0f0f"/>
            <text x="200" y="190" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="7.5" fill="#2a1a0a" letter-spacing="3">追慕堂</text>
            <text x="152" y="232" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="12" fill="#3a3a3a">崇</text>
            <text x="152" y="250" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="12" fill="#3a3a3a">祖</text>
            <text x="248" y="232" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="12" fill="#3a3a3a">和</text>
            <text x="248" y="250" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="12" fill="#3a3a3a">親</text>
            <rect x="183" y="258" width="34" height="10" rx="1" fill="#888" opacity="0.35"/>
            <rect x="157" y="278" width="86" height="17" rx="2" fill="#b0b8b0"/>
            <rect x="161" y="276" width="78" height="5" rx="1" fill="#9a9e9a"/>
            <circle cx="172" cy="287" r="5" fill="#e8a060"/><circle cx="184" cy="287" r="5" fill="#d04040"/><circle cx="196" cy="287" r="5" fill="#f0c040"/><circle cx="208" cy="287" r="5" fill="#f08840"/><circle cx="220" cy="287" r="5" fill="#70c870"/><circle cx="232" cy="286" r="4" fill="#c84040"/>
            <rect x="86" y="224" width="22" height="56" rx="2" fill="#2a2a2a"/>
            <rect x="84" y="220" width="26" height="7" rx="3" fill="#3a3a3a"/>
            <text x="97" y="240" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="5.5" fill="#c8c0a0" letter-spacing="1">宜寧</text>
            <text x="97" y="250" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="5.5" fill="#c8c0a0">南氏</text>
            <text x="97" y="260" text-anchor="middle" font-family="Noto Serif KR,serif" font-size="5" fill="#a09880">十八世</text>
            <ellipse cx="312" cy="268" rx="48" ry="27" fill="#6a8050"/>
            <rect x="270" y="265" width="80" height="16" rx="4" fill="#8a9878" stroke="#6a7858" stroke-width="0.5"/>
            <ellipse cx="312" cy="292" rx="52" ry="8" fill="#5a7045" opacity="0.4"/>
            <rect x="0" y="300" width="400" height="120" fill="#5a7040" opacity="0.3"/>
            <g opacity="0.25"><rect x="143" y="306" width="3" height="19" fill="#3d2a1a"/><ellipse cx="145" cy="303" rx="9" ry="11" fill="#4a7040"/><rect x="163" y="310" width="3" height="16" fill="#3d2a1a"/><ellipse cx="165" cy="307" rx="8" ry="10" fill="#4a7040"/><rect x="232" y="312" width="3" height="14" fill="#3d2a1a"/><ellipse cx="234" cy="309" rx="8" ry="9" fill="#4a7040"/></g>
          </svg>

          <div style="position:absolute;top:10px;left:0;right:0;padding:12px 16px;background:linear-gradient(to bottom,rgba(8,14,6,0.75) 0%,transparent 100%)">
            <div style="font-family:'Noto Serif KR',serif;font-size:15px;color:#f0d878;letter-spacing:0.12em">秋 潭 公 園</div>
            <div style="font-size:10px;color:rgba(240,216,120,0.55);margin-top:2px;letter-spacing:0.06em">宜寧南氏 沙川伯派 崇祖公園</div>
          </div>

          <div id="hs-shrine" class="mem-hotspot" style="left:46%;top:46%" onclick="App.showMemorialPopup('shrine')"><div class="mem-dot"></div></div>
          <div id="hs-stele"  class="mem-hotspot" style="left:22%;top:52%" onclick="App.showMemorialPopup('stele')"><div class="mem-dot"></div></div>
          <div id="hs-altar"  class="mem-hotspot" style="left:47%;top:64%" onclick="App.showMemorialPopup('altar')"><div class="mem-dot"></div></div>
          <div id="hs-tomb"   class="mem-hotspot" style="left:76%;top:58%" onclick="App.showMemorialPopup('tomb')"><div class="mem-dot"></div></div>

          <div style="position:absolute;bottom:12px;left:16px;right:16px">
            <div style="display:inline-block;background:rgba(160,120,30,0.3);border:0.5px solid rgba(160,120,30,0.5);border-radius:20px;padding:4px 12px;font-size:10px;color:#d4b860;font-family:'Noto Serif KR',serif">춘계 시제 현장</div>
            <div style="font-size:10px;color:rgba(200,180,100,0.45);margin-top:5px;letter-spacing:0.04em">빛나는 점을 터치하여 둘러보세요</div>
          </div>
        </div>

        <div style="padding:16px 16px 0">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px">
            <button class="mem-quick-btn" onclick="App.showMemorialPopup('guide')">
              <div class="mem-quick-icon">🗺</div>
              <div class="mem-quick-label">오시는 길</div>
            </button>
            <button class="mem-quick-btn" onclick="App.showMemorialPopup('board')">
              <div class="mem-quick-icon">📋</div>
              <div class="mem-quick-label">추모 게시판</div>
            </button>
            <button class="mem-quick-btn" onclick="App.showMemorialPopup('jesa')">
              <div class="mem-quick-icon">🕯</div>
              <div class="mem-quick-label">기제사 일정</div>
            </button>
            <button class="mem-quick-btn" onclick="App.navigate('home')">
              <div class="mem-quick-icon">🌳</div>
              <div class="mem-quick-label">가계도 보기</div>
            </button>
          </div>
        </div>

        <div id="memorial-popup-overlay" style="display:none;position:fixed;inset:0;background:rgba(8,14,6,0.88);z-index:200;align-items:flex-end;justify-content:center">
          <div id="memorial-popup-sheet" style="background:#1a2318;border-radius:20px 20px 0 0;border-top:0.5px solid rgba(180,160,80,0.3);padding:20px;width:100%;max-width:480px;max-height:70dvh;overflow-y:auto">
            <div style="width:36px;height:4px;background:rgba(180,160,80,0.3);border-radius:2px;margin:0 auto 16px"></div>
            <button onclick="App.closeMemorialPopup()" style="position:absolute;top:16px;right:16px;width:28px;height:28px;background:rgba(180,160,80,0.15);border:none;border-radius:50%;color:#c8b060;font-size:14px;cursor:pointer">✕</button>
            <div id="memorial-popup-content"></div>
          </div>
        </div>
      </div>
    `;
  },

  showMemorialPopup(type) {
    const contents = {
      shrine: {
        title: '追慕堂', sub: '숭조화친 · 崇祖和親',
        rows: [['위치','추담공원 중앙'],['문중','의령남씨 사천백파'],['특징','숭조·화친 정신']],
        text: '조상을 숭상하고 친족이 화목하게 지낸다는 뜻의 崇祖和親을 표방하는 우리 문중의 추모 공간입니다.'
      },
      stele: {
        title: '十八世 碩頤公 비석', sub: '宜寧南氏 沙川伯派',
        rows: [['세대','18세손'],['파','사천백파 夏後孫'],['비문','碩頤 夏後孫 崇祖公園']],
        text: '18세 석이공의 후손들이 세운 숭조공원 기념비입니다. 사천백파의 뿌리를 기리는 공간입니다.'
      },
      altar: {
        title: '시제 상석', sub: '춘계 시제 · 春季 時祭',
        rows: [['시기','매년 춘계'],['참여','문중 전체'],['제수','과일·어물·떡 등']],
        text: '매년 봄 문중 전체가 모여 조상님께 제를 올리는 시제 상석입니다.'
      },
      tomb: {
        title: '선산 묘역', sub: '조상님의 안식처',
        rows: [['형식','전통 봉분'],['관리','춘추 벌초'],['위치','추담공원 동편 산록']],
        text: '봉분 형태로 조성된 선산 묘역입니다. 봄·가을 벌초 및 시제를 봉행합니다.'
      },
      guide: {
        title: '오시는 길', sub: '추담공원 찾아오기',
        rows: [['주소','등록 예정'],['주차','공원 내 주차장'],['대중교통','등록 예정']],
        text: '추담공원으로 오시는 길 안내입니다. 상세 주소와 교통 정보는 문중에 문의해 주세요.'
      },
      board: {
        title: '추모 게시판', sub: '가족들의 이야기',
        rows: [],
        text: '가족들과 조상님에 대한 추모 기록을 나누는 공간입니다. 게시판 기능은 다음 업데이트에서 추가됩니다.'
      },
      jesa: {
        title: '기제사 일정', sub: '문중 연간 행사',
        rows: [['춘계 시제','매년 봄'],['추계 시제','매년 가을'],['기제사','음력 기준']],
        text: '문중의 연간 제례 일정입니다. 정확한 날짜는 문중 공지를 통해 안내됩니다.'
      }
    };
    const c = contents[type];
    if (!c) return;
    const overlay = document.getElementById('memorial-popup-overlay');
    const content = document.getElementById('memorial-popup-content');
    content.innerHTML = [
      '<div style="font-family:Noto Serif KR,serif;font-size:19px;color:#f0d878;margin-bottom:3px;font-weight:500">' + c.title + '</div>',
      '<div style="font-size:11px;color:rgba(200,180,100,0.6);margin-bottom:14px;letter-spacing:0.05em">' + c.sub + '</div>',
      c.rows.length ? '<div style="height:0.5px;background:rgba(180,160,80,0.2);margin-bottom:12px"></div>' : '',
      c.rows.map(function(r) {
        return '<div style="display:flex;justify-content:space-between;font-size:12px;padding:6px 0;border-bottom:0.5px solid rgba(180,160,80,0.1)">'
          + '<span style="color:rgba(200,180,100,0.55)">' + r[0] + '</span>'
          + '<span style="color:#d4c080;font-family:Noto Serif KR,serif">' + r[1] + '</span></div>';
      }).join(''),
      '<div style="font-size:12px;color:rgba(200,180,100,0.72);line-height:1.75;margin-top:14px;font-family:Noto Serif KR,serif">' + c.text + '</div>'
    ].join('');
    overlay.style.display = 'flex';
    overlay.onclick = (e) => { if(e.target === overlay) App.closeMemorialPopup(); };
  },

  closeMemorialPopup() {
    document.getElementById('memorial-popup-overlay').style.display = 'none';
  },

  async loadMemorialList() {
    const el = document.getElementById('memorial-list');
    if (!el) return;
    const persons = await DB.getAllPersons(20);
    const deceased = persons.filter(p => p.memorialLocation);
    if (!deceased.length) return;
    el.innerHTML = deceased.map(function(p) {
      return '<div class="person-item">'
        + '<div class="person-avatar deceased">' + ((p.name || '미')[0]) + '</div>'
        + '<div style="flex:1">'
        + '<div class="person-name">' + (p.name || '미상') + '</div>'
        + '<div class="person-meta">' + (p.generation || '?') + '세 · ' + (p.birthYear || '?') + '년 ~ ' + (p.deathYear || '?') + '년</div>'
        + (p.memorialLocation ? '<div class="person-meta" style="color:var(--moss);margin-top:2px">' + p.memorialLocation + '</div>' : '')
        + '</div></div>';
    }).join('');
  },

  renderClan() {
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-title">문중 관리</div>
            <div class="page-subtitle">기점 조상 · 행사 · 공지</div>
          </div>

        </div>
      </div>
      <div class="section">
        <div class="section-title">7대조 기점 조상</div>
        <div id="ancestor-card">
          <div class="text-center text-muted" style="padding:20px 0">불러오는 중...</div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">행사 일정</div>
        <div class="card">
          <div class="flex-between">
            <div>
              <div style="font-weight:500;font-family:var(--font-serif)">기제사</div>
              <div class="text-muted">음력 기준 • 문중 전체 행사</div>
            </div>
            <div class="gen-badge">D-?</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">문중 소식</div>
        <div class="card">
          <div class="text-muted text-center" style="padding:20px 0">
            <div style="font-size:24px;margin-bottom:8px">📢</div>
            등록된 공지가 없습니다
          </div>
        </div>
      </div>
    `;
    this.loadAncestorCard();
  },

  async loadAncestorCard() {
    const el = document.getElementById('ancestor-card');
    if (!el) return;
    const roots = await DB.getRootAncestors();
    if (!roots.length) {
      el.innerHTML = `
        <div class="card-gold">
          <div style="font-family:var(--font-serif);font-size:14px;color:var(--ink-3)">등록된 기점 조상이 없습니다</div>
          ${this.userProfile?.role === 'admin' ? `<button class="btn btn-sm btn-ghost mt-12" onclick="App.renderAncestorSetup()">7대조 등록</button>` : ''}
        </div>`;
      return;
    }
    const r = roots[0];
    el.innerHTML = `
      <div class="card-gold">
        <div class="flex-between mb-16">
          <div class="gen-badge">7대조</div>
          <div style="font-size:11px;color:var(--gold)">가문의 뿌리</div>
        </div>
        <div style="font-family:var(--font-serif);font-size:22px;font-weight:500;color:var(--ink)">${r.name || '미상'}</div>
        ${r.hanja ? `<div style="font-size:16px;color:var(--gold);margin-top:2px">${r.hanja}</div>` : ''}
        <div class="divider"></div>
        <div style="font-size:13px;color:var(--ink-2);display:flex;gap:16px">
          ${r.bongwan ? `<span>🏡 ${r.bongwan}파</span>` : ''}
          ${r.pa ? `<span>🌿 ${r.pa}</span>` : ''}
          ${r.birthYear ? `<span>📅 ${r.birthYear}년생</span>` : ''}
        </div>
        ${r.memorialLocation ? `<div style="margin-top:8px;font-size:12px;color:var(--moss)">📍 ${r.memorialLocation}</div>` : ''}
      </div>`;
  },

  // ── Profile Page ──────────────────────────────
  renderProfile() {
    const p = this.userProfile;
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-title">마이페이지</div>
        </div>
      </div>
      <div class="section">
        <div class="card" style="display:flex;align-items:center;gap:16px">
          <div class="person-avatar" style="width:56px;height:56px;font-size:22px">${(p?.name || '?')[0]}</div>
          <div>
            <div style="font-family:var(--font-serif);font-size:18px;font-weight:500">${p?.name || '—'}</div>
            <div class="text-muted">${p?.email || ''}</div>
            <div class="mt-4"><span class="gen-badge">${p?.saesu || '?'}세</span></div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">내 정보</div>
        <div class="card">
          <div class="person-item">
            <div style="width:72px;color:var(--ink-3);font-size:13px">본관</div>
            <div style="font-family:var(--font-serif)">${p?.bongwan || '—'}</div>
          </div>
          <div class="person-item">
            <div style="width:72px;color:var(--ink-3);font-size:13px">파</div>
            <div style="font-family:var(--font-serif)">${p?.pa || '—'}</div>
          </div>
          <div class="person-item">
            <div style="width:72px;color:var(--ink-3);font-size:13px">세수</div>
            <div style="font-family:var(--font-serif)">${p?.saesu || '—'}세 (${p?.daeson || '—'}대손)</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">설정</div>
        <div class="card">
          <div class="person-item" onclick="App.renderProfileEdit()">
            <div style="flex:1;font-size:14px">개인정보 수정</div>
            <div style="color:var(--ink-4)">›</div>
          </div>
          ${this.userProfile?.role === 'admin' ? `
          <div class="person-item" onclick="App.renderAdminPage()">
            <div style="flex:1;font-size:14px;color:var(--moss)">관리자 메뉴</div>
            <div style="color:var(--gold)">›</div>
          </div>` : ''}
          <div class="person-item">
            <div style="flex:1;font-size:14px">알림 설정</div>
            <div style="color:var(--ink-4)">›</div>
          </div>
          <div class="person-item">
            <div style="flex:1;font-size:14px">이용약관</div>
            <div style="color:var(--ink-4)">›</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">가족 초대</div>
        <div class="card-gold" style="cursor:pointer" onclick="App.showInviteSheet()">
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:40px;height:40px;background:rgba(154,123,58,0.15);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:20px;flex-shrink:0">🔗</div>
            <div>
              <div style="font-family:var(--font-serif);font-size:15px;font-weight:500;color:var(--ink)">가족 초대하기</div>
              <div style="font-size:12px;color:var(--ink-3);margin-top:2px">초대 링크를 공유하여 가계도를 함께 완성하세요</div>
            </div>
            <div style="color:var(--gold);font-size:18px;margin-left:auto">›</div>
          </div>
        </div>
      </div>
      <div class="section">
        <button class="btn btn-secondary w-full" onclick="App.logout()">로그아웃</button>
      </div>
    `;
  },

  // ── 초대 링크 ──────────────────────────────────
  showInviteSheet() {
    const p = this.userProfile;
    const base = window.location.origin + window.location.pathname;
    const inviteUrl = base + '?invite=' + encodeURIComponent(Auth.getUid())
      + '&from=' + encodeURIComponent(p?.name || '가족');

    document.querySelector('.invite-modal')?.remove();
    document.querySelector('.sheet-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet invite-modal';
    modal.innerHTML = '<div class="bottom-sheet-handle"></div>'
      + '<div style="font-family:var(--font-serif);font-size:18px;font-weight:500;margin-bottom:4px">가족 초대하기</div>'
      + '<div style="font-size:12px;color:var(--ink-3);margin-bottom:20px">아래 링크를 카카오톡이나 문자로 공유하세요</div>'
      + '<div style="background:var(--paper-2);border:0.5px solid var(--border-strong);border-radius:var(--radius-lg);padding:14px;margin-bottom:16px">'
      + '<div style="font-size:11px;color:var(--ink-4);margin-bottom:6px">초대 링크</div>'
      + '<div id="invite-url-text" style="font-size:12px;color:var(--ink-2);word-break:break-all;line-height:1.5">' + inviteUrl + '</div>'
      + '</div>'
      + '<div style="display:flex;flex-direction:column;gap:10px">'
      + '<button id="btn-copy-link" class="btn btn-primary" style="border-radius:var(--radius-lg)">링크 복사</button>'
      + (navigator.share
        ? '<button id="btn-share-link" class="btn btn-ghost">공유하기 (카카오톡 등)</button>'
        : '')
      + '</div>'
      + '<div style="margin-top:20px;padding:14px;background:var(--moss-pale);border-radius:var(--radius-lg)">'
      + '<div style="font-size:12px;color:var(--moss);line-height:1.65">'
      + '링크를 받은 가족이 클릭하면<br/>'
      + '<strong>' + (p?.name||'') + '</strong>님의 초대로 가입 화면이 열립니다.<br/>'
      + '가입 후 아버지 이름으로 가계도에 자동 연결됩니다.'
      + '</div></div>';

    document.body.appendChild(modal);
    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open');
      overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };
    overlay.addEventListener('click', close);

    document.getElementById('btn-copy-link').addEventListener('click', () => {
      navigator.clipboard.writeText(inviteUrl).then(() => {
        App.showToast('링크가 복사되었습니다!');
        close();
      }).catch(() => {
        // fallback
        const el = document.createElement('textarea');
        el.value = inviteUrl;
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        App.showToast('링크가 복사되었습니다!');
        close();
      });
    });

    const shareBtn = document.getElementById('btn-share-link');
    if (shareBtn) {
      shareBtn.addEventListener('click', async () => {
        try {
          await navigator.share({
            title: '추담공원 가족 초대',
            text: (p?.name||'가족') + '님이 추담공원 가계도에 초대했습니다.',
            url: inviteUrl
          });
          close();
        } catch(e) {
          if (e.name !== 'AbortError') App.showToast('공유 실패: ' + e.message);
        }
      });
    }
  },

  // ── 초대 링크 접속 처리 ───────────────────────
  checkInviteParam() {
    const params = new URLSearchParams(window.location.search);
    const inviteUid = params.get('invite');
    const fromName = params.get('from');
    if (inviteUid && fromName) {
      sessionStorage.setItem('inviteUid', inviteUid);
      sessionStorage.setItem('inviteFrom', decodeURIComponent(fromName));
      // URL 파라미터 제거 (히스토리 정리)
      window.history.replaceState({}, '', window.location.pathname);
      return { inviteUid, fromName: decodeURIComponent(fromName) };
    }
    return null;
  },

  getInviteInfo() {
    const uid = sessionStorage.getItem('inviteUid');
    const from = sessionStorage.getItem('inviteFrom');
    return uid ? { inviteUid: uid, fromName: from } : null;
  },

  clearInviteInfo() {
    sessionStorage.removeItem('inviteUid');
    sessionStorage.removeItem('inviteFrom');
  },

  async logout() {
    await Auth.signOut();
  },

  // ── Admin Page ────────────────────────────────
  // 등록된 인물 캐시 (부모 선택 드롭다운용)
  _adminPersons: [],

  async renderAdminPage() {
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <button onclick="App.navigate('profile')" style="background:none;border:none;cursor:pointer;color:var(--moss);font-size:14px">← 뒤로</button>
          <div class="page-title">관리자</div>
          <div></div>
        </div>
      </div>
      <div style="display:flex;background:var(--paper-2);border-radius:var(--radius);padding:3px;margin:0 20px 4px;">
        <button class="tab-btn active" id="admin-tab-persons" onclick="App.showAdminTab('persons')">인물 관리</button>
        <button class="tab-btn" id="admin-tab-members" onclick="App.showAdminTab('members')">회원 관리</button>
      </div>
      <div id="section-persons">
      <div class="section">
        <!-- 안내 배너 -->
        <div style="background:var(--moss-pale);border-radius:var(--radius-lg);padding:14px 16px;margin-bottom:16px;font-size:13px;color:var(--moss);line-height:1.6">
          <strong>등록 순서:</strong> 7대조(1세) → 6대조(2세) → … → 아버지 → 나<br/>
          부모를 먼저 등록해야 자녀를 연결할 수 있습니다.
        </div>
        <div class="card">
          <!-- 이름 -->
          <div class="form-group">
            <label class="form-label">성함 <span class="required">*</span></label>
            <div class="form-row">
              <input type="text" id="p-name" class="form-input" placeholder="한글 (예: 남○○)" />
              <input type="text" id="p-hanja" class="form-input" placeholder="한자 (선택)" />
            </div>
          </div>
          <!-- 세대 -->
          <div class="form-group">
            <label class="form-label">이 분은 몇 세(世)입니까? <span class="required">*</span></label>
            <div style="display:flex;gap:8px;flex-wrap:wrap" id="gen-buttons">
                \${[1,2,3,4,5,6,7,8,9,10].map(function(g){
                return '<button type="button" class="btn btn-sm btn-secondary gen-btn" data-gen="'+g+'" style="min-width:48px">'
                  + (g === 1 ? '1세<br><span style="font-size:9px">7대조</span>' : g+'세')
                  + '</button>';
              }).join('')}
            </div>
            <input type="hidden" id="p-gen" value="" />
            <div class="form-hint">7대조=1세, 6대조=2세, … 아버지=본인세수-1, 나=본인세수</div>
          </div>
          <!-- 부모 선택 -->
          <div class="form-group" id="parent-group" style="display:none">
            <label class="form-label">부모 선택 <span style="font-size:11px;color:var(--ink-4)">(위 세대에서 선택)</span></label>
            <select id="p-parent-select" class="form-select">
              <option value="">— 부모 선택 —</option>
            </select>
          </div>
          <!-- 생몰년도 -->
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">출생년도</label>
              <input type="number" id="p-birth" class="form-input" placeholder="예) 1940" />
            </div>
            <div class="form-group">
              <label class="form-label">사망년도</label>
              <input type="number" id="p-death" class="form-input" placeholder="작고 시 입력" />
            </div>
          </div>
          <!-- 추모 정보 -->
          <div class="form-group">
            <label class="form-label">납골당/묘역 위치</label>
            <input type="text" id="p-location" class="form-input" placeholder="예) 추담공원 3구역 A-15" />
          </div>
          <div class="form-group">
            <label class="form-label">기제사일</label>
            <input type="text" id="p-jesa" class="form-input" placeholder="예) 음력 3월 15일" />
          </div>
          <button class="btn btn-primary mt-8" id="btn-add-person">등록하기</button>
          <div id="admin-result" class="text-center mt-12" style="font-size:13px;display:none"></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">등록된 인물 목록
          <button class="btn btn-sm btn-secondary" onclick="App.loadAdminList()" style="margin-left:8px;font-size:11px">새로고침</button>
          <button class="btn btn-sm" onclick="App.bulkFixConnections()" style="margin-left:6px;font-size:11px;background:var(--gold-pale);color:var(--gold);border:0.5px solid rgba(154,123,58,0.3)">rootId 일괄연결</button>
          <button class="btn btn-sm" onclick="App.bulkFixParentIds()" style="margin-left:6px;font-size:11px;background:var(--moss-pale);color:var(--moss);border:0.5px solid rgba(44,58,43,0.3)">parentId 자동연결</button>
        </div>
        <div id="admin-person-list">
          <div class="text-muted text-center" style="padding:20px 0">불러오는 중...</div>
        </div>
      </div>
      </div>

      <div id="section-members" style="display:none">
      <div class="section">
        <div class="section-title">가입 회원 목록
          <button class="btn btn-sm btn-secondary" onclick="App.loadMemberList()" style="margin-left:8px;font-size:11px">새로고침</button>
        </div>
        <div id="member-list">
          <div class="text-muted text-center" style="padding:20px 0">불러오는 중...</div>
        </div>
      </div>
      </div>
    `;

    // 먼저 인물 목록 로드 (드롭다운용 캐시 확보)
    await this.loadAdminList();

    // 세대 버튼 클릭
    document.querySelectorAll('.gen-btn').forEach(btn => {
      btn.addEventListener('click', async () => {
        document.querySelectorAll('.gen-btn').forEach(b => {
          b.style.background = '';
          b.style.color = '';
          b.style.borderColor = '';
        });
        btn.style.background = 'var(--moss)';
        btn.style.color = 'var(--paper)';
        btn.style.borderColor = 'var(--moss)';
        const gen = parseInt(btn.dataset.gen);
        document.getElementById('p-gen').value = gen;

        const parentGroup = document.getElementById('parent-group');
        if (gen === 1) {
          parentGroup.style.display = 'none';
        } else {
          parentGroup.style.display = 'block';
          await this.loadParentOptions(gen - 1);
        }
      });
    });

    // 등록 버튼
    document.getElementById('btn-add-person').addEventListener('click', () => this.submitAdminPerson());
  },

  async loadParentOptions(parentGen) {
    const select = document.getElementById('p-parent-select');
    select.innerHTML = '<option value="">— 부모 선택 —</option>';
    const candidates = this._adminPersons.filter(p => p.generation === parentGen);
    if (!candidates.length) {
      select.innerHTML = `<option value="">⚠️ ${parentGen}세 인물이 없습니다. 먼저 등록하세요.</option>`;
      return;
    }
    candidates.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = `${p.name} (${p.generation}세)`;
      select.appendChild(opt);
    });
  },

  async submitAdminPerson() {
    const name = document.getElementById('p-name').value.trim();
    const gen = parseInt(document.getElementById('p-gen').value);
    const resultEl = document.getElementById('admin-result');

    if (!name) { this._adminMsg('성함을 입력해 주세요.', false); return; }
    if (!gen)  { this._adminMsg('세대(世) 버튼을 선택해 주세요.', false); return; }

    const parentId = gen > 1
      ? (document.getElementById('p-parent-select')?.value || null)
      : null;

    // 2세 이상인데 부모 미선택 시 경고
    if (gen > 1 && !parentId) {
      this._adminMsg('부모를 선택해 주세요. 부모가 없으면 먼저 윗 세대를 등록하세요.', false);
      return;
    }

    // rootAncestorId: 부모의 rootAncestorId 자동 상속
    let rootAncestorId = null;
    if (gen === 1) {
      rootAncestorId = null; // 저장 후 자기 ID로 업데이트
    } else if (parentId) {
      const parent = this._adminPersons.find(p => p.id === parentId);
      // 부모의 루트 조상 ID 상속 (부모가 7대조면 부모 자신이 루트)
      rootAncestorId = parent?.rootAncestorId || parent?.id || null;
    }

    const data = {
      name,
      hanja: document.getElementById('p-hanja').value.trim(),
      surname: this.userProfile?.name?.slice(0,1) || '',
      bongwan: this.userProfile?.bongwan || '',
      pa: this.userProfile?.pa || '',
      generation: gen,
      birthYear: parseInt(document.getElementById('p-birth').value) || null,
      deathYear: parseInt(document.getElementById('p-death').value) || null,
      parentId: parentId || null,
      rootAncestorId,
      memorialLocation: document.getElementById('p-location').value.trim(),
      jesaDate: document.getElementById('p-jesa').value.trim(),
      addedByUid: Auth.getUid()
    };

    const btn = document.getElementById('btn-add-person');
    btn.textContent = '저장 중...'; btn.disabled = true;

    try {
      const id = await DB.savePerson(data);

      // 7대조이면 자기 자신을 루트로 설정
      if (gen === 1) {
        await DB.updatePerson(id, { rootAncestorId: id });
      }

      this._adminMsg(`✅ ${name} 등록 완료!`, true);

      // 입력 초기화
      document.getElementById('p-name').value = '';
      document.getElementById('p-hanja').value = '';
      document.getElementById('p-birth').value = '';
      document.getElementById('p-death').value = '';
      document.getElementById('p-location').value = '';
      document.getElementById('p-jesa').value = '';

      await this.loadAdminList();
    } catch (e) {
      this._adminMsg('오류: ' + e.message, false);
    } finally {
      btn.textContent = '등록하기'; btn.disabled = false;
    }
  },

  _adminMsg(msg, success) {
    const el = document.getElementById('admin-result');
    if (!el) return;
    el.style.display = 'block';
    el.style.color = success ? 'var(--moss)' : 'var(--rust)';
    el.textContent = msg;
  },

  async loadAdminList() {
    const el = document.getElementById('admin-person-list');
    if (!el) return;
    this._adminPersons = await DB.getAllPersons(100);
    if (!this._adminPersons.length) {
      el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">등록된 인물 없음</div>';
      return;
    }
    // 세대별 그룹
    const byGen = {};
    this._adminPersons.forEach(p => {
      const g = p.generation || 0;
      if (!byGen[g]) byGen[g] = [];
      byGen[g].push(p);
    });
    const gens = Object.keys(byGen).map(Number).sort((a,b) => a-b);
    el.innerHTML = gens.map(g => `
      <div style="margin-bottom:12px">
        <div style="font-size:11px;color:var(--ink-4);margin-bottom:6px;padding-left:2px">
          ${g}세 ${g===1?'(7대조)':g===2?'(6대조)':''}
        </div>
        ${byGen[g].map(p => `
          <div class="person-item" style="padding:10px 0">
            <div class="person-avatar ${p.deathYear?'deceased':''}" style="width:36px;height:36px;font-size:14px">${(p.name||'?')[0]}</div>
            <div style="flex:1">
              <div style="font-family:var(--font-serif);font-size:14px;font-weight:500">${p.name}</div>
              <div class="person-meta">
                ${p.birthYear||'?'}~${p.deathYear||'생존'}
                ${p.rootAncestorId ? ' · 연결됨 ✅' : ' · <span style="color:var(--rust)">미연결</span>'}
              </div>
            </div>
            <div style="display:flex;gap:4px">
              <button class="btn btn-sm" style="font-size:11px;color:var(--moss);background:none;border:0.5px solid var(--border-strong);padding:4px 10px;border-radius:6px"
                onclick="App.showEditPersonModal('${p.id}')">수정</button>
              <button class="btn btn-sm" style="font-size:11px;color:var(--rust);background:none;border:none;padding:4px 8px"
                onclick="App.deletePerson('${p.id}','${p.name}')">삭제</button>
            </div>
          </div>
        `).join('')}
      </div>
    `).join('');
  },

  async showEditPersonModal(personId) {
    const person = this._adminPersons.find(p => p.id === personId);
    if (!person) { this.showToast('인물 정보를 찾을 수 없습니다'); return; }

    // 기존 모달 제거
    document.querySelector('.edit-modal')?.remove();
    document.querySelector('.sheet-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet edit-modal';
    modal.style.maxHeight = '85dvh';
    modal.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">
        <div style="font-family:var(--font-serif);font-size:18px;font-weight:500">인물 수정</div>
        <span class="gen-badge">${person.generation}세</span>
      </div>
      <div class="form-group">
        <label class="form-label">성함 (한글) <span class="required">*</span></label>
        <input type="text" id="ep-name" class="form-input" value="${person.name || ''}" />
      </div>
      <div class="form-group">
        <label class="form-label">성함 (한자)</label>
        <input type="text" id="ep-hanja" class="form-input" value="${person.hanja || ''}" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">출생년도</label>
          <input type="number" id="ep-birth" class="form-input" value="${person.birthYear || ''}" placeholder="예) 1940" />
        </div>
        <div class="form-group">
          <label class="form-label">사망년도</label>
          <input type="number" id="ep-death" class="form-input" value="${person.deathYear || ''}" placeholder="작고 시 입력" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">납골당/묘역 위치</label>
        <input type="text" id="ep-location" class="form-input" value="${person.memorialLocation || ''}" placeholder="예) 추담공원 3구역 A-15" />
      </div>
      <div class="form-group">
        <label class="form-label">기제사일</label>
        <input type="text" id="ep-jesa" class="form-input" value="${person.jesaDate || ''}" placeholder="예) 음력 3월 15일" />
      </div>
      <div class="form-group">
        <label class="form-label">성별</label>
        <select id="ep-gender" class="form-select">
          <option value=""${!person.gender?' selected':''}>선택 안 함</option>
          <option value="M"${person.gender==='M'?' selected':''}>남성</option>
          <option value="F"${person.gender==='F'?' selected':''}>여성</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">배우자 연결 <span style="font-size:11px;color:var(--ink-4)">(같은 세대에서 선택)</span></label>
        <select id="ep-spouse" class="form-select">
          <option value="">— 배우자 없음 —</option>
          ${this._adminPersons
            .filter(p => p.generation === person.generation && p.id !== person.id)
            .map(p => '<option value="' + p.id + '"' + (p.id === person.spouseId ? ' selected' : '') + '>' + p.name + (p.gender==='F'?' (여)':p.gender==='M'?' (남)':'') + '</option>')
            .join('')}
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">부모 변경</label>
        <select id="ep-parent" class="form-select">
          <option value="">— 변경 안 함 —</option>
          ${this._adminPersons
            .filter(p => p.generation === (person.generation - 1))
            .map(p => '<option value="' + p.id + '"' + (p.id === person.parentId ? ' selected' : '') + '>' + p.name + ' (' + p.generation + '세)</option>')
            .join('')}
        </select>
      </div>
      <div style="display:flex;gap:10px;margin-top:8px">
        <button class="btn btn-secondary" style="flex:1" id="ep-cancel">취소</button>
        <button class="btn btn-primary" style="flex:2;border-radius:var(--radius-lg)" id="ep-save">저장</button>
      </div>
    `;
    document.body.appendChild(modal);

    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open');
      overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };

    overlay.addEventListener('click', close);
    document.getElementById('ep-cancel').addEventListener('click', close);

    document.getElementById('ep-save').addEventListener('click', async () => {
      const name = document.getElementById('ep-name').value.trim();
      if (!name) { this.showToast('성함을 입력해 주세요'); return; }

      const btn = document.getElementById('ep-save');
      btn.textContent = '저장 중...'; btn.disabled = true;

      try {
        const parentId = document.getElementById('ep-parent').value || person.parentId || null;
        const updatedData = {
          name,
          hanja: document.getElementById('ep-hanja').value.trim(),
          birthYear: parseInt(document.getElementById('ep-birth').value) || null,
          deathYear: parseInt(document.getElementById('ep-death').value) || null,
          memorialLocation: document.getElementById('ep-location').value.trim(),
          jesaDate: document.getElementById('ep-jesa').value.trim(),
          parentId
        };

        const spouseId = document.getElementById('ep-spouse')?.value || null;
        const gender = document.getElementById('ep-gender')?.value || null;
        if (spouseId) updatedData.spouseId = spouseId;
        if (gender) updatedData.gender = gender;
        await DB.updatePerson(personId, updatedData);
        // 배우자도 역방향 연결
        if (spouseId) await DB.updatePerson(spouseId, { spouseId: personId });
        this.showToast(name + ' 수정 완료!');
        close();
        await this.loadAdminList();
        setTimeout(() => this.loadTree(), 400);
      } catch(e) {
        this.showToast('저장 실패: ' + e.message);
        btn.textContent = '저장'; btn.disabled = false;
      }
    });
  },

  async deletePerson(id, name) {
    if (!confirm(name + ' 을(를) 삭제하시겠습니까?')) return;
    try {
      await db.collection('persons').doc(id).delete();
      this.showToast(name + ' 삭제 완료');
      await this.loadAdminList();
    } catch(e) {
      this.showToast('삭제 실패: ' + e.message);
    }
  },

  // ── 미연결 인물 일괄 자동 연결 ─────────────────
  async bulkFixConnections() {
    const persons = this._adminPersons;
    if (!persons.length) { this.showToast('먼저 목록을 새로고침 해주세요'); return; }

    // 7대조(1세) 찾기
    const root = persons.find(p => p.generation === 1);
    if (!root) { this.showToast('7대조(1세)를 먼저 등록해주세요'); return; }
    const rootId = root.id;

    // 세대 순서대로 정렬
    const sorted = [...persons].sort((a, b) => (a.generation||0) - (b.generation||0));

    // ID → 인물 맵
    const byId = {};
    sorted.forEach(p => byId[p.id] = p);

    let fixed = 0;
    let failed = 0;

    for (const p of sorted) {
      // 이미 연결됐으면 스킵
      if (p.rootAncestorId) continue;

      try {
        let rootAncestorId = rootId; // 기본값: 7대조

        // parentId가 있으면 부모의 rootAncestorId 상속
        if (p.parentId && byId[p.parentId]) {
          rootAncestorId = byId[p.parentId].rootAncestorId || rootId;
        }

        await DB.updatePerson(p.id, { rootAncestorId });
        byId[p.id].rootAncestorId = rootAncestorId; // 캐시 업데이트
        fixed++;
      } catch(e) {
        failed++;
        console.error('연결 실패:', p.name, e);
      }
    }

    this.showToast(fixed + '명 연결 완료!' + (failed ? ' (' + failed + '명 실패)' : ''));
    await this.loadAdminList();
    // 가계도도 즉시 갱신
    setTimeout(() => this.loadTree(), 500);
  },

  // ── Admin Tab 전환 ───────────────────────────
  showAdminTab(tab) {
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const activeBtn = document.getElementById('admin-tab-' + tab);
    if (activeBtn) activeBtn.classList.add('active');

    if (tab === 'persons') {
      // 인물 관리 섹션 표시, 회원 관리 숨김
      const ps = document.getElementById('section-persons');
      const ms = document.getElementById('section-members');
      if (ps) ps.style.display = '';
      if (ms) ms.style.display = 'none';
    } else {
      const ps = document.getElementById('section-persons');
      const ms = document.getElementById('section-members');
      if (ps) ps.style.display = 'none';
      if (ms) { ms.style.display = ''; this.loadMemberList(); }
    }
  },

  // ── 회원 목록 로드 ────────────────────────────
  async loadMemberList() {
    const el = document.getElementById('member-list');
    if (!el) return;
    el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">불러오는 중...</div>';
    try {
      const snap = await db.collection('users').get();
      const members = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      if (!members.length) {
        el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">등록된 회원 없음</div>';
        return;
      }
      el.innerHTML = '';
      members.forEach(function(m) {
        const isAdmin = m.role === 'admin';
        const isSelf = m.id === App.userProfile?.id;
        const div = document.createElement('div');
        div.className = 'person-item';
        div.style.cssText = 'padding:12px 0';
        div.innerHTML = '<div class="person-avatar" style="width:38px;height:38px;font-size:15px">' + ((m.name||'?')[0]) + '</div>'
          + '<div style="flex:1;min-width:0">'
          + '<div style="font-family:var(--font-serif);font-size:14px;font-weight:500">' + (m.name||'미상') + '</div>'
          + '<div class="person-meta" style="margin-top:2px">' + (m.email||'') + '</div>'
          + '<div style="margin-top:4px;display:flex;gap:6px;align-items:center">'
          + '<span style="font-size:10px;padding:2px 8px;border-radius:10px;background:' + (isAdmin?'var(--gold-pale)':'var(--paper-2)') + ';color:' + (isAdmin?'var(--gold)':'var(--ink-4)') + '">' + (m.role||'member') + '</span>'
          + (m.birthYear ? '<span class="person-meta">' + m.birthYear + '년생</span>' : '')
          + '</div></div>'
          + '<div style="display:flex;gap:4px"></div>';

        const btnWrap = div.querySelector('div:last-child');
        const editBtn = document.createElement('button');
        editBtn.className = 'btn btn-sm';
        editBtn.style.cssText = 'font-size:11px;color:var(--moss);background:none;border:0.5px solid var(--border-strong);padding:4px 10px;border-radius:6px';
        editBtn.textContent = '수정';
        editBtn.addEventListener('click', function() { App.showEditMemberModal(m.id); });
        btnWrap.appendChild(editBtn);

        if (!isSelf) {
          const delBtn = document.createElement('button');
          delBtn.className = 'btn btn-sm';
          delBtn.style.cssText = 'font-size:11px;color:var(--rust);background:none;border:none;padding:4px 8px';
          delBtn.textContent = '삭제';
          delBtn.addEventListener('click', function() { App.deleteMember(m.id, m.name); });
          btnWrap.appendChild(delBtn);
        }
        el.appendChild(div);
      });
    } catch(e) {
      el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">오류: ' + e.message + '</div>';
    }
  },

  // ── 회원 수정 모달 ────────────────────────────
  async showEditMemberModal(uid) {
    const doc = await db.collection('users').doc(uid).get();
    if (!doc.exists) { this.showToast('회원 정보를 찾을 수 없습니다'); return; }
    const m = { id: doc.id, ...doc.data() };

    document.querySelector('.edit-modal')?.remove();
    document.querySelector('.sheet-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'sheet-overlay';
    document.body.appendChild(overlay);

    const modal = document.createElement('div');
    modal.className = 'bottom-sheet edit-modal';
    modal.style.maxHeight = '80dvh';
    modal.innerHTML = '<div class="bottom-sheet-handle"></div>'
      + '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:16px">'
      + '<div style="font-family:var(--font-serif);font-size:18px;font-weight:500">회원 정보 수정</div>'
      + '<button id="ep-cancel" style="width:28px;height:28px;background:rgba(60,55,45,0.08);border:none;border-radius:50%;cursor:pointer;font-size:14px;color:var(--ink-3)">✕</button>'
      + '</div>'
      + '<div class="form-group"><label class="form-label">성명</label>'
      + '<input type="text" id="em-name" class="form-input" value="' + (m.name||'') + '" /></div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">출생연도</label>'
      + '<input type="number" id="em-birth" class="form-input" value="' + (m.birthYear||'') + '" placeholder="예) 1975" /></div>'
      + '<div class="form-group"><label class="form-label">세수(世)</label>'
      + '<input type="number" id="em-saesu" class="form-input" value="' + (m.saesu||'') + '" placeholder="예) 8" /></div>'
      + '</div>'
      + '<div class="form-row">'
      + '<div class="form-group"><label class="form-label">본관</label>'
      + '<input type="text" id="em-bongwan" class="form-input" value="' + (m.bongwan||'의령') + '" /></div>'
      + '<div class="form-group"><label class="form-label">파</label>'
      + '<input type="text" id="em-pa" class="form-input" value="' + (m.pa||'사천백파') + '" /></div>'
      + '</div>'
      + '<div class="form-group"><label class="form-label">권한</label>'
      + '<select id="em-role" class="form-select">'
      + '<option value="member"' + (m.role!=='admin'?' selected':'') + '>member (일반)</option>'
      + '<option value="admin"' + (m.role==='admin'?' selected':'') + '>admin (관리자)</option>'
      + '</select></div>'
      + '<div style="display:flex;gap:10px;margin-top:8px">'
      + '<button id="em-save" class="btn btn-primary" style="flex:1;border-radius:var(--radius-lg)">저장</button>'
      + '</div>';

    document.body.appendChild(modal);
    overlay.classList.add('active');
    setTimeout(() => modal.classList.add('open'), 10);

    const close = () => {
      modal.classList.remove('open');
      overlay.classList.remove('active');
      setTimeout(() => { modal.remove(); overlay.remove(); }, 350);
    };
    overlay.addEventListener('click', close);
    document.getElementById('ep-cancel').addEventListener('click', close);
    document.getElementById('em-save').addEventListener('click', async () => {
      const btn = document.getElementById('em-save');
      btn.textContent = '저장 중...'; btn.disabled = true;
      try {
        await DB.saveUserProfile(uid, {
          name: document.getElementById('em-name').value.trim(),
          birthYear: parseInt(document.getElementById('em-birth').value)||null,
          saesu: parseInt(document.getElementById('em-saesu').value)||null,
          bongwan: document.getElementById('em-bongwan').value.trim(),
          pa: document.getElementById('em-pa').value.trim(),
          role: document.getElementById('em-role').value
        });
        this.showToast('수정 완료!');
        close();
        await this.loadMemberList();
      } catch(e) {
        this.showToast('저장 실패: ' + e.message);
        btn.textContent = '저장'; btn.disabled = false;
      }
    });
  },

  // ── 회원 삭제 ────────────────────────────────
  async deleteMember(uid, name) {
    if (!confirm((name||'이 회원') + '을(를) 삭제하시겠습니까?')) return;
    try {
      await db.collection('users').doc(uid).delete();
      this.showToast((name||'회원') + ' 삭제 완료');
      await this.loadMemberList();
    } catch(e) {
      this.showToast('삭제 실패: ' + e.message);
    }
  },

    // ── parentId 일괄 자동 연결 ──────────────────
  // 세대 순서대로 1세→2세→...→N세 직계 자동 연결
  async bulkFixParentIds() {
    const persons = this._adminPersons;
    if (!persons.length) { this.showToast('먼저 목록을 새로고침 해주세요'); return; }

    // 세대별 정렬
    const sorted = [...persons].sort((a, b) => (a.generation||0) - (b.generation||0));
    const byId = {};
    sorted.forEach(p => byId[p.id] = p);

    let fixed = 0, skipped = 0, failed = 0;

    for (const p of sorted) {
      // 이미 parentId 있으면 스킵
      if (p.parentId) { skipped++; continue; }
      // 1세(7대조)는 부모 없음
      if (p.generation <= 1) { skipped++; continue; }

      // 같은 rootAncestorId 중 바로 윗 세대 찾기
      const parentGen = p.generation - 1;
      const rootId = p.rootAncestorId;

      let candidates = sorted.filter(x =>
        x.generation === parentGen &&
        (rootId ? x.rootAncestorId === rootId : true)
      );

      // 못 찾으면 세대만으로
      if (!candidates.length) {
        candidates = sorted.filter(x => x.generation === parentGen);
      }

      if (!candidates.length) { skipped++; continue; }

      // 후보가 1명이면 자동, 여러 명이면 첫 번째
      const parent = candidates[0];
      try {
        await DB.updatePerson(p.id, { parentId: parent.id });
        byId[p.id].parentId = parent.id;
        fixed++;
      } catch(e) {
        failed++;
        console.error('parentId 연결 실패:', p.name, e);
      }
    }

    this.showToast('parentId 연결: ' + fixed + '명 완료' + (skipped?' / '+skipped+'명 스킵':'') + (failed?' / '+failed+'명 실패':''));
    await this.loadAdminList();
    setTimeout(() => this.loadTree(), 500);
  },

    // ── Ancestor Setup ────────────────────────────
  renderAncestorSetup() {
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div class="page-title">7대조 등록</div>
        </div>
      </div>
      <div class="section">
        <div class="card-moss" style="margin-bottom:20px;text-align:center;padding:24px">
          <div style="font-size:40px;margin-bottom:8px">🌳</div>
          <div style="font-family:var(--font-serif);font-size:16px">우리 가문의 뿌리를 등록해 주세요</div>
          <div style="font-size:12px;opacity:0.7;margin-top:4px">가계도의 시작점이 됩니다</div>
        </div>
        <div class="form-group">
          <label class="form-label">7대조 성함 <span class="required">*</span></label>
          <input type="text" id="a-name" class="form-input" placeholder="한글 성함" />
        </div>
        <div class="form-group">
          <label class="form-label">한자 성함</label>
          <input type="text" id="a-hanja" class="form-input" placeholder="한자 성함" />
        </div>
        <div class="form-row">
          <div class="form-group">
            <label class="form-label">본관 <span class="required">*</span></label>
            <input type="text" id="a-bongwan" class="form-input" placeholder="안동" />
          </div>
          <div class="form-group">
            <label class="form-label">파 <span class="required">*</span></label>
            <input type="text" id="a-pa" class="form-input" placeholder="충무공파" />
          </div>
        </div>
        <div class="form-group">
          <label class="form-label">묘소/납골당 위치</label>
          <input type="text" id="a-location" class="form-input" placeholder="예) 추담공원 1구역 A-01" />
        </div>
        <div class="form-group">
          <label class="form-label">기제사일</label>
          <input type="text" id="a-jesa" class="form-input" placeholder="예) 음력 3월 15일" />
        </div>
        <button class="btn btn-gold mt-8" id="btn-save-ancestor">등록 완료</button>
      </div>
    `;
    document.getElementById('btn-save-ancestor').addEventListener('click', async () => {
      const data = {
        name: document.getElementById('a-name').value.trim(),
        hanja: document.getElementById('a-hanja').value.trim(),
        bongwan: document.getElementById('a-bongwan').value.trim(),
        pa: document.getElementById('a-pa').value.trim(),
        memorialLocation: document.getElementById('a-location').value.trim(),
        jesaDate: document.getElementById('a-jesa').value.trim(),
        generation: 1,
        parentId: null,
        rootAncestorId: null
      };
      if (!data.name || !data.bongwan || !data.pa) {
        this.showToast('성함, 본관, 파는 필수입니다'); return;
      }
      try {
        const id = await DB.savePerson(data);
        await DB.updatePerson(id, { rootAncestorId: id }); // 자기 자신이 루트
        this.showToast('7대조 등록 완료!');
        setTimeout(() => this.navigate('home'), 1000);
      } catch (e) {
        this.showToast('오류: ' + e.message);
      }
    });
  },

  // ── Person Detail Sheet ───────────────────────
  showPersonDetail(person) {
    let sheet = document.querySelector('.bottom-sheet');
    if (!sheet) {
      sheet = document.createElement('div');
      sheet.className = 'bottom-sheet';
      document.body.appendChild(sheet);
    }
    let overlay = document.querySelector('.sheet-overlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.className = 'sheet-overlay';
      document.body.appendChild(overlay);
    }

    sheet.innerHTML = `
      <div class="bottom-sheet-handle"></div>
      <div class="flex-center gap-12 mb-16">
        <div class="person-avatar" style="width:52px;height:52px;font-size:20px">${(person.name || '?')[0]}</div>
        <div>
          <div style="font-family:var(--font-serif);font-size:20px;font-weight:500">${person.name || '미상'}</div>
          ${person.hanja ? `<div style="font-size:14px;color:var(--gold)">${person.hanja}</div>` : ''}
        </div>
      </div>
      <div class="card" style="margin-bottom:12px">
        <div class="person-item">
          <div style="width:64px;color:var(--ink-3);font-size:13px">세대</div>
          <div>${person.generation || '?'}세</div>
        </div>
        <div class="person-item">
          <div style="width:64px;color:var(--ink-3);font-size:13px">생몰연도</div>
          <div>${person.birthYear || '미상'} ~ ${person.deathYear || '미상'}</div>
        </div>
        ${person.memorialLocation ? `
        <div class="person-item">
          <div style="width:64px;color:var(--ink-3);font-size:13px">안치 위치</div>
          <div style="color:var(--moss)">${person.memorialLocation}</div>
        </div>` : ''}
        ${person.jesaDate ? `
        <div class="person-item">
          <div style="width:64px;color:var(--ink-3);font-size:13px">기제사</div>
          <div>${person.jesaDate}</div>
        </div>` : ''}
      </div>
    `;

    overlay.classList.add('active');
    setTimeout(() => sheet.classList.add('open'), 10);
    overlay.onclick = () => {
      sheet.classList.remove('open');
      overlay.classList.remove('active');
    };
  },

  // ── Match Detail ──────────────────────────────
  async renderMatchDetail(requestId) {
    this.showToast('연결 요청 정보를 불러오는 중...');
    // TODO: 실제 요청 데이터 로드 및 승인/거절 UI
  },

  // ── Toast ─────────────────────────────────────
  showToast(msg) {
    let toast = document.getElementById('app-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'app-toast';
      toast.className = 'toast';
      document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    setTimeout(() => toast.classList.remove('show'), 2500);
  },

  renderProfileEdit() {
    this.showToast('준비 중인 기능입니다');
  }
};

// ── Entry Point ────────────────────────────────
document.addEventListener('DOMContentLoaded', () => App.init());

// ── Service Worker 등록 ─────────────────────────
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    // 상대경로로 등록 → GitHub Pages 하위 폴더에서도 작동
    navigator.serviceWorker.register('./sw.js').catch(e => console.log('SW 등록 실패:', e));
  });
}
