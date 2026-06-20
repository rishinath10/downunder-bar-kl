document.addEventListener('DOMContentLoaded', () => {
  // --- DOM Elements ---
  
  // Tonight's Feature (Standard Matchday Section)
  const featureHomeTeam = document.getElementById('feature-home-team');
  const featureAwayTeam = document.getElementById('feature-away-team');
  const featureHomeScore = document.getElementById('feature-home-score');
  const featureAwayScore = document.getElementById('feature-away-score');
  const featureMatchStatus = document.getElementById('feature-match-status');

  // Tonight's Feature (Hero Matchday Card)
  const heroHomeTeam = document.getElementById('hero-home-team');
  const heroAwayTeam = document.getElementById('hero-away-team');
  const heroHomeScore = document.getElementById('hero-home-score');
  const heroAwayScore = document.getElementById('hero-away-score');
  const heroMatchStatus = document.getElementById('hero-match-status');
  
  // Stadium Tracker
  const sportsTrackerList = document.getElementById('sports-tracker-list');
  
  // Promotions
  const featuredPromoTitle = document.getElementById('featured-promo-title');
  const featuredPromoDesc = document.getElementById('featured-promo-desc');
  const featuredPromoPrice = document.getElementById('featured-promo-price');
  const featuredPromoImg = document.getElementById('featured-promo-img');
  const brewsTapList = document.getElementById('brews-tap-list');
  const tapFlowCount = document.getElementById('tap-flow-count');
  
  // Events
  const primaryEventTitle = document.getElementById('primary-event-title');
  const primaryEventDay = document.getElementById('primary-event-day');
  const primaryEventTime = document.getElementById('primary-event-time');
  const primaryEventDesc = document.getElementById('primary-event-desc');
  const primaryEventCtaText = document.getElementById('primary-event-cta-text');

  // Gallery
  const galleryGrid = document.getElementById('website-gallery-grid');
  
  // Lightbox
  const lightbox = document.getElementById('gallery-lightbox');
  const lightboxImg = document.getElementById('lightbox-img');
  const lightboxCaption = document.getElementById('lightbox-caption-text');
  const lightboxCloseBtn = document.getElementById('lightbox-close-btn');
  
  // Booking
  const bookingForm = document.getElementById('table-booking-form');
  const bookingResult = document.getElementById('booking-result-message');
  
  // Set tomorrow as default date for booking form
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];
  document.getElementById('booking-date').value = tomorrowStr;
  document.getElementById('booking-time').value = "19:00";

  // --- Fetch and Render Data ---
  async function loadSiteData() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Network response was not ok');
      const data = await response.json();
      
      renderTonightFeature(data.tonight_feature);
      renderStadiumTracker(data.stadium_tracker);
      renderPromotions(data.promotions);
      renderEvents(data.events);
      renderGallery(data.gallery);
      
      // Store and render interactive menu
      menuItems = data.promotions || [];
      renderInteractiveMenu();
    } catch (err) {
      console.error('Error loading data:', err);
      // Keep static HTML fallback or show error on UI
    }
  }

  // Render: Tonight's Feature Matchup
  function renderTonightFeature(feature) {
    if (!feature) return;

    // 1. Standard Matchday Section Scoreboard
    if (featureHomeTeam) featureHomeTeam.textContent = feature.homeTeam || 'HOME';
    if (featureAwayTeam) featureAwayTeam.textContent = feature.awayTeam || 'AWAY';
    if (featureHomeScore) featureHomeScore.textContent = feature.homeScore || '0';
    if (featureAwayScore) featureAwayScore.textContent = feature.awayScore || '0';
    if (featureMatchStatus) {
      featureMatchStatus.textContent = feature.status || "DUBKL MATCH DAY";
      
      // Animate badge color based on status
      if (feature.status && feature.status.toUpperCase().includes('LIVE')) {
        featureMatchStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        featureMatchStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        featureMatchStatus.style.color = '#10b981';
      } else {
        featureMatchStatus.style.backgroundColor = 'rgba(255, 184, 0, 0.12)';
        featureMatchStatus.style.borderColor = 'rgba(255, 184, 0, 0.25)';
        featureMatchStatus.style.color = '#ffb800';
      }
    }

    // 2. Hero Section Scoreboard Card
    if (heroHomeTeam) heroHomeTeam.textContent = feature.homeTeam || 'HOME';
    if (heroAwayTeam) heroAwayTeam.textContent = feature.awayTeam || 'AWAY';
    if (heroHomeScore) heroHomeScore.textContent = feature.homeScore || '0';
    if (heroAwayScore) heroAwayScore.textContent = feature.awayScore || '0';

    // Set emblem initials
    const homeChar = feature.homeTeam ? feature.homeTeam.trim().charAt(0).toUpperCase() : 'H';
    const awayChar = feature.awayTeam ? feature.awayTeam.trim().charAt(0).toUpperCase() : 'A';
    const heroHomeCharElem = document.getElementById('hero-home-char');
    const heroAwayCharElem = document.getElementById('hero-away-char');
    if (heroHomeCharElem) heroHomeCharElem.textContent = homeChar;
    if (heroAwayCharElem) heroAwayCharElem.textContent = awayChar;

    // Toggle live pulse indicator badge
    const heroLivePulse = document.getElementById('hero-live-pulse');
    const isLive = feature.status && feature.status.toUpperCase().includes('LIVE');
    if (heroLivePulse) {
      if (isLive) {
        heroLivePulse.classList.remove('hidden');
      } else {
        heroLivePulse.classList.add('hidden');
      }
    }

    if (heroMatchStatus) {
      heroMatchStatus.textContent = feature.status || "DUBKL MATCH DAY";
      
      // Animate badge color based on status
      if (isLive) {
        heroMatchStatus.style.backgroundColor = 'rgba(16, 185, 129, 0.15)';
        heroMatchStatus.style.borderColor = 'rgba(16, 185, 129, 0.3)';
        heroMatchStatus.style.color = '#10b981';
      } else {
        heroMatchStatus.style.backgroundColor = 'rgba(255, 184, 0, 0.12)';
        heroMatchStatus.style.borderColor = 'rgba(255, 184, 0, 0.25)';
        heroMatchStatus.style.color = '#ffb800';
      }
    }
  }

  // Render: Stadium Tracker Games
  function renderStadiumTracker(trackerList) {
    if (!sportsTrackerList) return;
    if (!trackerList || trackerList.length === 0) {
      sportsTrackerList.innerHTML = '<div class="tracker-item"><span class="teams-playing">No sports events scheduled today.</span></div>';
      return;
    }
    
    sportsTrackerList.innerHTML = '';
    trackerList.forEach(match => {
      const sportEmoji = getSportEmoji(match.sport);
      const statusBadge = match.status === 'LIVE' 
        ? `<span class="live-badge">● LIVE</span>` 
        : `<span class="upcoming-badge">UPCOMING</span>`;
        
      const itemHTML = `
        <div class="tracker-item">
          <div class="tracker-match-info">
            <span class="sport-icon">${sportEmoji}</span>
            <div class="match-details">
              <span class="sport-name">${match.sport}</span>
              <span class="teams-playing">${match.match}</span>
            </div>
          </div>
          <div class="tracker-match-status">
            <span class="match-time">${match.time}</span>
            ${statusBadge}
          </div>
        </div>
      `;
      sportsTrackerList.insertAdjacentHTML('beforeend', itemHTML);
    });
  }

  // Helper to map sports to emojis
  function getSportEmoji(sport) {
    if (!sport) return '🏈';
    const s = sport.toUpperCase();
    if (s.includes('AFL') || s.includes('FOOTBALL') || s.includes('NRL') || s.includes('RUGBY')) return '🏈';
    if (s.includes('EPL') || s.includes('SOCCER') || s.includes('CHAMPIONS')) return '⚽';
    if (s.includes('CRICKET')) return '🏏';
    if (s.includes('F1') || s.includes('RACING')) return '🏎️';
    if (s.includes('TENNIS')) return '🎾';
    if (s.includes('BASKETBALL') || s.includes('NBA')) return '🏀';
    return '🏆';
  }

  // Render: Promotions & On Tap
  function renderPromotions(promos) {
    if (!promos) return;
    
    // 1. Render Featured Food Promo ("The Tucker")
    const featuredFood = promos.find(p => p.category === 'The Tucker' && p.featured) || promos.find(p => p.category === 'The Tucker');
    if (featuredFood) {
      featuredPromoTitle.textContent = featuredFood.title.toUpperCase();
      featuredPromoDesc.textContent = featuredFood.description;
      featuredPromoPrice.textContent = featuredFood.price;
      if (featuredFood.image) {
        featuredPromoImg.src = featuredFood.image;
        featuredPromoImg.alt = featuredFood.title;
      }
    }
    
    // 2. Render On Tap ("Cold Brews")
    const coldBrews = promos.filter(p => p.category === 'Cold Brews');
    if (coldBrews.length > 0) {
      brewsTapList.innerHTML = '';
      coldBrews.forEach(beer => {
        const itemHTML = `
          <div class="tap-beer-item">
            <span class="tap-beer-name">${beer.title}</span>
            <span class="tap-beer-price">${beer.price}</span>
          </div>
        `;
        brewsTapList.insertAdjacentHTML('beforeend', itemHTML);
      });
      // Update count of taps flowing based on number of craft beers
      tapFlowCount.textContent = `${coldBrews.length + 8} TAPS FLOWING`; // base of 8 standard taps
    }
  }

  // Render: Primary Event Card
  function renderEvents(eventList) {
    if (!eventList || eventList.length === 0) return;
    
    // Render the primary (first) event
    const event = eventList[0];
    if (primaryEventTitle) primaryEventTitle.textContent = event.title.toUpperCase();
    if (primaryEventDay) primaryEventDay.textContent = event.day;
    if (primaryEventTime) primaryEventTime.textContent = event.time;
    if (primaryEventDesc) primaryEventDesc.textContent = event.description;
    if (event.ctaText && primaryEventCtaText) {
      primaryEventCtaText.textContent = event.ctaText;
    }
  }

  // Render: Gallery
  function renderGallery(galleryList) {
    if (!galleryList || galleryList.length === 0) {
      galleryGrid.innerHTML = '<div class="gallery-item-placeholder">No photos uploaded yet.</div>';
      return;
    }

    galleryGrid.innerHTML = '';
    galleryList.forEach(item => {
      const itemHTML = `
        <div class="gallery-item" data-src="${item.url}" data-caption="${item.caption}">
          <img src="${item.url}" alt="${item.caption}" class="gallery-photo" loading="lazy">
          <div class="gallery-overlay">
            <span class="gallery-caption">${item.caption}</span>
          </div>
        </div>
      `;
      galleryGrid.insertAdjacentHTML('beforeend', itemHTML);
    });

    // Add click listeners to gallery items for lightbox
    document.querySelectorAll('.gallery-item').forEach(elem => {
      elem.addEventListener('click', () => {
        const src = elem.getAttribute('data-src');
        const caption = elem.getAttribute('data-caption');
        openLightbox(src, caption);
      });
    });
  }

  // --- Lightbox Functions ---
  function openLightbox(src, caption) {
    lightboxImg.src = src;
    lightboxCaption.textContent = caption || '';
    lightbox.classList.remove('hidden');
    document.body.style.overflow = 'hidden'; // Stop page scrolling
  }

  function closeLightbox() {
    lightbox.classList.add('hidden');
    lightboxImg.src = '';
    document.body.style.overflow = ''; // Resume scrolling
  }

  lightboxCloseBtn.addEventListener('click', closeLightbox);
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  
  // Close lightbox on Escape key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !lightbox.classList.contains('hidden')) {
      closeLightbox();
    }
  });

  // --- Table Booking Handling ---
  if (bookingForm) {
    bookingForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      
      const submitBtn = document.getElementById('btn-submit-booking');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Submitting reservation...';
      
      const name = document.getElementById('guest-name').value;
      const email = document.getElementById('guest-email').value;
      const phone = document.getElementById('guest-phone').value;
      const date = document.getElementById('booking-date').value;
      const time = document.getElementById('booking-time').value;
      const guests = document.getElementById('booking-guests').value;
      
      const payload = { name, email, phone, date, time, guests };
      
      try {
        const response = await fetch('/api/booking', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        
        const resData = await response.json();
        
        bookingResult.classList.remove('hidden', 'success', 'error');
        if (response.ok && resData.success) {
          bookingResult.classList.add('success');
          bookingResult.innerHTML = `<strong>Success!</strong> Table reserved for ${guests} guests on ${date} at ${time}. Your booking ID is: <strong>#${resData.bookingId.toString().slice(-6)}</strong>.`;
          bookingForm.reset();
          // Reset default values
          document.getElementById('booking-date').value = tomorrowStr;
          document.getElementById('booking-time').value = "19:00";
        } else {
          throw new Error(resData.error || 'Failed to submit reservation');
        }
      } catch (err) {
        bookingResult.classList.add('error');
        bookingResult.innerHTML = `<strong>Booking Failed:</strong> ${err.message}. Please call us directly at +60 17-670 9076.`;
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Submit Reservation Request';
      }
    });
  }



  // --- Floating Nav Active State Tracker ---
  function initActiveNavTracker() {
    const navItems = document.querySelectorAll('.floating-bottom-nav .nav-item');
    const sections = document.querySelectorAll('section[id]');

    function updateActiveNav() {
      let currentSectionId = '';
      
      sections.forEach(section => {
        const rect = section.getBoundingClientRect();
        if (rect.top <= 160 && rect.bottom >= 160) {
          currentSectionId = section.getAttribute('id');
        }
      });

      if (window.scrollY === 0) {
        currentSectionId = 'home';
      }
      
      if ((window.innerHeight + window.scrollY) >= document.documentElement.scrollHeight - 60) {
        if (sections.length > 0) {
          currentSectionId = sections[sections.length - 1].getAttribute('id');
        }
      }

      navItems.forEach(item => {
        item.classList.remove('active');
        const href = item.getAttribute('href');
        if (href === `#${currentSectionId}`) {
          item.classList.add('active');
        }
      });
    }

    window.addEventListener('scroll', updateActiveNav);
    window.addEventListener('hashchange', updateActiveNav);
    updateActiveNav();
  }

  // --- Interactive Menu Controller ---
  let menuItems = [];
  let currentMenuCategory = 'food'; // 'food' or 'drinks'
  let menuSearchQuery = '';

  function initInteractiveMenuControls() {
    const tabButtons = document.querySelectorAll('.menu-tab-btn');
    const searchInput = document.getElementById('menu-search-input');
    const clearSearchBtn = document.getElementById('btn-clear-menu-search');

    tabButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        tabButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        
        currentMenuCategory = btn.getAttribute('data-menu-category');
        
        // Toggle active view container
        document.querySelectorAll('.menu-view').forEach(view => {
          view.classList.remove('active');
        });
        
        const activeView = document.getElementById(`menu-view-${currentMenuCategory}`);
        if (activeView) {
          activeView.classList.add('active');
        }
        
        renderInteractiveMenu();
      });
    });

    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        menuSearchQuery = e.target.value.toLowerCase().trim();
        
        if (menuSearchQuery.length > 0) {
          clearSearchBtn.classList.remove('hidden');
        } else {
          clearSearchBtn.classList.add('hidden');
        }
        
        renderInteractiveMenu();
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        menuSearchQuery = '';
        clearSearchBtn.classList.add('hidden');
        renderInteractiveMenu();
      });
    }
  }

  function renderInteractiveMenu() {
    // Filter items by search query (across title, description, or category)
    const filteredItems = menuItems.filter(item => {
      const matchSearch = !menuSearchQuery || 
        (item.title && item.title.toLowerCase().includes(menuSearchQuery)) ||
        (item.description && item.description.toLowerCase().includes(menuSearchQuery)) ||
        (item.category && item.category.toLowerCase().includes(menuSearchQuery));
      return matchSearch;
    });

    if (currentMenuCategory === 'food') {
      const foodGrid = document.getElementById('food-menu-grid');
      if (!foodGrid) return;
      
      const foodItems = filteredItems.filter(item => item.category === 'The Tucker');
      foodGrid.innerHTML = '';
      
      if (foodItems.length === 0) {
        foodGrid.innerHTML = `<div class="menu-empty">No food items matched "${menuSearchQuery}"</div>`;
        return;
      }
      
      foodItems.forEach(item => {
        const hasImage = item.image && item.image.trim() !== '';
        const imgHTML = hasImage 
          ? `<div class="menu-item-img-wrap">
               <img src="${item.image}" alt="${item.title}" class="menu-item-img" loading="lazy">
             </div>`
          : '';
          
        const cardHTML = `
          <div class="menu-item-card">
            ${imgHTML}
            <div class="menu-item-main">
              <div class="menu-item-header">
                <h4 class="menu-item-name">${item.title}</h4>
                <span class="menu-item-price">${item.price}</span>
              </div>
              <p class="menu-item-desc">${item.description}</p>
            </div>
          </div>
        `;
        foodGrid.insertAdjacentHTML('beforeend', cardHTML);
      });
      
    } else if (currentMenuCategory === 'drinks') {
      const tapGrid = document.getElementById('drinks-tap-grid');
      const cocktailGrid = document.getElementById('drinks-cocktail-grid');
      const wineGrid = document.getElementById('drinks-wine-grid');
      
      const tapItems = filteredItems.filter(item => item.category === 'Cold Brews');
      const cocktailItems = filteredItems.filter(item => item.category === 'Cocktails');
      const wineItems = filteredItems.filter(item => item.category === 'Wines');
      
      const renderGrid = (grid, items, subName) => {
        if (!grid) return;
        grid.innerHTML = '';
        
        const sectionEl = grid.closest('.drinks-subcategory-section');
        if (items.length === 0) {
          if (menuSearchQuery) {
            grid.innerHTML = `<div class="menu-empty">No ${subName} matched "${menuSearchQuery}"</div>`;
            if (sectionEl) sectionEl.style.display = 'flex';
          } else {
            if (sectionEl) sectionEl.style.display = 'none';
          }
          return;
        }
        
        if (sectionEl) sectionEl.style.display = 'flex';
        
        items.forEach(item => {
          const cardHTML = `
            <div class="menu-item-card">
              <div class="menu-item-main">
                <div class="menu-item-header">
                  <h4 class="menu-item-name">${item.title}</h4>
                  <span class="menu-item-price">${item.price}</span>
                </div>
                <p class="menu-item-desc">${item.description}</p>
              </div>
            </div>
          `;
          grid.insertAdjacentHTML('beforeend', cardHTML);
        });
      };
      
      renderGrid(tapGrid, tapItems, 'brews');
      renderGrid(cocktailGrid, cocktailItems, 'cocktails');
      renderGrid(wineGrid, wineItems, 'wines');
      
      // If all drink categories are hidden, show empty state
      const drinksView = document.getElementById('menu-view-drinks');
      const visibleSections = drinksView.querySelectorAll('.drinks-subcategory-section[style*="display: flex"]');
      if (visibleSections.length === 0 && menuSearchQuery) {
        const tapSec = tapGrid.closest('.drinks-subcategory-section');
        if (tapSec) {
          tapSec.style.display = 'flex';
          tapGrid.innerHTML = `<div class="menu-empty">No drinks matched "${menuSearchQuery}"</div>`;
        }
      }
    }
  }

  // --- Special Poster Promos Carousel ---
  function initPromoCarousel() {
    const slides = document.querySelectorAll('.promo-carousel-slide');
    const dots = document.querySelectorAll('.promo-carousel-dots .dot');
    const prevBtn = document.getElementById('promo-prev-btn');
    const nextBtn = document.getElementById('promo-next-btn');
    
    if (slides.length === 0) return;
    
    let currentIndex = 0;
    let autoplayTimer = null;
    
    function updateCarousel() {
      slides.forEach((slide, idx) => {
        slide.classList.remove('active', 'prev', 'next', 'hidden-left', 'hidden-right');
        
        if (idx === currentIndex) {
          slide.classList.add('active');
        } else if (idx === (currentIndex - 1 + slides.length) % slides.length) {
          slide.classList.add('prev');
        } else if (idx === (currentIndex + 1) % slides.length) {
          slide.classList.add('next');
        } else {
          slide.classList.add('hidden-right');
        }
      });
      
      // Update dots
      dots.forEach((dot, idx) => {
        dot.classList.toggle('active', idx === currentIndex);
      });
    }
    
    function showNext() {
      currentIndex = (currentIndex + 1) % slides.length;
      updateCarousel();
    }
    
    function showPrev() {
      currentIndex = (currentIndex - 1 + slides.length) % slides.length;
      updateCarousel();
    }
    
    function startAutoplay() {
      stopAutoplay();
      autoplayTimer = setInterval(showNext, 4500); // 4.5 seconds autoplay
    }
    
    function stopAutoplay() {
      if (autoplayTimer) {
        clearInterval(autoplayTimer);
        autoplayTimer = null;
      }
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showPrev();
        startAutoplay(); // Reset autoplay
      });
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', (e) => {
        e.preventDefault();
        showNext();
        startAutoplay(); // Reset autoplay
      });
    }
    
    dots.forEach((dot, idx) => {
      dot.addEventListener('click', (e) => {
        e.preventDefault();
        currentIndex = idx;
        updateCarousel();
        startAutoplay(); // Reset autoplay
      });
    });
    
    // Pause on hover
    const wrapper = document.querySelector('.promo-carousel-wrapper');
    if (wrapper) {
      wrapper.addEventListener('mouseenter', stopAutoplay);
      wrapper.addEventListener('mouseleave', startAutoplay);
    }
    
    updateCarousel();
    startAutoplay();
  }

  // --- Initialize App ---
  initInteractiveMenuControls();
  loadSiteData();
  initActiveNavTracker();
  initPromoCarousel();
  initHeroSlider();

  // --- FIFA matches search and lightbox ---
  const fifaSearchInput = document.getElementById('fifa-table-search');
  if (fifaSearchInput) {
    fifaSearchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase().trim();
      const rows = document.querySelectorAll('.fixture-row');
      rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        if (text.includes(query)) {
          row.style.display = '';
        } else {
          row.style.display = 'none';
        }
      });
    });
  }

  const fifaFlyerTrigger = document.getElementById('fifa-flyer-trigger');
  if (fifaFlyerTrigger) {
    fifaFlyerTrigger.addEventListener('click', () => {
      openLightbox('/images/fifa_schedule.jpg', 'DUBKL FIFA World Cup 2026 Fixtures Schedule');
    });
  }

  // --- Hero Slider Banner ---
  function initHeroSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.hero-slider-dots .dot');
    const prevBtn = document.getElementById('hero-prev-btn');
    const nextBtn = document.getElementById('hero-next-btn');
    
    if (slides.length === 0) return;
    
    let currentSlide = 0;
    let autoplayInterval = null;
    
    function showSlide(idx) {
      if (idx >= slides.length) currentSlide = 0;
      else if (idx < 0) currentSlide = slides.length - 1;
      else currentSlide = idx;
      
      slides.forEach((slide, sIdx) => {
        if (sIdx === currentSlide) {
          slide.classList.add('active');
        } else {
          slide.classList.remove('active');
        }
      });
      
      dots.forEach((dot, dIdx) => {
        if (dIdx === currentSlide) {
          dot.classList.add('active');
        } else {
          dot.classList.remove('active');
        }
      });
    }
    
    function nextSlide() {
      showSlide(currentSlide + 1);
    }
    
    function prevSlide() {
      showSlide(currentSlide - 1);
    }
    
    function startAutoplay() {
      stopAutoplay();
      autoplayInterval = setInterval(nextSlide, 5000); // 5 seconds autoplay
    }
    
    function stopAutoplay() {
      if (autoplayInterval) {
        clearInterval(autoplayInterval);
        autoplayInterval = null;
      }
    }
    
    if (nextBtn) {
      nextBtn.addEventListener('click', () => {
        nextSlide();
        startAutoplay();
      });
    }
    
    if (prevBtn) {
      prevBtn.addEventListener('click', () => {
        prevSlide();
        startAutoplay();
      });
    }
    
    dots.forEach((dot, dIdx) => {
      dot.addEventListener('click', () => {
        showSlide(dIdx);
        startAutoplay();
      });
    });
    
    const sliderWrapper = document.querySelector('.hero-slider-wrapper');
    if (sliderWrapper) {
      sliderWrapper.addEventListener('mouseenter', stopAutoplay);
      sliderWrapper.addEventListener('mouseleave', startAutoplay);
    }
    
    showSlide(0);
    startAutoplay();
  }
});
