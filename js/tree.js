// ── Tree Renderer v2 ────────────────────────────
// 배우자 연결 + 형제 다수 표시 + 직계/방계 토글 + 브랜치 접기

const Tree = {
  NODE_W: 110,
  NODE_H: 52,
  SPOUSE_W: 90,
  SPOUSE_H: 44,
  H_GAP: 16,
  V_GAP: 80,
  SPOUSE_GAP: 8,
  showLineageOnly: true,
  collapsed: new Set(),

  // ── 직계 ID 집합 ─────────────────────────────
  getLineageIds(persons, selfId) {
    const byId = {};
    persons.forEach(p => byId[p.id] = p);
    const ids = new Set();
    // 위로: 직계 조상
    let cur = byId[selfId];
    while (cur) {
      ids.add(cur.id);
      // 배우자도 직계에 포함
      if (cur.spouseId && byId[cur.spouseId]) ids.add(cur.spouseId);
      cur = cur.parentId ? byId[cur.parentId] : null;
    }
    // 아래로: 모든 후손
    const addDesc = id => {
      persons.filter(p => p.parentId === id || p.parentId2 === id).forEach(c => {
        ids.add(c.id);
        if (c.spouseId && byId[c.spouseId]) ids.add(c.spouseId);
        addDesc(c.id);
      });
    };
    addDesc(selfId);
    return ids;
  },

  // ── 접힌 노드 후손 제거 ──────────────────────
  applyCollapse(persons) {
    if (!this.collapsed.size) return persons;
    const childrenOf = {};
    persons.forEach(p => {
      [p.parentId, p.parentId2].filter(Boolean).forEach(pid => {
        if (!childrenOf[pid]) childrenOf[pid] = [];
        childrenOf[pid].push(p.id);
      });
    });
    const hiddenIds = new Set();
    this.collapsed.forEach(cId => {
      const queue = [...(childrenOf[cId] || [])];
      while (queue.length) {
        const id = queue.shift();
        hiddenIds.add(id);
        if (childrenOf[id]) queue.push(...childrenOf[id]);
      }
    });
    return persons.filter(p => !hiddenIds.has(p.id));
  },

  toggleCollapse(nodeId) {
    if (this.collapsed.has(nodeId)) this.collapsed.delete(nodeId);
    else this.collapsed.add(nodeId);
  },

  // ── 레이아웃 계산 ─────────────────────────────
  // 실제 인물 데이터 기반으로 위치 계산
  // 같은 parentId를 가진 형제들을 가로로 배열
  layout(persons, selfGen, totalGens) {
    const nodes = [];
    const edges = [];
    const byId = {};
    persons.forEach(p => byId[p.id] = { ...p });

    // 배우자로 연결된 ID 집합 (독립 노드로 표시하지 않음)
    const spouseRenderedIds = new Set();
    persons.forEach(p => {
      if (p.spouseId && byId[p.spouseId]) {
        // spouseId가 있는 쪽의 배우자는 인라인으로만 표시
        // 성별이 F(여성)이면 배우자 인라인 표시
        if (byId[p.spouseId].gender === 'F' || !byId[p.spouseId].gender) {
          spouseRenderedIds.add(p.spouseId);
        } else {
          spouseRenderedIds.add(p.id);
        }
      }
    });

    // 세대별 그룹 (배우자 인라인 렌더링 대상 제외)
    const byGen = {};
    persons.forEach(p => {
      if (spouseRenderedIds.has(p.id)) return; // 배우자 인라인 → 독립 노드 제외
      const g = p.generation || 1;
      if (!byGen[g]) byGen[g] = [];
      byGen[g].push(p);
    });

    const posMap = {}; // id -> {x, y}

    const gens = Object.keys(byGen).map(Number).sort((a,b) => a-b);
    const allGens = [];
    for (let g = 1; g <= totalGens; g++) allGens.push(g);

    allGens.forEach(gen => {
      const realList = byGen[gen] || [];
      const y = (gen - 1) * (this.NODE_H + this.V_GAP);

      if (!realList.length) {
        // ghost 노드
        const label = gen === 1 ? '7대조' : gen === selfGen ? '나' :
          gen < selfGen ? (selfGen-gen)+'대 조상' : (gen-selfGen)+'대 후손';
        nodes.push({ id: 'ghost-'+gen, ghost: true, generation: gen, label, x: 0, y });
        posMap['ghost-'+gen] = { x: 0, y };
        return;
      }

      // 부모별로 그룹핑
      const parentGroups = {};
      realList.forEach(p => {
        const key = p.parentId || 'root';
        if (!parentGroups[key]) parentGroups[key] = [];
        parentGroups[key].push(p);
      });

      // 각 그룹을 부모 위치 기준으로 배치
      let totalOffset = 0;
      const groupOffsets = [];

      Object.keys(parentGroups).forEach(pKey => {
        const siblings = parentGroups[pKey];
        const groupW = siblings.length * (this.NODE_W + this.H_GAP) - this.H_GAP;
        groupOffsets.push({ pKey, siblings, groupW, startX: totalOffset });
        totalOffset += groupW + this.H_GAP * 3;
      });

      // 전체 중앙 정렬
      const totalW = totalOffset - this.H_GAP * 3;
      const offsetX = -totalW / 2;

      groupOffsets.forEach(({ pKey, siblings, groupW, startX }) => {
        const groupCenterX = offsetX + startX + groupW / 2;

        // 부모 위치와 맞추기 (부모가 있으면)
        const parentPos = posMap[pKey];
        const baseX = parentPos ? parentPos.x - groupW / 2 + (this.NODE_W / 2) : groupCenterX - groupW / 2 + this.NODE_W / 2;

        siblings.forEach((p, i) => {
          const x = (parentPos ? parentPos.x - (siblings.length - 1) * (this.NODE_W + this.H_GAP) / 2 : groupCenterX - groupW / 2 + this.NODE_W / 2) + i * (this.NODE_W + this.H_GAP);
          posMap[p.id] = { x, y };
          nodes.push({ ...p, ghost: false, x, y });

          // 배우자 노드
          if (p.spouseId && byId[p.spouseId]) {
            const sp = byId[p.spouseId];
            const sx = x + this.NODE_W / 2 + this.SPOUSE_GAP + this.SPOUSE_W / 2;
            posMap[p.spouseId] = { x: sx, y: y + (this.NODE_H - this.SPOUSE_H) / 2 };
            nodes.push({ ...sp, ghost: false, isSpouse: true, x: sx, y: y + (this.NODE_H - this.SPOUSE_H) / 2 });
          }
        });
      });
    });

    // 엣지 생성
    nodes.forEach(n => {
      if (n.ghost || n.isSpouse) return;
      if (n.parentId && posMap[n.parentId]) {
        const pp = posMap[n.parentId];
        edges.push({ x1: pp.x, y1: pp.y + this.NODE_H, x2: n.x, y2: n.y, isGhost: false });
      } else if (n.generation > 1) {
        // ghost 부모와 연결
        const ghostPos = posMap['ghost-' + (n.generation - 1)];
        if (ghostPos) {
          edges.push({ x1: ghostPos.x, y1: ghostPos.y + this.NODE_H, x2: n.x, y2: n.y, isGhost: true });
        }
      }
      // 배우자 연결선 (가로)
      if (n.spouseId && posMap[n.spouseId]) {
        const sp = posMap[n.spouseId];
        edges.push({ x1: n.x + this.NODE_W / 2, y1: n.y + this.NODE_H / 2, x2: sp.x - this.SPOUSE_W / 2, y2: sp.y + this.SPOUSE_H / 2, isSpouse: true });
      }
    });

    return { nodes, edges };
  },

  // ── SVG 렌더링 ────────────────────────────────
  render(container, realPersons, selfPersonId, selfGen, totalGens) {
    const svgNS = 'http://www.w3.org/2000/svg';

    let displayPersons = this.applyCollapse(realPersons);
    const lineageIds = (selfPersonId && selfPersonId !== 'self-temp')
      ? this.getLineageIds(realPersons, selfPersonId) : null;

    if (this.showLineageOnly && lineageIds) {
      displayPersons = displayPersons.filter(p => lineageIds.has(p.id) || p.isSpouse);
    }

    const gens = displayPersons.map(p => p.generation||0).filter(g=>g>0);
    const maxGen = gens.length ? Math.max(...gens) : selfGen;
    const usedTotal = Math.max(totalGens||0, maxGen+2, selfGen+2, 9);

    const { nodes, edges } = this.layout(displayPersons, selfGen, usedTotal);

    if (!nodes.length) {
      container.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:200px;color:var(--ink-4);font-size:13px">가계 데이터가 없습니다</div>';
      return;
    }

    const PAD = 60;
    const xs = nodes.map(n => n.isSpouse ? n.x + this.SPOUSE_W/2 : n.x + this.NODE_W/2);
    const xsL = nodes.map(n => n.isSpouse ? n.x - this.SPOUSE_W/2 : n.x - this.NODE_W/2);
    const ys = nodes.map(n => n.y);
    const minX = Math.min(...xsL) - PAD;
    const maxX = Math.max(...xs) + PAD;
    const minY = Math.min(...ys) - PAD;
    const maxY = Math.max(...ys) + this.NODE_H + PAD;
    const W = Math.max(maxX - minX, 300);
    const H = maxY - minY;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', minX+' '+minY+' '+W+' '+H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.cssText = 'display:block;';

    // 엣지
    edges.forEach(e => {
      if (e.isSpouse) {
        // 배우자 연결 - 가로 실선
        const line = document.createElementNS(svgNS, 'line');
        line.setAttribute('x1', e.x1); line.setAttribute('y1', e.y1);
        line.setAttribute('x2', e.x2); line.setAttribute('y2', e.y2);
        line.setAttribute('stroke', 'rgba(154,123,58,0.4)');
        line.setAttribute('stroke-width', '1.5');
        line.setAttribute('stroke-dasharray', '4,3');
        svg.appendChild(line);
      } else {
        const path = document.createElementNS(svgNS, 'path');
        const midY = (e.y1 + e.y2) / 2;
        path.setAttribute('d', 'M '+e.x1+' '+e.y1+' C '+e.x1+' '+midY+', '+e.x2+' '+midY+', '+e.x2+' '+e.y2);
        path.setAttribute('fill', 'none');
        path.setAttribute('stroke', e.isGhost ? 'rgba(60,55,45,0.1)' : 'rgba(60,55,45,0.3)');
        path.setAttribute('stroke-width', '1.5');
        if (e.isGhost) path.setAttribute('stroke-dasharray', '5,4');
        svg.appendChild(path);
      }
    });

    // 노드
    nodes.forEach(n => {
      const isSelf     = n.id === selfPersonId;
      const isRoot     = n.generation === 1 && !n.ghost;
      const isGhost    = n.ghost;
      const isSpouse   = !!n.isSpouse;
      const isDeceased = !isGhost && !!n.deathYear;
      const inLineage  = lineageIds ? lineageIds.has(n.id) : true;
      const isSide     = !isGhost && !isSpouse && !inLineage;
      const isCollapsed = this.collapsed.has(n.id);
      const hasChildren = realPersons.some(p => p.parentId === n.id);

      const nw = isSpouse ? this.SPOUSE_W : this.NODE_W;
      const nh = isSpouse ? this.SPOUSE_H : this.NODE_H;
      const g = document.createElementNS(svgNS, 'g');
      g.style.cursor = 'pointer';

      const rx = n.x - nw/2;
      const ry = n.y;

      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', rx); rect.setAttribute('y', ry);
      rect.setAttribute('width', nw); rect.setAttribute('height', nh);
      rect.setAttribute('rx', '7');

      if (isGhost) {
        rect.setAttribute('fill', 'rgba(240,235,224,0.45)');
        rect.setAttribute('stroke', 'rgba(60,55,45,0.15)');
        rect.setAttribute('stroke-dasharray', '4,3');
        rect.setAttribute('stroke-width', '1');
      } else if (isSelf) {
        rect.setAttribute('fill', '#2C3A2B');
        rect.setAttribute('stroke-width', '0');
      } else if (isSpouse) {
        rect.setAttribute('fill', '#F5EDD8');
        rect.setAttribute('stroke', 'rgba(154,123,58,0.35)');
        rect.setAttribute('stroke-width', '1');
      } else if (isRoot) {
        rect.setAttribute('fill', '#F5EDD8');
        rect.setAttribute('stroke', 'rgba(154,123,58,0.5)');
        rect.setAttribute('stroke-width', '1');
      } else if (isSide) {
        rect.setAttribute('fill', '#EDEBE6');
        rect.setAttribute('stroke', 'rgba(60,55,45,0.1)');
        rect.setAttribute('stroke-width', '0.5');
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
        const plus = document.createElementNS(svgNS, 'text');
        plus.setAttribute('x', n.x); plus.setAttribute('y', ry+20);
        plus.setAttribute('text-anchor', 'middle'); plus.setAttribute('font-size', '14');
        plus.setAttribute('fill', 'rgba(60,55,45,0.25)'); plus.setAttribute('font-family', 'sans-serif');
        plus.textContent = '+';
        g.appendChild(plus);
        const lbl = document.createElementNS(svgNS, 'text');
        lbl.setAttribute('x', n.x); lbl.setAttribute('y', ry+35);
        lbl.setAttribute('text-anchor', 'middle'); lbl.setAttribute('font-size', '10');
        lbl.setAttribute('fill', 'rgba(60,55,45,0.3)');
        lbl.setAttribute('font-family', 'Noto Sans KR, sans-serif');
        lbl.textContent = n.label || '';
        g.appendChild(lbl);
        g.addEventListener('click', () => App.showAddPersonModal(n.generation));
      } else {
        // 배우자 표시
        if (isSpouse) {
          const spLabel = document.createElementNS(svgNS, 'text');
          spLabel.setAttribute('x', n.x); spLabel.setAttribute('y', ry+8);
          spLabel.setAttribute('text-anchor', 'middle'); spLabel.setAttribute('font-size', '8');
          spLabel.setAttribute('fill', 'rgba(154,123,58,0.6)');
          spLabel.setAttribute('font-family', 'Noto Sans KR, sans-serif');
          spLabel.textContent = n.gender === 'F' ? '배우자' : '배우자';
          g.appendChild(spLabel);
        }

        // 왼쪽 성별 컬러 바 (FamilySearch 스타일)
        const genderColor = n.gender === 'F' ? '#d4537e' : '#378ADD';
        const barColor = isSelf ? 'rgba(255,255,255,0.3)' : isSpouse ? '#d4537e' : (n.gender === 'F' ? '#d4537e' : '#378ADD');
        if (!isGhost) {
          const bar = document.createElementNS(svgNS, 'rect');
          bar.setAttribute('x', rx);
          bar.setAttribute('y', ry);
          bar.setAttribute('width', '4');
          bar.setAttribute('height', isSpouse ? String(this.SPOUSE_H) : String(this.NODE_H));
          bar.setAttribute('rx', '7');
          bar.setAttribute('fill', barColor);
          g.appendChild(bar);
        }

        const nameEl = document.createElementNS(svgNS, 'text');
        nameEl.setAttribute('x', rx + 12);
        nameEl.setAttribute('y', isSpouse ? ry+18 : ry+20);
        nameEl.setAttribute('text-anchor', 'start');
        nameEl.setAttribute('font-family', 'Noto Serif KR, serif');
        nameEl.setAttribute('font-size', isSpouse ? '11' : '13');
        nameEl.setAttribute('font-weight', '500');
        nameEl.setAttribute('fill', isSelf?'#F8F5EF':isSide?'#AAAAA0':'#1C1C1A');
        nameEl.textContent = n.name || '미상';
        g.appendChild(nameEl);

        const sub = document.createElementNS(svgNS, 'text');
        sub.setAttribute('x', rx + 12);
        sub.setAttribute('y', isSpouse ? ry+32 : ry+36);
        sub.setAttribute('text-anchor', 'start');
        sub.setAttribute('font-family', 'Noto Sans KR, sans-serif');
        sub.setAttribute('font-size', '9');
        sub.setAttribute('fill', isSelf?'rgba(248,245,239,0.6)':'#9E9E95');
        const yr = n.birthYear ? String(n.birthYear) : '';
        sub.textContent = (yr ? yr+'년' : '') + (n.deathYear ? '~'+n.deathYear : (yr?'~생존':''));
        g.appendChild(sub);

        g.addEventListener('click', () => App.showPersonDetail(n));

        // 접기/펼치기 버튼
        if (hasChildren && !isSpouse) {
          const bx = n.x;
          const by = ry + this.NODE_H + 10;
          const btnG = document.createElementNS(svgNS, 'g');
          btnG.style.cursor = 'pointer';
          const circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', bx); circle.setAttribute('cy', by);
          circle.setAttribute('r', '10');
          circle.setAttribute('fill', isSelf?'#3d5c3b':isRoot?'#e8d8a0':'#E6DFD0');
          circle.setAttribute('stroke', 'rgba(60,55,45,0.2)'); circle.setAttribute('stroke-width', '0.5');
          btnG.appendChild(circle);
          const arrow = document.createElementNS(svgNS, 'text');
          arrow.setAttribute('x', bx); arrow.setAttribute('y', by+4);
          arrow.setAttribute('text-anchor', 'middle'); arrow.setAttribute('font-size', '12');
          arrow.setAttribute('fill', isSelf?'#F8F5EF':isRoot?'#9A7B3A':'#6B6B64');
          arrow.setAttribute('font-family', 'sans-serif');
          arrow.textContent = isCollapsed ? '+' : '−';
          btnG.appendChild(arrow);
          btnG.addEventListener('click', e => { e.stopPropagation(); Tree.toggleCollapse(n.id); App.loadTree(); });
          g.appendChild(btnG);
        }
      }
      svg.appendChild(g);
    });

    // 상단 컨트롤 바
    // 컨트롤 바를 가계도 컨테이너 바깥 위에 고정
    const treeWrap = container.parentElement;
    // 기존 컨트롤 바 제거
    const existingCtrl = treeWrap?.querySelector('.tree-ctrl-bar');
    if (existingCtrl) existingCtrl.remove();

    const ctrlBar = document.createElement('div');
    ctrlBar.className = 'tree-ctrl-bar';
    ctrlBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:6px 12px;background:var(--paper);border-bottom:0.5px solid var(--border);position:sticky;top:0;z-index:10;';
    ctrlBar.innerHTML = '<span style="font-size:11px;color:var(--ink-4)">'
      + (this.showLineageOnly ? '직계 모드' : '방계 모드') + '</span>'
      + '<div style="display:flex;gap:6px">'
      + (this.collapsed.size > 0 ? '<button id="tree-expand-all" style="font-size:11px;padding:4px 10px;background:var(--paper);border:0.5px solid var(--border-strong);border-radius:20px;color:var(--ink-3);cursor:pointer;font-family:var(--font-sans)">모두 펼치기</button>' : '')
      + '<button id="tree-toggle-btn" style="font-size:11px;padding:4px 12px;background:'
      + (this.showLineageOnly ? 'var(--moss);color:var(--paper)' : 'var(--paper);color:var(--moss)')
      + ';border:0.5px solid var(--moss);border-radius:20px;cursor:pointer;font-family:var(--font-sans)">'
      + (this.showLineageOnly ? '방계 모드' : '직계 모드') + '</button>'
      + '</div>';

    container.innerHTML = '';
    container.appendChild(ctrlBar);
    container.appendChild(svg);

    document.getElementById('tree-toggle-btn').addEventListener('click', () => { Tree.showLineageOnly = !Tree.showLineageOnly; App.loadTree(); });
    const exBtn = document.getElementById('tree-expand-all');
    if (exBtn) exBtn.addEventListener('click', () => { Tree.collapsed.clear(); App.loadTree(); });

    this.initDrag(container);

    // 내 노드로 스크롤
    const selfNode = nodes.find(n => n.id === selfPersonId);
    if (selfNode) {
      setTimeout(() => {
        container.scrollLeft = Math.max(0, selfNode.x - container.clientWidth/2 - minX - PAD);
        container.scrollTop  = Math.max(0, selfNode.y - container.clientHeight/3 - minY - PAD);
      }, 100);
    }
  },

  initDrag(el) {
    let sx, sy, sl, st, on = false;
    const start = e => { on=true; sx=e.touches?e.touches[0].pageX:e.pageX; sy=e.touches?e.touches[0].pageY:e.pageY; sl=el.scrollLeft; st=el.scrollTop; };
    const move  = e => { if(!on)return; const cx=e.touches?e.touches[0].pageX:e.pageX,cy=e.touches?e.touches[0].pageY:e.pageY; el.scrollLeft=sl-(cx-sx); el.scrollTop=st-(cy-sy); };
    const end   = () => { on=false; };
    el.addEventListener('mousedown', start); el.addEventListener('mousemove', move);
    el.addEventListener('mouseup', end); el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start, {passive:true}); el.addEventListener('touchmove', move, {passive:true});
    el.addEventListener('touchend', end);
  }
};
