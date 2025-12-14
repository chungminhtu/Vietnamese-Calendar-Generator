// app.js
(function() {
  'use strict';

  const { MAX_INIT_ATTEMPTS } = window.CalendarConstants;
  const { state } = window.CalendarState;
  const { holidayService } = window.CalendarUtils;
  const { loadBackgroundImages } = window.CalendarStorage;
  const { render } = window.CalendarRender;
  const { setupEventListeners, initializeControls, updateBackgroundControls } = window.CalendarEvents;

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
    customHolidaysList: null,
    customPaletteName: null,
    saveCustomPaletteBtn: null,
    customPalettesList: null
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
    DOMElements.customPaletteName = document.getElementById('custom-palette-name');
    DOMElements.saveCustomPaletteBtn = document.getElementById('save-custom-palette');
    DOMElements.customPalettesList = document.getElementById('custom-palettes-list');
    window.CalendarDOM = DOMElements;
  };

  let initAttempts = 0;
  
  const startApp = () => {
    initAttempts++;
    
    if (typeof dayjs === 'undefined' || typeof html2pdf === 'undefined') {
      if (initAttempts < MAX_INIT_ATTEMPTS) {
        requestAnimationFrame(() => {
          startApp();
        });
      } else {
        if (typeof dayjs === 'undefined') alert('Required library (dayjs) failed to load. Please refresh the page.');
        if (typeof html2pdf === 'undefined') alert('Required library (html2pdf) failed to load. Please refresh the page.');
      }
      return;
    }
    
    try {
      const HolidaysLib = window.Holidays || window.dateHolidays || Holidays;
      if (HolidaysLib) {
        try {
          if (HolidaysLib.default) {
            window.CalendarUtils.holidayService = new HolidaysLib.default('VN');
          } else if (typeof HolidaysLib === 'function') {
            window.CalendarUtils.holidayService = new HolidaysLib('VN');
          } else if (HolidaysLib.Holidays) {
            window.CalendarUtils.holidayService = new HolidaysLib.Holidays('VN');
          }
        } catch (e) {
        }
      }
    } catch (e) {
    }
    
    try {
      initDOMElements();
      initializeControls();
      setupEventListeners();
      window.CalendarUtils.renderCustomPalettesList();
      loadBackgroundImages().then((images) => {
        if (Object.keys(images).length > 0) {
          state.monthBackgrounds = { ...state.monthBackgrounds, ...images };
          updateBackgroundControls(state.selectedMonth);
        }
        render();
      }).catch((e) => {
        render();
      });
    } catch (e) {
      alert('Failed to initialize calendar. Please check console for errors: ' + e.message);
    }
  };
  
  document.addEventListener('DOMContentLoaded', () => {
    requestAnimationFrame(() => {
      startApp();
    });
  });
})();
