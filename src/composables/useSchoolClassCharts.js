import { computed } from 'vue';
import { useTheme } from '@/composables/useTheme';

export const CHART_PALETTE = [
  'rgba(0, 168, 232, 0.85)',
  'rgba(26, 147, 111, 0.85)',
  'rgba(168, 51, 185, 0.85)',
  'rgba(247, 183, 7, 0.85)',
  'rgba(197, 40, 61, 0.85)',
  'rgba(0, 168, 232, 0.5)',
  'rgba(26, 147, 111, 0.5)',
  'rgba(168, 51, 185, 0.5)',
];

const chartFont = { family: 'Advent Pro, sans-serif' };

export function useSchoolClassCharts(classesRef, useNormalizedRef = { value: false }) {
  const { effectiveTheme } = useTheme();
  const isDarkTheme = computed(() => effectiveTheme.value === 'dark');

  const chartTheme = computed(() =>
    isDarkTheme.value
      ? {
        gridColor: 'rgba(255,255,255,0.08)',
        tickColor: 'rgba(255,255,255,0.6)',
        tooltipBg: 'rgba(8,33,42,0.96)',
        tooltipBorder: 'rgba(255,255,255,0.16)',
      }
      : {
        gridColor: 'rgba(13,37,48,0.12)',
        tickColor: 'rgba(13,37,48,0.72)',
        tooltipBg: 'rgba(255,255,255,0.98)',
        tooltipBorder: 'rgba(13,37,48,0.2)',
      }
  );

  const studentsPerClassData = computed(() => {
    const classes = classesRef.value;
    if (!classes?.length) return null;
    return {
      labels: classes.map((c) => c.name),
      datasets: [{
        label: 'Students',
        data: classes.map((c) => c.numberOfStudents ?? 0),
        backgroundColor: classes.map((_, i) => CHART_PALETTE[i % CHART_PALETTE.length]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      }],
    };
  });

  const classXPData = computed(() => {
    const classes = classesRef.value?.filter((c) => {
      if (useNormalizedRef.value) return c.teacherRelativeScore != null;
      return (c.experience ?? 0) > 0;
    });
    if (!classes?.length) return null;
    const label = useNormalizedRef.value ? 'Engagement rank' : 'XP';
    return {
      labels: classes.map((c) => c.name),
      datasets: [{
        label,
        data: classes.map((c) =>
          useNormalizedRef.value ? c.teacherRelativeScore : (c.experience ?? 0)
        ),
        backgroundColor: classes.map((_, i) => CHART_PALETTE[(i + 2) % CHART_PALETTE.length]),
        borderRadius: 6,
        borderSkipped: false,
        maxBarThickness: 48,
      }],
    };
  });

  const barOptions = computed(() => ({
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        titleFont: chartFont,
        bodyFont: chartFont,
        backgroundColor: chartTheme.value.tooltipBg,
        borderColor: chartTheme.value.tooltipBorder,
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: chartTheme.value.tickColor, font: chartFont },
        grid: { display: false },
      },
      y: {
        ticks: { color: chartTheme.value.tickColor, font: chartFont },
        grid: { color: chartTheme.value.gridColor },
        beginAtZero: true,
      },
    },
  }));

  const xpBarOptions = computed(() => ({
    ...barOptions.value,
    plugins: {
      ...barOptions.value.plugins,
      tooltip: {
        ...barOptions.value.plugins.tooltip,
        callbacks: {
          label: (ctx) =>
            useNormalizedRef.value
              ? `Engagement rank: ${ctx.parsed.y}`
              : `${ctx.parsed.y.toLocaleString()} XP`,
        },
      },
    },
    scales: {
      ...barOptions.value.scales,
      y: {
        ...barOptions.value.scales.y,
        max: useNormalizedRef.value ? 100 : undefined,
      },
    },
  }));

  return {
    studentsPerClassData,
    classXPData,
    barOptions,
    xpBarOptions,
  };
}
