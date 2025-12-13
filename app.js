// app.js
(function() {
  'use strict';

  // --- CONSTANTS ---
  const STORAGE_KEY = 'vietnamese-calendar-settings';
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
      isExporting: false, isDragging: false
    };
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

  const getHoliday = (date, lunarDay, lunarMonth) => {
    if (lunarDay > 0 && lunarMonth > 0) {
      if (lunarMonth === 1 && lunarDay <= 3) return 'Tết Nguyên Đán';
      if (lunarMonth === 3 && lunarDay === 10) return 'Giỗ Tổ Hùng Vương';
    }
    if (!holidayService) return null;
    const enabledTypes = [];
    if (state.showHolidayPublic) enabledTypes.push('public');
    if (state.showHolidayBank) enabledTypes.push('bank');
    if (state.showHolidaySchool) enabledTypes.push('school');
    if (state.showHolidayOptional) enabledTypes.push('optional');
    if (state.showHolidayObservance) enabledTypes.push('observance');
    if (enabledTypes.length === 0) return null;
    try {
      const allHolidays = holidayService.isHoliday(date);
      if (allHolidays) {
        const holidaysArray = Array.isArray(allHolidays) ? allHolidays : [allHolidays];
        const matchingHoliday = holidaysArray.find(h => h && h.type && enabledTypes.includes(h.type));
        return matchingHoliday ? matchingHoliday.name : null;
      }
    } catch (e) {}
    return null;
  };

  const applyColorPalette = (paletteName) => {
    const palette = COLOR_PALETTES[paletteName];
    if (palette) {
      Object.assign(state, palette);
      state.colorPalette = paletteName;
      state.backgroundColor = '#FFFFFF';
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
    calendarsContainer: null
  };

  const initDOMElements = () => {
    DOMElements.monthSelect = document.getElementById('month-select');
    DOMElements.yearSelect = document.getElementById('year-select');
    DOMElements.fontSelect = document.getElementById('font-select');
    DOMElements.startOfWeekSelect = document.getElementById('start-of-week-select');
    DOMElements.exportBtn = document.getElementById('export-btn');
    DOMElements.calendarMain = document.getElementById('calendar-main');
    DOMElements.calendarsContainer = document.getElementById('calendars-container');
  };

  // --- RENDERING ---
  const generateDayCellHTML = (day) => {
    const { date, lunarDay, lunarMonth, holidayName, isCurrentMonth } = day;
    const { datePosition, borderWidth, dateSize, dateFontWeight, lunarDateFontSize, holidayFontSize } = state;
    const dateColor = isCurrentMonth ? (holidayName ? state.holidayColor : state.dateColor) : state.otherMonthDateColor;
    const positionClasses = DATE_POSITION_CLASSES[datePosition] || DATE_POSITION_CLASSES['top-right'];
    
    const dayNum = date.getDate();
    let html = '<div class="border-r border-b p-1 flex flex-col" style="border-color: ' + state.borderColor + '; border-right-width: ' + borderWidth + 'px; border-bottom-width: ' + borderWidth + 'px;"><div class="w-full flex-1 flex ' + positionClasses + '"><div class="text-center leading-none"><p style="font-size: ' + dateSize + 'px; font-weight: ' + dateFontWeight + '; color: ' + dateColor + ';">' + dayNum + '</p>';
    
    if (lunarDay > 0 && lunarMonth > 0) {
      html += '<p style="font-size: ' + lunarDateFontSize + 'px; color: ' + state.lunarDateColor + '; line-height: 1.2;">' + lunarDay + '/' + lunarMonth + '</p>';
    }
    
    html += '</div></div>';
    
    if (holidayName && isCurrentMonth) {
      html += '<div class="text-center pb-1 mt-auto"><p class="holiday-name" style="font-size: ' + holidayFontSize + 'px; color: ' + state.holidayColor + '; line-height: normal; padding: 2px 0;">' + holidayName + '</p></div>';
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
      const holidayName = getHoliday(date, lunarDay, lunarMonth);
      const isCurrentMonth = date.getMonth() === month - 1;
      grid.push({ date, lunarDay, lunarMonth, holidayName, isCurrentMonth });
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
    if (!monthBg || !monthBg.url) return '';
    const url = String(monthBg.url).replace(/"/g, '&quot;').replace(/'/g, "\\'");
    return 'background-image: url("' + url + '"); background-size: ' + (monthBg.zoom || 100) + '%; background-position: ' + (monthBg.posX || 50) + '% ' + (monthBg.posY || 50) + '%; background-repeat: no-repeat; opacity: ' + ((monthBg.opacity || 100) / 100) + '; filter: brightness(' + ((monthBg.brightness || 100) / 100) + ') saturate(' + ((monthBg.saturation || 100) / 100) + ');';
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
    
    return '<div class="calendar-month-export relative shadow-2xl rounded-lg overflow-hidden transition-all duration-300" data-month="' + month + '" style="width: 100%; aspect-ratio: ' + aspectRatio + '; max-width: 100%; max-height: calc(100vh - 4rem); height: auto;"><div class="month-bg-image absolute inset-0 rounded-lg" style="' + bgStyle + ' cursor: ' + (hasBg ? 'move' : 'default') + '; z-index: 1; user-select: none; pointer-events: ' + (hasBg ? 'auto' : 'none') + '; width: 100%; height: 100%;"></div><div class="month-bg-overlay absolute inset-0 z-10 pointer-events-none" style="display: none;"></div><div class="relative w-full h-full flex flex-col p-4 sm:p-6" style="z-index: 2; font-family: ' + state.selectedFont + '; background-color: ' + state.backgroundColor + ';"><header class="relative text-center pb-4 flex items-center justify-center">' + generateNavButtonsHTML() + '<div class="flex-1">' + generateHeaderHTML(month, year) + '</div></header><div class="flex flex-col flex-grow"><div class="weekday-header grid grid-cols-7">' + generateWeekdayHTML() + '</div><div class="calendar-grid border-t border-l" style="border-color: ' + state.borderColor + '; border-top-width: ' + state.borderWidth + 'px; border-left-width: ' + state.borderWidth + 'px;">' + generateCalendarGrid(month, year) + '</div></div></div></div>';
  };

  const renderAllMonths = () => {
    if (!DOMElements.calendarsContainer) return;
    const parts = [];
    for (let month = 1; month <= 12; month++) {
      parts.push(generateMonthCalendarHTML(month, state.selectedYear));
    }
    DOMElements.calendarsContainer.innerHTML = parts.join('');
    cachedMonthElements = null;
    setupMonthInteractions();
  };

  const renderSingleMonth = () => {
    if (!DOMElements.calendarsContainer) return;
    DOMElements.calendarsContainer.innerHTML = generateMonthCalendarHTML(state.selectedMonth, state.selectedYear);
    cachedMonthElements = null;
    setupMonthInteractions();
  };

  const render = () => {
    if (renderTimeout) {
      cancelAnimationFrame(renderTimeout);
    }
    renderTimeout = requestAnimationFrame(() => {
      try {
        if (state.showAllMonths) {
          renderAllMonths();
        } else {
          renderSingleMonth();
        }
      } catch (e) {
        console.error('Render error:', e);
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
        if (files.length > 0 && files[0].type.startsWith('image/')) {
          const reader = new FileReader();
          reader.onload = (ev) => {
            const monthNum = parseInt(month);
            if (!state.monthBackgrounds[monthNum]) {
              state.monthBackgrounds[monthNum] = { zoom: 100, posX: 50, posY: 50, opacity: 100, brightness: 100, saturation: 100 };
            }
            state.monthBackgrounds[monthNum].url = ev.target.result;
            render();
          };
          reader.readAsDataURL(files[0]);
        }
      });
      
      monthEl.addEventListener('click', (e) => {
        if (e.target === monthEl || e.target === bgDiv || e.target.closest('.month-bg-image')) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (ev) => {
            const file = ev.target.files[0];
            if (file) {
              const reader = new FileReader();
              reader.onload = (ev2) => {
                const monthNum = parseInt(month);
                if (!state.monthBackgrounds[monthNum]) {
                  state.monthBackgrounds[monthNum] = { zoom: 100, posX: 50, posY: 50, opacity: 100, brightness: 100, saturation: 100 };
                }
                state.monthBackgrounds[monthNum].url = ev2.target.result;
                render();
              };
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
      
      monthEl.addEventListener('wheel', (e) => {
        const monthNum = parseInt(month);
        const bg = state.monthBackgrounds[monthNum];
        if (!bg?.url || e.ctrlKey || e.metaKey) return;
        e.preventDefault();
        const delta = e.deltaY > 0 ? -5 : 5;
        bg.zoom = Math.max(50, Math.min(200, (bg.zoom || 100) + delta));
        bgDiv.style.backgroundSize = `${bg.zoom}%`;
      }, { passive: false });
      
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
            render();
          }
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
      const deltaX = ((e.clientX - dragState.dragStartX) / rect.width) * 100;
      const deltaY = ((e.clientY - dragState.dragStartY) / rect.height) * 100;
      bg.posX = Math.max(0, Math.min(100, dragState.startPosX + deltaX));
      bg.posY = Math.max(0, Math.min(100, dragState.startPosY + deltaY));
      dragState.bgDiv.style.backgroundPosition = `${bg.posX}% ${bg.posY}%`;
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
    
    document.addEventListener('mouseup', () => {
      if (dragState.isDragging) {
        dragState.isDragging = false;
        if (dragState.monthEl) {
          const overlay = dragState.monthEl.querySelector('.month-bg-overlay');
          if (overlay) overlay.style.cursor = 'move';
        }
        dragState.monthNum = null;
        dragState.monthEl = null;
        dragState.bgDiv = null;
      }
    });
  }

  // --- INITIALIZATION ---
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
  };

  // --- EVENT LISTENERS ---
  const setupEventListeners = () => {
    const accordionContents = document.querySelectorAll('.accordion-content');
    for (let i = 0; i < accordionContents.length; i++) {
      accordionContents[i].classList.add('active');
    }
    const accordionSvgs = document.querySelectorAll('.accordion-toggle svg');
    for (let i = 0; i < accordionSvgs.length; i++) {
      accordionSvgs[i].classList.add('rotate-180');
    }
    
    const accordionToggles = document.querySelectorAll('.accordion-toggle');
    for (let i = 0; i < accordionToggles.length; i++) {
      accordionToggles[i].addEventListener('click', () => {
        const panel = accordionToggles[i].dataset.panel;
        const content = document.querySelector(`[data-content="${panel}"]`);
        const isActive = content.classList.contains('active');
        content.classList.toggle('active', !isActive);
        const svg = accordionToggles[i].querySelector('svg');
        if (svg) svg.classList.toggle('rotate-180', !isActive);
      });
    }

    if (DOMElements.monthSelect) {
      DOMElements.monthSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedMonth', parseInt(e.target.value));
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
                state.monthBackgrounds[month] = { zoom: 100, posX: 50, posY: 50, opacity: 100, brightness: 100, saturation: 100 };
              }
              state.monthBackgrounds[month][actualKey] = value;
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
      render();
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
