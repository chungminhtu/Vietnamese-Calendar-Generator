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
      dateColor: '#1F2937', otherMonthDateColor: '#6B7280',
      weekdayColor: '#111827', lunarDateColor: '#374151', holidayColor: '#DC2626',
      borderColor: '#4B5563'
    },
    oceanSunset: {
      dateColor: '#1E40AF', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#06B6D4', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#06B6D4',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    forestGold: {
      dateColor: '#059669', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#3B82F6', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    purplePink: {
      dateColor: '#7C3AED', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#06B6D4', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#EC4899'
    },
    sunset: {
      dateColor: '#EA580C', otherMonthDateColor: '#3B82F6',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#EC4899',
      borderColor: '#22C55E'
    },
    tealCoral: {
      dateColor: '#0D9488', otherMonthDateColor: '#FB7185',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#22C55E', lunarDateColor: '#F97316', holidayColor: '#EC4899',
      borderColor: '#06B6D4'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#8B5CF6', lunarDateColor: '#FCD34D', holidayColor: '#EC4899',
      borderColor: '#06B6D4'
    },
    violetYellow: {
      dateColor: '#8B5CF6', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#06B6D4', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#EC4899'
    },
    crimsonCyan: {
      dateColor: '#BE123C', otherMonthDateColor: '#06B6D4',
      weekdayColor: '#FCD34D', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    limePurple: {
      dateColor: '#84CC16', otherMonthDateColor: '#9333EA',
      weekdayColor: '#06B6D4', lunarDateColor: '#F97316', holidayColor: '#EC4899',
      borderColor: '#FCD34D'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#3B82F6',
      weekdayColor: '#EC4899', lunarDateColor: '#22C55E', holidayColor: '#FCD34D',
      borderColor: '#8B5CF6'
    },
    magentaGreen: {
      dateColor: '#D946EF', otherMonthDateColor: '#22C55E',
      weekdayColor: '#FCD34D', lunarDateColor: '#06B6D4', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    redYellow: {
      dateColor: '#EF4444', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#3B82F6', lunarDateColor: '#8B5CF6', holidayColor: '#22C55E',
      borderColor: '#EC4899'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#10B981',
      weekdayColor: '#EC4899', lunarDateColor: '#FCD34D', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    }
  };

  const COLOR_PALETTES_LIGHT = {
    default: {
      dateColor: '#1F2937', otherMonthDateColor: '#9CA3AF',
      weekdayColor: '#111827', lunarDateColor: '#6B7280', holidayColor: '#DC2626',
      borderColor: '#D1D5DB'
    },
    oceanSunset: {
      dateColor: '#1E40AF', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#06B6D4', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#06B6D4',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    forestGold: {
      dateColor: '#059669', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#3B82F6', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    purplePink: {
      dateColor: '#7C3AED', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#06B6D4', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#EC4899'
    },
    sunset: {
      dateColor: '#EA580C', otherMonthDateColor: '#3B82F6',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#EC4899',
      borderColor: '#22C55E'
    },
    tealCoral: {
      dateColor: '#0D9488', otherMonthDateColor: '#FB7185',
      weekdayColor: '#FCD34D', lunarDateColor: '#8B5CF6', holidayColor: '#F97316',
      borderColor: '#22C55E'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#22C55E', lunarDateColor: '#F97316', holidayColor: '#EC4899',
      borderColor: '#06B6D4'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#8B5CF6', lunarDateColor: '#FCD34D', holidayColor: '#EC4899',
      borderColor: '#06B6D4'
    },
    violetYellow: {
      dateColor: '#8B5CF6', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#06B6D4', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#EC4899'
    },
    crimsonCyan: {
      dateColor: '#BE123C', otherMonthDateColor: '#06B6D4',
      weekdayColor: '#FCD34D', lunarDateColor: '#22C55E', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    limePurple: {
      dateColor: '#84CC16', otherMonthDateColor: '#9333EA',
      weekdayColor: '#06B6D4', lunarDateColor: '#F97316', holidayColor: '#EC4899',
      borderColor: '#FCD34D'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#3B82F6',
      weekdayColor: '#EC4899', lunarDateColor: '#22C55E', holidayColor: '#FCD34D',
      borderColor: '#8B5CF6'
    },
    magentaGreen: {
      dateColor: '#D946EF', otherMonthDateColor: '#22C55E',
      weekdayColor: '#FCD34D', lunarDateColor: '#06B6D4', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
    },
    redYellow: {
      dateColor: '#EF4444', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#3B82F6', lunarDateColor: '#8B5CF6', holidayColor: '#22C55E',
      borderColor: '#EC4899'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#10B981',
      weekdayColor: '#EC4899', lunarDateColor: '#FCD34D', holidayColor: '#F97316',
      borderColor: '#8B5CF6'
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
