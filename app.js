// app.js
(function() {
  'use strict';

  // --- CONSTANTS ---
  const STORAGE_KEY = 'vietnamese-calendar-settings';
  const ACCORDION_STATE_KEY = 'vietnamese-calendar-accordion-state';
  const DB_NAME = 'vietnamese-calendar-images';
  const DB_VERSION = 2;
  const STORE_NAME = 'background-images';
  const A4_PORTRAIT_RATIO = 210 / 297;
  const A4_LANDSCAPE_RATIO = 297 / 210;
  const MAX_INIT_ATTEMPTS = 100;
  const EXPORT_SCALE = 3;
  const DPI = 96;
  const MM_PER_INCH = 25.4;
  const RENDER_DEBOUNCE_MS = 16; // ~1 frame
  const SAVE_DEBOUNCE_MS = 300; // 300ms for localStorage

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

  const COLOR_PALETTES = {
    default: {
      dateColor: '#374151', otherMonthDateColor: '#9CA3AF',
      weekdayColor: '#4B5563', lunarDateColor: '#6B7280', holidayColor: '#DC2626',
      borderColor: '#E5E7EB'
    },
    professional: {
      dateColor: '#1F2937', otherMonthDateColor: '#D1D5DB',
      weekdayColor: '#111827', lunarDateColor: '#4B5563', holidayColor: '#DC2626',
      borderColor: '#E5E7EB'
    },
    minimal: {
      dateColor: '#000000', otherMonthDateColor: '#9CA3AF',
      weekdayColor: '#374151', lunarDateColor: '#6B7280', holidayColor: '#DC2626',
      borderColor: '#E5E7EB'
    },
    vibrant: {
      dateColor: '#1F2937', otherMonthDateColor: '#9CA3AF',
      weekdayColor: '#2563EB', lunarDateColor: '#059669', holidayColor: '#EA580C',
      borderColor: '#D1D5DB'
    },
    warm: {
      dateColor: '#78350F', otherMonthDateColor: '#D97706',
      weekdayColor: '#92400E', lunarDateColor: '#B45309', holidayColor: '#DC2626',
      borderColor: '#FCD34D'
    },
    cool: {
      dateColor: '#0C4A6E', otherMonthDateColor: '#0284C7',
      weekdayColor: '#0369A1', lunarDateColor: '#075985', holidayColor: '#DC2626',
      borderColor: '#BAE6FD'
    },
    sunset: {
      dateColor: '#7C2D12', otherMonthDateColor: '#F97316',
      weekdayColor: '#EA580C', lunarDateColor: '#F59E0B', holidayColor: '#DC2626',
      borderColor: '#FED7AA'
    },
    ocean: {
      dateColor: '#164E63', otherMonthDateColor: '#06B6D4',
      weekdayColor: '#0891B2', lunarDateColor: '#0E7490', holidayColor: '#EF4444',
      borderColor: '#A5F3FC'
    },
    forest: {
      dateColor: '#14532D', otherMonthDateColor: '#22C55E',
      weekdayColor: '#16A34A', lunarDateColor: '#15803D', holidayColor: '#DC2626',
      borderColor: '#BBF7D0'
    },
    lavender: {
      dateColor: '#581C87', otherMonthDateColor: '#A78BFA',
      weekdayColor: '#7C3AED', lunarDateColor: '#6D28D9', holidayColor: '#EC4899',
      borderColor: '#E9D5FF'
    },
    cherry: {
      dateColor: '#991B1B', otherMonthDateColor: '#F87171',
      weekdayColor: '#DC2626', lunarDateColor: '#B91C1C', holidayColor: '#EF4444',
      borderColor: '#FECACA'
    },
    emerald: {
      dateColor: '#064E3B', otherMonthDateColor: '#10B981',
      weekdayColor: '#059669', lunarDateColor: '#047857', holidayColor: '#F59E0B',
      borderColor: '#A7F3D0'
    },
    sapphire: {
      dateColor: '#1E3A8A', otherMonthDateColor: '#60A5FA',
      weekdayColor: '#3B82F6', lunarDateColor: '#2563EB', holidayColor: '#F97316',
      borderColor: '#DBEAFE'
    },
    rose: {
      dateColor: '#9F1239', otherMonthDateColor: '#FB7185',
      weekdayColor: '#E11D48', lunarDateColor: '#BE123C', holidayColor: '#F43F5E',
      borderColor: '#FFE4E6'
    },
    golden: {
      dateColor: '#78350F', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#F59E0B', lunarDateColor: '#D97706', holidayColor: '#DC2626',
      borderColor: '#FEF3C7'
    },
    turquoise: {
      dateColor: '#134E4A', otherMonthDateColor: '#5EEAD4',
      weekdayColor: '#14B8A6', lunarDateColor: '#0D9488', holidayColor: '#F59E0B',
      borderColor: '#CCFBF1'
    },
    violet: {
      dateColor: '#5B21B6', otherMonthDateColor: '#C4B5FD',
      weekdayColor: '#8B5CF6', lunarDateColor: '#7C3AED', holidayColor: '#EC4899',
      borderColor: '#EDE9FE'
    },
    coral: {
      dateColor: '#9A3412', otherMonthDateColor: '#FDBA74',
      weekdayColor: '#F97316', lunarDateColor: '#EA580C', holidayColor: '#EF4444',
      borderColor: '#FFEDD5'
    },
    mint: {
      dateColor: '#065F46', otherMonthDateColor: '#6EE7B7',
      weekdayColor: '#10B981', lunarDateColor: '#059669', holidayColor: '#F59E0B',
      borderColor: '#D1FAE5'
    },
    indigo: {
      dateColor: '#312E81', otherMonthDateColor: '#818CF8',
      weekdayColor: '#6366F1', lunarDateColor: '#4F46E5', holidayColor: '#EC4899',
      borderColor: '#E0E7FF'
    },
    peach: {
      dateColor: '#9A3412', otherMonthDateColor: '#FED7AA',
      weekdayColor: '#FB923C', lunarDateColor: '#F97316', holidayColor: '#EF4444',
      borderColor: '#FFF7ED'
    },
    cyan: {
      dateColor: '#155E75', otherMonthDateColor: '#67E8F9',
      weekdayColor: '#06B6D4', lunarDateColor: '#0891B2', holidayColor: '#F59E0B',
      borderColor: '#CFFAFE'
    },
    magenta: {
      dateColor: '#831843', otherMonthDateColor: '#F9A8D4',
      weekdayColor: '#EC4899', lunarDateColor: '#DB2777', holidayColor: '#F43F5E',
      borderColor: '#FCE7F3'
    },
    amber: {
      dateColor: '#78350F', otherMonthDateColor: '#FCD34D',
      weekdayColor: '#F59E0B', lunarDateColor: '#D97706', holidayColor: '#EF4444',
      borderColor: '#FEF3C7'
    },
    teal: {
      dateColor: '#134E4A', otherMonthDateColor: '#5EEAD4',
      weekdayColor: '#14B8A6', lunarDateColor: '#0D9488', holidayColor: '#F59E0B',
      borderColor: '#CCFBF1'
    }
  };

  const DATE_POSITION_CLASSES = {
    'top-left': 'items-start justify-start',
    'top-right': 'items-start justify-end',
    'bottom-left': 'items-end justify-start',
    'bottom-right': 'items-end justify-end'
  };

  // --- PERFORMANCE HELPERS ---
  let renderTimeout = null;
  let saveTimeout = null;
  let cachedMonthElements = null;
  let cachedLabels = new Map();

  const debounce = (fn, delay) => {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => fn(...args), delay);
    };
  };

  const throttle = (fn, delay) => {
    let lastCall = 0;
    return (...args) => {
      const now = Date.now();
      if (now - lastCall >= delay) {
        lastCall = now;
        fn(...args);
      }
    };
  };

  // --- STATE MANAGEMENT ---
  const defaultState = () => {
    const now = new Date();
    return {
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      selectedFont: "'Be Vietnam Pro', sans-serif",
      startOfWeek: 1,
      monthFontSize: 48, yearFontSize: 24, weekdayFontSize: 14, dateSize: 24,
      lunarDateFontSize: 12, holidayFontSize: 11.2, monthFontWeight: 700,
      yearFontWeight: 400, weekdayFontWeight: 600, dateFontWeight: 400,
      monthTextTransform: 'uppercase', weekdayTextTransform: 'uppercase',
      backgroundColor: '#FFFFFF', dateColor: '#374151', otherMonthDateColor: '#9CA3AF',
      weekdayColor: '#4B5563', lunarDateColor: '#6B7280', holidayColor: '#DC2626',
      borderColor: '#E5E7EB', colorPalette: 'default',
      datePosition: 'top-right', monthYearLayout: 'double', borderWidth: 1,
      showOtherMonthDates: true, isLandscape: false, showAllMonths: false,
      showHolidayPublic: true, showHolidayBank: false, showHolidaySchool: false,
      showHolidayOptional: false, showHolidayObservance: true,
      monthBackgrounds: {},
      customHolidays: [],
      isExporting: false, isDragging: false
    };
  };

  // --- INDEXEDDB HELPERS ---
  let db = null;
  
  const openDB = () => {
    return new Promise((resolve, reject) => {
      if (db && db.objectStoreNames.contains(STORE_NAME)) {
        resolve(db);
        return;
      }
      if (db) {
        db.close();
        db = null;
      }
      const request = indexedDB.open(DB_NAME, DB_VERSION);
      request.onerror = () => reject(request.error);
      request.onsuccess = () => {
        db = request.result;
        resolve(db);
      };
      request.onupgradeneeded = (event) => {
        const db = event.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: 'month' });
        }
      };
    });
  };
  
  const saveBackgroundImage = async (monthNum, imageData) => {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.put({ month: monthNum, ...imageData });
    } catch (e) {
      console.warn('[IDB] Failed to save background image for month', monthNum, ':', e);
    }
  };
  
  const loadBackgroundImages = async () => {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.getAll();
      return new Promise((resolve, reject) => {
        request.onsuccess = () => {
          const images = {};
          for (let i = 0; i < request.result.length; i++) {
            const item = request.result[i];
            const month = item.month;
            delete item.month;
            images[month] = item;
          }
          resolve(images);
        };
        request.onerror = () => reject(request.error);
      });
    } catch (e) {
      console.warn('[IDB] Failed to load background images:', e);
      return {};
    }
  };
  
  const deleteBackgroundImage = async (monthNum) => {
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      await store.delete(monthNum);
    } catch (e) {
      console.warn('[IDB] Failed to delete background image for month', monthNum, ':', e);
    }
  };
  
  const removeAllBackgroundImages = async () => {
    if (!confirm('Bạn có chắc chắn muốn xóa tất cả hình nền?')) {
      return;
    }
    
    try {
      const database = await openDB();
      const transaction = database.transaction([STORE_NAME], 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.clear();
      await new Promise((resolve, reject) => {
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
      
      state.monthBackgrounds = {};
      render();
      console.log('[IDB] All background images removed');
    } catch (e) {
      console.warn('[IDB] Failed to remove all background images:', e);
      state.monthBackgrounds = {};
      render();
    }
  };

  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const state = { ...defaultState(), ...parsed };
        state.monthBackgrounds = {};
        return state;
      }
    } catch (e) {
      console.warn('Failed to load state:', e);
    }
    return defaultState();
  };


  const saveState = () => {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
      try {
        const toSave = { ...state };
        delete toSave.isExporting;
        delete toSave.isDragging;
        delete toSave.monthBackgrounds;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
        console.warn('Failed to save state:', e);
      }
    }, SAVE_DEBOUNCE_MS);
  };

  let state = loadState();
  let holidayService = null;
  let dragState = { isDragging: false, monthNum: null, dragStartX: 0, dragStartY: 0, startPosX: 0, startPosY: 0, monthEl: null, bgDiv: null };
  let shiftPressedMonths = new Set();

  // --- UTILITIES ---
  const getLunarDate = (day, month, year) => {
    try {
      const SolarClass = window.Solar || Solar;
      if (!SolarClass || typeof SolarClass.fromYmd !== 'function') {
        return { lunarDay: 0, lunarMonth: 0 };
      }
      const solar = SolarClass.fromYmd(year, month, day);
      if (!solar) return { lunarDay: 0, lunarMonth: 0 };
      const lunarDate = solar.getLunar();
      if (!lunarDate) return { lunarDay: 0, lunarMonth: 0 };
      const lunarDay = lunarDate.getDay();
      const lunarMonth = lunarDate.getMonth();
      if (lunarDay > 0 && lunarMonth > 0) {
        return { lunarDay: Number(lunarDay), lunarMonth: Math.abs(Number(lunarMonth)) };
      }
      return { lunarDay: 0, lunarMonth: 0 };
    } catch (e) {
      return { lunarDay: 0, lunarMonth: 0 };
    }
  };

  const getHolidays = (date, lunarDay, lunarMonth) => {
    const holidays = [];
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    
    if (state.customHolidays && Array.isArray(state.customHolidays)) {
      for (let i = 0; i < state.customHolidays.length; i++) {
        const custom = state.customHolidays[i];
        if (custom && custom.date === dateStr && custom.name) {
          holidays.push({ name: custom.name, isCustom: true, isPublic: false });
        }
      }
    }
    
    if (lunarDay > 0 && lunarMonth > 0) {
      if (lunarMonth === 1 && lunarDay <= 3) {
        holidays.push({ name: 'Tết Nguyên Đán', isCustom: false, isPublic: false });
      } else if (lunarMonth === 3 && lunarDay === 10) {
        holidays.push({ name: 'Giỗ Tổ Hùng Vương', isCustom: false, isPublic: false });
      }
    }
    
    if (holidayService) {
      const enabledTypes = [];
      if (state.showHolidayPublic) enabledTypes.push('public');
      if (state.showHolidayBank) enabledTypes.push('bank');
      if (state.showHolidaySchool) enabledTypes.push('school');
      if (state.showHolidayOptional) enabledTypes.push('optional');
      if (state.showHolidayObservance) enabledTypes.push('observance');
      if (enabledTypes.length > 0) {
        try {
          const allHolidays = holidayService.isHoliday(date);
          if (allHolidays) {
            const holidaysArray = Array.isArray(allHolidays) ? allHolidays : [allHolidays];
            for (let i = 0; i < holidaysArray.length; i++) {
              const h = holidaysArray[i];
              if (h && h.type && enabledTypes.includes(h.type) && h.name) {
                const exists = holidays.some(existing => existing.name === h.name && !existing.isCustom);
                if (!exists) {
                  holidays.push({ name: h.name, isCustom: false, isPublic: h.type === 'public', holidayType: h.type });
                }
              }
            }
          }
        } catch (e) {}
      }
    }
    
    if (holidays.length === 0) {
      return null;
    }
    
    const publicHolidays = holidays.filter(h => h.isPublic);
    const observanceHolidays = holidays.filter(h => h.holidayType === 'observance');
    
    if (publicHolidays.length > 0 && observanceHolidays.length > 0) {
      return publicHolidays;
    }
    
    if (publicHolidays.length > 0 && holidays.length > 1) {
      return publicHolidays;
    }
    
    return holidays;
  };

  const applyColorPalette = (paletteName) => {
    const palette = COLOR_PALETTES[paletteName];
    if (palette) {
      Object.assign(state, palette);
      state.colorPalette = paletteName;
      state.backgroundColor = '#FFFFFF';
      
      const colorInputs = document.querySelectorAll('input[type="color"][data-state]');
      for (let i = 0; i < colorInputs.length; i++) {
        const colorInput = colorInputs[i];
        const key = colorInput.dataset.state;
        if (state[key]) {
          colorInput.value = state[key];
        }
      }
      
      saveState();
      render();
    }
  };

  const updateStateAndRender = (key, value) => {
    state[key] = value;
    saveState();
    render();
  };

  // --- DOM ELEMENTS ---
  const DOMElements = {
    monthSelect: null,
    yearSelect: null,
    fontSelect: null,
    startOfWeekSelect: null,
    exportBtn: null,
    calendarMain: null,
    calendarsContainer: null,
    customHolidayDate: null,
    customHolidayName: null,
    addCustomHolidayBtn: null,
    customHolidaysList: null
  };

  const initDOMElements = () => {
    DOMElements.monthSelect = document.getElementById('month-select');
    DOMElements.yearSelect = document.getElementById('year-select');
    DOMElements.fontSelect = document.getElementById('font-select');
    DOMElements.startOfWeekSelect = document.getElementById('start-of-week-select');
    DOMElements.exportBtn = document.getElementById('export-btn');
    DOMElements.calendarMain = document.getElementById('calendar-main');
    DOMElements.calendarsContainer = document.getElementById('calendars-container');
    DOMElements.customHolidayDate = document.getElementById('custom-holiday-date');
    DOMElements.customHolidayName = document.getElementById('custom-holiday-name');
    DOMElements.addCustomHolidayBtn = document.getElementById('add-custom-holiday');
    DOMElements.customHolidaysList = document.getElementById('custom-holidays-list');
  };

  // --- RENDERING ---
  const generateDayCellHTML = (day) => {
    const { date, lunarDay, lunarMonth, holidays, isCurrentMonth } = day;
    const { datePosition, borderWidth, dateSize, dateFontWeight, lunarDateFontSize, holidayFontSize } = state;
    const hasHolidays = holidays && holidays.length > 0;
    const dateColor = isCurrentMonth ? (hasHolidays ? state.holidayColor : state.dateColor) : state.otherMonthDateColor;
    const positionClasses = DATE_POSITION_CLASSES[datePosition] || DATE_POSITION_CLASSES['top-right'];
    
    const dayNum = date.getDate();
    let html = '<div class="border-r border-b p-1 flex flex-col" style="border-color: ' + state.borderColor + '; border-right-width: ' + borderWidth + 'px; border-bottom-width: ' + borderWidth + 'px;"><div class="w-full flex-1 flex ' + positionClasses + '"><div class="text-center leading-none"><p style="font-size: ' + dateSize + 'px; font-weight: ' + dateFontWeight + '; color: ' + dateColor + ';">' + dayNum + '</p>';
    
    if (lunarDay > 0 && lunarMonth > 0) {
      html += '<p style="font-size: ' + lunarDateFontSize + 'px; color: ' + state.lunarDateColor + '; line-height: 1.2;">' + lunarDay + '/' + lunarMonth + '</p>';
    }
    
    html += '</div></div>';
    
    if (hasHolidays && isCurrentMonth) {
      html += '<div class="text-center mt-auto" style="padding-bottom: 2px;">';
      for (let i = 0; i < holidays.length; i++) {
        const holidayColor = holidays[i].isCustom ? '#6B21A8' : state.holidayColor;
        html += '<p class="holiday-name" style="font-size: ' + holidayFontSize + 'px; color: ' + holidayColor + '; line-height: normal; padding: 0; margin: 0;">' + holidays[i].name + '</p>';
      }
      html += '</div>';
    }
    
    html += '</div>';
    return html;
  };

  const generateCalendarGrid = (month, year) => {
    if (typeof dayjs === 'undefined') return '';
    const firstDayOfMonth = dayjs(`${year}-${String(month).padStart(2, '0')}-01`);
    let startOffset = firstDayOfMonth.day() - state.startOfWeek;
    if (startOffset < 0) startOffset += 7;
    
    const grid = [];
    const daysInMonth = firstDayOfMonth.daysInMonth();
    const endDay = firstDayOfMonth.endOf('month').day();
    const endOffset = (6 - (endDay - state.startOfWeek + 7) % 7);
    
    for (let i = 1 - startOffset; i <= daysInMonth + endOffset; i++) {
      if (i > daysInMonth && grid.length % 7 === 0) break;
      const date = firstDayOfMonth.add(i - 1, 'day').toDate();
      if (isNaN(date.getTime())) continue;
      const { lunarDay, lunarMonth } = getLunarDate(date.getDate(), date.getMonth() + 1, date.getFullYear());
      const holidays = getHolidays(date, lunarDay, lunarMonth);
      const isCurrentMonth = date.getMonth() === month - 1;
      grid.push({ date, lunarDay, lunarMonth, holidays, isCurrentMonth });
    }

    const parts = [];
    const borderStyle = 'border-color: ' + state.borderColor + '; border-right-width: ' + state.borderWidth + 'px; border-bottom-width: ' + state.borderWidth + 'px;';
    
    for (let i = 0; i < grid.length; i++) {
      const day = grid[i];
      if (!state.showOtherMonthDates && !day.isCurrentMonth) {
        parts.push('<div class="border-r border-b" style="' + borderStyle + '"></div>');
      } else {
        parts.push(generateDayCellHTML(day));
      }
    }
    return parts.join('');
  };

  const generateHeaderHTML = (month, year) => {
    const { monthFontSize, monthFontWeight, monthTextTransform, yearFontSize, yearFontWeight, monthYearLayout } = state;
    const headerTextColor = state.weekdayColor || state.dateColor || '#374151';
    const subHeaderTextColor = state.lunarDateColor || '#6B7280';
    const monthText = 'tháng';
    
    if (monthYearLayout === 'double') {
      return '<h1 class="font-bold tracking-widest" style="font-size: ' + monthFontSize + 'px; font-weight: ' + monthFontWeight + '; text-transform: ' + monthTextTransform + '; color: ' + headerTextColor + ';">' + monthText + ' ' + month + '</h1><p style="font-size: ' + yearFontSize + 'px; font-weight: ' + yearFontWeight + '; color: ' + subHeaderTextColor + ';">' + year + '</p>';
    }
    return '<h1 class="font-bold tracking-widest leading-tight" style="color: ' + headerTextColor + ';"><span style="font-size: ' + monthFontSize + 'px; font-weight: ' + monthFontWeight + '; text-transform: ' + monthTextTransform + ';">' + monthText + ' ' + month + '</span><span style="font-size: ' + yearFontSize + 'px; font-weight: ' + yearFontWeight + ';" class="ml-4">' + year + '</span></h1>';
  };

  const generateWeekdayHTML = () => {
    const labels = state.startOfWeek === 1 ? WEEKDAY_LABELS_MONDAY : WEEKDAY_LABELS_SUNDAY;
    const { weekdayFontSize, weekdayFontWeight, weekdayTextTransform, weekdayColor } = state;
    const parts = [];
    for (let i = 0; i < labels.length; i++) {
      parts.push('<div class="text-center font-semibold pb-2" style="font-size: ' + weekdayFontSize + 'px; font-weight: ' + weekdayFontWeight + '; text-transform: ' + weekdayTextTransform + '; color: ' + weekdayColor + ';">' + labels[i] + '</div>');
    }
    return parts.join('');
  };

  const generateBackgroundStyle = (monthNum) => {
    const monthBg = state.monthBackgrounds[monthNum];
    console.log('[RENDER] generateBackgroundStyle called for month', monthNum, 'monthBg exists:', !!monthBg, 'has URL:', !!(monthBg && monthBg.url));
    if (!monthBg || !monthBg.url) {
      console.log('[RENDER] No background image for month', monthNum, '- returning transparent');
      return 'background: transparent;';
    }
    return 'background: transparent;';
  };

  const generateNavButtonsHTML = () => {
    if (state.showAllMonths) return '';
    const headerTextColor = state.weekdayColor || state.dateColor || '#374151';
    return '<button class="nav-button prev-month-btn absolute left-0 p-2 rounded-full hover:bg-black/10 transition-colors" style="color: ' + headerTextColor + ';"><svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button><button class="nav-button next-month-btn absolute right-0 p-2 rounded-full hover:bg-black/10 transition-colors" style="color: ' + headerTextColor + ';"><svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>';
  };

  const generateMonthCalendarHTML = (month, year) => {
    if (typeof dayjs === 'undefined') return '';
    
    const monthNum = parseInt(month);
    const bgStyle = generateBackgroundStyle(monthNum);
    const hasBg = !!state.monthBackgrounds[monthNum]?.url;
    const aspectRatio = state.isLandscape ? A4_LANDSCAPE_RATIO : A4_PORTRAIT_RATIO;
    
    console.log('[RENDER] generateMonthCalendarHTML for month', monthNum, 'hasBg:', hasBg, 'bgStyle length:', bgStyle.length, 'bgStyle starts with:', bgStyle.substring(0, 50));
    
    // --- FIX START ---
    // If an image exists (hasBg), set the content background to transparent 
    // so the image behind it is visible. Otherwise, use the selected background color.
    const contentBackgroundColor = hasBg ? 'transparent' : state.backgroundColor;
    const containerBackgroundColor = hasBg ? 'transparent' : state.backgroundColor;
    console.log('[RENDER] Month', monthNum, 'contentBackgroundColor:', contentBackgroundColor, 'containerBackgroundColor:', containerBackgroundColor, '(hasBg:', hasBg, ')');
    // --- FIX END ---
    
    return '<div class="calendar-month-export relative shadow-2xl rounded-lg overflow-hidden transition-all duration-300" data-month="' + month + '" style="width: 100%; aspect-ratio: ' + aspectRatio + '; max-width: 100%; max-height: calc(100vh - 4rem); height: auto; background-color: ' + containerBackgroundColor + ';">' +
      // Layer 1: The Background Image
      '<div class="month-bg-image absolute inset-0 rounded-lg" style="position: absolute !important; top: 0; left: 0; right: 0; bottom: 0; ' + bgStyle + ' cursor: ' + (hasBg ? 'move' : 'default') + '; z-index: 1 !important; user-select: none; pointer-events: ' + (hasBg ? 'auto' : 'none') + '; width: 100%; height: 100%;"></div>' +
      // Layer 2: Overlay (hidden by default)
      '<div class="month-bg-overlay absolute inset-0 z-10 pointer-events-none" style="display: none;"></div>' +
      // Layer 3: The Content (Dates/Text) - Now uses contentBackgroundColor
      '<div class="relative w-full h-full flex flex-col p-4 sm:p-6" style="z-index: 2; font-family: ' + state.selectedFont + '; background-color: ' + contentBackgroundColor + ';">' +
        '<header class="relative text-center pb-4 flex items-center justify-center">' + generateNavButtonsHTML() + '<div class="flex-1">' + generateHeaderHTML(month, year) + '</div></header>' +
        '<div class="flex flex-col flex-grow">' +
          '<div class="weekday-header grid grid-cols-7">' + generateWeekdayHTML() + '</div>' +
          '<div class="calendar-grid border-t border-l" style="border-color: ' + state.borderColor + '; border-top-width: ' + state.borderWidth + 'px; border-left-width: ' + state.borderWidth + 'px;">' + generateCalendarGrid(month, year) + '</div>' +
        '</div>' +
      '</div>' +
    '</div>';
  };

  const applyBackgroundImages = () => {
    const monthElements = document.querySelectorAll('.calendar-month-export');
    for (let i = 0; i < monthElements.length; i++) {
      const monthEl = monthElements[i];
      const monthNum = parseInt(monthEl.dataset.month);
      const monthBg = state.monthBackgrounds[monthNum];
      if (monthBg && monthBg.url) {
        const bgDiv = monthEl.querySelector('.month-bg-image');
        if (bgDiv) {
          const zoom = monthBg.zoom || 100;
          const posX = monthBg.posX || 50;
          const posY = monthBg.posY || 50;
          const opacity = (monthBg.opacity !== undefined ? monthBg.opacity : 50) / 100;
          const brightness = (monthBg.brightness || 100) / 100;
          const saturation = (monthBg.saturation !== undefined ? monthBg.saturation : 120) / 100;
          bgDiv.style.backgroundImage = 'url("' + monthBg.url.replace(/"/g, '\\"') + '")';
          bgDiv.style.backgroundSize = zoom + '%';
          bgDiv.style.backgroundPosition = posX + '% ' + posY + '%';
          bgDiv.style.backgroundRepeat = 'no-repeat';
          bgDiv.style.opacity = opacity;
          bgDiv.style.filter = 'brightness(' + brightness + ') saturate(' + saturation + ')';
          bgDiv.style.zIndex = '1';
          bgDiv.style.cursor = 'move';
          console.log('[RENDER] Applied background image to month', monthNum, 'via JavaScript');
        }
      }
    }
  };

  const renderAllMonths = () => {
    if (!DOMElements.calendarsContainer) return;
    console.log('[RENDER] renderAllMonths() called - rendering 12 months');
    const parts = [];
    for (let month = 1; month <= 12; month++) {
      parts.push(generateMonthCalendarHTML(month, state.selectedYear));
    }
    DOMElements.calendarsContainer.innerHTML = parts.join('');
    cachedMonthElements = null;
    applyBackgroundImages();
    const monthsWithImages = [];
    for (let m = 1; m <= 12; m++) {
      if (state.monthBackgrounds[m]?.url) {
        monthsWithImages.push(m);
      }
    }
    console.log('[RENDER] renderAllMonths() completed. Months with images:', monthsWithImages.length > 0 ? monthsWithImages.join(', ') : 'none');
    setTimeout(() => {
      const monthEl = document.querySelector('[data-month="2"]');
      if (monthEl) {
        const bgDiv = monthEl.querySelector('.month-bg-image');
        const contentDiv = monthEl.querySelector('.relative.w-full.h-full');
        console.log('[DEBUG] Month 2 DOM check:');
        console.log('  - Container computed background:', window.getComputedStyle(monthEl).backgroundColor);
        console.log('  - Background div exists:', !!bgDiv);
        if (bgDiv) {
          console.log('  - Background div computed background-image:', window.getComputedStyle(bgDiv).backgroundImage.substring(0, 50));
          console.log('  - Background div z-index:', window.getComputedStyle(bgDiv).zIndex);
        }
        console.log('  - Content div exists:', !!contentDiv);
        if (contentDiv) {
          console.log('  - Content div computed background:', window.getComputedStyle(contentDiv).backgroundColor);
          console.log('  - Content div z-index:', window.getComputedStyle(contentDiv).zIndex);
        }
      }
    }, 100);
    setupMonthInteractions();
  };

  const renderSingleMonth = () => {
    if (!DOMElements.calendarsContainer) return;
    console.log('[RENDER] renderSingleMonth() called - rendering month', state.selectedMonth);
    DOMElements.calendarsContainer.innerHTML = generateMonthCalendarHTML(state.selectedMonth, state.selectedYear);
    cachedMonthElements = null;
    applyBackgroundImages();
    const hasImage = !!state.monthBackgrounds[state.selectedMonth]?.url;
    console.log('[RENDER] renderSingleMonth() completed. Month', state.selectedMonth, 'has image:', hasImage);
    setTimeout(() => {
      const monthEl = document.querySelector('[data-month="' + state.selectedMonth + '"]');
      if (monthEl) {
        const bgDiv = monthEl.querySelector('.month-bg-image');
        const contentDiv = monthEl.querySelector('.relative.w-full.h-full');
        console.log('[DEBUG] Month', state.selectedMonth, 'DOM check:');
        console.log('  - Container computed background:', window.getComputedStyle(monthEl).backgroundColor);
        console.log('  - Background div exists:', !!bgDiv);
        if (bgDiv) {
          console.log('  - Background div computed background-image:', window.getComputedStyle(bgDiv).backgroundImage.substring(0, 50));
          console.log('  - Background div z-index:', window.getComputedStyle(bgDiv).zIndex);
          console.log('  - Background div opacity:', window.getComputedStyle(bgDiv).opacity);
        }
        console.log('  - Content div exists:', !!contentDiv);
        if (contentDiv) {
          console.log('  - Content div computed background:', window.getComputedStyle(contentDiv).backgroundColor);
          console.log('  - Content div z-index:', window.getComputedStyle(contentDiv).zIndex);
        }
      }
    }, 100);
    setupMonthInteractions();
  };

  const render = () => {
    if (renderTimeout) {
      cancelAnimationFrame(renderTimeout);
    }
    renderTimeout = requestAnimationFrame(() => {
      try {
        console.log('[RENDER] render() called, showAllMonths:', state.showAllMonths);
        if (state.showAllMonths) {
          renderAllMonths();
        } else {
          renderSingleMonth();
        }
      } catch (e) {
        console.error('[RENDER] Render error:', e);
      }
      renderTimeout = null;
    });
  };

  // --- MONTH INTERACTIONS ---
  const getMonthElements = () => {
    if (!cachedMonthElements) {
      cachedMonthElements = Array.from(document.querySelectorAll('.calendar-month-export'));
    }
    return cachedMonthElements;
  };

  const setupMonthInteractions = () => {
    cachedMonthElements = Array.from(document.querySelectorAll('.calendar-month-export'));
    
    if (!state.showAllMonths) {
      const prevBtn = document.querySelector('.prev-month-btn');
      const nextBtn = document.querySelector('.next-month-btn');
      
      if (prevBtn && !prevBtn.dataset.listenerAdded) {
        prevBtn.dataset.listenerAdded = 'true';
        prevBtn.addEventListener('click', () => {
          if (typeof dayjs === 'undefined') return;
          const date = dayjs(`${state.selectedYear}-${String(state.selectedMonth).padStart(2, '0')}-01`).subtract(1, 'month');
          state.selectedMonth = date.month() + 1;
          state.selectedYear = date.year();
          if (DOMElements.monthSelect) DOMElements.monthSelect.value = state.selectedMonth;
          if (DOMElements.yearSelect) DOMElements.yearSelect.value = state.selectedYear;
          updateBackgroundControls(state.selectedMonth);
          saveState();
          render();
        });
      }
      
      if (nextBtn && !nextBtn.dataset.listenerAdded) {
        nextBtn.dataset.listenerAdded = 'true';
        nextBtn.addEventListener('click', () => {
          if (typeof dayjs === 'undefined') return;
          const date = dayjs(`${state.selectedYear}-${String(state.selectedMonth).padStart(2, '0')}-01`).add(1, 'month');
          state.selectedMonth = date.month() + 1;
          state.selectedYear = date.year();
          if (DOMElements.monthSelect) DOMElements.monthSelect.value = state.selectedMonth;
          if (DOMElements.yearSelect) DOMElements.yearSelect.value = state.selectedYear;
          updateBackgroundControls(state.selectedMonth);
          saveState();
          render();
        });
      }
    }
    
    for (let i = 0; i < cachedMonthElements.length; i++) {
      const monthEl = cachedMonthElements[i];
      if (monthEl.dataset.listenersAdded) continue;
      monthEl.dataset.listenersAdded = 'true';
      
      const month = parseInt(monthEl.dataset.month);
      const bgDiv = monthEl.querySelector('.month-bg-image');
      const overlay = monthEl.querySelector('.month-bg-overlay');
      
      monthEl.addEventListener('dragover', (e) => {
        e.preventDefault();
        monthEl.classList.add('border-4', 'border-blue-500');
      });
      
      monthEl.addEventListener('dragleave', () => {
        monthEl.classList.remove('border-4', 'border-blue-500');
      });
      
      monthEl.addEventListener('drop', (e) => {
        e.preventDefault();
        monthEl.classList.remove('border-4', 'border-blue-500');
        const files = e.dataTransfer.files;
        console.log('[DRAG-DROP] Image dropped on month', month, 'Files:', files.length, 'First file:', files[0]?.name, 'Type:', files[0]?.type, 'Size:', files[0]?.size, 'bytes');
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onerror = (err) => {
            console.error('[DRAG-DROP] Error reading file:', err);
          };
          reader.onload = (ev) => {
            const monthNum = parseInt(month);
            console.log('[DRAG-DROP] FileReader loaded for month', monthNum, 'Data URL length:', ev.target.result?.length || 0, 'Starts with:', ev.target.result?.substring(0, 30) || 'N/A');
            if (!state.monthBackgrounds[monthNum]) {
              state.monthBackgrounds[monthNum] = { zoom: 100, posX: 50, posY: 50, opacity: 50, brightness: 100, saturation: 120 };
              console.log('[DRAG-DROP] Created new background object for month', monthNum);
            } else {
              if (!state.monthBackgrounds[monthNum].zoom) state.monthBackgrounds[monthNum].zoom = 100;
              if (!state.monthBackgrounds[monthNum].opacity) state.monthBackgrounds[monthNum].opacity = 50;
              if (!state.monthBackgrounds[monthNum].brightness) state.monthBackgrounds[monthNum].brightness = 100;
              if (!state.monthBackgrounds[monthNum].saturation) state.monthBackgrounds[monthNum].saturation = 120;
              if (!state.monthBackgrounds[monthNum].posX) state.monthBackgrounds[monthNum].posX = 50;
              if (!state.monthBackgrounds[monthNum].posY) state.monthBackgrounds[monthNum].posY = 50;
            }
            state.monthBackgrounds[monthNum].url = ev.target.result;
            console.log('[DRAG-DROP] Image URL set in state.monthBackgrounds[' + monthNum + '].url, URL exists:', !!state.monthBackgrounds[monthNum].url);
            console.log('[DRAG-DROP] Full state object:', JSON.stringify({ month: monthNum, hasUrl: !!state.monthBackgrounds[monthNum].url, zoom: state.monthBackgrounds[monthNum].zoom, opacity: state.monthBackgrounds[monthNum].opacity, brightness: state.monthBackgrounds[monthNum].brightness, saturation: state.monthBackgrounds[monthNum].saturation, posX: state.monthBackgrounds[monthNum].posX, posY: state.monthBackgrounds[monthNum].posY }));
            saveBackgroundImage(monthNum, state.monthBackgrounds[monthNum]);
            updateBackgroundControls(monthNum);
            console.log('[DRAG-DROP] Calling render() to update calendar...');
            render();
          };
          console.log('[DRAG-DROP] Starting FileReader.readAsDataURL()...');
          reader.readAsDataURL(files[0]);
        } else {
          console.warn('[DRAG-DROP] No valid image file found. File type:', files[0]?.type);
        }
      });
      
      monthEl.addEventListener('click', (e) => {
        if (e.target === monthEl || e.target === bgDiv || e.target.closest('.month-bg-image')) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (ev) => {
            const file = ev.target.files[0];
            console.log('[CLICK-UPLOAD] File selected for month', month, 'File:', file?.name, 'Type:', file?.type, 'Size:', file?.size, 'bytes');
            if (file) {
              const reader = new FileReader();
              reader.onerror = (err) => {
                console.error('[CLICK-UPLOAD] Error reading file:', err);
              };
              reader.onload = (ev2) => {
                const monthNum = parseInt(month);
                console.log('[CLICK-UPLOAD] FileReader loaded for month', monthNum, 'Data URL length:', ev2.target.result?.length || 0, 'Starts with:', ev2.target.result?.substring(0, 30) || 'N/A');
                if (!state.monthBackgrounds[monthNum]) {
                  state.monthBackgrounds[monthNum] = { zoom: 100, posX: 50, posY: 50, opacity: 50, brightness: 100, saturation: 120 };
                  console.log('[CLICK-UPLOAD] Created new background object for month', monthNum);
                } else {
                  if (!state.monthBackgrounds[monthNum].zoom) state.monthBackgrounds[monthNum].zoom = 100;
                  if (!state.monthBackgrounds[monthNum].opacity) state.monthBackgrounds[monthNum].opacity = 50;
                  if (!state.monthBackgrounds[monthNum].brightness) state.monthBackgrounds[monthNum].brightness = 100;
                  if (!state.monthBackgrounds[monthNum].saturation) state.monthBackgrounds[monthNum].saturation = 120;
                  if (!state.monthBackgrounds[monthNum].posX) state.monthBackgrounds[monthNum].posX = 50;
                  if (!state.monthBackgrounds[monthNum].posY) state.monthBackgrounds[monthNum].posY = 50;
                }
                state.monthBackgrounds[monthNum].url = ev2.target.result;
                console.log('[CLICK-UPLOAD] Image URL set in state.monthBackgrounds[' + monthNum + '].url, URL exists:', !!state.monthBackgrounds[monthNum].url);
                console.log('[CLICK-UPLOAD] Full state object:', JSON.stringify({ month: monthNum, hasUrl: !!state.monthBackgrounds[monthNum].url, zoom: state.monthBackgrounds[monthNum].zoom, opacity: state.monthBackgrounds[monthNum].opacity, brightness: state.monthBackgrounds[monthNum].brightness, saturation: state.monthBackgrounds[monthNum].saturation, posX: state.monthBackgrounds[monthNum].posX, posY: state.monthBackgrounds[monthNum].posY }));
                saveBackgroundImage(monthNum, state.monthBackgrounds[monthNum]);
                updateBackgroundControls(monthNum);
                console.log('[CLICK-UPLOAD] Calling render() to update calendar...');
                render();
              };
              console.log('[CLICK-UPLOAD] Starting FileReader.readAsDataURL()...');
              reader.readAsDataURL(file);
            }
          };
          input.click();
        }
      });
      
      overlay.addEventListener('mousedown', (e) => {
        const monthNum = parseInt(month);
        const bg = state.monthBackgrounds[monthNum];
        if (!bg?.url) return;
        dragState.isDragging = true;
        dragState.monthNum = monthNum;
        dragState.monthEl = monthEl;
        dragState.bgDiv = bgDiv;
        dragState.dragStartX = e.clientX;
        dragState.dragStartY = e.clientY;
        dragState.startPosX = bg.posX || 50;
        dragState.startPosY = bg.posY || 50;
        e.preventDefault();
        overlay.style.cursor = 'grabbing';
      });
      
      bgDiv.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
          const monthNum = parseInt(month);
          const bg = state.monthBackgrounds[monthNum];
          if (!bg?.url) return;
          e.preventDefault();
          dragState.isDragging = true;
          dragState.monthNum = monthNum;
          dragState.monthEl = monthEl;
          dragState.bgDiv = bgDiv;
          dragState.dragStartX = e.clientX;
          dragState.dragStartY = e.clientY;
          dragState.startPosX = bg.posX || 50;
          dragState.startPosY = bg.posY || 50;
          bgDiv.style.cursor = 'grabbing';
        }
      });
      
      monthEl.addEventListener('wheel', (e) => {
        const monthNum = parseInt(month);
        const bg = state.monthBackgrounds[monthNum];
        if (!bg?.url || e.ctrlKey || e.metaKey) return;
        if (dragState.isDragging) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        bg.zoom = Math.max(50, Math.min(200, (bg.zoom || 100) + delta));
        bgDiv.style.backgroundSize = `${bg.zoom}%`;
        saveBackgroundImage(monthNum, bg);
      }, { passive: false });
      
      monthEl.addEventListener('mousedown', (e) => {
        if (e.button === 1) {
          const monthNum = parseInt(month);
          const bg = state.monthBackgrounds[monthNum];
          if (!bg?.url) return;
          e.preventDefault();
          dragState.isDragging = true;
          dragState.monthNum = monthNum;
          dragState.monthEl = monthEl;
          dragState.bgDiv = bgDiv;
          dragState.dragStartX = e.clientX;
          dragState.dragStartY = e.clientY;
          dragState.startPosX = bg.posX || 50;
          dragState.startPosY = bg.posY || 50;
          monthEl.style.cursor = 'grabbing';
        }
      });
      
      monthEl.addEventListener('contextmenu', (e) => {
        const monthNum = parseInt(month);
        const bg = state.monthBackgrounds[monthNum];
        if (bg?.url) {
          e.preventDefault();
          if (confirm('Xóa ảnh nền cho tháng này?')) {
            delete bg.url;
            if (Object.keys(bg).length === 0 || (Object.keys(bg).length === 6 && !bg.url)) {
              delete state.monthBackgrounds[monthNum];
            }
            deleteBackgroundImage(monthNum);
            render();
          }
        }
      });
      
      monthEl.addEventListener('auxclick', (e) => {
        if (e.button === 1) {
          e.preventDefault();
        }
      });
    }
  };

  if (!window.monthInteractionsSetup) {
    window.monthInteractionsSetup = true;
    
    const throttledMouseMove = throttle((e) => {
      if (!dragState.isDragging || !dragState.monthNum) return;
      const bg = state.monthBackgrounds[dragState.monthNum];
      if (!bg?.url || !dragState.monthEl || !dragState.bgDiv) return;
      const rect = dragState.monthEl.getBoundingClientRect();
      const deltaX = -((e.clientX - dragState.dragStartX) / rect.width) * 100;
      const deltaY = -((e.clientY - dragState.dragStartY) / rect.height) * 100;
      bg.posX = Math.max(0, Math.min(100, dragState.startPosX + deltaX));
      bg.posY = Math.max(0, Math.min(100, dragState.startPosY + deltaY));
      dragState.bgDiv.style.backgroundPosition = `${bg.posX}% ${bg.posY}%`;
      saveBackgroundImage(dragState.monthNum, bg);
    }, 16);
    
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Shift') {
        const monthElements = getMonthElements();
        for (let i = 0; i < monthElements.length; i++) {
          const monthEl = monthElements[i];
          const monthNum = parseInt(monthEl.dataset.month);
          const bg = state.monthBackgrounds[monthNum];
          if (bg?.url) {
            shiftPressedMonths.add(monthNum);
            const overlay = monthEl.querySelector('.month-bg-overlay');
            if (overlay) {
              overlay.style.display = 'block';
              overlay.style.pointerEvents = 'all';
              overlay.style.cursor = 'move';
            }
            monthEl.style.cursor = 'move';
          }
        }
      }
    });
    
    document.addEventListener('keyup', (e) => {
      if (e.key === 'Shift') {
        shiftPressedMonths.forEach(monthNum => {
          const monthEl = document.querySelector(`[data-month="${monthNum}"]`);
          if (monthEl) {
            const overlay = monthEl.querySelector('.month-bg-overlay');
            if (overlay) {
              overlay.style.display = 'none';
              overlay.style.pointerEvents = 'none';
            }
            monthEl.style.cursor = 'default';
          }
        });
        shiftPressedMonths.clear();
        if (dragState.isDragging) {
          dragState.isDragging = false;
        }
      }
    });
    
    document.addEventListener('mousemove', throttledMouseMove);
    
    document.addEventListener('mouseup', (e) => {
      if (dragState.isDragging) {
        dragState.isDragging = false;
        if (dragState.monthEl) {
          const overlay = dragState.monthEl.querySelector('.month-bg-overlay');
          if (overlay) overlay.style.cursor = 'move';
          const bgDiv = dragState.monthEl.querySelector('.month-bg-image');
          if (bgDiv && state.monthBackgrounds[dragState.monthNum]?.url) {
            bgDiv.style.cursor = 'move';
          }
          dragState.monthEl.style.cursor = 'default';
        }
        dragState.monthNum = null;
        dragState.monthEl = null;
        dragState.bgDiv = null;
      }
      if (e.button === 1) {
        e.preventDefault();
      }
    });
  }

  // --- CUSTOM HOLIDAYS ---
  const renderCustomHolidaysList = () => {
    if (!DOMElements.customHolidaysList) return;
    if (!state.customHolidays || state.customHolidays.length === 0) {
      DOMElements.customHolidaysList.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Chưa có ngày lễ tùy chỉnh</p>';
      return;
    }
    const sorted = [...state.customHolidays].map((h, idx) => ({ ...h, originalIndex: idx })).sort((a, b) => a.date.localeCompare(b.date));
    let html = '';
    for (let i = 0; i < sorted.length; i++) {
      const holiday = sorted[i];
      const dateObj = new Date(holiday.date + 'T00:00:00');
      const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
      html += '<div class="flex items-center justify-between p-1 bg-gray-50 rounded text-xs"><span>' + dateStr + ' - ' + holiday.name + '</span><button class="delete-holiday text-red-600 hover:text-red-800 px-1" data-index="' + holiday.originalIndex + '">×</button></div>';
    }
    DOMElements.customHolidaysList.innerHTML = html;
    
    const deleteButtons = DOMElements.customHolidaysList.querySelectorAll('.delete-holiday');
    for (let i = 0; i < deleteButtons.length; i++) {
      const btn = deleteButtons[i];
      if (btn.dataset.listenerAdded) continue;
      btn.dataset.listenerAdded = 'true';
      btn.addEventListener('click', (e) => {
        const index = parseInt(e.target.dataset.index);
        if (index >= 0 && index < state.customHolidays.length) {
          state.customHolidays.splice(index, 1);
          saveState();
          renderCustomHolidaysList();
          render();
        }
      });
    }
  };

  // --- INITIALIZATION ---
  const updateBackgroundControls = (monthNum) => {
    const bg = state.monthBackgrounds[monthNum];
    if (!bg) return;
    
    const controls = [
      { key: 'bgZoom', prop: 'zoom', default: 100 },
      { key: 'bgOpacity', prop: 'opacity', default: 50 },
      { key: 'bgBrightness', prop: 'brightness', default: 100 },
      { key: 'bgSaturation', prop: 'saturation', default: 120 }
    ];
    
    for (let i = 0; i < controls.length; i++) {
      const control = controls[i];
      const input = document.querySelector(`[data-state="${control.key}"]`);
      const label = document.querySelector(`[data-label="${control.key}"]`);
      const value = bg[control.prop] !== undefined ? bg[control.prop] : control.default;
      
      if (input) {
        input.value = value;
      }
      if (label) {
        label.textContent = value;
      }
    }
  };

  const initializeControls = () => {
    if (DOMElements.monthSelect) {
      const options = [];
      for (let i = 1; i <= 12; i++) {
        options.push('<option value="' + i + '">' + i + '</option>');
      }
      DOMElements.monthSelect.innerHTML = options.join('');
      DOMElements.monthSelect.value = state.selectedMonth;
    }
    if (DOMElements.yearSelect) {
      const options = [];
      for (let i = 2100; i >= 1900; i--) {
        options.push('<option value="' + i + '">' + i + '</option>');
      }
      DOMElements.yearSelect.innerHTML = options.join('');
      DOMElements.yearSelect.value = state.selectedYear;
    }
    if (DOMElements.fontSelect) {
      const options = [];
      for (let i = 0; i < FONTS.length; i++) {
        const f = FONTS[i];
        options.push('<option value="' + f.family + '" style="font-family:' + f.family + '">' + f.name + '</option>');
      }
      DOMElements.fontSelect.innerHTML = options.join('');
      DOMElements.fontSelect.value = state.selectedFont;
    }
    if (DOMElements.startOfWeekSelect) {
      DOMElements.startOfWeekSelect.value = state.startOfWeek;
    }
    
    if (DOMElements.customHolidayDate) {
      if (typeof flatpickr !== 'undefined') {
        flatpickr(DOMElements.customHolidayDate, {
          locale: 'vn',
          dateFormat: 'd/m/Y',
          defaultDate: new Date(),
          allowInput: true
        });
      } else {
        const today = new Date();
        const day = String(today.getDate()).padStart(2, '0');
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const year = today.getFullYear();
        DOMElements.customHolidayDate.value = day + '/' + month + '/' + year;
      }
    }
    
    renderCustomHolidaysList();
    
    const stateElements = document.querySelectorAll('[data-state]');
    for (let i = 0; i < stateElements.length; i++) {
      const el = stateElements[i];
      const key = el.dataset.state;
      
      if (key.startsWith('bg')) {
        const bgKey = key.replace('bg', '').toLowerCase();
        const bgKeyMap = {
          'zoom': 'zoom',
          'opacity': 'opacity',
          'brightness': 'brightness',
          'saturation': 'saturation'
        };
        const actualKey = bgKeyMap[bgKey];
        if (actualKey) {
          const month = state.selectedMonth;
          const bg = state.monthBackgrounds[month];
          if (bg && bg[actualKey] !== undefined) {
            el.value = bg[actualKey];
            const label = document.querySelector(`[data-label="${key}"]`);
            if (label) label.textContent = bg[actualKey];
          }
        }
      } else if (state[key] !== undefined) {
        if (el.type === 'checkbox') {
          el.checked = state[key];
        } else if (el.type === 'color') {
          el.value = state[key];
        } else {
          el.value = state[key];
        }
      }
    }
    
    updateBackgroundControls(state.selectedMonth);
  };

  // --- ACCORDION STATE MANAGEMENT ---
  const loadAccordionState = () => {
    try {
      const saved = localStorage.getItem(ACCORDION_STATE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('Failed to load accordion state:', e);
    }
    return {
      basic: true,
      typography: true,
      colors: true,
      background: true,
      customHolidays: true,
      layout: true
    };
  };
  
  const saveAccordionState = (accordionState) => {
    try {
      localStorage.setItem(ACCORDION_STATE_KEY, JSON.stringify(accordionState));
    } catch (e) {
      console.warn('Failed to save accordion state:', e);
    }
  };
  
  const applyAccordionState = (accordionState) => {
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    for (let i = 0; i < accordionToggles.length; i++) {
      const panel = accordionToggles[i].dataset.panel;
      const content = document.querySelector(`[data-content="${panel}"]`);
      const svg = accordionToggles[i].querySelector('svg');
      const isActive = accordionState[panel] !== false;
      if (content) {
        content.classList.toggle('active', isActive);
      }
      if (svg) {
        svg.classList.toggle('rotate-180', isActive);
      }
    }
  };

  // --- EVENT LISTENERS ---
  const setupEventListeners = () => {
    const accordionState = loadAccordionState();
    applyAccordionState(accordionState);
    
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    for (let i = 0; i < accordionToggles.length; i++) {
      accordionToggles[i].addEventListener('click', () => {
        const panel = accordionToggles[i].dataset.panel;
        const content = document.querySelector(`[data-content="${panel}"]`);
        const isActive = content.classList.contains('active');
        content.classList.toggle('active', !isActive);
        const svg = accordionToggles[i].querySelector('svg');
        if (svg) svg.classList.toggle('rotate-180', !isActive);
        
        accordionState[panel] = !isActive;
        saveAccordionState(accordionState);
      });
    }

    if (DOMElements.monthSelect) {
      DOMElements.monthSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedMonth', parseInt(e.target.value));
        updateBackgroundControls(state.selectedMonth);
      });
    }
    if (DOMElements.yearSelect) {
      DOMElements.yearSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedYear', parseInt(e.target.value));
      });
    }
    if (DOMElements.fontSelect) {
      DOMElements.fontSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedFont', e.target.value);
      });
    }
    if (DOMElements.startOfWeekSelect) {
      DOMElements.startOfWeekSelect.addEventListener('change', (e) => {
        updateStateAndRender('startOfWeek', parseInt(e.target.value));
      });
    }

    const rangeInputs = document.querySelectorAll('input[type="range"][data-state]');
    for (let i = 0; i < rangeInputs.length; i++) {
      rangeInputs[i].addEventListener('input', (e) => {
        const key = e.target.dataset.state;
        const isFloat = e.target.step && e.target.step.includes('.');
        const value = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        
        if (key.startsWith('bg')) {
          const bgKey = key.replace('bg', '').toLowerCase();
          const bgKeyMap = {
            'zoom': 'zoom',
            'opacity': 'opacity',
            'brightness': 'brightness',
            'saturation': 'saturation'
          };
          const actualKey = bgKeyMap[bgKey];
          if (actualKey) {
            if (state.showAllMonths) {
              for (let m = 1; m <= 12; m++) {
                if (state.monthBackgrounds[m]) {
                  state.monthBackgrounds[m][actualKey] = value;
                }
              }
            } else {
              const month = state.selectedMonth;
              if (!state.monthBackgrounds[month]) {
                state.monthBackgrounds[month] = { zoom: 100, posX: 50, posY: 50, opacity: 50, brightness: 100, saturation: 120 };
              }
              state.monthBackgrounds[month][actualKey] = value;
              if (state.monthBackgrounds[month].url) {
                saveBackgroundImage(month, state.monthBackgrounds[month]);
              }
            }
          }
        } else {
          state[key] = value;
        }
        
        const label = cachedLabels.get(key) || document.querySelector(`[data-label="${key}"]`);
        if (label) {
          if (!cachedLabels.has(key)) cachedLabels.set(key, label);
          label.textContent = value;
        }
        saveState();
        render();
      });
    }
    
    const selectInputs = document.querySelectorAll('select[data-state]');
    for (let i = 0; i < selectInputs.length; i++) {
      selectInputs[i].addEventListener('change', (e) => {
        const key = e.target.dataset.state;
        if (key === 'colorPalette') {
          applyColorPalette(e.target.value);
          return;
        }
        const isNumber = !isNaN(parseFloat(e.target.options[0]?.value));
        let value = e.target.value;
        if (isNumber) {
          value = parseFloat(value) || parseInt(value, 10);
        }
        updateStateAndRender(key, value);
      });
    }
    
    const checkboxInputs = document.querySelectorAll('input[type="checkbox"][data-state]');
    for (let i = 0; i < checkboxInputs.length; i++) {
      checkboxInputs[i].addEventListener('change', (e) => {
        updateStateAndRender(e.target.dataset.state, e.target.checked);
      });
    }
    
    const colorInputs = document.querySelectorAll('input[type="color"][data-state]');
    for (let i = 0; i < colorInputs.length; i++) {
      const colorInput = colorInputs[i];
      const key = colorInput.dataset.state;
      if (state[key]) colorInput.value = state[key];
      colorInput.addEventListener('input', (e) => {
        updateStateAndRender(key, e.target.value);
      });
      colorInput.addEventListener('change', (e) => {
        updateStateAndRender(key, e.target.value);
      });
    }
    
    if (DOMElements.addCustomHolidayBtn && DOMElements.customHolidayDate && DOMElements.customHolidayName) {
      const convertDateToISO = (dateStr) => {
        if (!dateStr) return null;
        const parts = dateStr.split('/');
        if (parts.length === 3) {
          const day = parseInt(parts[0], 10);
          const month = parseInt(parts[1], 10);
          const year = parseInt(parts[2], 10);
          if (day >= 1 && day <= 31 && month >= 1 && month <= 12 && year >= 1900 && year <= 2100) {
            return year + '-' + String(month).padStart(2, '0') + '-' + String(day).padStart(2, '0');
          }
        }
        return null;
      };
      
      DOMElements.addCustomHolidayBtn.addEventListener('click', () => {
        const dateInput = DOMElements.customHolidayDate.value.trim();
        const name = DOMElements.customHolidayName.value.trim();
        if (dateInput && name) {
          const date = convertDateToISO(dateInput);
          if (date) {
            if (!state.customHolidays) state.customHolidays = [];
            const exists = state.customHolidays.some(h => h.date === date && h.name === name);
            if (!exists) {
              state.customHolidays.push({ date: date, name: name });
              saveState();
              renderCustomHolidaysList();
              render();
              DOMElements.customHolidayName.value = '';
              if (typeof flatpickr !== 'undefined') {
                const fp = DOMElements.customHolidayDate._flatpickr;
                if (fp) {
                  fp.setDate(new Date());
                }
              } else {
                const today = new Date();
                const day = String(today.getDate()).padStart(2, '0');
                const month = String(today.getMonth() + 1).padStart(2, '0');
                const year = today.getFullYear();
                DOMElements.customHolidayDate.value = day + '/' + month + '/' + year;
              }
            } else {
              alert('Ngày lễ này đã tồn tại');
            }
          } else {
            alert('Vui lòng nhập ngày hợp lệ (dd/MM/yyyy)');
          }
        }
      });
      
      DOMElements.customHolidayName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          DOMElements.addCustomHolidayBtn.click();
        }
      });
      
      DOMElements.customHolidayDate.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          DOMElements.addCustomHolidayBtn.click();
        }
      });
    }
    
    const removeAllBackgroundsBtn = document.getElementById('remove-all-backgrounds');
    if (removeAllBackgroundsBtn) {
      removeAllBackgroundsBtn.addEventListener('click', async () => {
        await removeAllBackgroundImages();
      });
    }
    
    if (DOMElements.exportBtn) {
      DOMElements.exportBtn.addEventListener('click', async () => {
        if (state.isExporting) return;
        state.isExporting = true;
        DOMElements.exportBtn.disabled = true;
        DOMElements.exportBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Đang xuất...</span>';
        document.body.classList.add('is-exporting');

        await new Promise(resolve => setTimeout(resolve, 200));
        
        try {
          const jsPDFLib = window.jspdf || jspdf;
          const { jsPDF } = jsPDFLib;
          const pixelsPerMm = (DPI * EXPORT_SCALE) / MM_PER_INCH;
          let pdf = null;
          const monthElements = getMonthElements();
          
          for (let i = 0; i < monthElements.length; i++) {
            const monthEl = monthElements[i];
            const month = parseInt(monthEl.dataset.month);
            
            const originalStyles = {
              position: monthEl.style.position,
              transform: monthEl.style.transform,
              margin: monthEl.style.margin,
              padding: monthEl.style.padding,
              boxSizing: monthEl.style.boxSizing,
              overflow: monthEl.style.overflow
            };
            
            monthEl.style.position = 'absolute';
            monthEl.style.left = '0';
            monthEl.style.top = '0';
            monthEl.style.margin = '0';
            monthEl.style.padding = '0';
            monthEl.style.boxSizing = 'border-box';
            monthEl.style.overflow = 'visible';
            
            const rect = monthEl.getBoundingClientRect();
            const elementWidth = Math.ceil(rect.width);
            const elementHeight = Math.ceil(rect.height);
            
            const aspectRatio = state.isLandscape ? A4_LANDSCAPE_RATIO : A4_PORTRAIT_RATIO;
            const expectedHeight = Math.ceil(elementWidth / aspectRatio);
            const finalHeight = Math.max(elementHeight, expectedHeight);
            
            await new Promise(resolve => setTimeout(resolve, 150));
            
            const canvas = await html2canvas(monthEl, {
              useCORS: true,
              scale: EXPORT_SCALE,
              logging: false,
              backgroundColor: state.monthBackgrounds[month]?.url ? null : state.backgroundColor,
              allowTaint: true,
              removeContainer: false,
              imageTimeout: 20000,
              width: elementWidth,
              height: finalHeight,
              x: 0,
              y: 0,
              scrollX: 0,
              scrollY: 0,
              windowWidth: elementWidth,
              windowHeight: finalHeight,
              onclone: (clonedDoc, element) => {
                const clonedMonth = clonedDoc.querySelector(`[data-month="${month}"]`);
                if (clonedMonth) {
                  clonedMonth.style.position = 'absolute';
                  clonedMonth.style.left = '0';
                  clonedMonth.style.top = '0';
                  clonedMonth.style.width = elementWidth + 'px';
                  clonedMonth.style.height = finalHeight + 'px';
                  clonedMonth.style.margin = '0';
                  clonedMonth.style.padding = '0';
                  clonedMonth.style.boxSizing = 'border-box';
                  clonedMonth.style.overflow = 'visible';
                  clonedMonth.style.transform = 'none';
                  
                  const navButtons = clonedMonth.querySelectorAll('.nav-button');
                  for (let j = 0; j < navButtons.length; j++) {
                    navButtons[j].style.display = 'none';
                  }
                  
                  const allTextElements = clonedMonth.querySelectorAll('p, h1, h2, h3, span, div');
                  for (let j = 0; j < allTextElements.length; j++) {
                    const el = allTextElements[j];
                    el.style.textRendering = 'optimizeLegibility';
                    el.style.webkitFontSmoothing = 'antialiased';
                    el.style.mozOsxFontSmoothing = 'grayscale';
                    if (el.style.overflow === 'hidden') {
                      el.style.overflow = 'visible';
                    }
                    if (el.style.textOverflow) {
                      el.style.textOverflow = 'clip';
                    }
                  }
                  
                  const calendarGrid = clonedMonth.querySelector('.calendar-grid');
                  if (calendarGrid) {
                    calendarGrid.style.overflow = 'visible';
                  }
                  
                  const holidayNames = clonedMonth.querySelectorAll('.holiday-name');
                  for (let j = 0; j < holidayNames.length; j++) {
                    holidayNames[j].style.overflow = 'visible';
                    holidayNames[j].style.textOverflow = 'clip';
                    holidayNames[j].style.whiteSpace = 'normal';
                    holidayNames[j].style.wordWrap = 'break-word';
                  }
                }
                
                const body = clonedDoc.body;
                if (body) {
                  body.style.margin = '0';
                  body.style.padding = '0';
                  body.style.width = elementWidth + 'px';
                  body.style.height = finalHeight + 'px';
                  body.style.overflow = 'visible';
                }
                
                const html = clonedDoc.documentElement;
                if (html) {
                  html.style.margin = '0';
                  html.style.padding = '0';
                  html.style.width = elementWidth + 'px';
                  html.style.height = finalHeight + 'px';
                  html.style.overflow = 'visible';
                }
              }
            });
            
            monthEl.style.position = originalStyles.position;
            monthEl.style.transform = originalStyles.transform;
            monthEl.style.margin = originalStyles.margin;
            monthEl.style.padding = originalStyles.padding;
            monthEl.style.boxSizing = originalStyles.boxSizing;
            monthEl.style.overflow = originalStyles.overflow;
            monthEl.style.left = '';
            monthEl.style.top = '';
            
            const imgData = canvas.toDataURL('image/png', 1.0);
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const mmWidth = canvasWidth / pixelsPerMm;
            const mmHeight = canvasHeight / pixelsPerMm;
            
            if (i === 0) {
              pdf = new jsPDF({
                orientation: state.isLandscape ? 'landscape' : 'portrait',
                unit: 'mm',
                format: [mmWidth, mmHeight],
                precision: 16,
                compress: false
              });
            } else {
              pdf.addPage([mmWidth, mmHeight], state.isLandscape ? 'landscape' : 'portrait');
            }
            
            pdf.addImage(imgData, 'PNG', 0, 0, mmWidth, mmHeight, undefined, 'FAST');
          }
          
          if (pdf) {
            pdf.save(`lich-viet-${state.selectedYear}-12-thang.pdf`);
          }
        } catch (error) {
          console.error('Failed to export calendar:', error);
          alert('An error occurred while exporting the calendar: ' + error.message);
        } finally {
          state.isExporting = false;
          DOMElements.exportBtn.disabled = false;
          DOMElements.exportBtn.innerHTML = '<span>Xuất file PDF</span>';
          document.body.classList.remove('is-exporting');
        }
      });
    }
  };

  // --- START APP ---
  let initAttempts = 0;
  
  const startApp = () => {
    initAttempts++;
    
    if (typeof dayjs === 'undefined' || typeof html2canvas === 'undefined' || (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined')) {
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        setTimeout(startApp, 100);
      } else {
        console.error('Required libraries failed to load');
        if (typeof dayjs === 'undefined') alert('Required library (dayjs) failed to load. Please refresh the page.');
        if (typeof html2canvas === 'undefined') alert('Required library (html2canvas) failed to load. Please refresh the page.');
        if (typeof window.jspdf === 'undefined' && typeof jspdf === 'undefined') alert('Required library (jsPDF) failed to load. Please refresh the page.');
      }
      return;
    }
    
    const SolarClass = window.Solar || Solar;
    if (SolarClass && typeof SolarClass.fromYmd === 'function') {
      console.log('lunar-javascript library loaded');
    }
    
    try {
      const HolidaysLib = window.Holidays || window.dateHolidays || Holidays;
      if (HolidaysLib) {
        try {
          if (HolidaysLib.default) {
            holidayService = new HolidaysLib.default('VN');
          } else if (typeof HolidaysLib === 'function') {
            holidayService = new HolidaysLib('VN');
          } else if (HolidaysLib.Holidays) {
            holidayService = new HolidaysLib.Holidays('VN');
          }
          console.log('Holiday service initialized');
        } catch (e) {
          console.warn('Holidays library initialization failed:', e);
        }
      }
    } catch (e) {
      console.warn('Holidays service not available:', e);
    }
    
    try {
      initDOMElements();
      initializeControls();
      setupEventListeners();
      loadBackgroundImages().then((images) => {
        if (Object.keys(images).length > 0) {
          state.monthBackgrounds = { ...state.monthBackgrounds, ...images };
          console.log('[IDB] Loaded', Object.keys(images).length, 'background images from IndexedDB');
        }
        render();
      }).catch((e) => {
        console.warn('[IDB] Failed to load background images, rendering without them:', e);
        render();
      });
      console.log('Calendar initialized successfully');
    } catch (e) {
      console.error('Failed to initialize app:', e);
      alert('Failed to initialize calendar. Please check console for errors: ' + e.message);
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, starting initialization...');
    setTimeout(startApp, 100);
  });
})();
