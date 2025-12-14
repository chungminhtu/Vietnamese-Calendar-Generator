// constants.js
(function() {
  'use strict';

  const STORAGE_KEY = 'vietnamese-calendar-settings';
  const ACCORDION_STATE_KEY = 'vietnamese-calendar-accordion-state';
  const CUSTOM_PALETTES_KEY = 'vietnamese-calendar-custom-palettes';
  const DB_NAME = 'vietnamese-calendar-images';
  const DB_VERSION = 2;
  const STORE_NAME = 'background-images';
  const A4_PORTRAIT_RATIO = 210 / 297;
  const A4_LANDSCAPE_RATIO = 297 / 210;
  const MAX_INIT_ATTEMPTS = 100;
  const EXPORT_SCALE = 4;
  const DPI = 96;
  const MM_PER_INCH = 25.4;
  const A4_WIDTH_MM = 210;
  const A4_HEIGHT_MM = 297;
  const getA4Dimensions = (isLandscape) => {
    const pixelsPerMm = DPI / MM_PER_INCH;
    if (isLandscape) {
      const width = A4_HEIGHT_MM * pixelsPerMm;
      const height = A4_WIDTH_MM * pixelsPerMm;
      return {
        width: Math.round(width),
        height: Math.round(height),
        exactWidth: width,
        exactHeight: height
      };
    } else {
      const width = A4_WIDTH_MM * pixelsPerMm;
      const height = A4_HEIGHT_MM * pixelsPerMm;
      return {
        width: Math.round(width),
        height: Math.round(height),
        exactWidth: width,
        exactHeight: height
      };
    }
  };
  const SAVE_DEBOUNCE_MS = 300;

  const WEEKDAY_LABELS_MONDAY = ['thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy', 'chủ nhật'];
  const WEEKDAY_LABELS_SUNDAY = ['chủ nhật', 'thứ hai', 'thứ ba', 'thứ tư', 'thứ năm', 'thứ sáu', 'thứ bảy'];

  const FONTS = [
    { name: 'Be Vietnam Pro', family: "'Be Vietnam Pro', sans-serif" },
    { name: 'Noto Sans', family: "'Noto Sans', sans-serif" },
    { name: 'Work Sans', family: "'Work Sans', sans-serif" },
    { name: 'Quicksand', family: "'Quicksand', sans-serif" },
    { name: 'Source Sans Pro', family: "'Source Sans Pro', sans-serif" },
    { name: 'Lexend Deca', family: "'Lexend Deca', sans-serif" },
    { name: 'Roboto', family: "'Roboto', sans-serif" },
    { name: 'Open Sans', family: "'Open Sans', sans-serif" },
    { name: 'Montserrat', family: "'Montserrat', sans-serif" },
    { name: 'Lato', family: "'Lato', sans-serif" },
    { name: 'Nunito Sans', family: "'Nunito Sans', sans-serif" },
    { name: 'Inter', family: "'Inter', sans-serif" }
  ];

  const COLOR_PALETTES_DARK = {
    default: {
      dateColor: '#334155', otherMonthDateColor: '#64748B',
      weekdayColor: '#475569', lunarDateColor: '#475569', holidayColor: '#DC2626',
      borderColor: '#475569'
    },
    oceanSunset: {
      dateColor: '#0284C7', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#14B8A6'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#65A30D', lunarDateColor: '#A855F7', holidayColor: '#D97706',
      borderColor: '#EC4899'
    },
    forestGold: {
      dateColor: '#16A34A', otherMonthDateColor: '#D97706',
      weekdayColor: '#4F46E5', lunarDateColor: '#EC4899', holidayColor: '#EAB308',
      borderColor: '#0284C7'
    },
    purplePink: {
      dateColor: '#9333EA', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#7C3AED'
    },
    sunset: {
      dateColor: '#C2410C', otherMonthDateColor: '#EC4899',
      weekdayColor: '#0891B2', lunarDateColor: '#7C3AED', holidayColor: '#16A34A',
      borderColor: '#DC2626'
    },
    tealCoral: {
      dateColor: '#14B8A6', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#EAB308'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#C2410C', holidayColor: '#0891B2',
      borderColor: '#9333EA'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#EC4899',
      borderColor: '#16A34A'
    },
    violetYellow: {
      dateColor: '#7C3AED', otherMonthDateColor: '#EAB308',
      weekdayColor: '#14B8A6', lunarDateColor: '#DC2626', holidayColor: '#0891B2',
      borderColor: '#EC4899'
    },
    crimsonCyan: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#D97706',
      borderColor: '#EC4899'
    },
    limePurple: {
      dateColor: '#65A30D', otherMonthDateColor: '#A855F7',
      weekdayColor: '#0284C7', lunarDateColor: '#DC2626', holidayColor: '#F97316',
      borderColor: '#16A34A'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#2563EB',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#16A34A'
    },
    magentaGreen: {
      dateColor: '#EC4899', otherMonthDateColor: '#16A34A',
      weekdayColor: '#4F46E5', lunarDateColor: '#0284C7', holidayColor: '#D97706',
      borderColor: '#F472B6'
    },
    redYellow: {
      dateColor: '#DC2626', otherMonthDateColor: '#EAB308',
      weekdayColor: '#2563EB', lunarDateColor: '#14B8A6', holidayColor: '#9333EA',
      borderColor: '#EC4899'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#059669',
      weekdayColor: '#EC4899', lunarDateColor: '#D97706', holidayColor: '#DC2626',
      borderColor: '#9333EA'
    }
  };

  const COLOR_PALETTES_LIGHT = {
    default: {
      dateColor: '#475569', otherMonthDateColor: '#94A3B8',
      weekdayColor: '#64748B', lunarDateColor: '#334155', holidayColor: '#DC2626',
      borderColor: '#1E293B'
    },
    oceanSunset: {
      dateColor: '#0284C7', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#14B8A6'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#65A30D', lunarDateColor: '#A855F7', holidayColor: '#D97706',
      borderColor: '#EC4899'
    },
    forestGold: {
      dateColor: '#16A34A', otherMonthDateColor: '#D97706',
      weekdayColor: '#4F46E5', lunarDateColor: '#EC4899', holidayColor: '#EAB308',
      borderColor: '#0284C7'
    },
    purplePink: {
      dateColor: '#9333EA', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#7C3AED'
    },
    sunset: {
      dateColor: '#C2410C', otherMonthDateColor: '#EC4899',
      weekdayColor: '#0891B2', lunarDateColor: '#7C3AED', holidayColor: '#16A34A',
      borderColor: '#DC2626'
    },
    tealCoral: {
      dateColor: '#14B8A6', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#EAB308'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#C2410C', holidayColor: '#0891B2',
      borderColor: '#9333EA'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#EC4899',
      borderColor: '#16A34A'
    },
    violetYellow: {
      dateColor: '#7C3AED', otherMonthDateColor: '#EAB308',
      weekdayColor: '#14B8A6', lunarDateColor: '#DC2626', holidayColor: '#0891B2',
      borderColor: '#EC4899'
    },
    crimsonCyan: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#D97706',
      borderColor: '#EC4899'
    },
    limePurple: {
      dateColor: '#65A30D', otherMonthDateColor: '#A855F7',
      weekdayColor: '#0284C7', lunarDateColor: '#DC2626', holidayColor: '#F97316',
      borderColor: '#16A34A'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#2563EB',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#16A34A'
    },
    magentaGreen: {
      dateColor: '#EC4899', otherMonthDateColor: '#16A34A',
      weekdayColor: '#4F46E5', lunarDateColor: '#0284C7', holidayColor: '#D97706',
      borderColor: '#F472B6'
    },
    redYellow: {
      dateColor: '#DC2626', otherMonthDateColor: '#EAB308',
      weekdayColor: '#2563EB', lunarDateColor: '#14B8A6', holidayColor: '#9333EA',
      borderColor: '#EC4899'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#059669',
      weekdayColor: '#EC4899', lunarDateColor: '#D97706', holidayColor: '#DC2626',
      borderColor: '#9333EA'
    }
  };

  const DATE_POSITION_CLASSES = {
    'top-left': 'items-start justify-start',
    'top-right': 'items-start justify-end',
    'bottom-left': 'items-end justify-start',
    'bottom-right': 'items-end justify-end'
  };

  window.CalendarConstants = {
    STORAGE_KEY,
    ACCORDION_STATE_KEY,
    CUSTOM_PALETTES_KEY,
    DB_NAME,
    DB_VERSION,
    STORE_NAME,
    A4_PORTRAIT_RATIO,
    A4_LANDSCAPE_RATIO,
    MAX_INIT_ATTEMPTS,
    EXPORT_SCALE,
    DPI,
    MM_PER_INCH,
    A4_WIDTH_MM,
    A4_HEIGHT_MM,
    getA4Dimensions,
    SAVE_DEBOUNCE_MS,
    WEEKDAY_LABELS_MONDAY,
    WEEKDAY_LABELS_SUNDAY,
    FONTS,
    COLOR_PALETTES_DARK,
    COLOR_PALETTES_LIGHT,
    DATE_POSITION_CLASSES
  };
})();
