// Страница проекта (project.html?id=...).
// Все проекты описаны в списке PROJECTS ниже: чтобы добавить новый проект,
// достаточно добавить сюда объект и сделать карточку со ссылкой project.html?id=<id>.

const PROJECTS = {
  rise: {
    number: '008', name: 'RISE Café', type: 'Кафе',
    cover: 'img/Projects/rise-cover.webp',
    coverPortrait: 'img/Projects/rise-cover-portrait.webp', // для планшета и телефона
    // блок с информацией под обложкой (необязательный: нет info — блок скрыт)
    info: {
      year: '2026',
      credits: [
        { role: 'Дизайнери', names: ['Бондарь Ольга', 'Лазуренко Єлизавета'] },
        { role: 'Креслення', names: ['Нестеренко Катерина'] },
        { role: '3D візуалізація', names: ['Лазарев Артем'] },
        { role: 'Фотограф', names: ['Карєв Євген'] }
      ],
      text: [
        'Інтер’єр кафе побудований на поєднанні природних матеріалів, м’якого світла та живої зелені. Тепла фактура тонованої фанери створює камерний фон, а округлі форми меблів додають простору м’якості та невимушеності.',
        'Головним акцентом інтер’єру стала барна стійка, облицьована вишневою керамічною плиткою в поєднанні з рельєфним склом та нержавіючою сталлю.',
        'Фінікові пальми, що сягають стелі, додають простору виразності та формують відчуття затишного міського оазису.'
      ]
    },
    // фотографии проекта (по порядку сверху вниз). wide: true — фото на всю ширину,
    // остальные (вертикальные) идут парами по две в ряд
    gallery: [
      { src: 'img/Projects/rise/rise-01.webp' },
      { src: 'img/Projects/rise/rise-02.webp' },
      { src: 'img/Projects/rise/rise-03.webp' },
      { src: 'img/Projects/rise/rise-04.webp' },
      { src: 'img/Projects/rise/rise-05.webp', wide: true },
      { src: 'img/Projects/rise/rise-06.webp' },
      { src: 'img/Projects/rise/rise-07.webp' },
      { src: 'img/Projects/rise/rise-08.webp', wide: true }
    ]
  },
  kandinsky: {
    number: '007', name: 'ЖК «Кандинський»', type: 'Квартира',
    cover: 'img/Hero/Hero2.webp'
  },
  shidnytsia: {
    number: '006', name: 'Селище Східниця', type: 'Приватний будинок',
    cover: 'img/Hero/Hero3.webp'
  },
  grace: {
    number: '005', name: 'Grace', type: 'Ресторан',
    cover: 'img/Projects/grace.webp'
  },
  p55: {
    number: '004', name: 'P_55', type: 'Апартаменти',
    cover: 'img/Projects/project-03.webp'
  },
  f001: {
    number: '003', name: 'F_001', type: 'Апартаменти',
    cover: 'img/Projects/project-04.webp'
  },
  p22: {
    number: '002', name: 'P_22', type: 'Апартаменти',
    cover: 'img/Projects/project-01.webp'
  },
  lapki: {
    number: '001', name: 'Lapki', type: 'Салон для хвостатих',
    cover: 'img/Projects/project-02.webp'
  }
};

// Порядок проектов для блока «Наступний проєкт»: после последнего идёт первый
const PROJECT_ORDER = ['rise', 'kandinsky', 'shidnytsia', 'grace', 'p55', 'f001', 'p22', 'lapki'];

(function () {
  const id = new URLSearchParams(window.location.search).get('id');
  const project = PROJECTS[id];

  // неизвестный проект — показываем страницу 404
  if (!project) {
    window.location.replace('404.html');
    return;
  }

  document.title = project.name + ' — BON';

  const img = document.getElementById('projectCover');
  const hero = img.closest('.project-hero');
  // запускаем анимацию появления, когда обложка загрузилась
  const showHero = () => hero.classList.add('ready');
  img.addEventListener('load', showHero);
  img.addEventListener('error', showHero);

  // вертикальная обложка для планшета и телефона (необязательная)
  const portrait = document.getElementById('projectCoverPortrait');
  if (project.coverPortrait) portrait.srcset = project.coverPortrait;
  else portrait.remove();

  img.src = project.cover;
  if (img.complete) showHero();
  img.alt = project.name;

  document.getElementById('projectCaption').textContent = project.name;

  // блок с информацией под обложкой
  if (project.info) {
    const info = project.info;
    document.getElementById('projectYear').textContent = info.year + ' · ' + project.type;

    const credits = document.getElementById('projectCredits');
    info.credits.forEach(item => {
      const group = document.createElement('div');
      group.className = 'project-credit';
      const role = document.createElement('p');
      role.className = 'project-credit-role';
      role.textContent = item.role;
      group.appendChild(role);
      item.names.forEach(name => {
        const line = document.createElement('p');
        line.textContent = name;
        group.appendChild(line);
      });
      credits.appendChild(group);
    });

    const text = document.getElementById('projectText');
    info.text.forEach(paragraph => {
      const p = document.createElement('p');
      p.textContent = paragraph;
      text.appendChild(p);
    });

    document.getElementById('projectAbout').hidden = false;
  }

  // блок «Наступний проєкт»
  const nextId = PROJECT_ORDER[(PROJECT_ORDER.indexOf(id) + 1) % PROJECT_ORDER.length];
  const next = PROJECTS[nextId];
  if (next) {
    document.getElementById('nextProject').href = 'project.html?id=' + nextId;
    document.getElementById('nextProjectMeta').textContent = next.number + ' · ' + next.type;
    document.getElementById('nextProjectName').textContent = next.name;
    const nextImg = document.getElementById('nextProjectImg');
    nextImg.src = next.cover;
    nextImg.alt = next.name;
  }

  // галерея фотографий
  if (project.gallery && project.gallery.length) {
    const gallery = document.getElementById('projectGallery');
    project.gallery.forEach(photo => {
      const img = document.createElement('img');
      img.className = 'project-photo' + (photo.wide ? ' wide' : '');
      img.src = photo.src;
      img.alt = project.name;
      img.loading = 'lazy';
      img.decoding = 'async';
      gallery.appendChild(img);
    });
    gallery.hidden = false;
  }
})();
