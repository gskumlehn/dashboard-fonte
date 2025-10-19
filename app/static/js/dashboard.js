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
      options: { responsive: true, maintainAspectRatio: false }
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
      options: { responsive: true, maintainAspectRatio: false }
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
      options: { responsive: true, maintainAspectRatio: false }
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
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  function hexToRgba(hex, alpha) {
    const h = hex.replace('#','');
    const bigint = parseInt(h.length === 3 ? h.split('').map(c=>c+c).join('') : h, 16);
    const r = (bigint >> 16) & 255;
    const g = (bigint >> 8) & 255;
    const b = bigint & 255;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  document.addEventListener('DOMContentLoaded', function () {
    const elLine = document.getElementById('chart-line');
    const elBar = document.getElementById('chart-bar');
    const elDoughnut = document.getElementById('chart-doughnut');
    const elRadar = document.getElementById('chart-radar');

    if (elLine) createLineChart(elLine.getContext('2d'));
    if (elBar) createBarChart(elBar.getContext('2d'));
    if (elDoughnut) createDoughnutChart(elDoughnut.getContext('2d'));
    if (elRadar) createRadarChart(elRadar.getContext('2d'));
  });
})();

