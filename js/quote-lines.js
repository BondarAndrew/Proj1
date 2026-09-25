// Линии узора для секции с цитатой: пути из макета лежат в js/quote-paths.js,
// здесь они добавляются в SVG и «прорисовываются» от краёв экрана к центру.

(function () {
  const section = document.getElementById('quote');
  const svg = section && section.querySelector('.quote-lines');
  if (!section || !svg || !window.QUOTE_PATHS) return;

  const W = 1440;          // размеры макета (viewBox)
  const H = 800;
  const NS = 'http://www.w3.org/2000/svg';
  svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);

  const items = [];
  let built = false;

  function build() {
    if (built) return;
    built = true;

    const cx = W / 2, cy = H / 2;
    const maxDist = Math.hypot(cx, cy);

    window.QUOTE_PATHS.forEach(d => {
      const nums = d.match(/-?\d*\.?\d+/g).map(Number);
      const sx = nums[0], sy = nums[1];
      const ex = nums[nums.length - 2], ey = nums[nums.length - 1];
      const dStart = Math.hypot(sx - cx, sy - cy);
      const dEnd = Math.hypot(ex - cx, ey - cy);
      // линия всегда рисуется от края к центру: если её конец дальше от центра,
      // прорисовываем «с конца» (отрицательное смещение штриха)
      const dir = dEnd > dStart ? -1 : 1;

      const path = document.createElementNS(NS, 'path');
      path.setAttribute('d', d);
      path.setAttribute('pathLength', '1');   // длина = 1, как в макете
      path.style.strokeDasharray = '1 1';
      path.style.strokeDashoffset = String(dir);
      svg.appendChild(path);
      items.push({
        path,
        dir,
        // чем дальше от центра начало линии, тем раньше она начнёт рисоваться
        start: (1 - Math.min(Math.max(dStart, dEnd) / maxDist, 1)) * 0.55
      });
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
      it.path.style.strokeDashoffset = it.dir * (1 - easeInOut(raw));
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
})();
