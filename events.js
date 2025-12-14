// events.js
(function() {
  'use strict';

  const { FONTS, EXPORT_SCALE, getA4Dimensions, A4_WIDTH_MM, A4_HEIGHT_MM } = window.CalendarConstants;
  const { state } = window.CalendarState;
  const { convertDateToISO, formatDateInput, processImageWithFilters, updateStateAndRender, applyColorPalette, toggleTheme, initializeBackgroundForMonth } = window.CalendarUtils;
  const { saveState, getCustomPalettes, saveCustomPalette, deleteCustomPalette, loadAccordionState, saveAccordionState, removeAllBackgroundImages } = window.CalendarStorage;
  const { render, renderCustomHolidaysList } = window.CalendarRender;
  const { getMonthElements } = window.CalendarInteractions;

  const BG_KEY_MAP = {
    'zoom': 'zoom',
    'opacity': 'opacity',
    'brightness': 'brightness',
    'saturation': 'saturation'
  };

  const BACKGROUND_CONTROLS = [
    { key: 'bgZoom', prop: 'zoom', default: 100 },
    { key: 'bgOpacity', prop: 'opacity', default: 50 },
    { key: 'bgBrightness', prop: 'brightness', default: 100 },
    { key: 'bgSaturation', prop: 'saturation', default: 120 }
  ];

  const updateBackgroundControls = (monthNum) => {
    const bg = state.monthBackgrounds[monthNum];
    if (!bg) return;
    
    for (let i = 0; i < BACKGROUND_CONTROLS.length; i++) {
      const control = BACKGROUND_CONTROLS[i];
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

  const applyBackgroundToExportElement = (bgDiv, monthBg, processedImageUrl, a4Dims) => {
    const zoom = monthBg.zoom || 100;
    const offsetPercent = (10 / a4Dims.width) * 100;
    const posX = (monthBg.posX || 50) - offsetPercent;
    const posY = monthBg.posY || 50;
    const opacity = (monthBg.opacity !== undefined ? monthBg.opacity : 50) / 100;
    bgDiv.style.backgroundImage = 'url("' + processedImageUrl.replace(/"/g, '\\"') + '")';
    bgDiv.style.backgroundSize = zoom + '%';
    bgDiv.style.backgroundPosition = posX + '% ' + posY + '%';
    bgDiv.style.backgroundRepeat = 'no-repeat';
    bgDiv.style.opacity = opacity;
    bgDiv.style.filter = 'none';
    bgDiv.style.zIndex = '1';
    bgDiv.style.position = 'absolute';
    bgDiv.style.top = '0';
    bgDiv.style.left = '0';
    bgDiv.style.right = '0';
    bgDiv.style.bottom = '0';
    bgDiv.style.width = '100%';
    bgDiv.style.height = '100%';
    bgDiv.style.margin = '0';
    bgDiv.style.padding = '0';
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

  const initializeControls = () => {
    if (window.CalendarDOM.monthSelect) {
      const options = [];
      for (let i = 1; i <= 12; i++) {
        options.push('<option value="' + i + '">' + i + '</option>');
      }
      window.CalendarDOM.monthSelect.innerHTML = options.join('');
      window.CalendarDOM.monthSelect.value = state.selectedMonth;
    }
    if (window.CalendarDOM.yearSelect) {
      const options = [];
      for (let i = 2100; i >= 1900; i--) {
        options.push('<option value="' + i + '">' + i + '</option>');
      }
      window.CalendarDOM.yearSelect.innerHTML = options.join('');
      window.CalendarDOM.yearSelect.value = state.selectedYear;
    }
    if (window.CalendarDOM.fontSelect) {
      const options = [];
      for (let i = 0; i < FONTS.length; i++) {
        const f = FONTS[i];
        options.push('<option value="' + f.family + '" style="font-family:' + f.family + '">' + f.name + '</option>');
      }
      window.CalendarDOM.fontSelect.innerHTML = options.join('');
      window.CalendarDOM.fontSelect.value = state.selectedFont;
    }
    if (window.CalendarDOM.startOfWeekSelect) {
      window.CalendarDOM.startOfWeekSelect.value = state.startOfWeek;
    }
    
    if (window.CalendarDOM.customHolidayDate) {
      if (typeof flatpickr !== 'undefined') {
        flatpickr(window.CalendarDOM.customHolidayDate, {
          locale: 'vn',
          dateFormat: 'd/m/Y',
          defaultDate: new Date(),
          allowInput: true
        });
      } else {
        window.CalendarDOM.customHolidayDate.value = formatDateInput();
      }
    }
    
    renderCustomHolidaysList();
    
    const stateElements = document.querySelectorAll('[data-state]');
    for (let i = 0; i < stateElements.length; i++) {
      const el = stateElements[i];
      const key = el.dataset.state;
      
      if (key.startsWith('bg')) {
        const bgKey = key.replace('bg', '').toLowerCase();
        const actualKey = BG_KEY_MAP[bgKey];
        if (actualKey) {
          const month = state.selectedMonth;
          const bg = state.monthBackgrounds[month];
          const control = BACKGROUND_CONTROLS.find(c => c.key === key);
          const defaultValue = control ? control.default : 100;
          const value = bg && bg[actualKey] !== undefined ? bg[actualKey] : defaultValue;
          el.value = value;
          const label = document.querySelector(`[data-label="${key}"]`);
          if (label) label.textContent = value;
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
      
      if (key === 'writingLinesCount') {
        const value = state.writingLinesCount || 3;
        el.value = value;
        state.writingLinesCount = parseInt(value) || 3;
      }
    }
    
    updateBackgroundControls(state.selectedMonth);
  };

  const exportToPDF = async () => {
    if (state.isExporting) return;
    state.isExporting = true;
    window.CalendarDOM.exportBtn.disabled = true;
    window.CalendarDOM.exportBtn.innerHTML = '<svg class="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle><path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg><span>Đang xuất...</span>';
    document.body.classList.add('is-exporting');

    try {
      const monthElements = getMonthElements();
      const a4Dims = getA4Dimensions(state.isLandscape);
      const exactWidth = a4Dims.exactWidth || a4Dims.width;
      const exactHeight = a4Dims.exactHeight || a4Dims.height;
      const exportContainer = document.createElement('div');
      exportContainer.style.width = exactWidth + 'px';
      exportContainer.style.height = exactHeight + 'px';
      exportContainer.style.margin = '0';
      exportContainer.style.padding = '0';
      exportContainer.style.boxSizing = 'border-box';
      exportContainer.style.position = 'absolute';
      exportContainer.style.left = '0';
      exportContainer.style.top = '0';
      exportContainer.style.overflow = 'hidden';
      exportContainer.style.borderRadius = '0';
      document.body.appendChild(exportContainer);
      
      const processedImages = {};
      const imagePromises = [];
      
      for (let month = 1; month <= 12; month++) {
        const monthBg = state.monthBackgrounds[month];
        if (monthBg && monthBg.url) {
          const brightness = (monthBg.brightness || 100) / 100;
          const saturation = (monthBg.saturation !== undefined ? monthBg.saturation : 120) / 100;
          imagePromises.push(
            processImageWithFilters(monthBg.url, brightness, saturation)
              .then(dataUrl => { processedImages[month] = dataUrl; })
              .catch(() => { processedImages[month] = monthBg.url; })
          );
        }
      }
      
      await Promise.all(imagePromises);
      
      monthElements.forEach((monthEl, i) => {
        const clone = monthEl.cloneNode(true);
        Object.assign(clone.style, {
          width: exactWidth + 'px',
          height: exactHeight + 'px',
          margin: '0',
          padding: '0',
          boxSizing: 'border-box',
          overflow: 'hidden',
          transform: 'none',
          borderRadius: '0',
          position: 'relative',
          left: '0',
          top: '0'
        });
        clone.querySelectorAll('.nav-button').forEach(btn => btn.style.display = 'none');
        clone.querySelectorAll('.month-bg-image').forEach(bgDiv => {
          bgDiv.style.borderRadius = '0';
        });
        clone.querySelectorAll('*').forEach(el => {
          if (el.style && el.style.borderRadius) {
            el.style.borderRadius = '0';
          }
        });
        
        const monthNum = parseInt(clone.dataset.month);
        const monthBg = state.monthBackgrounds[monthNum];
        if (monthBg && monthBg.url && processedImages[monthNum]) {
          const bgDiv = clone.querySelector('.month-bg-image');
          if (bgDiv) {
            applyBackgroundToExportElement(bgDiv, monthBg, processedImages[monthNum], a4Dims);
          }
        }
        
        if (i < monthElements.length - 1) clone.classList.add('html2pdf__page-break');
        exportContainer.appendChild(clone);
      });
      
      await html2pdf().set({
        margin: [0, 0, 0, 0],
        filename: `lich-viet-${state.selectedYear}-12-thang.pdf`,
        image: { type: 'jpeg', quality: 0.95 },
        html2canvas: { 
          scale: EXPORT_SCALE,
          useCORS: true,
          logging: false,
          allowTaint: true,
          width: exactWidth,
          height: exactHeight,
          onclone: (clonedDoc) => {
            const body = clonedDoc.body;
            if (body) {
              body.style.margin = '0';
              body.style.padding = '0';
              body.style.overflow = 'hidden';
            }
            const html = clonedDoc.documentElement;
            if (html) {
              html.style.margin = '0';
              html.style.padding = '0';
              html.style.overflow = 'hidden';
            }
            const clonedElements = clonedDoc.querySelectorAll('[data-month]');
            clonedElements.forEach((clonedEl) => {
              clonedEl.style.margin = '0';
              clonedEl.style.padding = '0';
              clonedEl.style.left = '0';
              clonedEl.style.position = 'relative';
              clonedEl.style.borderRadius = '0';
              clonedEl.querySelectorAll('.month-bg-image').forEach(bgDiv => {
                bgDiv.style.borderRadius = '0';
              });
              clonedEl.querySelectorAll('*').forEach(el => {
                if (el.style) {
                  el.style.borderRadius = '0';
                }
              });
              const monthNum = parseInt(clonedEl.dataset.month);
              const monthBg = state.monthBackgrounds[monthNum];
              if (monthBg && monthBg.url && processedImages[monthNum]) {
                const bgDiv = clonedEl.querySelector('.month-bg-image');
                if (bgDiv) {
                  applyBackgroundToExportElement(bgDiv, monthBg, processedImages[monthNum], a4Dims);
                }
              }
            });
          }
        },
        jsPDF: { 
          unit: 'mm', 
          format: 'a4',
          orientation: state.isLandscape ? 'landscape' : 'portrait',
          compress: true
        },
        pagebreak: { mode: ['css', 'legacy'] }
      }).from(exportContainer).save();
      
      document.body.removeChild(exportContainer);
    } catch (error) {
      alert('An error occurred while exporting the calendar: ' + error.message);
    } finally {
      state.isExporting = false;
      window.CalendarDOM.exportBtn.disabled = false;
      window.CalendarDOM.exportBtn.innerHTML = '<span>Xuất file PDF</span>';
      document.body.classList.remove('is-exporting');
    }
  };

  const setupEventListeners = () => {
    const accordionState = loadAccordionState();
    applyAccordionState(accordionState);
    
    if (window.CalendarDOM.saveCustomPaletteBtn) {
      window.CalendarDOM.saveCustomPaletteBtn.addEventListener('click', () => {
        const name = window.CalendarDOM.customPaletteName ? window.CalendarDOM.customPaletteName.value.trim() : '';
        if (!name) {
          alert('Vui lòng nhập tên bảng màu');
          return;
        }
        
        const customPalettes = getCustomPalettes();
        if (customPalettes[name] && !confirm('Bảng màu "' + name + '" đã tồn tại. Ghi đè?')) {
          return;
        }
        
        const palette = {
          dateColor: state.dateColor || '#1F2937',
          otherMonthDateColor: state.otherMonthDateColor || '#6B7280',
          weekdayColor: state.weekdayColor || '#111827',
          lunarDateColor: state.lunarDateColor || '#374151',
          holidayColor: state.holidayColor || '#DC2626',
          borderColor: state.borderColor || '#4B5563'
        };
        
        if (saveCustomPalette(name, palette)) {
          if (window.CalendarDOM.customPaletteName) {
            window.CalendarDOM.customPaletteName.value = '';
          }
          window.CalendarUtils.renderCustomPalettesList();
          
          const paletteSelect = document.querySelector('[data-state="colorPalette"]');
          if (paletteSelect) {
            paletteSelect.value = name;
            applyColorPalette(name);
          }
          
          alert('Đã lưu bảng màu "' + name + '"');
        } else {
          alert('Không thể lưu bảng màu');
        }
      });
    }
    
    if (window.CalendarDOM.customPaletteName) {
      window.CalendarDOM.customPaletteName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && window.CalendarDOM.saveCustomPaletteBtn) {
          window.CalendarDOM.saveCustomPaletteBtn.click();
        }
      });
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
        
        accordionState[panel] = !isActive;
        saveAccordionState(accordionState);
      });
    }

    if (window.CalendarDOM.monthSelect) {
      window.CalendarDOM.monthSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedMonth', parseInt(e.target.value));
        updateBackgroundControls(state.selectedMonth);
      });
    }
    if (window.CalendarDOM.yearSelect) {
      window.CalendarDOM.yearSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedYear', parseInt(e.target.value));
      });
    }
    if (window.CalendarDOM.fontSelect) {
      window.CalendarDOM.fontSelect.addEventListener('change', (e) => {
        updateStateAndRender('selectedFont', e.target.value);
      });
    }
    if (window.CalendarDOM.startOfWeekSelect) {
      window.CalendarDOM.startOfWeekSelect.addEventListener('change', (e) => {
        updateStateAndRender('startOfWeek', parseInt(e.target.value));
      });
    }

    const rangeInputs = document.querySelectorAll('input[type="range"][data-state]');
    for (let i = 0; i < rangeInputs.length; i++) {
      rangeInputs[i].addEventListener('input', (e) => {
        const key = e.target.dataset.state;
        const step = e.target.getAttribute('step');
        const isFloat = step && (parseFloat(step) < 1 || step.includes('.'));
        const value = isFloat ? parseFloat(e.target.value) : parseInt(e.target.value, 10);
        
        if (key.startsWith('bg')) {
          const bgKey = key.replace('bg', '').toLowerCase();
          const actualKey = BG_KEY_MAP[bgKey];
          if (actualKey) {
            if (state.showAllMonths) {
              for (let m = 1; m <= 12; m++) {
                if (state.monthBackgrounds[m]) {
                  state.monthBackgrounds[m][actualKey] = value;
                  if (state.monthBackgrounds[m].url) {
                    window.CalendarStorage.saveBackgroundImage(m, state.monthBackgrounds[m]);
                  }
                }
              }
              window.CalendarRender.applyBackgroundImages();
            } else {
              const month = state.selectedMonth;
              if (!state.monthBackgrounds[month]) {
                initializeBackgroundForMonth(month);
              }
              state.monthBackgrounds[month][actualKey] = value;
              if (state.monthBackgrounds[month].url) {
                window.CalendarStorage.saveBackgroundImage(month, state.monthBackgrounds[month]);
                window.CalendarRender.applyBackgroundImages();
              }
            }
          }
        } else {
          state[key] = value;
        }
        
        const cachedLabels = window.CalendarUtils.cachedLabels;
        const label = cachedLabels.get(key) || document.querySelector(`[data-label="${key}"]`);
        if (label) {
          if (!cachedLabels.has(key)) cachedLabels.set(key, label);
          label.textContent = isFloat ? value.toFixed(2) : value;
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
        if (key === 'writingLinesCount') {
          state.writingLinesCount = parseInt(value) || 3;
          saveState();
          render();
        } else {
          updateStateAndRender(key, value);
        }
      });
    }
    
    const checkboxInputs = document.querySelectorAll('input[type="checkbox"][data-state]');
    for (let i = 0; i < checkboxInputs.length; i++) {
      checkboxInputs[i].addEventListener('change', (e) => {
        const key = e.target.dataset.state;
        if (key === 'isDarkTheme') {
          toggleTheme(e.target.checked);
        } else {
          updateStateAndRender(key, e.target.checked);
        }
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
    
    if (window.CalendarDOM.addCustomHolidayBtn && window.CalendarDOM.customHolidayDate && window.CalendarDOM.customHolidayName) {
      window.CalendarDOM.addCustomHolidayBtn.addEventListener('click', () => {
        const dateInput = window.CalendarDOM.customHolidayDate.value.trim();
        const name = window.CalendarDOM.customHolidayName.value.trim();
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
              window.CalendarDOM.customHolidayName.value = '';
              if (typeof flatpickr !== 'undefined') {
                const fp = window.CalendarDOM.customHolidayDate._flatpickr;
                if (fp) {
                  fp.setDate(new Date());
                }
              } else {
                window.CalendarDOM.customHolidayDate.value = formatDateInput();
              }
            } else {
              alert('Ngày lễ này đã tồn tại');
            }
          } else {
            alert('Vui lòng nhập ngày hợp lệ (dd/MM/yyyy)');
          }
        }
      });
      
      window.CalendarDOM.customHolidayName.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.CalendarDOM.addCustomHolidayBtn.click();
        }
      });
      
      window.CalendarDOM.customHolidayDate.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
          window.CalendarDOM.addCustomHolidayBtn.click();
        }
      });
    }
    
    const removeAllBackgroundsBtn = document.getElementById('remove-all-backgrounds');
    if (removeAllBackgroundsBtn) {
      removeAllBackgroundsBtn.addEventListener('click', async () => {
        await removeAllBackgroundImages();
      });
    }
    
    if (window.CalendarDOM.exportBtn) {
      window.CalendarDOM.exportBtn.addEventListener('click', exportToPDF);
    }
    
    let resizeTimeout = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        render();
      }, 150);
    });
  };

  window.CalendarEvents = {
    setupEventListeners,
    initializeControls,
    updateBackgroundControls,
    applyAccordionState
  };
})();
