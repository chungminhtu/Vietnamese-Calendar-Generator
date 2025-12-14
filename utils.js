// utils.js
(function() {
  'use strict';

  const { COLOR_PALETTES_DARK, COLOR_PALETTES_LIGHT } = window.CalendarConstants;
  const { loadState, saveState, getCustomPalettes, deleteCustomPalette } = window.CalendarStorage;

  let state = loadState();
  let holidayService = null;
  let dragState = { isDragging: false, monthNum: null, dragStartX: 0, dragStartY: 0, startPosX: 0, startPosY: 0, monthEl: null, bgDiv: null };
  let shiftPressedMonths = new Set();
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
    
    const normalizeName = (name) => {
      if (!name) return '';
      return name.toLowerCase().trim().replace(/\s+/g, ' ');
    };
    
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
        const tetExists = holidays.some(h => {
          const normalized = normalizeName(h.name);
          return normalized.includes('tết nguyên đán') || normalized.includes('giao thừa');
        });
        if (!tetExists) {
          holidays.push({ name: 'Tết Nguyên Đán', isCustom: false, isPublic: false });
        }
      } else if (lunarMonth === 3 && lunarDay === 10) {
        const gioToExists = holidays.some(h => {
          const normalized = normalizeName(h.name);
          return normalized.includes('giỗ tổ') || normalized.includes('giỗ tổ hùng vương');
        });
        if (!gioToExists) {
          holidays.push({ name: 'Giỗ Tổ Hùng Vương', isCustom: false, isPublic: false });
        }
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
                const hNormalized = normalizeName(h.name);
                const exists = holidays.some(existing => {
                  if (existing.isCustom) return false;
                  const existingNormalized = normalizeName(existing.name);
                  if (existingNormalized === hNormalized) return true;
                  if (existingNormalized.includes(hNormalized) || hNormalized.includes(existingNormalized)) return true;
                  return false;
                });
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
    
    const deduplicatedHolidays = [];
    for (let i = 0; i < holidays.length; i++) {
      const current = holidays[i];
      let shouldAdd = true;
      const currentNormalized = normalizeName(current.name);
      
      for (let j = 0; j < deduplicatedHolidays.length; j++) {
        const existing = deduplicatedHolidays[j];
        const existingNormalized = normalizeName(existing.name);
        
        if (currentNormalized === existingNormalized) {
          shouldAdd = false;
          break;
        }
        if (currentNormalized.includes(existingNormalized)) {
          shouldAdd = false;
          break;
        }
        if (existingNormalized.includes(currentNormalized)) {
          deduplicatedHolidays[j] = current;
          shouldAdd = false;
          break;
        }
      }
      
      if (shouldAdd) {
        deduplicatedHolidays.push(current);
      }
    }
    
    const publicHolidays = deduplicatedHolidays.filter(h => h.isPublic || h.holidayType === 'public');
    const observanceHolidays = deduplicatedHolidays.filter(h => h.holidayType === 'observance');
    
    if (publicHolidays.length > 0 && observanceHolidays.length > 0) {
      return publicHolidays;
    }
    
    return deduplicatedHolidays;
  };

  const applyColorPalette = (paletteName) => {
    const paletteSet = state.isDarkTheme ? COLOR_PALETTES_DARK : COLOR_PALETTES_LIGHT;
    let palette = paletteSet[paletteName];
    
    if (!palette) {
      const customPalettes = getCustomPalettes();
      palette = customPalettes[paletteName];
    }
    
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
      window.CalendarRender.render();
    }
  };
  
  const toggleTheme = (isDark) => {
    state.isDarkTheme = isDark;
    const currentPalette = state.colorPalette || 'default';
    applyColorPalette(currentPalette);
  };

  const updateStateAndRender = (key, value) => {
    state[key] = value;
    saveState();
    window.CalendarRender.render();
  };

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

  const formatDateInput = () => {
    const today = new Date();
    const day = String(today.getDate()).padStart(2, '0');
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const year = today.getFullYear();
    return day + '/' + month + '/' + year;
  };

  const initializeBackgroundForMonth = (monthNum) => {
    if (!state.monthBackgrounds[monthNum]) {
      state.monthBackgrounds[monthNum] = { zoom: 100, posX: 50, posY: 50, opacity: 50, brightness: 100, saturation: 120 };
    } else {
      if (!state.monthBackgrounds[monthNum].zoom) state.monthBackgrounds[monthNum].zoom = 100;
      if (!state.monthBackgrounds[monthNum].opacity) state.monthBackgrounds[monthNum].opacity = 50;
      if (!state.monthBackgrounds[monthNum].brightness) state.monthBackgrounds[monthNum].brightness = 100;
      if (!state.monthBackgrounds[monthNum].saturation) state.monthBackgrounds[monthNum].saturation = 120;
      if (!state.monthBackgrounds[monthNum].posX) state.monthBackgrounds[monthNum].posX = 50;
      if (!state.monthBackgrounds[monthNum].posY) state.monthBackgrounds[monthNum].posY = 50;
    }
  };

  const processImageWithFilters = (imageUrl, brightness, saturation) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.filter = 'brightness(' + brightness + ') saturate(' + saturation + ')';
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/jpeg', 0.95));
      };
      img.onerror = reject;
      img.src = imageUrl;
    });
  };

  const renderCustomPalettesList = () => {
    if (!window.CalendarDOM || !window.CalendarDOM.customPalettesList) return;
    const customPalettes = getCustomPalettes();
    const paletteNames = Object.keys(customPalettes);
    
    const paletteSelect = document.querySelector('[data-state="colorPalette"]');
    if (paletteSelect) {
      const existingCustomOptions = paletteSelect.querySelectorAll('option[data-custom="true"]');
      for (let i = 0; i < existingCustomOptions.length; i++) {
        existingCustomOptions[i].remove();
      }
      
      for (let i = 0; i < paletteNames.length; i++) {
        const name = paletteNames[i];
        const option = document.createElement('option');
        option.value = name;
        option.textContent = name;
        option.dataset.custom = 'true';
        paletteSelect.appendChild(option);
      }
    }
    
    if (paletteNames.length === 0) {
      window.CalendarDOM.customPalettesList.innerHTML = '<p class="text-xs text-gray-500 text-center py-1">Chưa có bảng màu tùy chỉnh</p>';
      return;
    }
    
    let html = '';
    for (let i = 0; i < paletteNames.length; i++) {
      const name = paletteNames[i];
      html += '<div class="flex items-center justify-between p-1 bg-gray-50 rounded text-xs hover:bg-gray-100">';
      html += '<button class="flex-1 text-left custom-palette-select" data-palette="' + name.replace(/"/g, '&quot;') + '">' + name.replace(/</g, '&lt;').replace(/>/g, '&gt;') + '</button>';
      html += '<button class="delete-custom-palette text-red-600 hover:text-red-800 px-1" data-palette="' + name.replace(/"/g, '&quot;') + '">×</button>';
      html += '</div>';
    }
    window.CalendarDOM.customPalettesList.innerHTML = html;
    
    const selectButtons = window.CalendarDOM.customPalettesList.querySelectorAll('.custom-palette-select');
    for (let i = 0; i < selectButtons.length; i++) {
      selectButtons[i].addEventListener('click', (e) => {
        const paletteName = e.target.dataset.palette;
        if (paletteName) {
          if (paletteSelect) {
            paletteSelect.value = paletteName;
            applyColorPalette(paletteName);
          }
        }
      });
    }
    
    const deleteButtons = window.CalendarDOM.customPalettesList.querySelectorAll('.delete-custom-palette');
    for (let i = 0; i < deleteButtons.length; i++) {
      deleteButtons[i].addEventListener('click', (e) => {
        const paletteName = e.target.dataset.palette;
        if (paletteName && confirm('Xóa bảng màu "' + paletteName + '"?')) {
          deleteCustomPalette(paletteName);
          renderCustomPalettesList();
          if (paletteSelect && paletteSelect.value === paletteName) {
            paletteSelect.value = 'default';
            applyColorPalette('default');
          }
        }
      });
    }
  };

  window.CalendarState = { state };
  window.CalendarUtils = {
    holidayService,
    dragState,
    shiftPressedMonths,
    renderTimeout,
    saveTimeout,
    get cachedMonthElements() { return cachedMonthElements; },
    set cachedMonthElements(value) { cachedMonthElements = value; },
    cachedLabels,
    debounce,
    throttle,
    getLunarDate,
    getHolidays,
    applyColorPalette,
    toggleTheme,
    updateStateAndRender,
    convertDateToISO,
    formatDateInput,
    initializeBackgroundForMonth,
    processImageWithFilters,
    renderCustomPalettesList
  };
})();
