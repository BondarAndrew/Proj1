// Топографические линии для секции с цитатой:
// линии генерируются один раз (шум + marching squares), а при скролле
// «прорисовываются» от краёв экрана к центру.

(function () {
  const section = document.getElementById('quote');
  const svg = section && section.querySelector('.quote-lines');
  if (!section || !svg) return;

  const W = 1600;          // размеры viewBox
  const H = 900;
  const STEP = 10;         // шаг сетки
  const SPACING = 31;      // расстояние между линиями
  const MIN_LINE = 120;    // короче этого открытые линии не рисуем
  const MIN_LOOP = 160;    // мелкие замкнутые петли не рисуем
  const NS = 'http://www.w3.org/2000/svg';

  // ---------- шум ----------
  function mulberry32(seed) {
    return function () {
      seed |= 0; seed = (seed + 0x6D2B79F5) | 0;
      let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
      t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  const rand = mulberry32(20240607);
  const GRID = 64;
  const lattice = new Float32Array(GRID * GRID);
  for (let i = 0; i < lattice.length; i++) lattice[i] = rand() * 2 - 1;

  const smooth = t => t * t * (3 - 2 * t);
  function valueNoise(x, y) {
    const xi = Math.floor(x), yi = Math.floor(y);
    const xf = smooth(x - xi), yf = smooth(y - yi);
    const g = (a, b) => lattice[((b & (GRID - 1)) * GRID) + (a & (GRID - 1))];
    const top = g(xi, yi) * (1 - xf) + g(xi + 1, yi) * xf;
    const bot = g(xi, yi + 1) * (1 - xf) + g(xi + 1, yi + 1) * xf;
    return top * (1 - yf) + bot * yf;
  }

  // «Ядра» узора: короткие отрезки [x1, y1, x2, y2]. Линии — это контуры на равном
  // расстоянии от ближайшего ядра, поэтому шаг между ними везде одинаковый, а формы
  // получаются органичными: вложенные петли, которые вытягиваются и сливаются.
  const SEEDS = [
    [770, 690, 790, 730],
    [1110, 330, 1170, 390],
    [830, 30, 900, 60],
    [40, 110, 210, 270],
    [300, 210, 420, 310],
    [60, 620, 60, 880],
    [1400, 560, 1580, 700],
    [1500, 90, 1600, 140],
    [560, 470, 640, 500]
  ];
  const BLEND = 48;        // плавность слияния соседних ядер
  const WARP = 46;         // амплитуда искажения (органичность линий)

  function segDist(px, py, s) {
    const dx = s[2] - s[0], dy = s[3] - s[1];
    const t = Math.max(0, Math.min(1, ((px - s[0]) * dx + (py - s[1]) * dy) / (dx * dx + dy * dy)));
    return Math.hypot(px - (s[0] + dx * t), py - (s[1] + dy * t));
  }

  function field(x, y) {
    // искажаем координаты, чтобы контуры не были правильными окружностями
    const wx = x + valueNoise(x / 380 + 3, y / 380 + 9) * WARP;
    const wy = y + valueNoise(x / 380 + 21, y / 380 + 4) * WARP;
    // мягкий минимум расстояний до ядер
    let sum = 0;
    for (let k = 0; k < SEEDS.length; k++) sum += Math.exp(-segDist(wx, wy, SEEDS[k]) / BLEND);
    return -BLEND * Math.log(sum);
  }

  // Генерация линий — самая тяжёлая часть, поэтому она запускается заранее,
  // но не при загрузке страницы, а когда секция уже недалеко от экрана.
  const items = [];
  let built = false;

  function build() {
  if (built) return;
  built = true;

  // ---------- сетка значений ----------
  const cols = Math.ceil(W / STEP) + 1;
  const rows = Math.ceil(H / STEP) + 1;
  const values = new Float32Array(cols * rows);
  let vmin = Infinity, vmax = -Infinity;
  for (let j = 0; j < rows; j++) {
    for (let i = 0; i < cols; i++) {
      const v = field(i * STEP, j * STEP);
      values[j * cols + i] = v;
      if (v < vmin) vmin = v;
      if (v > vmax) vmax = v;
    }
  }
  const val = (i, j) => values[j * cols + i];

  // ---------- marching squares ----------
  // вершины ячейки: tl, tr, br, bl; рёбра: 0 верх, 1 право, 2 низ, 3 лево
  const CASES = {
    1: [[3, 2]], 2: [[2, 1]], 3: [[3, 1]], 4: [[0, 1]],
    6: [[0, 2]], 7: [[0, 3]], 8: [[0, 3]], 9: [[0, 2]],
    11: [[0, 1]], 12: [[3, 1]], 13: [[2, 1]], 14: [[3, 2]]
  };

  function contour(level) {
    const points = new Map();     // id ребра -> [x, y]
    const adj = new Map();        // id ребра -> соседние id

    function edgePoint(edge, i, j) {
      let id, a, b;
      if (edge === 0) { id = 'h' + i + ',' + j;       a = [i, j];         b = [i + 1, j]; }
      else if (edge === 2) { id = 'h' + i + ',' + (j + 1); a = [i, j + 1];   b = [i + 1, j + 1]; }
      else if (edge === 3) { id = 'v' + i + ',' + j;       a = [i, j];         b = [i, j + 1]; }
      else { id = 'v' + (i + 1) + ',' + j;                  a = [i + 1, j];     b = [i + 1, j + 1]; }
      if (!points.has(id)) {
        const va = val(a[0], a[1]), vb = val(b[0], b[1]);
        const t = (level - va) / (vb - va);
        points.set(id, [
          (a[0] + (b[0] - a[0]) * t) * STEP,
          (a[1] + (b[1] - a[1]) * t) * STEP
        ]);
      }
      return id;
    }

    function link(p, q) {
      if (!adj.has(p)) adj.set(p, []);
      if (!adj.has(q)) adj.set(q, []);
      adj.get(p).push(q);
      adj.get(q).push(p);
    }

    for (let j = 0; j < rows - 1; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const tl = val(i, j) >= level ? 1 : 0;
        const tr = val(i + 1, j) >= level ? 1 : 0;
        const br = val(i + 1, j + 1) >= level ? 1 : 0;
        const bl = val(i, j + 1) >= level ? 1 : 0;
        const idx = tl * 8 + tr * 4 + br * 2 + bl;
        if (idx === 0 || idx === 15) continue;

        let segs = CASES[idx];
        if (idx === 5 || idx === 10) {
          const centre = (val(i, j) + val(i + 1, j) + val(i + 1, j + 1) + val(i, j + 1)) / 4 >= level;
          if (idx === 5) segs = centre ? [[0, 3], [2, 1]] : [[0, 1], [3, 2]];
          else segs = centre ? [[0, 1], [3, 2]] : [[0, 3], [2, 1]];
        }
        segs.forEach(s => link(edgePoint(s[0], i, j), edgePoint(s[1], i, j)));
      }
    }

    // собираем ломаные
    const visited = new Set();
    const lines = [];

    function walk(start) {
      const path = [];
      let prev = null, cur = start;
      while (cur && !visited.has(cur)) {
        visited.add(cur);
        path.push(points.get(cur));
        const next = adj.get(cur).find(n => n !== prev && !visited.has(n));
        prev = cur;
        cur = next;
      }
      return path;
    }

    adj.forEach((n, id) => {                 // сначала открытые линии (от границ)
      if (n.length === 1 && !visited.has(id)) lines.push({ pts: walk(id), closed: false });
    });
    adj.forEach((n, id) => {                 // потом замкнутые
      if (!visited.has(id)) lines.push({ pts: walk(id), closed: true });
    });
    // выбрасываем короткие обрывки и мелкие замкнутые «завитки»
    return lines.filter(l => polylineLength(l.pts) > (l.closed ? MIN_LOOP : MIN_LINE));
  }

  function polylineLength(pts) {
    let len = 0;
    for (let k = 1; k < pts.length; k++) {
      len += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]);
    }
    return len;
  }

  // ---------- построение путей ----------
  const cx = W / 2, cy = H / 2;
  const maxDist = Math.hypot(cx, cy);
  const dist = p => Math.hypot(p[0] - cx, p[1] - cy);

  function toPath(pts, closed) {
    let d = 'M' + pts[0][0].toFixed(1) + ' ' + pts[0][1].toFixed(1);
    for (let k = 1; k < pts.length - 1; k++) {
      const mx = (pts[k][0] + pts[k + 1][0]) / 2;
      const my = (pts[k][1] + pts[k + 1][1]) / 2;
      d += 'Q' + pts[k][0].toFixed(1) + ' ' + pts[k][1].toFixed(1) + ' ' + mx.toFixed(1) + ' ' + my.toFixed(1);
    }
    const last = pts[pts.length - 1];
    d += 'L' + last[0].toFixed(1) + ' ' + last[1].toFixed(1);
    return d;
  }

  for (let level = SPACING; level < vmax; level += SPACING) {
    contour(level).forEach(line => {
      let pts = line.pts;
      if (line.closed) {
        // замкнутую линию начинаем с самой удалённой от центра точки
        let best = 0;
        pts.forEach((p, k) => { if (dist(p) > dist(pts[best])) best = k; });
        pts = pts.slice(best).concat(pts.slice(0, best));
        pts.push(pts[0]);
      } else if (dist(pts[pts.length - 1]) > dist(pts[0])) {
        pts = pts.slice().reverse();          // рисуем от края к центру
      }

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', toPath(pts, line.closed));
      svg.appendChild(path);
      items.push({
        path,
        len: 0,
        // чем дальше от центра начало линии, тем раньше она начнёт рисоваться
        start: (1 - Math.min(dist(pts[0]) / maxDist, 1)) * 0.55
      });
    });
  }

  items.forEach(it => {
    it.len = it.path.getTotalLength();
    it.path.style.strokeDasharray = it.len;
    it.path.style.strokeDashoffset = it.len;
  });
  }

  // ---------- анимация по времени ----------
  // запускается один раз, когда секция появляется на экране
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const TOTAL = 6000;      // общая длительность, мс
  const DURATION = 0.45;   // доля общего времени на одну линию
  const easeInOut = t => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

  function draw(progress) {
    items.forEach(it => {
      const raw = Math.min(Math.max((progress * 1.05 - it.start) / DURATION, 0), 1);
      it.path.style.strokeDashoffset = it.len * (1 - easeInOut(raw));
    });
  }

  // пока линии рисуются, весь узор слегка приближается к зрителю
  const ZOOM_TO = 1.12;     // итоговое увеличение (1 = без приближения)
  const easeOut = t => 1 - Math.pow(1 - t, 2);

  const HOLD = 4000;        // сколько узор «висит» готовым перед повтором, мс
  const FADE = 800;         // плавное исчезновение перед повтором, мс

  let visible = false;      // секция сейчас на экране
  let waiting = false;      // повтор ждёт, пока секция снова появится

  function play() {
    if (reduce) { draw(1); return; }
    const t0 = performance.now();
    function frame(now) {
      const p = Math.min((now - t0) / TOTAL, 1);
      draw(p);
      svg.style.transform = 'scale(' + (1 + (ZOOM_TO - 1) * easeOut(p)) + ')';
      if (p < 1) requestAnimationFrame(frame);
      else setTimeout(restart, HOLD);
    }
    requestAnimationFrame(frame);
  }

  // после паузы узор плавно гаснет и рисуется заново
  function restart() {
    if (!visible) { waiting = true; return; }
    svg.style.transition = 'opacity ' + FADE + 'ms ease-in-out';
    svg.style.opacity = '0';
    setTimeout(() => {
      draw(0);
      svg.style.transform = 'scale(1)';
      svg.style.opacity = '1';
      play();
    }, FADE);
  }

  let started = false;
  const observer = new IntersectionObserver(entries => {
    visible = entries.some(e => e.isIntersecting);
    if (!visible) return;
    if (!started) { started = true; build(); play(); }
    else if (waiting) { waiting = false; restart(); }
  }, { threshold: 0.4 });
  observer.observe(section);

  // заранее (за полтора экрана до секции) строим линии в момент простоя браузера
  const prebuild = new IntersectionObserver(entries => {
    if (!entries.some(e => e.isIntersecting)) return;
    prebuild.disconnect();
    if ('requestIdleCallback' in window) requestIdleCallback(build, { timeout: 1500 });
    else setTimeout(build, 200);
  }, { rootMargin: '150% 0px' });
  prebuild.observe(section);
})();
