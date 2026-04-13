// ── Database Module ─────────────────────────────
// Firestore 컬렉션 구조:
// /users/{uid}           → 사용자 프로필
// /persons/{id}          → 가문 인물 데이터
// /mergeRequests/{id}    → 가계도 연결 요청

const DB = {

  // ── Users ────────────────────────────────────

  async saveUserProfile(uid, data) {
    await db.collection('users').doc(uid).set({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
  },

  async getUserProfile(uid) {
    const doc = await db.collection('users').doc(uid).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  async updateUserProfile(uid, data) {
    await db.collection('users').doc(uid).update({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    });
  },

  // ── Persons (가문 인물) ──────────────────────

  async savePerson(data) {
    const ref = await db.collection('persons').add({
      ...data,
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  },

  async updatePerson(id, data) {
    await db.collection('persons').doc(id).update(data);
  },

  async getPerson(id) {
    const doc = await db.collection('persons').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  // 7대조 기준으로 가문 전체 인물 조회
  async getPersonsByAncestorId(ancestorId) {
    const snap = await db.collection('persons')
      .where('rootAncestorId', '==', ancestorId)
      .orderBy('generation', 'asc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // rootAncestorId 기준 전체 인물 조회 (tree 렌더용)
  async getPersonsByRootId(rootId) {
    const snap = await db.collection('persons')
      .where('rootAncestorId', '==', rootId)
      .orderBy('generation', 'asc')
      .get();
    const persons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    // 루트 본인도 포함
    const root = await this.getPerson(rootId);
    if (root && !persons.find(p => p.id === rootId)) persons.unshift(root);
    return persons;
  },

  // 직접 입력한 7대조 조상 찾기 (매칭용)
  async findAncestorByInfo(surname, bongwan, pa, name) {
    const snap = await db.collection('persons')
      .where('generation', '==', 1)
      .where('surname', '==', surname)
      .where('bongwan', '==', bongwan)
      .where('pa', '==', pa)
      .where('name', '==', name)
      .limit(5)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // 나의 직계 조상 가져오기
  async getMyLineage(personId) {
    const results = [];
    let currentId = personId;
    while (currentId) {
      const person = await this.getPerson(currentId);
      if (!person) break;
      results.unshift(person);
      currentId = person.parentId || null;
    }
    return results;
  },

  // 자녀 목록 가져오기
  async getChildren(personId) {
    const snap = await db.collection('persons')
      .where('parentId', '==', personId)
      .orderBy('birthYear', 'asc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // ── Merge Requests (연결 요청) ───────────────

  async sendMergeRequest(fromUid, toUid, fromPersonId, toPersonId, commonAncestorId) {
    const ref = await db.collection('mergeRequests').add({
      fromUid, toUid, fromPersonId, toPersonId, commonAncestorId,
      status: 'pending',  // pending / accepted / rejected
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  },

  async getMergeRequests(uid) {
    const snap = await db.collection('mergeRequests')
      .where('toUid', '==', uid)
      .where('status', '==', 'pending')
      .orderBy('createdAt', 'desc')
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  async updateMergeRequest(requestId, status) {
    await db.collection('mergeRequests').doc(requestId).update({ status });
  },

  // ── Admin: 전체 인물 목록 ─────────────────────

  async getAllPersons(limit = 100) {
    const snap = await db.collection('persons')
      .orderBy('generation', 'asc')
      .limit(limit)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // 7대조 뿌리 인물만 조회
  async getRootAncestors() {
    const snap = await db.collection('persons')
      .where('generation', '==', 1)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  }
};
