(() => {
  if (navigator.doNotTrack === '1' || !location.pathname.endsWith('/')) return;
  const visitorKey = 'pepsproduction-analytics-v1';
  const lifetime = 400 * 24 * 60 * 60 * 1000;
  const randomId = () => {
    if (typeof crypto.randomUUID === 'function') return crypto.randomUUID();
    const bytes = new Uint8Array(24);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (value) => value.toString(16).padStart(2, '0')).join('');
  };
  let visitorId = '';
  try {
    const saved = JSON.parse(localStorage.getItem(visitorKey) || '{}');
    if (typeof saved.id === 'string' && /^[A-Za-z0-9_-]{20,64}$/.test(saved.id) && Number.isFinite(saved.createdAt) && Date.now() - saved.createdAt < lifetime) {
      visitorId = saved.id;
    } else {
      visitorId = randomId();
      localStorage.setItem(visitorKey, JSON.stringify({ id: visitorId, createdAt: Date.now() }));
    }
  } catch {
    try {
      visitorId = sessionStorage.getItem(visitorKey) || randomId();
      sessionStorage.setItem(visitorKey, visitorId);
    } catch { visitorId = randomId(); }
  }
  if (!visitorId) return;

  const cleanLabel = (value) => String(value || '').replace(/\s+/g, ' ').trim().slice(0, 100);
  const send = (eventType, category, itemId, itemLabel) => {
    const body = JSON.stringify({ eventType, category, itemId, itemLabel: cleanLabel(itemLabel) || itemId, visitorId, page: '/' });
    fetch('/api/analytics/collect', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body,
      keepalive: true,
      cache: 'no-store',
      credentials: 'same-origin'
    }).catch(() => { /* Analytics is optional; never interrupt site navigation. */ });
  };

  send('page_view', 'page', 'home', 'หน้าแรก');

  const sectionSeen = new Set();
  const sections = [...document.querySelectorAll('main section[id]')];
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        const id = entry.target.id === 'home' ? 'home' : entry.target.id;
        if (!['home', 'experience', 'works', 'broadcasts', 'videos', 'schedule', 'contact'].includes(id) || sectionSeen.has(id)) return;
        sectionSeen.add(id);
        const heading = entry.target.querySelector('h1, h2');
        send('section_view', 'section', `section_${id}`, heading?.textContent || id);
      });
    }, { threshold: 0.3 });
    sections.forEach((section) => observer.observe(section));
  }

  const itemIndex = (element, selector) => [...document.querySelectorAll(selector)].indexOf(element);
  const labelFrom = (card) => cleanLabel(card.querySelector('h3, h4, strong')?.textContent || card.textContent);
  const contactId = (element) => {
    if (element.hasAttribute('data-line-add-friend')) return ['contact_line', 'LINE'];
    const icon = element.querySelector('.contact-icon');
    if (icon?.classList.contains('contact-icon--facebook')) {
      const cards = [...document.querySelectorAll('[data-contact-links] .contact-link')].filter((card) => card.querySelector('.contact-icon--facebook'));
      const index = cards.indexOf(element);
      return index === 0 ? ['contact_facebook_page', labelFrom(element)] : ['contact_facebook_personal', labelFrom(element)];
    }
    if (icon?.classList.contains('contact-icon--tiktok')) return ['contact_tiktok', labelFrom(element)];
    if (icon?.classList.contains('contact-icon--youtube')) return ['contact_youtube', labelFrom(element)];
    if (icon?.classList.contains('contact-icon--phone')) {
      const cards = [...document.querySelectorAll('[data-contact-links] .contact-link')].filter((card) => card.querySelector('.contact-icon--phone'));
      return [`contact_phone_${Math.max(1, cards.indexOf(element) + 1)}`, labelFrom(element)];
    }
    return null;
  };

  const clickDetails = (target) => {
    if (target.matches('[data-launcher-download]')) {
      const id = target.classList.contains('header-download') ? 'launcher_header'
        : target.classList.contains('button-large') ? 'launcher_hero' : 'launcher_strip';
      return ['launcher', id, 'PepsTool Launcher'];
    }
    if (target.closest('.site-nav')) {
      const section = target.getAttribute('href')?.replace(/^#/, '');
      const ids = { experience: 'nav_experience', works: 'nav_works', broadcasts: 'nav_broadcasts', videos: 'nav_videos', schedule: 'nav_schedule', contact: 'nav_contact' };
      return ids[section] ? ['navigation', ids[section], cleanLabel(target.textContent)] : null;
    }
    if (target.closest('[data-line-add-friend]')) return ['contact', 'contact_line', 'LINE'];
    const contact = target.closest('[data-contact-links] .contact-link');
    if (contact) {
      const details = contactId(contact);
      return details ? ['contact', details[0], details[1]] : null;
    }
    const portfolio = target.closest('.portfolio-card');
    if (portfolio) {
      const index = itemIndex(portfolio, '.portfolio-card');
      return index >= 0 && index < 30 ? ['portfolio', `portfolio_${index}`, labelFrom(portfolio)] : null;
    }
    const broadcast = target.closest('.broadcast-card');
    if (broadcast) {
      const index = itemIndex(broadcast, '.broadcast-card');
      return index >= 0 && index < 100 ? ['broadcast', `broadcast_${index}`, labelFrom(broadcast)] : null;
    }
    const video = target.closest('.video-card');
    if (video) {
      const index = itemIndex(video, '.video-card');
      return index >= 0 && index < 30 ? ['video', `video_${index}`, labelFrom(video)] : null;
    }
    if (target.matches('[data-youtube-playlist]')) return ['video', 'video_playlist', 'เพลย์ลิสต์ YouTube'];
    if (target.matches('[data-month-prev]')) return ['schedule', 'schedule_month_prev', 'เดือนก่อนหน้า'];
    if (target.matches('[data-month-next]')) return ['schedule', 'schedule_month_next', 'เดือนถัดไป'];
    if (target.matches('[data-agenda-all]')) return ['schedule', 'schedule_agenda_all', 'ดูคิวทั้งเดือน'];
    if (target.matches('.calendar-day')) return ['schedule', 'schedule_day', 'เลือกวันในปฏิทิน'];
    if (target.matches('.hero-actions .text-link, .scroll-cue')) return ['navigation', 'hero_works', 'สำรวจผลงาน'];
    return null;
  };

  document.addEventListener('click', (event) => {
    const target = event.target.closest('a[href], button:not(:disabled)');
    if (!target) return;
    const details = clickDetails(target);
    if (details) send('click', details[0], details[1], details[2]);
  }, { capture: true });
})();
