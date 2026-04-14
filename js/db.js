// ── Database Module ─────────────────────────────
// orderBy + where 복합 쿼리는 Firestore 인덱스 필요
// → orderBy 제거하고 클라이언트에서 정렬하는 방식으로 통일

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
    await db.collection('users').doc(uid).set({
      ...data,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    }, { merge: true });
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
    await db.collection('persons').doc(id).set(data, { merge: true });
  },

  async getPerson(id) {
    const doc = await db.collection('persons').doc(id).get();
    return doc.exists ? { id: doc.id, ...doc.data() } : null;
  },

  // 전체 persons 가져온 뒤 클라이언트 정렬 (인덱스 불필요)
  async getAllPersons(limit = 200) {
    const snap = await db.collection('persons').limit(limit).get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (a.generation || 0) - (b.generation || 0));
  },

  // rootAncestorId 기준 전체 인물 (트리 렌더용)
  async getPersonsByRootId(rootId) {
    const snap = await db.collection('persons')
      .where('rootAncestorId', '==', rootId)
      .get();
    const persons = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    const root = await this.getPerson(rootId);
    if (root && !persons.find(p => p.id === rootId)) persons.unshift(root);
    return persons.sort((a, b) => (a.generation || 0) - (b.generation || 0));
  },

  // 7대조(generation=1) 인물만
  async getRootAncestors() {
    const snap = await db.collection('persons')
      .where('generation', '==', 1)
      .get();
    return snap.docs.map(d => ({ id: d.id, ...d.data() }));
  },

  // 자녀 목록
  async getChildren(personId) {
    const snap = await db.collection('persons')
      .where('parentId', '==', personId)
      .get();
    const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    return list.sort((a, b) => (a.birthYear || 0) - (b.birthYear || 0));
  },

  // 나의 직계 조상 체인
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

  // 7대조 매칭용 검색
  async findAncestorByInfo(surname, bongwan, pa, name) {
    const snap = await db.collection('persons')
      .where('generation', '==', 1)
      .get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(p =>
        p.surname === surname &&
        p.bongwan === bongwan &&
        p.pa === pa &&
        p.name === name
      );
  },

  // ── Merge Requests ───────────────────────────

  async sendMergeRequest(fromUid, toUid, fromPersonId, toPersonId, commonAncestorId) {
    const ref = await db.collection('mergeRequests').add({
      fromUid, toUid, fromPersonId, toPersonId, commonAncestorId,
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    });
    return ref.id;
  },

  async getMergeRequests(uid) {
    const snap = await db.collection('mergeRequests')
      .where('toUid', '==', uid)
      .get();
    return snap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(d => d.status === 'pending')
      .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0));
  },

  async updateMergeRequest(requestId, status) {
    await db.collection('mergeRequests').doc(requestId).update({ status });
  }
};
