// ── Tree Renderer ───────────────────────────────
// 나를 중심으로 위(조상) ↑ / 아래(후손) ↓
// 미입력 세대는 회색 점선 ghost 노드로 표시

const Tree = {
  NODE_W: 130,
  NODE_H: 58,
  H_GAP: 24,
  V_GAP: 64,

  // ── Ghost 트리 생성 ──────────────────────────
  // selfGen: 나의 세대(世), 예) 8
  // MAX_GEN: 총 세대 수 (7대조=1 ~ 현재 이하)
  buildGhostTree(realPersons, selfGen, totalGens) {
    const nodes = [];
    const edges = [];

    // 실제 데이터 맵
    const byGen = {};
    realPersons.forEach(p => {
      const g = p.generation || 1;
      if (!byGen[g]) byGen[g] = [];
      byGen[g].push(p);
    });

    const COLS = 1; // 직계 1줄 + 방계는 실데이터로만

    for (let gen = 1; gen <= totalGens; gen++) {
      const real = byGen[gen] || [];
      const isGhost = real.length === 0;

      // 직계 노드 1개 (실제 or ghost)
      if (isGhost) {
        const label = gen === 1 ? '7대조' :
                      gen === selfGen ? '나' :
                      gen < selfGen ? `${selfGen - gen}대 조상` :
                      `${gen - selfGen}대 후손`;
        nodes.push({
          id: `ghost-${gen}`,
          ghost: true,
          generation: gen,
          label,
          x: 0, // 계산 후 설정
          y: (gen - 1) * (this.NODE_H + this.V_GAP)
        });
      } else {
        real.forEach((p, i) => {
          const offset = (i - (real.length - 1) / 2) * (this.NODE_W + this.H_GAP);
          nodes.push({
            ...p,
            ghost: false,
            x: offset,
            y: (gen - 1) * (this.NODE_H + this.V_GAP)
          });
        });
      }
    }

    // 엣지: 세대 사이 연결
    for (let gen = 2; gen <= totalGens; gen++) {
      const parentNodes = nodes.filter(n => n.generation === gen - 1);
      const childNodes  = nodes.filter(n => n.generation === gen);
      parentNodes.forEach(p => {
        childNodes.forEach(c => {
          // ghost → ghost, real → real, 혼합 모두 연결
          edges.push({ fromId: p.id, toId: c.id,
            x1: p.x, y1: p.y + this.NODE_H,
            x2: c.x, y2: c.y,
            isGhost: p.ghost || c.ghost
          });
        });
      });
    }

    return { nodes, edges };
  },

  // ── SVG 렌더링 ───────────────────────────────
  render(container, realPersons, selfPersonId, selfGen, totalGens) {
    const svgNS = 'http://www.w3.org/2000/svg';

    // 최소 총 세대: 7대조(1) ~ 내 세대 + 2 (후손 여백)
    const minGen = Math.max(selfGen + 2, 9);
    const usedTotalGens = totalGens || minGen;

    const { nodes, edges } = this.buildGhostTree(realPersons, selfGen, usedTotalGens);

    const PAD = 48;
    const xs = nodes.map(n => n.x);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xs) - this.NODE_W / 2 - PAD;
    const maxX = Math.max(...xs) + this.NODE_W / 2 + PAD;
    const minY = Math.min(...ys) - PAD;
    const maxY = Math.max(...ys) + this.NODE_H + PAD;
    const W = Math.max(maxX - minX, 280);
    const H = maxY - minY;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', `${minX} ${minY} ${W} ${H}`);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.cssText = 'display:block;';

    // ── 엣지 ──
    edges.forEach(e => {
      const path = document.createElementNS(svgNS, 'path');
      const midY = (e.y1 + e.y2) / 2;
      path.setAttribute('d', `M ${e.x1} ${e.y1} C ${e.x1} ${midY}, ${e.x2} ${midY}, ${e.x2} ${e.y2}`);
      path.setAttribute('fill', 'none');
      path.setAttribute('stroke', e.isGhost ? 'rgba(60,55,45,0.12)' : 'rgba(60,55,45,0.28)');
      path.setAttribute('stroke-width', '1.5');
      if (e.isGhost) path.setAttribute('stroke-dasharray', '5,4');
      svg.appendChild(path);
    });

    // ── 노드 ──
    nodes.forEach(n => {
      const isSelf    = n.id === selfPersonId;
      const isRoot    = n.generation === 1;
      const isGhost   = n.ghost;
      const isDeceased = !isGhost && !!n.deathYear;

      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-id', n.id);
      g.style.cursor = isGhost ? 'pointer' : 'pointer';

      const rx = n.x - this.NODE_W / 2;
      const ry = n.y;

      // 배경
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', rx);
      rect.setAttribute('y', ry);
      rect.setAttribute('width', this.NODE_W);
      rect.setAttribute('height', this.NODE_H);
      rect.setAttribute('rx', '8');

      if (isGhost) {
        rect.setAttribute('fill', 'rgba(240,235,224,0.5)');
        rect.setAttribute('stroke', 'rgba(60,55,45,0.2)');
        rect.setAttribute('stroke-dasharray', '4,3');
        rect.setAttribute('stroke-width', '1');
      } else if (isSelf) {
        rect.setAttribute('fill', '#2C3A2B');
        rect.setAttribute('stroke', '#2C3A2B');
        rect.setAttribute('stroke-width', '0');
      } else if (isRoot) {
        rect.setAttribute('fill', '#F5EDD8');
        rect.setAttribute('stroke', 'rgba(154,123,58,0.45)');
        rect.setAttribute('stroke-width', '1');
      } else if (isDeceased) {
        rect.setAttribute('fill', '#EDE8DF');
        rect.setAttribute('stroke', 'rgba(60,55,45,0.18)');
        rect.setAttribute('stroke-width', '0.5');
      } else {
        rect.setAttribute('fill', '#F8F5EF');
        rect.setAttribute('stroke', 'rgba(60,55,45,0.2)');
        rect.setAttribute('stroke-width', '0.5');
      }
      g.appendChild(rect);

      if (isGhost) {
        // + 아이콘
        const plus = document.createElementNS(svgNS, 'text');
        plus.setAttribute('x', n.x);
        plus.setAttribute('y', ry + 24);
        plus.setAttribute('text-anchor', 'middle');
        plus.setAttribute('font-size', '16');
        plus.setAttribute('fill', 'rgba(60,55,45,0.3)');
        plus.setAttribute('font-family', 'sans-serif');
        plus.textContent = '+';
        g.appendChild(plus);

        const label = document.createElementNS(svgNS, 'text');
        label.setAttribute('x', n.x);
        label.setAttribute('y', ry + 42);
        label.setAttribute('text-anchor', 'middle');
        label.setAttribute('font-size', '10');
        label.setAttribute('fill', 'rgba(60,55,45,0.35)');
        label.setAttribute('font-family', 'Noto Sans KR, sans-serif');
        label.textContent = n.label || '';
        g.appendChild(label);

        // ghost 클릭 → 인물 추가 화면
        g.addEventListener('click', () => App.showAddPersonModal(n.generation));
      } else {
        // 이름
        const nameEl = document.createElementNS(svgNS, 'text');
        nameEl.setAttribute('x', n.x);
        nameEl.setAttribute('y', ry + 24);
        nameEl.setAttribute('text-anchor', 'middle');
        nameEl.setAttribute('font-family', 'Noto Serif KR, serif');
        nameEl.setAttribute('font-size', '13');
        nameEl.setAttribute('font-weight', '500');
        nameEl.setAttribute('fill', isSelf ? '#F8F5EF' : isRoot ? '#9A7B3A' : '#1C1C1A');
        nameEl.textContent = n.name || '미상';
        g.appendChild(nameEl);

        // 세대·연도
        const sub = document.createElementNS(svgNS, 'text');
        sub.setAttribute('x', n.x);
        sub.setAttribute('y', ry + 41);
        sub.setAttribute('text-anchor', 'middle');
        sub.setAttribute('font-family', 'Noto Sans KR, sans-serif');
        sub.setAttribute('font-size', '10');
        sub.setAttribute('fill', isSelf ? 'rgba(248,245,239,0.65)' : '#9E9E95');
        const yr = n.birthYear ? `${n.birthYear}` : '';
        const dy = n.deathYear ? `~${n.deathYear}` : '';
        sub.textContent = `${n.generation}세${yr ? ' · '+yr : ''}${dy}`;
        g.appendChild(sub);

        g.addEventListener('click', () => App.showPersonDetail(n));
      }

      svg.appendChild(g);
    });

    container.innerHTML = '';
    container.appendChild(svg);
    this.initDrag(container);

    // 내 노드로 스크롤
    const selfNode = nodes.find(n => n.id === selfPersonId);
    if (selfNode) {
      const scrollX = selfNode.x - container.clientWidth / 2 + minX * -1;
      const scrollY = selfNode.y - container.clientHeight / 3 + minY * -1;
      setTimeout(() => {
        container.scrollLeft = Math.max(0, scrollX - PAD);
        container.scrollTop  = Math.max(0, scrollY - PAD);
      }, 100);
    }
  },

  initDrag(el) {
    let sx, sy, sl, st, on = false;
    const start = e => { on=true; sx=e.touches?e.touches[0].pageX:e.pageX; sy=e.touches?e.touches[0].pageY:e.pageY; sl=el.scrollLeft; st=el.scrollTop; };
    const move  = e => { if(!on)return; const cx=e.touches?e.touches[0].pageX:e.pageX,cy=e.touches?e.touches[0].pageY:e.pageY; el.scrollLeft=sl-(cx-sx); el.scrollTop=st-(cy-sy); };
    const end   = () => { on=false; };
    el.addEventListener('mousedown', start);
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start, {passive:true});
    el.addEventListener('touchmove', move, {passive:true});
    el.addEventListener('touchend', end);
  }
};
