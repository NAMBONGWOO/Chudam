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
      case 'home': this.renderHome(); break;
      case 'memorial': this.renderMemorial(); break;
      case 'clan': this.renderClan(); break;
      case 'profile': this.renderProfile(); break;
    }
  },

  onLogin(user) {
    this.loadUserData(user.uid).then(() => {
      this.navigate('home');
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
        <input type="email" id="login-email" class="form-input" placeholder="email@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호</label>
        <input type="password" id="login-pw" class="form-input" placeholder="비밀번호 입력" />
      </div>
      <button class="btn btn-primary mt-16" id="btn-login">로그인</button>
      <div class="auth-divider mt-16">또는</div>
      <button class="btn btn-secondary w-full" id="btn-google">
        <svg width="18" height="18" viewBox="0 0 18 18"><path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/><path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 009 18z"/><path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 013.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 000 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/><path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 00.957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/></svg>
        Google로 로그인
      </button>
      <div id="auth-error" class="text-center mt-12" style="color:var(--rust);font-size:13px;display:none"></div>
    `;
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
      <div class="form-group">
        <label class="form-label">성명 <span class="required">*</span></label>
        <input type="text" id="su-name" class="form-input" placeholder="홍길동" />
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">본관 <span class="required">*</span></label>
          <input type="text" id="su-bongwan" class="form-input" placeholder="예) 안동" />
        </div>
        <div class="form-group">
          <label class="form-label">파 <span class="required">*</span></label>
          <input type="text" id="su-pa" class="form-input" placeholder="예) 충무공파" />
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">세수(世) <span class="required">*</span></label>
          <input type="number" id="su-saesu" class="form-input" placeholder="예) 8" min="1" max="30" />
          <div class="form-hint">시조로부터 몇 번째 세대</div>
        </div>
        <div class="form-group">
          <label class="form-label">대손(代孫)</label>
          <input type="number" id="su-daeson" class="form-input" placeholder="자동계산" readonly style="background:var(--paper-2);color:var(--ink-3)" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">이메일 <span class="required">*</span></label>
        <input type="email" id="su-email" class="form-input" placeholder="email@example.com" />
      </div>
      <div class="form-group">
        <label class="form-label">비밀번호 <span class="required">*</span></label>
        <input type="password" id="su-pw" class="form-input" placeholder="6자 이상" />
      </div>
      <button class="btn btn-primary mt-16" id="btn-signup">회원가입</button>
      <div id="auth-error" class="text-center mt-12" style="color:var(--rust);font-size:13px;display:none"></div>
    `;
    // 세수 입력 시 대손 자동계산
    document.getElementById('su-saesu').addEventListener('input', (e) => {
      const saesu = parseInt(e.target.value) || 0;
      document.getElementById('su-daeson').value = saesu > 0 ? saesu - 1 : '';
    });
    document.getElementById('btn-signup').addEventListener('click', async () => {
      const name = document.getElementById('su-name').value.trim();
      const bongwan = document.getElementById('su-bongwan').value.trim();
      const pa = document.getElementById('su-pa').value.trim();
      const saesu = parseInt(document.getElementById('su-saesu').value) || 0;
      const email = document.getElementById('su-email').value.trim();
      const pw = document.getElementById('su-pw').value;
      if (!name || !bongwan || !pa || !saesu || !email || !pw) {
        this.showAuthError('모든 필수 항목을 입력해 주세요.'); return;
      }
      try {
        document.getElementById('btn-signup').textContent = '처리 중...';
        const user = await Auth.signUp(email, pw, name);
        await DB.saveUserProfile(user.uid, {
          name, bongwan, pa, saesu, daeson: saesu - 1, email,
          role: 'member', createdAt: new Date().toISOString()
        });
      } catch (e) {
        this.showAuthError(e.message || '회원가입에 실패했습니다.');
        document.getElementById('btn-signup').textContent = '회원가입';
      }
    });
  },

  showAuthError(msg) {
    const el = document.getElementById('auth-error');
    if (el) { el.textContent = msg; el.style.display = 'block'; }
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
    const totalGens = Math.max(selfGen + 2, 9); // 7대조~나+후손 여백 2세대

    try {
      // 내가 연결된 인물 데이터 로드 (있으면 실제, 없으면 ghost만)
      let realPersons = [];
      if (p.personId) {
        // personId가 있으면 같은 rootAncestorId 전체 로드
        const me = await DB.getPerson(p.personId);
        if (me?.rootAncestorId) {
          realPersons = await DB.getPersonsByRootId(me.rootAncestorId);
        }
      } else {
        // personId 없으면 본인 정보만 임시 노드로
        realPersons = [{
          id: 'self-temp',
          name: p.name,
          generation: selfGen,
          bongwan: p.bongwan,
          pa: p.pa
        }];
      }

      const container = document.getElementById('tree-wrap');
      Tree.render(container, realPersons, p.personId || 'self-temp', selfGen, totalGens);
    } catch (e) {
      console.error('트리 로드 오류:', e);
      const container = document.getElementById('tree-wrap');
      if (container) {
        // 에러 시에도 기본 ghost 트리는 보여줌
        Tree.render(container, [{
          id: 'self-temp',
          name: p?.name || '나',
          generation: selfGen
        }], 'self-temp', selfGen, Math.max(selfGen + 2, 9));
      }
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
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-title">추모공원</div>
            <div class="page-subtitle">조상님의 안치 위치와 추모 기록</div>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="card-moss">
          <div style="font-family:var(--font-serif);font-size:16px;margin-bottom:4px">추담공원</div>
          <div style="font-size:12px;opacity:0.7">우리 가문의 추모공원</div>
          <div style="margin-top:16px;display:flex;gap:12px">
            <button class="btn btn-sm" style="background:rgba(248,245,239,0.15);color:var(--paper);border:0.5px solid rgba(248,245,239,0.3)">
              오시는 길
            </button>
            <button class="btn btn-sm" style="background:rgba(248,245,239,0.15);color:var(--paper);border:0.5px solid rgba(248,245,239,0.3)">
              납골당 위치
            </button>
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">안치 현황</div>
        <div id="memorial-list">
          <div class="text-center text-muted" style="padding:40px 0">
            <div style="font-size:28px;margin-bottom:8px">🪔</div>
            등록된 안치 정보가 없습니다
          </div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">추모 게시판</div>
        <div class="card">
          <div class="text-muted text-center" style="padding:20px 0">
            <div style="font-size:24px;margin-bottom:8px">📝</div>
            가족들과 추모 기록을 나눠보세요
          </div>
          <button class="btn btn-ghost w-full mt-12">글 작성하기</button>
        </div>
      </div>
    `;
    this.loadMemorialList();
  },

  async loadMemorialList() {
    const el = document.getElementById('memorial-list');
    if (!el) return;
    const persons = await DB.getAllPersons(20);
    const deceased = persons.filter(p => p.memorialLocation);
    if (!deceased.length) return;
    el.innerHTML = deceased.map(p => `
      <div class="person-item" onclick="App.showPersonDetail(${JSON.stringify(p).replace(/"/g,'&quot;')})">
        <div class="person-avatar deceased">${(p.name || '미')[0]}</div>
        <div style="flex:1">
          <div class="person-name">${p.name || '미상'}</div>
          <div class="person-meta">${p.generation || '?'}세 · ${p.birthYear || '?'}년 ~ ${p.deathYear || '?'}년</div>
          ${p.memorialLocation ? `<div class="person-meta" style="color:var(--moss);margin-top:2px">📍 ${p.memorialLocation}</div>` : ''}
        </div>
      </div>
    `).join('');
  },

  // ── Clan Page ─────────────────────────────────
  renderClan() {
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <div>
            <div class="page-title">문중 관리</div>
            <div class="page-subtitle">기점 조상 · 행사 · 공지</div>
          </div>
          ${this.userProfile?.role === 'admin' ? `<button class="btn btn-sm btn-secondary" onclick="App.renderAdminPage()">관리자 메뉴</button>` : ''}
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
        <button class="btn btn-secondary w-full" onclick="App.logout()">로그아웃</button>
      </div>
    `;
  },

  async logout() {
    await Auth.signOut();
  },

  // ── Admin Page ────────────────────────────────
  renderAdminPage() {
    document.getElementById('page-container').innerHTML = `
      <div class="page-header">
        <div class="page-header-inner">
          <button onclick="App.navigate('clan')" style="background:none;border:none;cursor:pointer;color:var(--moss);font-size:14px">← 뒤로</button>
          <div class="page-title">관리자</div>
          <div></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">인물 등록</div>
        <div class="card">
          <div class="form-group">
            <label class="form-label">성함 (한글) <span class="required">*</span></label>
            <input type="text" id="p-name" class="form-input" placeholder="예) 홍길동" />
          </div>
          <div class="form-group">
            <label class="form-label">성함 (한자)</label>
            <input type="text" id="p-hanja" class="form-input" placeholder="예) 洪吉童" />
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">성씨</label>
              <input type="text" id="p-surname" class="form-input" placeholder="홍" />
            </div>
            <div class="form-group">
              <label class="form-label">본관</label>
              <input type="text" id="p-bongwan" class="form-input" placeholder="안동" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">파</label>
              <input type="text" id="p-pa" class="form-input" placeholder="충무공파" />
            </div>
            <div class="form-group">
              <label class="form-label">세대(世) <span class="required">*</span></label>
              <input type="number" id="p-gen" class="form-input" placeholder="1=7대조" min="1" />
            </div>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">출생년도</label>
              <input type="number" id="p-birth" class="form-input" placeholder="예) 1850" />
            </div>
            <div class="form-group">
              <label class="form-label">사망년도</label>
              <input type="number" id="p-death" class="form-input" placeholder="예) 1920" />
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">부모 ID</label>
            <input type="text" id="p-parent" class="form-input" placeholder="부모 인물의 문서 ID (7대조는 비워두세요)" />
          </div>
          <div class="form-group">
            <label class="form-label">루트 조상 ID</label>
            <input type="text" id="p-root" class="form-input" placeholder="7대조의 문서 ID (7대조 본인은 비워두세요)" />
          </div>
          <div class="form-group">
            <label class="form-label">납골당/묘역 위치</label>
            <input type="text" id="p-location" class="form-input" placeholder="예) 추담공원 3구역 A-15" />
          </div>
          <div class="form-group">
            <label class="form-label">기제사일</label>
            <input type="text" id="p-jesa" class="form-input" placeholder="예) 음력 3월 15일" />
          </div>
          <button class="btn btn-primary mt-8" id="btn-add-person">인물 등록</button>
          <div id="admin-result" class="text-center mt-12" style="font-size:13px;display:none"></div>
        </div>
      </div>
      <div class="section">
        <div class="section-title">등록된 인물 목록</div>
        <div id="admin-person-list">
          <div class="text-muted text-center" style="padding:20px 0">불러오는 중...</div>
        </div>
      </div>
    `;
    document.getElementById('btn-add-person').addEventListener('click', async () => {
      const data = {
        name: document.getElementById('p-name').value.trim(),
        hanja: document.getElementById('p-hanja').value.trim(),
        surname: document.getElementById('p-surname').value.trim(),
        bongwan: document.getElementById('p-bongwan').value.trim(),
        pa: document.getElementById('p-pa').value.trim(),
        generation: parseInt(document.getElementById('p-gen').value) || null,
        birthYear: parseInt(document.getElementById('p-birth').value) || null,
        deathYear: parseInt(document.getElementById('p-death').value) || null,
        parentId: document.getElementById('p-parent').value.trim() || null,
        rootAncestorId: document.getElementById('p-root').value.trim() || null,
        memorialLocation: document.getElementById('p-location').value.trim(),
        jesaDate: document.getElementById('p-jesa').value.trim()
      };
      if (!data.name || !data.generation) {
        document.getElementById('admin-result').style.display = 'block';
        document.getElementById('admin-result').style.color = 'var(--rust)';
        document.getElementById('admin-result').textContent = '성함과 세대는 필수입니다.';
        return;
      }
      try {
        const id = await DB.savePerson(data);
        const el = document.getElementById('admin-result');
        el.style.display = 'block';
        el.style.color = 'var(--moss)';
        el.textContent = `✅ 등록 완료! ID: ${id}`;
        this.loadAdminList();
      } catch (e) {
        document.getElementById('admin-result').style.display = 'block';
        document.getElementById('admin-result').style.color = 'var(--rust)';
        document.getElementById('admin-result').textContent = '오류: ' + e.message;
      }
    });
    this.loadAdminList();
  },

  async loadAdminList() {
    const el = document.getElementById('admin-person-list');
    if (!el) return;
    const persons = await DB.getAllPersons(50);
    if (!persons.length) { el.innerHTML = '<div class="text-muted text-center" style="padding:20px 0">등록된 인물 없음</div>'; return; }
    el.innerHTML = persons.map(p => `
      <div class="person-item">
        <div class="person-avatar deceased">${(p.name || '?')[0]}</div>
        <div style="flex:1">
          <div class="person-name">${p.name}</div>
          <div class="person-meta">${p.generation}세 · ID: <code style="font-size:10px;background:var(--paper-2);padding:1px 4px;border-radius:3px">${p.id}</code></div>
          ${p.parentId ? `<div class="person-meta">부모: ${p.parentId.slice(0,8)}...</div>` : ''}
        </div>
      </div>
    `).join('');
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
