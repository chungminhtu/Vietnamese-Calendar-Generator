// storage.js
(function() {
  'use strict';

  const { STORAGE_KEY, ACCORDION_STATE_KEY, CUSTOM_PALETTES_KEY, DB_NAME, DB_VERSION, STORE_NAME, SAVE_DEBOUNCE_MS } = window.CalendarConstants;

  const defaultState = () => {
    const now = new Date();
    return {
      selectedMonth: now.getMonth() + 1,
      selectedYear: now.getFullYear(),
      selectedFont: "'Be Vietnam Pro', sans-serif",
      startOfWeek: 1,
      monthFontSize: 36, yearFontSize: 20, weekdayFontSize: 12, dateSize: 16,
      lunarDateFontSize: 10, holidayFontSize: 12, monthFontWeight: 700,
      yearFontWeight: 400, weekdayFontWeight: 600, dateFontWeight: 400,
      monthTextTransform: 'uppercase', weekdayTextTransform: 'uppercase',
      backgroundColor: '#FFFFFF', dateColor: '#1F2937', otherMonthDateColor: '#6B7280',
      weekdayColor: '#111827', lunarDateColor: '#374151', holidayColor: '#DC2626',
      borderColor: '#4B5563', colorPalette: 'oceanSunset',
      datePosition: 'top-right', monthYearLayout: 'double', borderWidth: 1,
      showOtherMonthDates: true, isLandscape: false, showAllMonths: false,
      showWritingLines: true, writingLinesCount: 3,
      showHolidayPublic: true, showHolidayBank: false, showHolidaySchool: false,
      showHolidayOptional: false, showHolidayObservance: true,
      monthBackgrounds: {},
      customHolidays: [],
      isExporting: false, isDragging: false,
      isDarkTheme: true
    };
  };

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
      
      if (window.CalendarState && window.CalendarState.state) {
        window.CalendarState.state.monthBackgrounds = {};
        if (window.CalendarRender && window.CalendarRender.render) {
          window.CalendarRender.render();
        }
      }
    } catch (e) {
      if (window.CalendarState && window.CalendarState.state) {
        window.CalendarState.state.monthBackgrounds = {};
        if (window.CalendarRender && window.CalendarRender.render) {
          window.CalendarRender.render();
        }
      }
    }
  };

  const loadState = () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        const state = { ...defaultState(), ...parsed };
        state.monthBackgrounds = {};
        if (!state.writingLinesCount) state.writingLinesCount = 3;
        return state;
      }
    } catch (e) {
    }
    return defaultState();
  };

  const saveState = () => {
    if (!window.CalendarUtils || !window.CalendarState || !window.CalendarState.state) return;
    if (window.CalendarUtils.saveTimeout) clearTimeout(window.CalendarUtils.saveTimeout);
    window.CalendarUtils.saveTimeout = setTimeout(() => {
      try {
        const toSave = { ...window.CalendarState.state };
        delete toSave.isExporting;
        delete toSave.isDragging;
        delete toSave.monthBackgrounds;
        localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
      } catch (e) {
      }
    }, SAVE_DEBOUNCE_MS);
  };

  const getCustomPalettes = () => {
    try {
      const saved = localStorage.getItem(CUSTOM_PALETTES_KEY);
      return saved ? JSON.parse(saved) : {};
    } catch (e) {
      return {};
    }
  };

  const saveCustomPalette = (name, palette) => {
    try {
      const customPalettes = getCustomPalettes();
      customPalettes[name] = palette;
      localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(customPalettes));
      return true;
    } catch (e) {
      return false;
    }
  };

  const deleteCustomPalette = (name) => {
    try {
      const customPalettes = getCustomPalettes();
      delete customPalettes[name];
      localStorage.setItem(CUSTOM_PALETTES_KEY, JSON.stringify(customPalettes));
      return true;
    } catch (e) {
      return false;
    }
  };

  const loadAccordionState = () => {
    try {
      const saved = localStorage.getItem(ACCORDION_STATE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
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
    }
  };

  window.CalendarStorage = {
    defaultState,
    openDB,
    saveBackgroundImage,
    loadBackgroundImages,
    deleteBackgroundImage,
    removeAllBackgroundImages,
    loadState,
    saveState,
    getCustomPalettes,
    saveCustomPalette,
    deleteCustomPalette,
    loadAccordionState,
    saveAccordionState
  };
})();
