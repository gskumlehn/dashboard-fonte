(function () {
  function getColorVar(name, fallback) {
    const v = getComputedStyle(document.documentElement).getPropertyValue(name);
    return (v || fallback).trim();
  }

  const colors = {
    primary: getColorVar('--primary', '#c67440'),
    secondary: getColorVar('--secondary', '#b56535'),
    accent: getColorVar('--accent', '#f2cfa6'),
    muted: getColorVar('--muted', '#f5f5f5'),
    success: getColorVar('--success', '#28a745'),
    danger: getColorVar('--danger', '#dc3545')
  };

  function hexToRgba(hex, alpha) {
    if (!hex) return `rgba(0,0,0,${alpha})`;
    const h = hex.replace('#','').trim();
    const full = h.length === 3 ? h.split('').map(c=>c+c).join('') : h;
    const bigint = parseInt(full, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  function safeCreateChart(createFn, id, name) {
    try {
      const el = document.getElementById(id);
      if (!el) {
        console.debug(`Canvas ${id} não encontrado — ignorando ${name}`);
        return;
      }
      const ctx = el.getContext && el.getContext('2d');
      if (!ctx) {
        console.warn(`Context 2d não disponível para ${id}`);
        return;
      }
      createFn(ctx);
      console.debug(`${name} criado em ${id}`);
    } catch (err) {
      console.error(`Erro ao criar ${name} em ${id}:`, err);
    }
  }

  function createLineChart(ctx) {
    return new Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan','Fev','Mar','Abr','Mai','Jun','Jul'],
        datasets: [{
          label: 'Receita',
          data: [1200, 1500, 1700, 1600, 1900, 2200, 2400],
          borderColor: colors.primary,
          backgroundColor: hexToRgba(colors.primary, 0.12),
          fill: true,
          tension: 0.3,
          pointRadius: 3
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }
    });
  }

  function createBarChart(ctx) {
    return new Chart(ctx, {
      type: 'bar',
      data: {
        labels: ['Mon','Tue','Wed','Thu','Fri','Sat','Sun'],
        datasets: [{
          label: 'Novos usuários',
          data: [12, 19, 8, 14, 23, 7, 10],
          backgroundColor: colors.secondary,
          borderRadius: 6
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }
    });
  }

  function createDoughnutChart(ctx) {
    return new Chart(ctx, {
      type: 'doughnut',
      data: {
        labels: ['Orgânico','Pago','Indicação'],
        datasets: [{
          data: [55, 30, 15],
          backgroundColor: [colors.primary, colors.accent, colors.muted]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'right' } } }
    });
  }

  function createRadarChart(ctx) {
    return new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Velocidade','Estabilidade','UX','Funcionalidade','Segurança'],
        datasets: [{
          label: 'Pontuação',
          data: [80, 65, 75, 90, 70],
          backgroundColor: hexToRgba(colors.primary, 0.14),
          borderColor: colors.primary,
          pointBackgroundColor: colors.primary
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { r: { grid: { display: false } } } }
    });
  }

  function createPolarChart(ctx) {
    return new Chart(ctx, {
      type: 'polarArea',
      data: {
        labels: ['Produto A','Produto B','Produto C','Produto D'],
        datasets: [{
          data: [11, 16, 7, 14],
          backgroundColor: [colors.primary, colors.secondary, colors.accent, colors.muted]
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function createBubbleChart(ctx) {
    return new Chart(ctx, {
      type: 'bubble',
      data: {
        datasets: [{
          label: 'Segmentos',
          data: [
            { x: 10, y: 20, r: 8 },
            { x: 15, y: 10, r: 12 },
            { x: 7, y: 25, r: 6 },
            { x: 18, y: 15, r: 10 }
          ],
          backgroundColor: hexToRgba(colors.secondary, 0.6)
        }]
      },
      options: { responsive: true, maintainAspectRatio: false, scales: { x: { grid: { display: false } }, y: { grid: { display: false } } } }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    if (typeof Chart === 'undefined') {
      console.error('Chart.js não encontrado. Verifique se o CDN está carregado antes de dashboard.js');
      return;
    }

    safeCreateChart(createLineChart, 'chart-line', 'LineChart');
    safeCreateChart(createBarChart, 'chart-bar', 'BarChart');
    safeCreateChart(createDoughnutChart, 'chart-doughnut', 'DoughnutChart');
    safeCreateChart(createRadarChart, 'chart-radar', 'RadarChart');
    safeCreateChart(createPolarChart, 'chart-polar', 'PolarAreaChart');
    safeCreateChart(createBubbleChart, 'chart-bubble', 'BubbleChart');
  });
})();
