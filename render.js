// render.js
(function() {
  'use strict';

  const { WEEKDAY_LABELS_MONDAY, WEEKDAY_LABELS_SUNDAY, DATE_POSITION_CLASSES, getA4Dimensions } = window.CalendarConstants;
  const { state } = window.CalendarState;
  const { getLunarDate, getHolidays, cachedLabels } = window.CalendarUtils;
  const { saveState } = window.CalendarStorage;

  let localRenderTimeout = null;

  const hexToRgba = (hex, alpha) => {
    if (!hex || !hex.startsWith('#')) return 'rgba(243, 244, 246, ' + alpha + ')';
    let r, g, b;
    if (hex.length === 4) {
      r = parseInt(hex[1] + hex[1], 16);
      g = parseInt(hex[2] + hex[2], 16);
      b = parseInt(hex[3] + hex[3], 16);
    } else {
      r = parseInt(hex.slice(1, 3), 16);
      g = parseInt(hex.slice(3, 5), 16);
      b = parseInt(hex.slice(5, 7), 16);
    }
    if (isNaN(r) || isNaN(g) || isNaN(b)) return 'rgba(243, 244, 246, ' + alpha + ')';
    return 'rgba(' + r + ', ' + g + ', ' + b + ', ' + alpha + ')';
  };

  const generateDayCellHTML = (day) => {
    const { date, lunarDay, lunarMonth, holidays, isCurrentMonth } = day;
    const { datePosition, borderWidth, dateSize, dateFontWeight, lunarDateFontSize, holidayFontSize } = state;
    const hasHolidays = holidays && holidays.length > 0;
    const dateColor = isCurrentMonth ? (hasHolidays ? state.holidayColor : state.dateColor) : state.otherMonthDateColor;
    const positionClasses = DATE_POSITION_CLASSES[datePosition] || DATE_POSITION_CLASSES['top-right'];
    
    const dayNum = date.getDate();
    const dayOfWeek = date.getDay();
    let cellStyle = 'border-color: ' + state.borderColor + '; border-right-width: ' + borderWidth + 'px; border-bottom-width: ' + borderWidth + 'px;';
    
    if (state.showWeekendBackground) {
      const isWeekend = dayOfWeek === 6 || dayOfWeek === 0;
      if (isWeekend) {
        if (state.showOtherMonthDates || isCurrentMonth) {
          const weekendColor = state.weekendBackgroundColor || '#F3F4F6';
          cellStyle += ' background-color: ' + hexToRgba(weekendColor, 0.5) + ';';
        }
      }
    }
    
    let html = '<div class="border-r border-b p-1 flex flex-col relative" style="' + cellStyle + '">';
    
    if (hasHolidays && isCurrentMonth) {
      html += '<div class="w-full flex items-start" style="min-height: ' + dateSize + 'px; gap: 4px;">';
      html += '<div class="holiday-section" style="flex: 1 1 auto; min-width: 0;">';
      for (let i = 0; i < holidays.length; i++) {
        const holidayColor = holidays[i].isCustom ? '#6B21A8' : state.holidayColor;
        html += '<p class="holiday-name" style="font-size: ' + holidayFontSize + 'px; color: ' + holidayColor + '; line-height: normal; padding: 0; margin: 0; word-wrap: break-word; overflow-wrap: break-word; white-space: normal; text-align: left;">' + holidays[i].name + '</p>';
      }
      html += '</div>';
      html += '<div class="flex ' + positionClasses + '" style="flex-shrink: 0;"><div class="text-center leading-none"><p style="font-size: ' + dateSize + 'px; font-weight: ' + dateFontWeight + '; color: ' + dateColor + ';">' + dayNum + '</p>';
      if (lunarDay > 0 && lunarMonth > 0) {
        html += '<p style="font-size: ' + lunarDateFontSize + 'px; color: ' + state.lunarDateColor + '; line-height: 1.2;">' + lunarDay + '/' + lunarMonth + '</p>';
      }
      html += '</div></div>';
      html += '</div>';
    } else {
      html += '<div class="w-full flex-1 flex ' + positionClasses + '"><div class="text-center leading-none"><p style="font-size: ' + dateSize + 'px; font-weight: ' + dateFontWeight + '; color: ' + dateColor + ';">' + dayNum + '</p>';
      if (lunarDay > 0 && lunarMonth > 0) {
        html += '<p style="font-size: ' + lunarDateFontSize + 'px; color: ' + state.lunarDateColor + '; line-height: 1.2;">' + lunarDay + '/' + lunarMonth + '</p>';
      }
      html += '</div></div>';
    }
    
    if (state.showWritingLines) {
      let lineCount = parseInt(state.writingLinesCount);
      if (isNaN(lineCount) || lineCount < 2) lineCount = 3;
      const availableHeight = 'calc(100% - 30px)';
      const gapCount = lineCount + 1;
      const gapSizePercent = 100 / gapCount;
      const lineStyle = state.writingLinesStyle || 'dotted-close';
      const showCheckboxes = state.showWritingCheckboxes || false;
      
      const createDottedPattern = (spacing) => {
        const encodedColor = encodeURIComponent(state.borderColor);
        return 'url("data:image/svg+xml,%3Csvg width=\'' + spacing + '\' height=\'2\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Ccircle cx=\'1\' cy=\'1\' r=\'1\' fill=\'' + encodedColor + '\'/%3E%3C/svg%3E")';
      };
      
      let borderStyle = '';
      let extraStyle = '';
      if (lineStyle === 'dotted-close') {
        borderStyle = 'border-top: 1px dotted ' + state.borderColor + ';';
      } else if (lineStyle === 'dotted') {
        borderStyle = 'border-top: none; height: 2px;';
        extraStyle = 'background-image: ' + createDottedPattern(4) + '; background-repeat: repeat-x; background-size: 4px 2px;';
      } else if (lineStyle === 'dotted-medium') {
        borderStyle = 'border-top: none; height: 2px;';
        extraStyle = 'background-image: ' + createDottedPattern(6) + '; background-repeat: repeat-x; background-size: 6px 2px;';
      } else if (lineStyle === 'dotted-sparse') {
        borderStyle = 'border-top: none; height: 2px;';
        extraStyle = 'background-image: ' + createDottedPattern(8) + '; background-repeat: repeat-x; background-size: 8px 2px;';
      } else if (lineStyle === 'dotted-very-sparse') {
        borderStyle = 'border-top: none; height: 2px;';
        extraStyle = 'background-image: ' + createDottedPattern(11) + '; background-repeat: repeat-x; background-size: 11px 2px;';
      } else {
        borderStyle = 'border-top: 1px dotted ' + state.borderColor + ';';
      }
      
      html += '<div class="writing-lines" style="position: absolute; bottom: 0; left: 0; right: 0; top: 30px; padding: 0 2px; pointer-events: none; height: ' + availableHeight + ';">';
      for (let i = 0; i < lineCount; i++) {
        const bottomOffset = gapSizePercent * (i + 1);
        if (showCheckboxes) {
          html += '<div style="position: absolute; bottom: ' + bottomOffset + '%; left: 2px; right: 2px; display: flex; align-items: center; width: calc(100% - 4px);">';
          html += '<input type="checkbox" style="width: 14px; height: 14px; margin-left: 4px; margin-right: 6px; pointer-events: none; flex-shrink: 0;" disabled>';
          html += '<div style="flex: 1; min-height: 2px; ' + borderStyle + extraStyle + '"></div>';
          html += '</div>';
        } else {
          html += '<div style="position: absolute; bottom: ' + bottomOffset + '%; left: 2px; right: 2px; ' + borderStyle + extraStyle + ' width: calc(100% - 4px);"></div>';
        }
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

  const generateNavButtonsHTML = () => {
    if (state.showAllMonths) return '';
    const headerTextColor = state.weekdayColor || state.dateColor || '#374151';
    return '<button class="nav-button prev-month-btn absolute left-0 p-2 rounded-full hover:bg-black/10 transition-colors" style="color: ' + headerTextColor + ';"><svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" /></svg></button><button class="nav-button next-month-btn absolute right-0 p-2 rounded-full hover:bg-black/10 transition-colors" style="color: ' + headerTextColor + ';"><svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" /></svg></button>';
  };

  const calculateCalendarWidth = () => {
    const sidebar = document.querySelector('aside');
    if (!sidebar) {
      const a4Dims = getA4Dimensions(state.isLandscape);
      return a4Dims.width;
    }
    
    const sidebarWidth = window.innerWidth >= 1024 ? 384 : 0;
    const padding = window.innerWidth >= 1024 ? 64 : 32;
    const availableWidth = window.innerWidth - sidebarWidth - padding;
    const a4AspectRatio = state.isLandscape ? 297 / 210 : 210 / 297;
    const maxHeight = window.innerHeight - 32;
    const maxWidthByHeight = maxHeight * a4AspectRatio;
    const width = Math.min(Math.max(200, availableWidth), maxWidthByHeight);
    return Math.max(200, width);
  };

  const generateMonthCalendarHTML = (month, year) => {
    if (typeof dayjs === 'undefined') return '';
    
    const monthNum = parseInt(month);
    const hasBg = !!state.monthBackgrounds[monthNum]?.url;
    const contentBackgroundColor = hasBg ? 'transparent' : state.backgroundColor;
    const containerBackgroundColor = hasBg ? 'transparent' : state.backgroundColor;
    
    const calendarWidth = calculateCalendarWidth();
    const a4AspectRatio = state.isLandscape ? 297 / 210 : 210 / 297;
    return '<div class="calendar-month-export relative shadow-2xl overflow-hidden transition-all duration-300" data-month="' + month + '" style="width: ' + calendarWidth + 'px; aspect-ratio: ' + a4AspectRatio + '; max-width: 100%; background-color: ' + containerBackgroundColor + '; box-sizing: border-box; overflow: hidden; border-radius: 0;">' +
      '<div class="month-bg-image absolute inset-0" style="position: absolute !important; top: 0; left: 0; right: 0; bottom: 0; background: transparent; cursor: ' + (hasBg ? 'move' : 'default') + '; z-index: 1 !important; user-select: none; pointer-events: ' + (hasBg ? 'auto' : 'none') + '; width: 100%; height: 100%; border-radius: 0;"></div>' +
      '<div class="month-bg-overlay absolute inset-0 z-10 pointer-events-none" style="display: none;"></div>' +
      '<div class="relative w-full h-full flex flex-col p-4 sm:p-6" style="z-index: 2; font-family: ' + state.selectedFont + '; background-color: ' + contentBackgroundColor + '; box-sizing: border-box;">' +
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
        }
      }
    }
  };

  const renderAllMonths = () => {
    if (!window.CalendarDOM.calendarsContainer) return;
    const parts = [];
    for (let month = 1; month <= 12; month++) {
      parts.push(generateMonthCalendarHTML(month, state.selectedYear));
    }
    window.CalendarDOM.calendarsContainer.innerHTML = parts.join('');
    applyBackgroundImages();
    if (window.CalendarInteractions) window.CalendarInteractions.setupMonthInteractions();
  };

  const renderSingleMonth = () => {
    if (!window.CalendarDOM.calendarsContainer) return;
    window.CalendarDOM.calendarsContainer.innerHTML = generateMonthCalendarHTML(state.selectedMonth, state.selectedYear);
    applyBackgroundImages();
    if (window.CalendarInteractions) window.CalendarInteractions.setupMonthInteractions();
  };

  const render = () => {
    if (localRenderTimeout) {
      cancelAnimationFrame(localRenderTimeout);
    }
    localRenderTimeout = requestAnimationFrame(() => {
      try {
        if (state.showAllMonths) {
          renderAllMonths();
        } else {
          renderSingleMonth();
        }
      } catch (e) {
      }
      localRenderTimeout = null;
    });
  };

  const renderCustomHolidaysList = () => {
    if (!window.CalendarDOM.customHolidaysList) return;
    if (!state.customHolidays || state.customHolidays.length === 0) {
      window.CalendarDOM.customHolidaysList.innerHTML = '<p class="text-xs text-gray-500 text-center py-2">Chưa có ngày lễ tùy chỉnh</p>';
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
    window.CalendarDOM.customHolidaysList.innerHTML = html;
    
    const deleteButtons = window.CalendarDOM.customHolidaysList.querySelectorAll('.delete-holiday');
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

  window.CalendarRender = {
    render,
    renderAllMonths,
    renderSingleMonth,
    renderCustomHolidaysList,
    applyBackgroundImages,
    generateMonthCalendarHTML
  };
})();
