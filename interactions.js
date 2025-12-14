// interactions.js
(function() {
  'use strict';

  const { state } = window.CalendarState;
  const { dragState, shiftPressedMonths, cachedMonthElements, throttle, initializeBackgroundForMonth } = window.CalendarUtils;
  const { saveBackgroundImage, deleteBackgroundImage } = window.CalendarStorage;
  const { render } = window.CalendarRender;

  const getMonthElements = () => {
    if (!window.CalendarUtils.cachedMonthElements) {
      window.CalendarUtils.cachedMonthElements = Array.from(document.querySelectorAll('.calendar-month-export'));
    }
    return window.CalendarUtils.cachedMonthElements;
  };

  const navigateMonth = (direction) => {
    if (typeof dayjs === 'undefined') return;
    const date = dayjs(`${state.selectedYear}-${String(state.selectedMonth).padStart(2, '0')}-01`)[direction === 'prev' ? 'subtract' : 'add'](1, 'month');
    state.selectedMonth = date.month() + 1;
    state.selectedYear = date.year();
    if (window.CalendarDOM.monthSelect) window.CalendarDOM.monthSelect.value = state.selectedMonth;
    if (window.CalendarDOM.yearSelect) window.CalendarDOM.yearSelect.value = state.selectedYear;
    if (window.CalendarEvents && window.CalendarEvents.updateBackgroundControls) {
      window.CalendarEvents.updateBackgroundControls(state.selectedMonth);
    }
    window.CalendarStorage.saveState();
    render();
  };

  const handleImageUpload = (monthNum, file) => {
    if (!file || !file.type.startsWith('image/')) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      initializeBackgroundForMonth(monthNum);
      state.monthBackgrounds[monthNum].url = ev.target.result;
      saveBackgroundImage(monthNum, state.monthBackgrounds[monthNum]);
      if (window.CalendarEvents && window.CalendarEvents.updateBackgroundControls) {
        window.CalendarEvents.updateBackgroundControls(monthNum);
      }
      render();
    };
    reader.readAsDataURL(file);
  };

  const setupMonthInteractions = () => {
    if (!window.CalendarUtils) window.CalendarUtils = {};
    window.CalendarUtils.cachedMonthElements = Array.from(document.querySelectorAll('.calendar-month-export'));
    
    if (!state.showAllMonths) {
      const prevBtn = document.querySelector('.prev-month-btn');
      const nextBtn = document.querySelector('.next-month-btn');
      
      if (prevBtn && !prevBtn.dataset.listenerAdded) {
        prevBtn.dataset.listenerAdded = 'true';
        prevBtn.addEventListener('click', () => navigateMonth('prev'));
      }
      
      if (nextBtn && !nextBtn.dataset.listenerAdded) {
        nextBtn.dataset.listenerAdded = 'true';
        nextBtn.addEventListener('click', () => navigateMonth('next'));
      }
    }
    
    for (let i = 0; i < window.CalendarUtils.cachedMonthElements.length; i++) {
      const monthEl = window.CalendarUtils.cachedMonthElements[i];
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
        if (files.length > 0) {
          handleImageUpload(parseInt(month), files[0]);
        }
      });
      
      monthEl.addEventListener('click', (e) => {
        if (e.target === monthEl || e.target === bgDiv || e.target.closest('.month-bg-image')) {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = (ev) => {
            const file = ev.target.files[0];
            if (file) {
              handleImageUpload(parseInt(month), file);
            }
          };
          input.click();
        }
      });
      
      overlay.addEventListener('mousedown', (e) => {
        if (e.button === 0 && e.shiftKey) {
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
        }
      });
      
      bgDiv.addEventListener('mousedown', (e) => {
        if (e.button === 0 && e.shiftKey) {
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
        if (!bg?.url) return;
        if (dragState.isDragging) return;
        if (!e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation();
        
        if (!bg.zoom) bg.zoom = 100;
        const currentZoom = bg.zoom;
        const zoomFactor = 1.15;
        const minZoom = 10;
        const maxZoom = 500;
        
        const deltaY = e.deltaY;
        const deltaX = e.deltaX;
        
        let delta = deltaY;
        if (Math.abs(deltaY) < 0.0001 && Math.abs(deltaX) > 0.0001) {
          delta = deltaX;
        }
        
        if (Math.abs(delta) < 0.0001) {
          return;
        }
        
        let newZoom;
        if (delta < 0) {
          newZoom = currentZoom * zoomFactor;
        } else {
          newZoom = currentZoom / zoomFactor;
        }
        
        newZoom = Math.max(minZoom, Math.min(maxZoom, newZoom));
        bg.zoom = newZoom;
        
        const currentBgDiv = monthEl.querySelector('.month-bg-image');
        if (currentBgDiv) {
          currentBgDiv.style.backgroundSize = `${bg.zoom}%`;
        }
        saveBackgroundImage(monthNum, bg);
      }, { passive: false });
      
      monthEl.addEventListener('mousedown', (e) => {
        if (e.button === 0 && e.shiftKey) {
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
            window.CalendarStorage.deleteBackgroundImage(monthNum);
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

  window.CalendarInteractions = {
    getMonthElements,
    setupMonthInteractions,
    navigateMonth,
    handleImageUpload
  };
})();
