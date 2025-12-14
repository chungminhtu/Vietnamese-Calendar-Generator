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
    { name: 'Inter', family: "'Inter', sans-serif" },
    { name: 'Noto Serif', family: "'Noto Serif', serif" },
    { name: 'Nunito', family: "'Nunito', sans-serif" },
    { name: 'Raleway', family: "'Raleway', sans-serif" },
    { name: 'Ubuntu', family: "'Ubuntu', sans-serif" },
    { name: 'Dosis', family: "'Dosis', sans-serif" },
    { name: 'Merriweather', family: "'Merriweather', serif" },
    { name: 'Lora', family: "'Lora', serif" },
    { name: 'EB Garamond', family: "'EB Garamond', serif" },
    { name: 'Playfair Display', family: "'Playfair Display', serif" },
    { name: 'Tinos', family: "'Tinos', serif" },
    { name: 'Libre Baskerville', family: "'Libre Baskerville', serif" }
  ];

  const COLOR_PALETTES_DARK = {
    default: {
      dateColor: '#2563EB', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#0891B2', weekendBackgroundColor: '#DBEAFE'
    },
    oceanSunset: {
      dateColor: '#0284C7', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#14B8A6', weekendBackgroundColor: '#DBEAFE'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#65A30D', lunarDateColor: '#A855F7', holidayColor: '#D97706',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    forestGold: {
      dateColor: '#16A34A', otherMonthDateColor: '#D97706',
      weekdayColor: '#4F46E5', lunarDateColor: '#EC4899', holidayColor: '#EAB308',
      borderColor: '#0284C7', weekendBackgroundColor: '#D1FAE5'
    },
    purplePink: {
      dateColor: '#9333EA', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#7C3AED', weekendBackgroundColor: '#EDE9FE'
    },
    sunset: {
      dateColor: '#C2410C', otherMonthDateColor: '#EC4899',
      weekdayColor: '#0891B2', lunarDateColor: '#7C3AED', holidayColor: '#16A34A',
      borderColor: '#DC2626', weekendBackgroundColor: '#FEE2E2'
    },
    tealCoral: {
      dateColor: '#14B8A6', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#EAB308', weekendBackgroundColor: '#FEF3C7'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#C2410C', holidayColor: '#0891B2',
      borderColor: '#9333EA', weekendBackgroundColor: '#E0E7FF'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#EC4899',
      borderColor: '#16A34A', weekendBackgroundColor: '#D1FAE5'
    },
    violetYellow: {
      dateColor: '#7C3AED', otherMonthDateColor: '#EAB308',
      weekdayColor: '#14B8A6', lunarDateColor: '#DC2626', holidayColor: '#0891B2',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    crimsonCyan: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#D97706',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    limePurple: {
      dateColor: '#65A30D', otherMonthDateColor: '#A855F7',
      weekdayColor: '#0284C7', lunarDateColor: '#DC2626', holidayColor: '#F97316',
      borderColor: '#16A34A', weekendBackgroundColor: '#D1FAE5'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#2563EB',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#16A34A', weekendBackgroundColor: '#D1FAE5'
    },
    magentaGreen: {
      dateColor: '#EC4899', otherMonthDateColor: '#16A34A',
      weekdayColor: '#4F46E5', lunarDateColor: '#0284C7', holidayColor: '#D97706',
      borderColor: '#F472B6', weekendBackgroundColor: '#FCE7F3'
    },
    redYellow: {
      dateColor: '#DC2626', otherMonthDateColor: '#EAB308',
      weekdayColor: '#2563EB', lunarDateColor: '#14B8A6', holidayColor: '#9333EA',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#059669',
      weekdayColor: '#EC4899', lunarDateColor: '#D97706', holidayColor: '#DC2626',
      borderColor: '#9333EA', weekendBackgroundColor: '#E0E7FF'
    },
    royalPlum: {
      dateColor: '#7C3AED', otherMonthDateColor: '#F97316',
      weekdayColor: '#0891B2', lunarDateColor: '#EC4899', holidayColor: '#16A34A',
      borderColor: '#DC2626', weekendBackgroundColor: '#FEE2E2'
    },
    mintCherry: {
      dateColor: '#10B981', otherMonthDateColor: '#F472B6',
      weekdayColor: '#2563EB', lunarDateColor: '#EAB308', holidayColor: '#9333EA',
      borderColor: '#0891B2', weekendBackgroundColor: '#F3F4F6'
    },
    sapphireAmber: {
      dateColor: '#2563EB', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#9333EA', weekendBackgroundColor: '#E0E7FF'
    },
    jadeRose: {
      dateColor: '#059669', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#0891B2', holidayColor: '#EA580C',
      borderColor: '#9333EA', weekendBackgroundColor: '#E0E7FF'
    },
    cobaltCoral: {
      dateColor: '#1E40AF', otherMonthDateColor: '#FB7185',
      weekdayColor: '#10B981', lunarDateColor: '#A855F7', holidayColor: '#F59E0B',
      borderColor: '#0891B2', weekendBackgroundColor: '#F3F4F6'
    },
    emeraldFuchsia: {
      dateColor: '#10B981', otherMonthDateColor: '#D946EF',
      weekdayColor: '#2563EB', lunarDateColor: '#F59E0B', holidayColor: '#0891B2',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    navyPeach: {
      dateColor: '#1E3A8A', otherMonthDateColor: '#FB923C',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#16A34A',
      borderColor: '#9333EA', weekendBackgroundColor: '#FED7AA'
    }
  };

  const COLOR_PALETTES_LIGHT = {
    default: {
      dateColor: '#2563EB', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#0891B2', weekendBackgroundColor: '#DBEAFE'
    },
    oceanSunset: {
      dateColor: '#0284C7', otherMonthDateColor: '#DC2626',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#EA580C',
      borderColor: '#14B8A6', weekendBackgroundColor: '#FEF3C7'
    },
    fireIce: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#65A30D', lunarDateColor: '#A855F7', holidayColor: '#D97706',
      borderColor: '#EC4899', weekendBackgroundColor: '#FED7AA'
    },
    forestGold: {
      dateColor: '#16A34A', otherMonthDateColor: '#D97706',
      weekdayColor: '#4F46E5', lunarDateColor: '#EC4899', holidayColor: '#EAB308',
      borderColor: '#0284C7', weekendBackgroundColor: '#FEF3C7'
    },
    purplePink: {
      dateColor: '#9333EA', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#7C3AED', weekendBackgroundColor: '#FCE7F3'
    },
    sunset: {
      dateColor: '#C2410C', otherMonthDateColor: '#EC4899',
      weekdayColor: '#0891B2', lunarDateColor: '#7C3AED', holidayColor: '#16A34A',
      borderColor: '#DC2626', weekendBackgroundColor: '#FED7AA'
    },
    tealCoral: {
      dateColor: '#14B8A6', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#D97706',
      borderColor: '#EAB308', weekendBackgroundColor: '#CCFBF1'
    },
    indigoRose: {
      dateColor: '#4F46E5', otherMonthDateColor: '#F472B6',
      weekdayColor: '#10B981', lunarDateColor: '#C2410C', holidayColor: '#0891B2',
      borderColor: '#9333EA', weekendBackgroundColor: '#FCE7F3'
    },
    emeraldOrange: {
      dateColor: '#10B981', otherMonthDateColor: '#F97316',
      weekdayColor: '#4F46E5', lunarDateColor: '#DC2626', holidayColor: '#EC4899',
      borderColor: '#16A34A', weekendBackgroundColor: '#FED7AA'
    },
    violetYellow: {
      dateColor: '#7C3AED', otherMonthDateColor: '#EAB308',
      weekdayColor: '#14B8A6', lunarDateColor: '#DC2626', holidayColor: '#0891B2',
      borderColor: '#EC4899', weekendBackgroundColor: '#EDE9FE'
    },
    crimsonCyan: {
      dateColor: '#DC2626', otherMonthDateColor: '#0891B2',
      weekdayColor: '#16A34A', lunarDateColor: '#9333EA', holidayColor: '#D97706',
      borderColor: '#EC4899', weekendBackgroundColor: '#CFFAFE'
    },
    limePurple: {
      dateColor: '#65A30D', otherMonthDateColor: '#A855F7',
      weekdayColor: '#0284C7', lunarDateColor: '#DC2626', holidayColor: '#F97316',
      borderColor: '#16A34A', weekendBackgroundColor: '#EDE9FE'
    },
    amberBlue: {
      dateColor: '#D97706', otherMonthDateColor: '#2563EB',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#16A34A', weekendBackgroundColor: '#DBEAFE'
    },
    magentaGreen: {
      dateColor: '#EC4899', otherMonthDateColor: '#16A34A',
      weekdayColor: '#4F46E5', lunarDateColor: '#0284C7', holidayColor: '#D97706',
      borderColor: '#F472B6', weekendBackgroundColor: '#D1FAE5'
    },
    redYellow: {
      dateColor: '#DC2626', otherMonthDateColor: '#EAB308',
      weekdayColor: '#2563EB', lunarDateColor: '#14B8A6', holidayColor: '#9333EA',
      borderColor: '#EC4899', weekendBackgroundColor: '#FEF3C7'
    },
    blueGreen: {
      dateColor: '#2563EB', otherMonthDateColor: '#059669',
      weekdayColor: '#EC4899', lunarDateColor: '#D97706', holidayColor: '#DC2626',
      borderColor: '#9333EA', weekendBackgroundColor: '#CCFBF1'
    },
    royalPlum: {
      dateColor: '#7C3AED', otherMonthDateColor: '#F97316',
      weekdayColor: '#0891B2', lunarDateColor: '#EC4899', holidayColor: '#16A34A',
      borderColor: '#DC2626', weekendBackgroundColor: '#FCE7F3'
    },
    mintCherry: {
      dateColor: '#10B981', otherMonthDateColor: '#F472B6',
      weekdayColor: '#2563EB', lunarDateColor: '#EAB308', holidayColor: '#9333EA',
      borderColor: '#0891B2', weekendBackgroundColor: '#FEF3C7'
    },
    sapphireAmber: {
      dateColor: '#2563EB', otherMonthDateColor: '#F59E0B',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#DC2626',
      borderColor: '#9333EA', weekendBackgroundColor: '#FED7AA'
    },
    jadeRose: {
      dateColor: '#059669', otherMonthDateColor: '#F472B6',
      weekdayColor: '#4F46E5', lunarDateColor: '#0891B2', holidayColor: '#EA580C',
      borderColor: '#9333EA', weekendBackgroundColor: '#FCE7F3'
    },
    cobaltCoral: {
      dateColor: '#1E40AF', otherMonthDateColor: '#FB7185',
      weekdayColor: '#10B981', lunarDateColor: '#A855F7', holidayColor: '#F59E0B',
      borderColor: '#0891B2', weekendBackgroundColor: '#DBEAFE'
    },
    emeraldFuchsia: {
      dateColor: '#10B981', otherMonthDateColor: '#D946EF',
      weekdayColor: '#2563EB', lunarDateColor: '#F59E0B', holidayColor: '#0891B2',
      borderColor: '#EC4899', weekendBackgroundColor: '#FCE7F3'
    },
    navyPeach: {
      dateColor: '#1E3A8A', otherMonthDateColor: '#FB923C',
      weekdayColor: '#EC4899', lunarDateColor: '#14B8A6', holidayColor: '#16A34A',
      borderColor: '#9333EA', weekendBackgroundColor: '#FED7AA'
    }
  };

  const WEEKEND_COLOR_PRESETS = {
    default: { color: '#F3F4F6' },
    blue: { color: '#DBEAFE' },
    purple: { color: '#EDE9FE' },
    teal: { color: '#CCFBF1' },
    yellow: { color: '#FEF3C7' },
    green: { color: '#D1FAE5' },
    indigo: { color: '#E0E7FF' },
    pink: { color: '#FCE7F3' },
    cyan: { color: '#CFFAFE' },
    gray: { color: '#F3F4F6' }
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
    DATE_POSITION_CLASSES,
    WEEKEND_COLOR_PRESETS
  };
})();
