(() => {
  const periods = [1, 7, 15, 30, 60, 90, 120, 365];
  const labels = {
    uniqueVisitors: 'ผู้เข้าชมไม่ซ้ำ',
    pageViews: 'การเปิดหน้าเว็บ',
    clicks: 'จำนวนคลิก',
    sectionViews: 'ส่วนที่ถูกเปิดดู'
  };
  const categoryLabels = {
    page: 'หน้าเว็บไซต์',
    navigation: 'เมนูเว็บไซต์',
    launcher: 'ดาวน์โหลด Launcher',
    portfolio: 'ผลงาน',
    broadcast: 'ถ่ายทอดสด',
    video: 'วิดีโอ',
    schedule: 'ตารางคิวงาน',
    contact: 'ช่องทางติดต่อ',
    section: 'ส่วนที่เปิดดู'
  };
  const numberFormat = new Intl.NumberFormat('th-TH');
  const state = { report: null, period: 30, metric: 'uniqueVisitors' };
  const node = (selector) => document.querySelector(selector);
  const chart = node('[data-chart]');
  const notice = node('[data-notice]');
  let noticeTimer = 0;

  const announce = (message) => {
    if (!notice) return;
    notice.textContent = message;
    notice.hidden = false;
    window.clearTimeout(noticeTimer);
    noticeTimer = window.setTimeout(() => { notice.hidden = true; }, 2600);
  };

  const formatDate = (key, options = { day: 'numeric', month: 'short' }) => {
    const date = new Date(`${key}T12:00:00+07:00`);
    return Number.isNaN(date.getTime()) ? key : new Intl.DateTimeFormat('th-TH', { ...options, timeZone: 'Asia/Bangkok' }).format(date);
  };

  const periodRows = () => {
    const today = state.report?.today;
    if (!today) return [];
    const [year, month, day] = today.split('-').map(Number);
    const end = new Date(Date.UTC(year, month - 1, day));
    const rowsByDate = new Map((state.report.daily || []).map((row) => [row.date, row]));
    return Array.from({ length: state.period }, (_, index) => {
      const date = new Date(end);
      date.setUTCDate(end.getUTCDate() - (state.period - 1 - index));
      const key = date.toISOString().slice(0, 10);
      return rowsByDate.get(key) || { date: key, pageViews: 0, clicks: 0, sectionViews: 0, uniqueVisitors: 0 };
    });
  };

  const renderChart = () => {
    if (!chart || !state.report) return;
    const rows = periodRows();
    const values = rows.map((row) => Math.max(0, Number(row[state.metric]) || 0));
    const maxValue = Math.max(1, ...values);
    const svgNs = 'http://www.w3.org/2000/svg';
    const svg = document.createElementNS(svgNs, 'svg');
    svg.setAttribute('viewBox', '0 0 1000 270');
    svg.setAttribute('role', 'img');
    svg.setAttribute('aria-label', `${labels[state.metric]} ย้อนหลัง ${state.period} วัน`);
    const left = 66;
    const right = 972;
    const top = 18;
    const bottom = 224;
    const xFor = (index) => rows.length < 2 ? (left + right) / 2 : left + (right - left) * index / (rows.length - 1);
    const yFor = (value) => bottom - (bottom - top) * value / maxValue;
    const defs = document.createElementNS(svgNs, 'defs');
    defs.innerHTML = '<linearGradient id="area-fill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stop-color="#ff713d" stop-opacity=".27"/><stop offset="100%" stop-color="#ff713d" stop-opacity="0"/></linearGradient>';
    svg.append(defs);

    for (let tick = 0; tick <= 4; tick += 1) {
      const y = top + (bottom - top) * tick / 4;
      const value = maxValue * (4 - tick) / 4;
      const line = document.createElementNS(svgNs, 'line');
      line.setAttribute('x1', String(left)); line.setAttribute('x2', String(right));
      line.setAttribute('y1', String(y)); line.setAttribute('y2', String(y)); line.setAttribute('class', 'chart-grid');
      svg.append(line);
      const text = document.createElementNS(svgNs, 'text');
      text.setAttribute('x', '52'); text.setAttribute('y', String(y + 4)); text.setAttribute('text-anchor', 'end'); text.setAttribute('class', 'chart-axis');
      text.textContent = numberFormat.format(Math.round(value));
      svg.append(text);
    }

    const points = values.map((value, index) => [xFor(index), yFor(value)]);
    const linePath = points.map(([x, y], index) => `${index ? 'L' : 'M'} ${x.toFixed(2)} ${y.toFixed(2)}`).join(' ');
    const area = document.createElementNS(svgNs, 'path');
    area.setAttribute('d', `${linePath} L ${points.at(-1)?.[0] || right} ${bottom} L ${points[0]?.[0] || left} ${bottom} Z`);
    area.setAttribute('class', 'chart-area');
    svg.append(area);
    const line = document.createElementNS(svgNs, 'path');
    line.setAttribute('d', linePath);
    line.setAttribute('class', 'chart-line');
    svg.append(line);

    const dotIndexes = new Set([0, rows.length - 1]);
    if (rows.length > 2) {
      for (let index = 1; index < rows.length - 1; index += Math.ceil(rows.length / 9)) dotIndexes.add(index);
      dotIndexes.add(Math.floor((rows.length - 1) / 2));
    }
    for (const index of [...dotIndexes].sort((a, b) => a - b)) {
      const [x, y] = points[index];
      const circle = document.createElementNS(svgNs, 'circle');
      circle.setAttribute('cx', String(x)); circle.setAttribute('cy', String(y)); circle.setAttribute('r', '4.2'); circle.setAttribute('class', 'chart-dot');
      const title = document.createElementNS(svgNs, 'title');
      title.textContent = `${formatDate(rows[index].date, { day: 'numeric', month: 'long', year: 'numeric' })}: ${numberFormat.format(values[index])}`;
      circle.append(title);
      svg.append(circle);
    }

    const labelIndexes = [...new Set([0, Math.floor((rows.length - 1) / 4), Math.floor((rows.length - 1) / 2), Math.floor((rows.length - 1) * 3 / 4), rows.length - 1])];
    for (const index of labelIndexes) {
      const text = document.createElementNS(svgNs, 'text');
      text.setAttribute('x', String(xFor(index)));
      text.setAttribute('y', '254');
      text.setAttribute('text-anchor', index === 0 ? 'start' : index === rows.length - 1 ? 'end' : 'middle');
      text.setAttribute('class', 'chart-axis');
      text.textContent = formatDate(rows[index].date);
      svg.append(text);
    }
    chart.replaceChildren(svg);
    node('[data-chart-label]').textContent = labels[state.metric];
    node('[data-chart-range]').textContent = rows.length ? `${formatDate(rows[0].date)} – ${formatDate(rows.at(-1).date)}` : '—';
  };

  const renderCategories = () => {
    const target = node('[data-categories]');
    if (!target || !state.report) return;
    const totals = new Map();
    (state.report.items || []).forEach((item) => {
      const current = totals.get(item.category) || 0;
      totals.set(item.category, current + (Number(item.clicks?.[String(state.period)]) || 0));
    });
    const categories = [...totals.entries()].sort((a, b) => b[1] - a[1] || (categoryLabels[a[0]] || a[0]).localeCompare(categoryLabels[b[0]] || b[0], 'th'));
    if (!categories.length) {
      target.innerHTML = '<p class="loading-message">ยังไม่มีข้อมูลคลิกในช่วงเวลานี้</p>';
      return;
    }
    target.replaceChildren(...categories.map(([key, count]) => {
      const card = document.createElement('article');
      card.className = `category-card category-card--${key}`;
      const label = document.createElement('small'); label.textContent = categoryLabels[key] || key;
      const value = document.createElement('strong'); value.textContent = numberFormat.format(count);
      const unit = document.createElement('span'); unit.textContent = '↗'; unit.setAttribute('aria-hidden', 'true');
      card.append(label, value, unit);
      return card;
    }));
  };

  const renderItems = () => {
    const target = node('[data-items]');
    if (!target || !state.report) return;
    const items = [...(state.report.items || [])].map((item) => ({
      ...item,
      periodClicks: Number(item.clicks?.[String(state.period)]) || 0,
      periodViews: Number(item.sectionViews?.[String(state.period)]) || 0
    })).filter((item) => item.periodClicks || item.periodViews)
      .sort((a, b) => b.periodClicks - a.periodClicks || b.periodViews - a.periodViews || String(a.itemLabel).localeCompare(String(b.itemLabel), 'th'));
    if (!items.length) {
      target.innerHTML = '<tr><td colspan="4" class="empty-cell">ยังไม่มีรายการที่ถูกคลิกในช่วงเวลานี้</td></tr>';
      return;
    }
    target.replaceChildren(...items.map((item) => {
      const row = document.createElement('tr');
      const category = document.createElement('td');
      const badge = document.createElement('span'); badge.className = 'item-category'; badge.textContent = categoryLabels[item.category] || item.category;
      category.append(badge);
      const label = document.createElement('td'); label.className = 'item-name'; label.textContent = item.itemLabel || item.itemId;
      const clicks = document.createElement('td'); clicks.className = 'item-count'; clicks.textContent = numberFormat.format(item.periodClicks);
      const views = document.createElement('td'); views.className = 'item-count'; views.textContent = numberFormat.format(item.periodViews);
      row.append(category, label, clicks, views);
      return row;
    }));
  };

  const render = () => {
    if (!state.report) return;
    const totals = state.report.periodTotals?.[String(state.period)] || {};
    for (const key of Object.keys(labels)) {
      const target = node(`[data-stat="${key}"]`);
      if (target) target.textContent = numberFormat.format(Number(totals[key]) || 0);
    }
    node('[data-period-caption]').textContent = `ย้อนหลัง ${state.period} วัน`;
    node('[data-details-period]').textContent = `${state.period} วัน`;
    node('[data-footer-date]').textContent = `ข้อมูลถึง ${formatDate(state.report.today, { day: 'numeric', month: 'long', year: 'numeric' })}`;
    document.querySelectorAll('[data-period]').forEach((button) => button.setAttribute('aria-pressed', String(Number(button.dataset.period) === state.period)));
    renderChart();
    renderCategories();
    renderItems();
  };

  const refresh = async () => {
    const button = node('[data-refresh]');
    if (button) button.disabled = true;
    node('[data-updated]').textContent = 'กำลังโหลด…';
    try {
      const endpoint = new URL('/admin/analytics/api/report', location.origin);
      const response = await fetch(endpoint, { cache: 'no-store', credentials: 'same-origin', headers: { accept: 'application/json' } });
      if (response.status === 401 || response.status === 403) throw new Error('access');
      if (!response.ok) throw new Error('server');
      const result = await response.json();
      if (result.ok !== true || !Array.isArray(result.periods) || !Array.isArray(result.daily) || !Array.isArray(result.items)) throw new Error('format');
      state.report = result;
      node('[data-updated]').textContent = new Intl.DateTimeFormat('th-TH', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short', timeZone: 'Asia/Bangkok' }).format(new Date(result.updatedAt)) + ' น.';
      render();
    } catch (error) {
      const message = error.message === 'access'
        ? 'ไม่พบสิทธิ์เข้าดูรายงาน กรุณาเข้าสู่ระบบด้วยบัญชีที่ได้รับอนุญาต'
        : 'ยังดึงรายงานไม่ได้ ลองรีเฟรชอีกครั้ง';
      node('[data-updated]').textContent = 'เชื่อมต่อไม่สำเร็จ';
      chart.innerHTML = '';
      const chartMessage = document.createElement('p'); chartMessage.className = 'loading-message'; chartMessage.textContent = message;
      chart.append(chartMessage);
      node('[data-categories]').textContent = message;
      node('[data-items]').innerHTML = `<tr><td colspan="4" class="empty-cell">${message}</td></tr>`;
      if (state.report) announce(message);
    } finally {
      if (button) button.disabled = false;
    }
  };

  const exportCsv = () => {
    if (!state.report) return announce('ยังไม่มีข้อมูลสำหรับดาวน์โหลด');
    const rows = [['หมวด', 'รายการ', 'คลิก', 'ส่วนที่เปิดดู', 'ช่วงวัน']];
    (state.report.items || []).forEach((item) => rows.push([
      categoryLabels[item.category] || item.category,
      item.itemLabel || item.itemId,
      Number(item.clicks?.[String(state.period)]) || 0,
      Number(item.sectionViews?.[String(state.period)]) || 0,
      state.period
    ]));
    const csvCell = (value) => {
      const text = String(value ?? '');
      const safe = /^[\u0000-\u0020]*[=+\-@]/.test(text) ? `'${text}` : text;
      return `"${safe.replace(/"/g, '""')}"`;
    };
    const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
    const blobUrl = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = `pepsproduction-analytics-${state.period}d-${state.report.today}.csv`;
    link.click();
    URL.revokeObjectURL(blobUrl);
    announce('ดาวน์โหลดรายงาน CSV แล้ว');
  };

  document.querySelectorAll('[data-period]').forEach((button) => button.addEventListener('click', () => {
    const period = Number(button.dataset.period);
    if (periods.includes(period)) { state.period = period; render(); }
  }));
  node('[data-metric]')?.addEventListener('change', (event) => {
    if (Object.hasOwn(labels, event.target.value)) { state.metric = event.target.value; renderChart(); }
  });
  node('[data-refresh]')?.addEventListener('click', refresh);
  node('[data-export]')?.addEventListener('click', exportCsv);
  refresh();
})();
