// ── Tree Renderer ───────────────────────────────
// 직계/방계 토글 + 각 노드 자손 접기/펼치기 동시 지원

const Tree = {
  NODE_W: 130,
  NODE_H: 58,
  H_GAP: 24,
  V_GAP: 80,
  showLineageOnly: true,
  collapsed: new Set(),

  // ── 직계 ID 집합 ─────────────────────────────
  getLineageIds(persons, selfId) {
    const byId = {};
    persons.forEach(p => byId[p.id] = p);
    const ids = new Set();
    let cur = byId[selfId];
    while (cur) { ids.add(cur.id); cur = cur.parentId ? byId[cur.parentId] : null; }
    const addDesc = id => {
      persons.filter(p => p.parentId === id).forEach(c => { ids.add(c.id); addDesc(c.id); });
    };
    addDesc(selfId);
    return ids;
  },

  // ── 접힌 노드의 자손 제거 ────────────────────
  applyCollapse(persons) {
    if (this.collapsed.size === 0) return persons;
    const childrenOf = {};
    persons.forEach(p => {
      if (p.parentId) {
        if (!childrenOf[p.parentId]) childrenOf[p.parentId] = [];
        childrenOf[p.parentId].push(p.id);
      }
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

  // ── Ghost 트리 레이아웃 ──────────────────────
  buildGhostTree(persons, selfGen, totalGens) {
    const nodes = [], edges = [];
    const byGen = {};
    persons.forEach(p => {
      const g = p.generation || 1;
      if (!byGen[g]) byGen[g] = [];
      byGen[g].push(p);
    });

    for (let gen = 1; gen <= totalGens; gen++) {
      const real = byGen[gen] || [];
      if (!real.length) {
        const label = gen === 1 ? '7대조' : gen === selfGen ? '나' :
          gen < selfGen ? (selfGen-gen)+'대 조상' : (gen-selfGen)+'대 후손';
        nodes.push({ id:'ghost-'+gen, ghost:true, generation:gen, label, x:0, y:(gen-1)*(this.NODE_H+this.V_GAP) });
      } else {
        real.forEach((p, i) => {
          const offset = (i-(real.length-1)/2)*(this.NODE_W+this.H_GAP);
          nodes.push({ ...p, ghost:false, x:offset, y:(gen-1)*(this.NODE_H+this.V_GAP) });
        });
      }
    }

    for (let gen = 2; gen <= totalGens; gen++) {
      const parents = nodes.filter(n => n.generation === gen-1);
      const children = nodes.filter(n => n.generation === gen);
      parents.forEach(p => children.forEach(c => {
        edges.push({ x1:p.x, y1:p.y+this.NODE_H, x2:c.x, y2:c.y, isGhost:p.ghost||c.ghost });
      }));
    }
    return { nodes, edges };
  },

  // ── 메인 렌더 ────────────────────────────────
  render(container, realPersons, selfPersonId, selfGen, totalGens) {
    const svgNS = 'http://www.w3.org/2000/svg';

    // 1) 접기 적용
    let displayPersons = this.applyCollapse(realPersons);

    // 2) 직계 필터 적용
    const lineageIds = (selfPersonId && selfPersonId !== 'self-temp')
      ? this.getLineageIds(realPersons, selfPersonId) : null;
    if (this.showLineageOnly && lineageIds) {
      displayPersons = displayPersons.filter(p => lineageIds.has(p.id));
    }

    const gens = displayPersons.map(p => p.generation||0).filter(g=>g>0);
    const maxGen = gens.length ? Math.max(...gens) : selfGen;
    const usedTotal = Math.max(totalGens||0, maxGen+2, selfGen+2, 9);

    const { nodes, edges } = this.buildGhostTree(displayPersons, selfGen, usedTotal);

    const PAD = 48;
    const xs = nodes.map(n=>n.x), ys = nodes.map(n=>n.y);
    const minX = Math.min(...xs)-this.NODE_W/2-PAD;
    const maxX = Math.max(...xs)+this.NODE_W/2+PAD;
    const minY = Math.min(...ys)-PAD;
    const maxY = Math.max(...ys)+this.NODE_H+PAD;
    const W = Math.max(maxX-minX, 300);
    const H = maxY-minY;

    const svg = document.createElementNS(svgNS, 'svg');
    svg.setAttribute('viewBox', minX+' '+minY+' '+W+' '+H);
    svg.setAttribute('width', W);
    svg.setAttribute('height', H);
    svg.style.cssText = 'display:block;';

    // 엣지
    edges.forEach(e => {
      const path = document.createElementNS(svgNS, 'path');
      const midY = (e.y1+e.y2)/2;
      path.setAttribute('d','M '+e.x1+' '+e.y1+' C '+e.x1+' '+midY+', '+e.x2+' '+midY+', '+e.x2+' '+e.y2);
      path.setAttribute('fill','none');
      path.setAttribute('stroke', e.isGhost ? 'rgba(60,55,45,0.1)' : 'rgba(60,55,45,0.28)');
      path.setAttribute('stroke-width','1.5');
      if (e.isGhost) path.setAttribute('stroke-dasharray','5,4');
      svg.appendChild(path);
    });

    // 노드
    nodes.forEach(n => {
      const isSelf     = n.id === selfPersonId;
      const isRoot     = n.generation === 1 && !n.ghost;
      const isGhost    = n.ghost;
      const isDeceased = !isGhost && !!n.deathYear;
      const inLineage  = lineageIds ? lineageIds.has(n.id) : true;
      const isSide     = !isGhost && !inLineage;
      const isCollapsed = this.collapsed.has(n.id);
      const hasChildren = realPersons.some(p => p.parentId === n.id);

      const g = document.createElementNS(svgNS, 'g');
      g.setAttribute('data-id', n.id);
      g.style.cursor = 'pointer';

      const rx = n.x - this.NODE_W/2;
      const ry = n.y;

      // 배경 rect
      const rect = document.createElementNS(svgNS, 'rect');
      rect.setAttribute('x', rx); rect.setAttribute('y', ry);
      rect.setAttribute('width', this.NODE_W); rect.setAttribute('height', this.NODE_H);
      rect.setAttribute('rx', '8');
      if (isGhost) {
        rect.setAttribute('fill','rgba(240,235,224,0.45)');
        rect.setAttribute('stroke','rgba(60,55,45,0.15)');
        rect.setAttribute('stroke-dasharray','4,3');
        rect.setAttribute('stroke-width','1');
      } else if (isSelf) {
        rect.setAttribute('fill','#2C3A2B'); rect.setAttribute('stroke-width','0');
      } else if (isRoot) {
        rect.setAttribute('fill','#F5EDD8');
        rect.setAttribute('stroke','rgba(154,123,58,0.45)');
        rect.setAttribute('stroke-width','1');
      } else if (isSide) {
        rect.setAttribute('fill','#EDEBE6');
        rect.setAttribute('stroke','rgba(60,55,45,0.12)');
        rect.setAttribute('stroke-width','0.5');
      } else if (isDeceased) {
        rect.setAttribute('fill','#EDE8DF');
        rect.setAttribute('stroke','rgba(60,55,45,0.18)');
        rect.setAttribute('stroke-width','0.5');
      } else {
        rect.setAttribute('fill','#F8F5EF');
        rect.setAttribute('stroke','rgba(60,55,45,0.2)');
        rect.setAttribute('stroke-width','0.5');
      }
      g.appendChild(rect);

      if (isGhost) {
        const plus = document.createElementNS(svgNS, 'text');
        plus.setAttribute('x',n.x); plus.setAttribute('y',ry+24);
        plus.setAttribute('text-anchor','middle'); plus.setAttribute('font-size','16');
        plus.setAttribute('fill','rgba(60,55,45,0.25)'); plus.setAttribute('font-family','sans-serif');
        plus.textContent = '+';
        g.appendChild(plus);
        const lbl = document.createElementNS(svgNS, 'text');
        lbl.setAttribute('x',n.x); lbl.setAttribute('y',ry+41);
        lbl.setAttribute('text-anchor','middle'); lbl.setAttribute('font-size','10');
        lbl.setAttribute('fill','rgba(60,55,45,0.3)');
        lbl.setAttribute('font-family','Noto Sans KR, sans-serif');
        lbl.textContent = n.label||'';
        g.appendChild(lbl);
        g.addEventListener('click', () => App.showAddPersonModal(n.generation));
      } else {
        // 이름
        const nameEl = document.createElementNS(svgNS, 'text');
        nameEl.setAttribute('x',n.x); nameEl.setAttribute('y',ry+22);
        nameEl.setAttribute('text-anchor','middle');
        nameEl.setAttribute('font-family','Noto Serif KR, serif');
        nameEl.setAttribute('font-size','13'); nameEl.setAttribute('font-weight','500');
        nameEl.setAttribute('fill', isSelf?'#F8F5EF':isRoot?'#9A7B3A':isSide?'#AAAAA0':'#1C1C1A');
        nameEl.textContent = n.name||'미상';
        g.appendChild(nameEl);

        // 세대/연도
        const sub = document.createElementNS(svgNS, 'text');
        sub.setAttribute('x',n.x); sub.setAttribute('y',ry+38);
        sub.setAttribute('text-anchor','middle');
        sub.setAttribute('font-family','Noto Sans KR, sans-serif');
        sub.setAttribute('font-size','10');
        sub.setAttribute('fill', isSelf?'rgba(248,245,239,0.65)':'#9E9E95');
        const yr = n.birthYear ? String(n.birthYear) : '';
        const dy = n.deathYear ? '~'+String(n.deathYear) : '';
        sub.textContent = n.generation+'세'+(yr?' · '+yr:'')+(dy?dy:'');
        g.appendChild(sub);

        g.addEventListener('click', () => App.showPersonDetail(n));

        // 접기/펼치기 버튼 (자손이 있는 실제 노드에만)
        if (hasChildren) {
          const bx = n.x;
          const by = ry + this.NODE_H + 10;

          const btnG = document.createElementNS(svgNS, 'g');
          btnG.style.cursor = 'pointer';

          const circle = document.createElementNS(svgNS, 'circle');
          circle.setAttribute('cx', bx); circle.setAttribute('cy', by);
          circle.setAttribute('r', '10');
          circle.setAttribute('fill', isSelf ? '#3d5c3b' : isRoot ? '#e8d8a0' : '#E6DFD0');
          circle.setAttribute('stroke', isSelf ? '#2C3A2B' : 'rgba(60,55,45,0.25)');
          circle.setAttribute('stroke-width', '0.5');
          btnG.appendChild(circle);

          const arrow = document.createElementNS(svgNS, 'text');
          arrow.setAttribute('x', bx); arrow.setAttribute('y', by+4);
          arrow.setAttribute('text-anchor', 'middle');
          arrow.setAttribute('font-size', '12');
          arrow.setAttribute('fill', isSelf ? '#F8F5EF' : isRoot ? '#9A7B3A' : '#6B6B64');
          arrow.setAttribute('font-family', 'sans-serif');
          arrow.textContent = isCollapsed ? '+' : '−';
          btnG.appendChild(arrow);

          btnG.addEventListener('click', e => {
            e.stopPropagation();
            Tree.toggleCollapse(n.id);
            App.loadTree();
          });
          g.appendChild(btnG);
        }
      }
      svg.appendChild(g);
    });

    // 상단 컨트롤 바
    const ctrlBar = document.createElement('div');
    ctrlBar.style.cssText = 'display:flex;align-items:center;justify-content:space-between;padding:8px 14px 4px;';
    ctrlBar.innerHTML =
      '<span style="font-size:11px;color:var(--ink-4)">' +
        (this.showLineageOnly ? '직계만 표시 중' : '전체 가계도') +
      '</span>' +
      '<div style="display:flex;gap:6px">' +
        (this.collapsed.size > 0
          ? '<button id="tree-expand-all" style="font-size:11px;padding:4px 10px;background:var(--paper);border:0.5px solid var(--border-strong);border-radius:20px;color:var(--ink-3);cursor:pointer;font-family:var(--font-sans)">모두 펼치기</button>'
          : '') +
        '<button id="tree-toggle-btn" style="font-size:11px;padding:4px 12px;background:var(--paper);border:0.5px solid var(--border-strong);border-radius:20px;color:var(--moss);cursor:pointer;font-family:var(--font-sans)">' +
          (this.showLineageOnly ? '방계 펼치기' : '직계만 보기') +
        '</button>' +
      '</div>';

    container.innerHTML = '';
    container.appendChild(ctrlBar);
    container.appendChild(svg);

    document.getElementById('tree-toggle-btn').addEventListener('click', () => {
      Tree.showLineageOnly = !Tree.showLineageOnly;
      App.loadTree();
    });
    const expandBtn = document.getElementById('tree-expand-all');
    if (expandBtn) {
      expandBtn.addEventListener('click', () => {
        Tree.collapsed.clear();
        App.loadTree();
      });
    }

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
    el.addEventListener('mousedown', start);
    el.addEventListener('mousemove', move);
    el.addEventListener('mouseup', end);
    el.addEventListener('mouseleave', end);
    el.addEventListener('touchstart', start, {passive:true});
    el.addEventListener('touchmove', move, {passive:true});
    el.addEventListener('touchend', end);
  }
};
