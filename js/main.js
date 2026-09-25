// JavaScript файл для интерактивности

// Мобильное меню
const burgerMenu = document.querySelector('.burger-menu');
const mobileMenu = document.querySelector('.mobile-menu');

if (burgerMenu && mobileMenu) {
  burgerMenu.addEventListener('click', () => {
    burgerMenu.classList.toggle('active');
    mobileMenu.classList.toggle('active');
  });

  // Закрытие меню при клике на затемнённую область под ним
  mobileMenu.addEventListener('click', (e) => {
    if (e.target !== mobileMenu) return;
    burgerMenu.classList.remove('active');
    mobileMenu.classList.remove('active');
  });

  // Закрытие меню при клике на ссылку
  const menuLinks = mobileMenu.querySelectorAll('.nav-item');
  menuLinks.forEach(link => {
    link.addEventListener('click', () => {
      burgerMenu.classList.remove('active');
      mobileMenu.classList.remove('active');
    });
  });
}

// Подсветка пункта меню для текущей секции
const spySections = ['about', 'projects', 'services']
  .map(id => document.getElementById(id))
  .filter(Boolean);
const spyLinks = document.querySelectorAll('.nav-item[href^="#"]:not(.contacts)');

function updateActiveNav() {
  // секция считается текущей, когда её верх поднялся выше 40% высоты окна
  const line = window.innerHeight * 0.4;
  let currentId = null;
  spySections.forEach(section => {
    if (section.getBoundingClientRect().top <= line) currentId = section.id;
  });
  spyLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + currentId);
  });
}

// обновляем не чаще одного раза за кадр, чтобы скролл не тормозил
let navTicking = false;
function requestNavUpdate() {
  if (navTicking) return;
  navTicking = true;
  requestAnimationFrame(() => {
    navTicking = false;
    updateActiveNav();
  });
}

window.addEventListener('scroll', requestNavUpdate, { passive: true });
window.addEventListener('resize', requestNavUpdate);
updateActiveNav();

// Видео в блоке «Про нас» играет только пока оно видно на экране
const aboutVideo = document.querySelector('.about-video-small');
if (aboutVideo && 'IntersectionObserver' in window) {
  new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) aboutVideo.play().catch(() => {});
      else aboutVideo.pause();
    });
  }).observe(aboutVideo);
}

// Hero Slider
const heroTrack = document.querySelector('.hero-track');
const counterEl = document.querySelector('.hero-counter');
const captionEl = document.getElementById('heroCaption');
const currentCounter = document.querySelector('.current');

if (heroTrack && counterEl && captionEl && currentCounter) {
  let index = 0;

  const captions = [
    'RISE Café <span class="arrow">→</span>',
    'Квартира у ЖК «Кандинський» <span class="arrow">→</span>',
    'Приватний будинок у Східниці <span class="arrow">→</span>'
  ];

  function nextSlide() {
    // 1. Сначала прячем текст и счётчик
    captionEl.style.opacity = '0';
    counterEl.style.opacity = '0';

    // 2. Через небольшую паузу запускаем свайп картинки
    setTimeout(() => {
      index++;
      heroTrack.style.transform = `translateX(-${index * 25}%)`;

      // 3. Ждём окончания свайпа картинки, затем обновляем текст/счётчик и проявляем их
      setTimeout(() => {
        captionEl.innerHTML = captions[index % 3];
        currentCounter.textContent = (index % 3) + 1;
        captionEl.style.opacity = '1';
        counterEl.style.opacity = '1';

        // Логика с дубликатом слайда
        if (index === 3) {
          heroTrack.style.transition = 'none';
          heroTrack.style.transform = 'translateX(0%)';
          heroTrack.offsetHeight; // принудительный reflow
          heroTrack.style.transition = 'transform 0.7s ease-in-out';
          index = 0;
        }
      }, 700); // = длительности transform-transition картинки
    }, 300); // небольшая пауза после исчезновения текста
  }

  setInterval(nextSlide, 2700);
}

// Contact Panel
const contactTriggers = document.querySelectorAll('.nav-item.contacts');
const overlay = document.getElementById('contactOverlay');
const panel = document.getElementById('contactPanel');
const closeBtn = document.getElementById('contactPanelClose');

if (contactTriggers.length > 0 && overlay && panel && closeBtn) {
  function openPanel(e) {
    e.preventDefault();
    overlay.classList.add('open');
  }

  function closePanel() {
    overlay.classList.remove('open');
  }

  contactTriggers.forEach(trigger => {
    trigger.addEventListener('click', openPanel);
  });

  closeBtn.addEventListener('click', closePanel);

  overlay.addEventListener('click', (e) => {
    // закрываем, только если клик именно по overlay (фону), а не по самой панели
    if (e.target === overlay) closePanel();
  });
}

// Раскрытие/сворачивание дополнительных проектов
const projectsMore = document.getElementById('projectsMore');
const projectsHide = document.getElementById('projectsHide');
const projectsExtra = document.getElementById('projectsExtra');

if (projectsMore && projectsHide && projectsExtra) {
  projectsMore.addEventListener('click', (e) => {
    e.preventDefault();
    projectsExtra.classList.add('open');
    projectsMore.setAttribute('aria-expanded', 'true');
    projectsMore.classList.add('hidden');
    projectsHide.classList.remove('hidden');
  });

  projectsHide.addEventListener('click', (e) => {
    e.preventDefault();
    projectsExtra.classList.remove('open');
    projectsMore.setAttribute('aria-expanded', 'false');
    projectsHide.classList.add('hidden');
    projectsMore.classList.remove('hidden');
    // возвращаемся к началу секции, чтобы страница не «прыгала» при сворачивании
    document.getElementById('projects').scrollIntoView({ behavior: 'smooth' });
  });
}

// Клик по логотипу: плавно возвращаемся на главную (в начало страницы)
const logoLink = document.querySelector('.logo-link');
// на других страницах (например, 404) логотип работает как обычная ссылка
if (logoLink && document.querySelector('.hero-slider')) {
  logoLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// Клик по почте: адрес копируется в буфер обмена, внизу появляется уведомление
const copyToast = document.createElement('div');
copyToast.className = 'copy-toast';
copyToast.setAttribute('role', 'status');
copyToast.setAttribute('aria-live', 'polite');
copyToast.textContent = 'Пошту скопійовано в буфер обміну';
document.body.appendChild(copyToast);

let copyToastTimer;
function showCopyToast() {
  copyToast.classList.add('show');
  clearTimeout(copyToastTimer);
  copyToastTimer = setTimeout(() => copyToast.classList.remove('show'), 2200);
}

function copyText(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }
  // запасной вариант для страниц без https (например, открытых прямо с диска)
  return new Promise((resolve, reject) => {
    const field = document.createElement('textarea');
    field.value = text;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.appendChild(field);
    field.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(field);
    ok ? resolve() : reject();
  });
}

document.querySelectorAll('a[href^="mailto:"]').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    const email = link.getAttribute('href').replace('mailto:', '');
    copyText(email).then(showCopyToast).catch(() => {
      // если скопировать не удалось, открываем почтовую программу как обычно
      window.location.href = link.href;
    });
  });
});

// Переход на страницу проекта: главная плавно гаснет, потом открывается проект
if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.querySelectorAll('.project-card, .next-project').forEach(card => {
    card.addEventListener('click', (e) => {
      // обычный клик; с Ctrl/Cmd/Shift ссылка открывается как всегда
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      document.body.classList.add('leaving');
      setTimeout(() => { window.location.href = card.href; }, 280);
    });
  });
  // при возврате кнопкой «Назад» страница не должна остаться погашенной
  window.addEventListener('pageshow', () => document.body.classList.remove('leaving'));
}

// Лёгкое проявление блоков при скролле
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  const revealTargets = document.querySelectorAll(
    '.about-title-wrap, .about-text-group, .about-img-large, .projects-head, ' +
    '.projects-section > .projects-grid > .project-card, .service-row, .faq-title, .faq-list'
  );

  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });

  revealTargets.forEach(el => {
    el.classList.add('reveal');
    // карточки в одном ряду появляются с небольшой задержкой друг за другом
    if (el.classList.contains('project-card')) {
      const index = Array.prototype.indexOf.call(el.parentNode.children, el);
      el.style.transitionDelay = (index % 2) * 0.1 + 's';
    }
    revealObserver.observe(el);
  });
}

// Услуги: «Детальніше» раскрывает текст под описанием (у услуг без текста ссылка ничего не делает)
document.querySelectorAll('.service-row').forEach(row => {
  const more = row.querySelector('.service-more');
  const detail = row.querySelector('.service-detail');
  more.addEventListener('click', e => {
    e.preventDefault();
    if (!detail) return;
    const open = row.classList.toggle('open');
    more.setAttribute('aria-expanded', String(open));
    more.querySelector('.service-plus').textContent = open ? '−' : '+';
  });
});

// FAQ: аккордеон (одновременно открыт один вопрос)
const faqItems = document.querySelectorAll('.faq-item');

faqItems.forEach(item => {
  const btn = item.querySelector('.faq-q');
  btn.addEventListener('click', () => {
    const willOpen = !item.classList.contains('open');
    faqItems.forEach(other => {
      other.classList.remove('open');
      other.querySelector('.faq-q').setAttribute('aria-expanded', 'false');
    });
    if (willOpen) {
      item.classList.add('open');
      btn.setAttribute('aria-expanded', 'true');
    }
  });
});