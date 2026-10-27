(() => {
  const menuButton = document.querySelector('.menu-toggle');
  const menu = document.querySelector('#site-nav');
  const year = new Date().getFullYear();

  document.querySelectorAll('[data-year]').forEach((node) => {
    node.textContent = String(year);
  });
  const scheduleYear = document.querySelector('[data-schedule-year]');
  if (scheduleYear) scheduleYear.textContent = String(year);

  if (menuButton && menu) {
    const closeMenu = () => {
      menuButton.setAttribute('aria-expanded', 'false');
      menuButton.setAttribute('aria-label', 'เปิดเมนู');
      menu.classList.remove('is-open');
      document.body.classList.remove('menu-open');
    };

    menuButton.addEventListener('click', () => {
      const isOpen = menuButton.getAttribute('aria-expanded') === 'true';
      menuButton.setAttribute('aria-expanded', String(!isOpen));
      menuButton.setAttribute('aria-label', isOpen ? 'เปิดเมนู' : 'ปิดเมนู');
      menu.classList.toggle('is-open', !isOpen);
      document.body.classList.toggle('menu-open', !isOpen && window.matchMedia('(max-width: 780px)').matches);
    });

    menu.querySelectorAll('a').forEach((link) => link.addEventListener('click', closeMenu));
    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') closeMenu();
    });
    window.addEventListener('resize', () => {
      if (!window.matchMedia('(max-width: 780px)').matches) closeMenu();
    });
  }

  const safeHttpsUrl = (value) => {
    try {
      const url = new URL(value, window.location.href);
      return url.protocol === 'https:' ? url.href : '';
    } catch {
      return '';
    }
  };

  const visitorCountNode = document.querySelector('[data-visitor-number]');
  const loadVisitorCount = async () => {
    if (!visitorCountNode) return;
    const countCacheKey = 'pepslive-counter-last-pepslive-tools';
    const fallbackCount = 1309;
    const formatVisitorCount = (value) => new Intl.NumberFormat('th-TH').format(Math.max(fallbackCount, value));
    const createId = () => window.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    let lastKnown = fallbackCount;
    let visitorKey = '';
    try {
      const cached = Number(window.localStorage.getItem(countCacheKey));
      if (Number.isSafeInteger(cached) && cached > lastKnown) lastKnown = cached;
      visitorKey = window.localStorage.getItem('pepslive-visitor-id') || '';
      if (!visitorKey) {
        visitorKey = createId();
        window.localStorage.setItem('pepslive-visitor-id', visitorKey);
      }
    } catch {
      try {
        visitorKey = window.sessionStorage.getItem('pepslive-visitor-session-id') || '';
        if (!visitorKey) {
          visitorKey = createId();
          window.sessionStorage.setItem('pepslive-visitor-session-id', visitorKey);
        }
      } catch {
        visitorKey = createId();
      }
    }

    visitorCountNode.textContent = formatVisitorCount(lastKnown);
    if (navigator.doNotTrack === '1' || !visitorKey) return;

    const visitKey = `${visitorKey}:${new Date().toISOString().slice(0, 10)}`;
    try {
      const response = await fetch('/api/visitor', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ visitorKey, visitKey, page: location.pathname || '/' }),
        cache: 'no-store',
        signal: AbortSignal.timeout(8000)
      });
      if (!response.ok) throw new Error('visitor_counter_unavailable');
      const payload = await response.json();
      const count = Number(payload.count);
      if (payload.ok !== true || !Number.isSafeInteger(count) || count < 0) throw new Error('visitor_count_invalid');
      lastKnown = Math.max(lastKnown, count);
      visitorCountNode.textContent = formatVisitorCount(lastKnown);
      try { window.localStorage.setItem(countCacheKey, String(lastKnown)); } catch { /* The API count still displays for this page. */ }
    } catch {
      // Keep the last verified count if the upstream analytics sheet is temporarily unavailable.
    }
  };

  const text = (tag, value, className) => {
    const node = document.createElement(tag);
    if (className) node.className = className;
    node.textContent = value || '';
    return node;
  };

  const formatDate = (value) => {
    if (!value) return '';
    const date = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T05:00:00Z`) : new Date(value);
    return Number.isNaN(date.getTime()) ? value : new Intl.DateTimeFormat('th-TH', {
      day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok'
    }).format(date);
  };

  const formatDateTime = (value) => {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat('th-TH', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok'
    }).format(date) + ' น.';
  };

  const dateKeyInBangkok = (value) => {
    if (!value) return '';
    if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return '';
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'Asia/Bangkok'
    }).formatToParts(date);
    const part = Object.fromEntries(parts.map(({ type, value: item }) => [type, item]));
    return `${part.year}-${part.month}-${part.day}`;
  };

  const dateFromKey = (key) => {
    const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key || '');
    return match ? new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3]))) : null;
  };

  const shiftDateKey = (key, days) => {
    const date = dateFromKey(key);
    if (!date) return '';
    date.setUTCDate(date.getUTCDate() + days);
    return date.toISOString().slice(0, 10);
  };

  const todayKeyInBangkok = () => {
    const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Bangkok', year: 'numeric', month: '2-digit', day: '2-digit'
    }).formatToParts(new Date()).map(({ type, value }) => [type, value]));
    return `${parts.year}-${parts.month}-${parts.day}`;
  };

  const eventStartKey = (record) => dateKeyInBangkok(record.start || record.date);

  const eventEndKey = (record) => {
    const start = eventStartKey(record);
    const rawEnd = record.end || record.endDate || record.start || record.date;
    const end = dateKeyInBangkok(rawEnd);
    if (!start || !end) return start;
    if (record.allDay && /^\d{4}-\d{2}-\d{2}$/.test(rawEnd)) return shiftDateKey(end, -1);
    const endDate = new Date(rawEnd);
    if (!Number.isNaN(endDate.getTime()) && end > start) {
      const endTime = Object.fromEntries(new Intl.DateTimeFormat('en-GB', {
        timeZone: 'Asia/Bangkok', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23'
      }).formatToParts(endDate).map(({ type, value }) => [type, value]));
      if (endTime.hour === '00' && endTime.minute === '00' && endTime.second === '00') return shiftDateKey(end, -1);
    }
    return end;
  };

  const monthLabel = (key) => {
    const date = dateFromKey(`${key.slice(0, 7)}-01`);
    return date ? new Intl.DateTimeFormat('th-TH', { month: 'long', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(date) : '';
  };

  const formatScheduleRange = (record) => {
    const startKey = eventStartKey(record);
    const endKey = eventEndKey(record);
    const start = dateFromKey(startKey);
    const end = dateFromKey(endKey);
    if (!start || !end) return '';

    const withYear = new Intl.DateTimeFormat('th-TH', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' });
    let label;
    if (startKey === endKey) label = withYear.format(start);
    else if (start.getUTCMonth() === end.getUTCMonth() && start.getUTCFullYear() === end.getUTCFullYear()) {
      const monthAndYear = new Intl.DateTimeFormat('th-TH', { month: 'short', year: 'numeric', timeZone: 'Asia/Bangkok' }).format(start);
      label = `${start.getUTCDate()}–${end.getUTCDate()} ${monthAndYear}`;
    } else label = `${withYear.format(start)} – ${withYear.format(end)}`;

    if (!record.allDay && startKey === endKey) {
      const startTime = new Date(record.start);
      const endTime = new Date(record.end);
      if (!Number.isNaN(startTime.getTime()) && !Number.isNaN(endTime.getTime())) {
        const time = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Bangkok' });
        label += ` · ${time.format(startTime)}–${time.format(endTime)} น.`;
      }
    }
    return label;
  };

  const makeAction = (label, href) => {
    const safeUrl = safeHttpsUrl(href);
    if (!safeUrl || !label) return null;
    const link = text('a', `${label} ↗`);
    link.href = safeUrl;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    return link;
  };

  const renderPortfolio = (records) => {
    const container = document.querySelector('[data-collection="portfolio"]');
    if (!container || !records.length) return;
    container.replaceChildren();

    records.slice(0, 8).forEach((record, index) => {
      const card = document.createElement('article');
      card.className = 'portfolio-card';
      if (record.image) {
        const imageUrl = safeHttpsUrl(record.image) || (record.image.startsWith('assets/') ? record.image : '');
        if (imageUrl) {
          const image = document.createElement('img');
          image.src = imageUrl;
          image.alt = record.imageAlt || record.title || 'ภาพผลงาน';
          image.loading = 'lazy';
          image.decoding = 'async';
          card.append(image);
        }
      }
      const copy = document.createElement('div');
      copy.className = 'portfolio-card-copy';
      copy.append(text('small', `${String(index + 1).padStart(2, '0')} / ${record.category || 'LIVE REPLAY'}${record.duration ? ` · ${record.duration}` : ''}`));
      copy.append(text('h3', record.title));
      if (record.description) copy.append(text('p', record.description));
      const action = makeAction(record.linkLabel || 'ดูรายละเอียดงาน', record.url);
      if (action) copy.append(action);
      card.append(copy);
      container.append(card);
    });
  };

  const loadPortfolio = async () => {
    for (const url of ['api/youtube-portfolio', 'assets/youtube-portfolio.json']) {
      try {
        const response = await fetch(url, { cache: 'no-cache' });
        if (!response.ok) continue;
        const data = await response.json();
        if (!Array.isArray(data.items) || data.items.length !== 8) continue;
        renderPortfolio(data.items);
        const status = document.querySelector('[data-portfolio-updated]');
        const updated = new Date(data.updatedAt);
        if (status && !Number.isNaN(updated.getTime())) {
          status.textContent = `ข้อมูลจาก YouTube · อัปเดต ${new Intl.DateTimeFormat('th-TH', { dateStyle: 'medium', timeStyle: 'short', timeZone: 'Asia/Bangkok' }).format(updated)} น.`;
        }
        return;
      } catch { /* Try the last verified static snapshot. */ }
    }
    const status = document.querySelector('[data-portfolio-updated]');
    if (status) status.textContent = 'โหลดผลงานไม่สำเร็จ · เปิดดูไลฟ์ทั้งหมดบน YouTube ได้';
  };

  const renderBroadcasts = (records) => {
    const container = document.querySelector('[data-collection="broadcasts"]');
    if (!container || !records.length) return;
    container.querySelector('[data-empty]')?.remove();

    records.forEach((record) => {
      const card = document.createElement('article');
      const thumbnailUrl = safeHttpsUrl(record.thumbnail || record.image);
      card.className = `broadcast-card${record.startsAt && thumbnailUrl ? ' broadcast-card--youtube' : ''}`;
      if (record.startsAt && thumbnailUrl) {
        const thumbnail = document.createElement('img');
        thumbnail.className = 'broadcast-thumbnail';
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = '';
        thumbnail.loading = 'lazy';
        thumbnail.decoding = 'async';
        card.append(thumbnail);
      }
      const dateLabel = record.startsAt ? formatDateTime(record.startsAt) : formatDate(record.date);
      card.append(text('small', [record.status || (record.startsAt ? 'YOUTUBE · LIVE UPCOMING' : 'รายการถ่ายทอดสด'), dateLabel].filter(Boolean).join(' · ')));
      card.append(text('h3', record.title));
      card.append(text('p', record.description || (record.startsAt ? 'กำหนดการนี้ซิงก์จากช่อง YouTube PepsProduction อัตโนมัติ' : '')));
      const action = makeAction(record.linkLabel || (record.startsAt ? 'เปิดหน้าไลฟ์ YouTube' : 'รายละเอียด / รับชม'), record.url);
      if (action) card.append(action);
      container.append(card);
    });
  };

  const loadYoutubeUpcoming = () => {
    fetch('/api/youtube-upcoming', { cache: 'no-store' })
      .then((response) => response.ok ? response.json() : null)
      .then((data) => {
        if (data?.connected === true && Array.isArray(data.streams)) renderBroadcasts(data.streams);
      })
      .catch(() => {
        // Upcoming streams remain optional if the YouTube API is not configured or unavailable.
      });
  };

  const youtubeId = (record) => {
    if (/^[a-zA-Z0-9_-]{11}$/.test(record.youtubeId || '')) return record.youtubeId;
    const safeUrl = safeHttpsUrl(record.url);
    if (!safeUrl) return '';
    try {
      const url = new URL(safeUrl);
      if (url.hostname === 'youtu.be') return url.pathname.slice(1).split('/')[0] || '';
      if (url.hostname === 'youtube.com' || url.hostname === 'www.youtube.com' || url.hostname === 'm.youtube.com') {
        return url.searchParams.get('v') || url.pathname.match(/^\/(?:embed|shorts|live)\/([\w-]{11})/)?.[1] || '';
      }
    } catch { /* Ignore malformed URLs. */ }
    return '';
  };

  const renderVideos = (records) => {
    const container = document.querySelector('[data-collection="videos"]');
    if (!container || !records.length) return;
    container.querySelector('[data-empty]')?.remove();
    container.classList.add('has-items');

    records.forEach((record) => {
      const card = document.createElement('article');
      card.className = 'video-card';
      const player = document.createElement('div');
      player.className = 'video-player';
      const thumbnailUrl = safeHttpsUrl(record.image);
      if (thumbnailUrl) {
        const thumbnail = document.createElement('img');
        thumbnail.className = 'video-thumbnail';
        thumbnail.src = thumbnailUrl;
        thumbnail.alt = '';
        thumbnail.loading = 'lazy';
        thumbnail.decoding = 'async';
        player.append(thumbnail);
      }
      const id = youtubeId(record);
      if (id) {
        const button = text('button', '▶  เล่นคลิป');
        button.type = 'button';
        button.className = 'video-play';
        button.setAttribute('aria-label', `เล่นคลิป ${record.title || 'YouTube'}`);
        button.addEventListener('click', () => {
          const frame = document.createElement('iframe');
          frame.title = record.title || 'วิดีโอจาก PepsProduction';
          frame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
          frame.loading = 'lazy';
          frame.referrerPolicy = 'strict-origin-when-cross-origin';
          frame.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
          frame.allowFullscreen = true;
          player.replaceChildren(frame);
        }, { once: true });
        player.append(button);
      }

      const copy = document.createElement('div');
      copy.className = 'video-card-copy';
      copy.append(text('small', record.category || 'PEPSPRODUCTION'));
      copy.append(text('h3', record.title));
      copy.append(text('p', record.description));
      card.append(player, copy);
      container.append(card);
    });
  };

  const scheduleState = { records: [], month: '', selectedDate: '', source: 'site' };
  let scheduleSyncInFlight = false;

  const renderSchedule = (records, source = 'site') => {
    const container = document.querySelector('[data-collection="schedule"]');
    const grid = container?.querySelector('[data-calendar-grid]');
    const list = container?.querySelector('[data-schedule-list]');
    const monthTitle = container?.querySelector('[data-month-label]');
    const agendaTitle = container?.querySelector('[data-agenda-label]');
    const empty = container?.querySelector('[data-agenda-empty]');
    if (!container || !grid || !list || !monthTitle || !agendaTitle || !empty) return;

    if (source === 'google' && scheduleState.source !== 'google') scheduleState.month = '';
    scheduleState.records = (Array.isArray(records) ? records : []).filter((record) => (
      record && typeof record.title === 'string' && record.title.trim() && eventStartKey(record) && eventEndKey(record)
    ));
    scheduleState.source = source;

    const status = container.querySelector('[data-schedule-status]');
    if (status) status.textContent = source === 'google'
      ? 'ซิงก์อัตโนมัติจาก Google Calendar · เวลาไทย'
      : 'แสดงเฉพาะคิวงานที่เลือกเผยแพร่ · เวลาไทย';

    if (!scheduleState.month) {
      const today = todayKeyInBangkok();
      const upcoming = scheduleState.records.map(eventStartKey).filter((key) => key >= today).sort()[0];
      scheduleState.month = (upcoming || today).slice(0, 7);
    }

    const [yearNumber, monthNumber] = scheduleState.month.split('-').map(Number);
    if (!yearNumber || !monthNumber) return;
    const scheduleYear = container.querySelector('[data-schedule-year]');
    if (scheduleYear) scheduleYear.textContent = String(yearNumber);
    const monthStart = dateFromKey(`${scheduleState.month}-01`);
    const monthEnd = dateFromKey(`${scheduleState.month}-${String(new Date(Date.UTC(yearNumber, monthNumber, 0)).getUTCDate()).padStart(2, '0')}`);
    if (!monthStart || !monthEnd) return;
    monthTitle.textContent = monthLabel(`${scheduleState.month}-01`);

    const monthEvents = scheduleState.records.filter((record) => (
      eventEndKey(record) >= `${scheduleState.month}-01` && eventStartKey(record) <= monthEnd.toISOString().slice(0, 10)
    )).sort((a, b) => eventStartKey(a).localeCompare(eventStartKey(b)) || String(a.title).localeCompare(String(b.title), 'th'));
    const eventsByDay = new Map();
    monthEvents.forEach((record) => {
      let key = eventStartKey(record);
      const last = eventEndKey(record);
      while (key && key <= last && key.slice(0, 7) === scheduleState.month) {
        eventsByDay.set(key, (eventsByDay.get(key) || 0) + 1);
        key = shiftDateKey(key, 1);
      }
    });

    const todayKey = todayKeyInBangkok();
    const firstWeekday = monthStart.getUTCDay();
    const daysInMonth = monthEnd.getUTCDate();
    const cellCount = Math.ceil((firstWeekday + daysInMonth) / 7) * 7;
    grid.replaceChildren();
    for (let cell = 0; cell < cellCount; cell += 1) {
      const day = cell - firstWeekday + 1;
      if (day < 1 || day > daysInMonth) {
        const spacer = document.createElement('span');
        spacer.className = 'calendar-day-spacer';
        spacer.setAttribute('aria-hidden', 'true');
        grid.append(spacer);
        continue;
      }
      const key = `${scheduleState.month}-${String(day).padStart(2, '0')}`;
      const count = eventsByDay.get(key) || 0;
      const button = text('button', '', `calendar-day${count ? ' has-event' : ''}${key === todayKey ? ' is-today' : ''}${key === scheduleState.selectedDate ? ' is-selected' : ''}`);
      button.type = 'button';
      button.setAttribute('aria-pressed', String(key === scheduleState.selectedDate));
      button.setAttribute('aria-label', count ? `${day} มี ${count} คิวงาน` : `${day} ไม่มีคิวงาน`);
      button.append(text('span', String(day), 'calendar-day-number'));
      if (count) button.append(text('span', String(count), 'calendar-event-count'));
      button.addEventListener('click', () => {
        scheduleState.selectedDate = scheduleState.selectedDate === key ? '' : key;
        renderSchedule(scheduleState.records, scheduleState.source);
      });
      grid.append(button);
    }

    agendaTitle.textContent = scheduleState.selectedDate
      ? `คิววันที่ ${formatDate(scheduleState.selectedDate)}`
      : `คิวงานเดือน ${new Intl.DateTimeFormat('th-TH', { month: 'short', timeZone: 'Asia/Bangkok' }).format(monthStart)}`;
    const shownEvents = scheduleState.selectedDate
      ? monthEvents.filter((record) => eventStartKey(record) <= scheduleState.selectedDate && eventEndKey(record) >= scheduleState.selectedDate)
      : monthEvents;
    list.replaceChildren();
    shownEvents.forEach((record) => {
      const item = document.createElement('article');
      item.className = 'schedule-event';
      item.append(text('small', formatScheduleRange(record)));
      item.append(text('h4', record.title));
      list.append(item);
    });
    empty.hidden = shownEvents.length > 0;
    if (shownEvents.length === 0) {
      empty.querySelector('strong').textContent = scheduleState.selectedDate ? 'วันนี้ยังไม่มีคิวงาน' : 'ยังไม่มีคิวงานในเดือนนี้';
      empty.querySelector('p').textContent = 'ติดต่อสอบถามคิวว่างหรือรายละเอียดเพิ่มเติมได้เลย';
    }
  };

  const installScheduleControls = () => {
    const container = document.querySelector('[data-collection="schedule"]');
    if (!container) return;
    const changeMonth = (amount) => {
      if (!/^\d{4}-\d{2}$/.test(scheduleState.month)) return;
      const [yearNumber, monthNumber] = scheduleState.month.split('-').map(Number);
      const date = new Date(Date.UTC(yearNumber, monthNumber - 1 + amount, 1));
      scheduleState.month = `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
      scheduleState.selectedDate = '';
      renderSchedule(scheduleState.records, scheduleState.source);
    };
    container.querySelector('[data-month-prev]')?.addEventListener('click', () => changeMonth(-1));
    container.querySelector('[data-month-next]')?.addEventListener('click', () => changeMonth(1));
    container.querySelector('[data-agenda-all]')?.addEventListener('click', () => {
      scheduleState.selectedDate = '';
      renderSchedule(scheduleState.records, scheduleState.source);
    });
  };

  const refreshGoogleSchedule = async () => {
    if (document.visibilityState === 'hidden' || scheduleSyncInFlight) return;
    scheduleSyncInFlight = true;
    try {
      const response = await fetch('/api/schedule', { cache: 'no-store' });
      if (!response.ok) return;
      const schedule = await response.json();
      if (schedule?.connected === true && Array.isArray(schedule.events)) {
        renderSchedule(schedule.events, 'google');
      }
    } catch {
      // Keep the last successful calendar snapshot visible if a refresh fails.
    } finally {
      scheduleSyncInFlight = false;
    }
  };

  const safeContactUrl = (value) => {
    if (typeof value !== 'string') return '';
    if (/^tel:\+?[0-9-]+$/.test(value)) return value;
    return safeHttpsUrl(value);
  };

  const copyToClipboard = async (value) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return;
    }
    const field = document.createElement('textarea');
    field.value = value;
    field.setAttribute('readonly', '');
    field.style.position = 'fixed';
    field.style.opacity = '0';
    document.body.append(field);
    field.select();
    const copied = document.execCommand('copy');
    field.remove();
    if (!copied) throw new Error('copy_failed');
  };

  const contactIconFiles = {
    facebook: 'facebook.svg',
    phone: 'phone.svg',
    tiktok: 'tiktok.svg',
    youtube: 'youtube.svg'
  };

  const renderContactLinks = (records, lineAddFriendUrl) => {
    const container = document.querySelector('[data-contact-links]');
    if (!container) return;
    const lineCard = container.querySelector('[data-line-add-friend]');
    const safeLineUrl = safeHttpsUrl(lineAddFriendUrl);
    if (lineCard && safeLineUrl) lineCard.href = safeLineUrl;
    container.replaceChildren();
    if (lineCard) container.append(lineCard);
    if (!Array.isArray(records)) return;
    records.forEach((record) => {
      if (record.platform === 'line') return;
      const isCopy = record.action === 'copy' && typeof record.value === 'string' && record.value;
      const url = safeContactUrl(record.url);
      if (!url && !isCopy) return;
      const link = document.createElement(isCopy ? 'button' : 'a');
      link.className = `contact-link${isCopy ? ' contact-link-button' : ''}`;
      if (isCopy) {
        link.type = 'button';
        link.addEventListener('click', async () => {
          const action = link.querySelector('.contact-arrow');
          try {
            await copyToClipboard(record.value);
            if (action) action.textContent = 'คัดลอกแล้ว';
            window.setTimeout(() => { if (action) action.textContent = 'คัดลอก'; }, 1800);
          } catch {
            if (action) action.textContent = record.value;
          }
        });
      } else {
        link.href = url;
        if (url.startsWith('https:')) {
          link.target = '_blank';
          link.rel = 'noopener noreferrer';
        }
      }
      const iconClass = ['line', 'phone', 'tiktok', 'youtube'].includes(record.platform) ? ` contact-icon--${record.platform}` : '';
      const icon = document.createElement('span');
      icon.className = `contact-icon${iconClass}${record.platform === 'facebook' ? ' contact-icon--facebook' : ''}`;
      icon.setAttribute('aria-hidden', 'true');
      const iconFile = contactIconFiles[record.platform];
      if (iconFile) {
        const image = document.createElement('img');
        image.src = `assets/social/${iconFile}`;
        image.alt = '';
        image.width = 24;
        image.height = 24;
        image.loading = 'lazy';
        image.decoding = 'async';
        icon.append(image);
      } else {
        icon.textContent = record.icon || '↗';
      }
      const label = document.createElement('span');
      label.className = 'contact-link-copy';
      label.append(text('small', record.label));
      label.append(text('strong', record.name));
      const arrow = text('span', isCopy ? 'คัดลอก' : url.startsWith('tel:') ? 'โทร' : '↗', 'contact-arrow');
      arrow.setAttribute('aria-hidden', 'true');
      link.append(icon, label, arrow);
      container.append(link);
    });
  };

  loadVisitorCount();
  loadPortfolio();

  fetch('site-content.json', { cache: 'no-cache' })
    .then((response) => {
      if (!response.ok) throw new Error('site_content_not_found');
      return response.json();
    })
    .then((content) => {
      const downloadUrl = safeHttpsUrl(content.launcher?.downloadUrl);
      if (downloadUrl) {
        document.querySelectorAll('[data-launcher-download]').forEach((link) => { link.href = downloadUrl; });
      }
      if (content.launcher?.version) {
        document.querySelectorAll('[data-launcher-version]').forEach((node) => { node.textContent = content.launcher.version; });
      }
      if (content.launcher?.size) {
        document.querySelectorAll('[data-launcher-size]').forEach((node) => { node.textContent = content.launcher.size; });
      }
      const playlistUrl = safeHttpsUrl(content.youtubePlaylist);
      const playlistLink = document.querySelector('[data-youtube-playlist]');
      if (playlistUrl && playlistLink) playlistLink.href = playlistUrl;

      renderBroadcasts(Array.isArray(content.broadcasts) ? content.broadcasts : []);
      renderVideos(Array.isArray(content.videos) ? content.videos : []);
      loadYoutubeUpcoming();
      installScheduleControls();
      renderSchedule(Array.isArray(content.schedule) ? content.schedule : []);
      renderContactLinks(content.contactLinks, content.lineAddFriendUrl);

      refreshGoogleSchedule();
      window.setInterval(refreshGoogleSchedule, 120_000);
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') refreshGoogleSchedule();
      });
    })
    .catch(() => {
      // The page contains readable empty states and current links if optional data is unavailable.
    });
})();

(() => {
  const makeRipple = (target, x, y) => {
    target.classList.add('has-tap-effect');
    target.querySelector('.tap-ripple')?.remove();
    const bounds = target.getBoundingClientRect();
    const ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    ripple.style.left = `${Math.max(0, Math.min(bounds.width, x - bounds.left))}px`;
    ripple.style.top = `${Math.max(0, Math.min(bounds.height, y - bounds.top))}px`;
    target.prepend(ripple);
    window.setTimeout(() => ripple.remove(), 650);
  };

  document.addEventListener('pointerdown', (event) => {
    if (event.button !== 0) return;
    const target = event.target.closest('a[href], button:not(:disabled)');
    if (target && !target.classList.contains('skip-link')) makeRipple(target, event.clientX, event.clientY);
  }, { passive: true });

  document.addEventListener('click', (event) => {
    if (event.detail !== 0) return;
    const target = event.target.closest('a[href], button:not(:disabled)');
    if (target && !target.classList.contains('skip-link')) {
      const bounds = target.getBoundingClientRect();
      makeRipple(target, bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    }
  });
})();
