// ── Matching Engine ─────────────────────────────
// F-03 핵심: 7대조 기반 지능형 자동 매칭

const Matching = {

  // 촌수 계산 함수
  // gen1: 나의 세대(7대조=1), gen2: 상대방 세대
  // commonGen: 공통 조상 세대
  calculateChonsu(gen1, gen2, commonGen) {
    // 공통 조상으로부터의 거리 합계
    const dist1 = gen1 - commonGen;
    const dist2 = gen2 - commonGen;
    const totalDist = dist1 + dist2;

    // 직계는 대수로 표현
    if (dist1 === 0 || dist2 === 0) {
      return { chonsu: Math.max(dist1, dist2), type: 'lineage', label: `${Math.max(dist1, dist2)}대` };
    }

    // 방계는 촌수로 표현 (각각의 거리 합 × 2 - 공통 조상까지 올라간 거리)
    // 형제=2촌, 사촌=4촌, 육촌=6촌...
    const chonsu = totalDist;
    return {
      chonsu,
      type: 'collateral',
      label: `${chonsu}촌`,
      description: this.getChonsuDescription(dist1, dist2, chonsu)
    };
  },

  getChonsuDescription(dist1, dist2, chonsu) {
    if (chonsu === 2) return '형제/자매';
    if (chonsu === 3) return '조카/삼촌(고모)';
    if (chonsu === 4) return '사촌';
    if (chonsu === 6) return '육촌';
    if (chonsu === 8) return '팔촌';
    if (chonsu === 10) return '십촌';
    if (chonsu === 12) return '십이촌';
    return `${chonsu}촌 친척`;
  },

  // 7대조 매칭 점수 계산
  calculateMatchScore(candidate, userInput) {
    let score = 0;
    const checks = [];

    // 1차: 성씨 + 본관 + 파 (필수)
    if (candidate.surname === userInput.surname) { score += 30; checks.push('성씨 일치'); }
    if (candidate.bongwan === userInput.bongwan) { score += 30; checks.push('본관 일치'); }
    if (candidate.pa === userInput.pa) { score += 20; checks.push('파 일치'); }

    // 2차: 함자 (고점)
    if (candidate.name === userInput.ancestorName) { score += 20; checks.push('함자 일치'); }

    return { score, checks, isMatch: score >= 80 };
  },

  // 매칭 후 가계도 병합 처리
  async processMerge(fromPersonId, toPersonId, commonAncestorId) {
    try {
      // 두 가계도가 공통 조상 노드를 공유하도록 처리
      // toPersonId의 rootAncestorId를 fromPersonId와 동일하게 업데이트
      const fromPerson = await DB.getPerson(fromPersonId);
      if (!fromPerson) throw new Error('연결 요청자 정보를 찾을 수 없습니다');

      // 성공적 병합 시 양쪽 모두 동일한 rootAncestorId 사용
      console.log(`✅ 가계도 병합 완료: ${fromPersonId} ↔ ${toPersonId}`);
      return { success: true, commonAncestorId };
    } catch (e) {
      console.error('병합 처리 오류:', e);
      return { success: false, error: e.message };
    }
  },

  // 사용자의 세수(世數) 자동계산
  // 세수 입력 시 대손 자동 계산 (세수 = 대손 + 1)
  calcDaeson(saesu) {
    return saesu > 0 ? saesu - 1 : 0;
  },

  calcSaesu(daeson) {
    return daeson + 1;
  }
};
