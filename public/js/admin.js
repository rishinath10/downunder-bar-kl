document.addEventListener('DOMContentLoaded', () => {
  // --- Admin Security State ---
  let dbState = null; // Holds the local copy of data.json
  const sessionToken = sessionStorage.getItem('adminToken');

  // DOM Elements
  const loginSection = document.getElementById('login-section');
  const dashboardSection = document.getElementById('dashboard-section');
  const loginForm = document.getElementById('admin-login-form');
  const loginErrorMsg = document.getElementById('login-error-msg');
  const btnLogout = document.getElementById('btn-admin-logout');

  // UI Tabs & Views
  const navItems = document.querySelectorAll('.sidebar-nav .nav-item');
  const tabContents = document.querySelectorAll('.tab-content');
  const activeTabTitle = document.getElementById('db-active-tab-title');
  const bookingsCountBadge = document.getElementById('bookings-count-badge');

  // --- Initial Auth Check ---
  if (sessionToken) {
    showDashboard();
  } else {
    showLogin();
  }

  function showLogin() {
    loginSection.classList.remove('hidden');
    dashboardSection.classList.add('hidden');
  }

  function showDashboard() {
    loginSection.classList.add('hidden');
    dashboardSection.classList.remove('hidden');
    fetchDatabase();
  }

  // --- Login Form Submit ---
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    loginErrorMsg.classList.add('hidden');

    const passwordInput = document.getElementById('admin-password');
    const password = passwordInput.value;

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        sessionStorage.setItem('adminToken', data.token);
        passwordInput.value = '';
        showDashboard();
        showToast('Access granted. Welcome to your dashboard!');
      } else {
        throw new Error(data.error || 'Login failed');
      }
    } catch (err) {
      loginErrorMsg.textContent = err.message;
      loginErrorMsg.classList.remove('hidden');
    }
  });

  // --- Logout Trigger ---
  btnLogout.addEventListener('click', () => {
    sessionStorage.removeItem('adminToken');
    showLogin();
    showToast('Successfully logged out.');
  });

  // --- API Handlers ---

  // GET: Fetch Database from Server
  async function fetchDatabase() {
    try {
      const response = await fetch('/api/data');
      if (!response.ok) throw new Error('Failed to retrieve database');
      dbState = await response.json();
      
      // Update badge counts and render active tab content
      updateBadgeCounts();
      renderActiveTab();
    } catch (err) {
      console.error(err);
      showToast('Error loading database: ' + err.message, 'error');
    }
  }

  // POST: Save Database state to Server
  async function saveDatabase() {
    try {
      const response = await fetch('/api/data', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(dbState)
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Failed to save updates');
      }

      showToast('Changes saved successfully!');
      updateBadgeCounts();
      renderActiveTab();
    } catch (err) {
      console.error(err);
      showToast('Save failed: ' + err.message, 'error');
    }
  }

  // Helper: Read file field to Base64 String
  function fileToBase64(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = error => reject(error);
    });
  }

  // POST: Image Uploader
  async function uploadImage(file) {
    try {
      const base64Data = await fileToBase64(file);
      const payload = {
        name: file.name,
        data: base64Data
      };

      const response = await fetch('/api/upload', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${sessionStorage.getItem('adminToken')}`
        },
        body: JSON.stringify(payload)
      });

      const resData = await response.json();
      if (!response.ok || !resData.success) {
        throw new Error(resData.error || 'Image upload failure');
      }

      return resData.url; // Returns server relative path e.g. /uploads/image.png
    } catch (err) {
      showToast('Image upload failed: ' + err.message, 'error');
      throw err;
    }
  }

  // --- Navigation & Tab Rendering ---

  // Sidebar Tab Switching
  navItems.forEach(item => {
    item.addEventListener('click', (e) => {
      e.preventDefault();
      
      // Toggle sidebar active class
      navItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      // Show matching tab content
      const tabId = item.getAttribute('data-tab');
      tabContents.forEach(content => {
        if (content.id === `tab-${tabId}`) {
          content.classList.remove('hidden');
        } else {
          content.classList.add('hidden');
        }
      });

      // Update header title
      activeTabTitle.textContent = item.innerText.slice(2); // Strip icon prefix

      renderActiveTab();
    });
  });

  function updateBadgeCounts() {
    if (!dbState) return;
    const pendingBookings = dbState.bookings ? dbState.bookings.filter(b => b.status === 'Pending').length : 0;
    if (pendingBookings > 0) {
      bookingsCountBadge.textContent = pendingBookings;
      bookingsCountBadge.classList.remove('hidden');
    } else {
      bookingsCountBadge.classList.add('hidden');
    }
  }

  // Route Rendering based on Active Tab
  function renderActiveTab() {
    if (!dbState) return;
    
    const activeItem = document.querySelector('.sidebar-nav .nav-item.active');
    const tabId = activeItem ? activeItem.getAttribute('data-tab') : 'feature';

    switch (tabId) {
      case 'feature':
        loadTonightFeatureForm();
        break;
      case 'tracker':
        renderTrackerTable();
        break;
      case 'promotions':
        renderPromotionsTable();
        break;
      case 'events':
        loadEventsForm();
        break;
      case 'gallery':
        renderGalleryList();
        break;
      case 'bookings':
        renderBookingsTable();
        break;
    }
  }

  // --- Tab 1: Tonight's Feature ---
  const formFeature = document.getElementById('form-feature');
  
  function loadTonightFeatureForm() {
    const feat = dbState.tonight_feature;
    if (!feat) return;

    document.getElementById('feat-home').value = feat.homeTeam || '';
    document.getElementById('feat-away').value = feat.awayTeam || '';
    document.getElementById('feat-home-score').value = feat.homeScore || '0';
    document.getElementById('feat-away-score').value = feat.awayScore || '0';
    document.getElementById('feat-status').value = feat.status || '';
  }

  formFeature.addEventListener('submit', (e) => {
    e.preventDefault();
    dbState.tonight_feature = {
      homeTeam: document.getElementById('feat-home').value.toUpperCase(),
      awayTeam: document.getElementById('feat-away').value.toUpperCase(),
      homeScore: document.getElementById('feat-home-score').value,
      awayScore: document.getElementById('feat-away-score').value,
      status: document.getElementById('feat-status').value
    };
    saveDatabase();
  });

  // --- Tab 2: Stadium Tracker CRUD ---
  const trackerTableBody = document.getElementById('tracker-table-body');
  const btnAddMatch = document.getElementById('btn-add-match');
  const modalMatch = document.getElementById('modal-match');
  const formMatch = document.getElementById('form-match');
  const matchModalClose = document.getElementById('match-modal-close');
  const matchModalTitle = document.getElementById('match-modal-title');

  function renderTrackerTable() {
    const list = dbState.stadium_tracker || [];
    trackerTableBody.innerHTML = '';

    if (list.length === 0) {
      trackerTableBody.innerHTML = '<tr><td colspan="5" class="text-center">No matches scheduled in system.</td></tr>';
      return;
    }

    list.forEach(match => {
      const statusClass = match.status === 'LIVE' ? 'live' : 'upcoming';
      const row = `
        <tr>
          <td><strong>${match.sport}</strong></td>
          <td>${match.match}</td>
          <td>${match.time}</td>
          <td><span class="status-pill ${statusClass}">${match.status}</span></td>
          <td>
            <div class="btn-action-group">
              <button class="btn-edit" onclick="editMatch(${match.id})">Edit</button>
              <button class="btn-delete" onclick="deleteMatch(${match.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
      trackerTableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  // Match Modal controls
  btnAddMatch.addEventListener('click', () => {
    formMatch.reset();
    document.getElementById('match-id').value = '';
    matchModalTitle.textContent = 'Add New Match';
    modalMatch.classList.remove('hidden');
  });

  matchModalClose.addEventListener('click', () => modalMatch.classList.add('hidden'));

  formMatch.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('match-id').value;
    const sport = document.getElementById('match-sport').value;
    const matchName = document.getElementById('match-teams').value;
    const time = document.getElementById('match-time').value;
    const status = document.getElementById('match-status').value;

    if (id) {
      // Edit
      const matchIndex = dbState.stadium_tracker.findIndex(m => m.id == id);
      if (matchIndex > -1) {
        dbState.stadium_tracker[matchIndex] = { id: parseInt(id), sport, match: matchName, time, status };
      }
    } else {
      // Add
      const newId = dbState.stadium_tracker.length > 0 ? Math.max(...dbState.stadium_tracker.map(m => m.id)) + 1 : 1;
      dbState.stadium_tracker.push({ id: newId, sport, match: matchName, time, status });
    }

    saveDatabase();
    modalMatch.classList.add('hidden');
  });

  window.editMatch = (id) => {
    const match = dbState.stadium_tracker.find(m => m.id == id);
    if (!match) return;

    document.getElementById('match-id').value = match.id;
    document.getElementById('match-sport').value = match.sport;
    document.getElementById('match-teams').value = match.match;
    document.getElementById('match-time').value = match.time;
    document.getElementById('match-status').value = match.status;

    matchModalTitle.textContent = 'Edit Match Details';
    modalMatch.classList.remove('hidden');
  };

  window.deleteMatch = (id) => {
    if (!confirm('Are you sure you want to delete this match?')) return;
    dbState.stadium_tracker = dbState.stadium_tracker.filter(m => m.id != id);
    saveDatabase();
  };

  // --- Tab 3: Promotions CRUD ---
  const promotionsTableBody = document.getElementById('promotions-table-body');
  const btnAddPromo = document.getElementById('btn-add-promo');
  const modalPromo = document.getElementById('modal-promo');
  const formPromo = document.getElementById('form-promo');
  const promoModalClose = document.getElementById('promo-modal-close');
  const promoModalTitle = document.getElementById('promo-modal-title');
  const promoCategorySelect = document.getElementById('promo-category');
  const promoImageGroup = document.getElementById('promo-image-group');

  function renderPromotionsTable() {
    const list = dbState.promotions || [];
    promotionsTableBody.innerHTML = '';

    if (list.length === 0) {
      promotionsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No promotions loaded in system.</td></tr>';
      return;
    }

    list.forEach(promo => {
      const imgHTML = promo.image ? `<img src="${promo.image}" alt="${promo.title}">` : '<span style="color:var(--text-muted)">None</span>';
      const featHTML = promo.featured ? '<span style="color:var(--accent-gold)">★ Featured</span>' : '<span style="color:var(--text-muted)">No</span>';
      
      const row = `
        <tr>
          <td>${imgHTML}</td>
          <td><span style="font-size:0.8rem; background:rgba(255,255,255,0.05); padding:3px 6px; border-radius:4px;">${promo.category}</span></td>
          <td><strong>${promo.title}</strong></td>
          <td style="max-width:260px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${promo.description}</td>
          <td><strong style="color:var(--accent-gold)">${promo.price}</strong></td>
          <td>${featHTML}</td>
          <td>
            <div class="btn-action-group">
              <button class="btn-edit" onclick="editPromo(${promo.id})">Edit</button>
              <button class="btn-delete" onclick="deletePromo(${promo.id})">Delete</button>
            </div>
          </td>
        </tr>
      `;
      promotionsTableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  // Manage field displays based on category (Food/Drink)
  promoCategorySelect.addEventListener('change', () => {
    if (promoCategorySelect.value === 'The Tucker') {
      promoImageGroup.style.display = 'block';
    } else {
      promoImageGroup.style.display = 'none';
      document.getElementById('promo-image-file').value = '';
      document.getElementById('promo-preview-wrap').classList.add('hidden');
    }
  });

  // Form image preview load
  document.getElementById('promo-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('promo-img-preview').src = event.target.result;
        document.getElementById('promo-preview-wrap').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  btnAddPromo.addEventListener('click', () => {
    formPromo.reset();
    document.getElementById('promo-id').value = '';
    document.getElementById('promo-preview-wrap').classList.add('hidden');
    promoImageGroup.style.display = 'block'; // defaults to Tucker
    promoModalTitle.textContent = 'Add New Promotion';
    modalPromo.classList.remove('hidden');
  });

  promoModalClose.addEventListener('click', () => modalPromo.classList.add('hidden'));

  formPromo.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const saveBtn = document.getElementById('btn-save-promo');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving details...';

    const id = document.getElementById('promo-id').value;
    const category = document.getElementById('promo-category').value;
    const title = document.getElementById('promo-title').value;
    const price = document.getElementById('promo-price').value;
    const description = document.getElementById('promo-desc').value;
    const featured = document.getElementById('promo-featured').checked;
    
    let imageUrl = '';
    
    // Check existing promo image path if edit
    if (id) {
      const existing = dbState.promotions.find(p => p.id == id);
      if (existing) imageUrl = existing.image || '';
    }

    const imageFile = document.getElementById('promo-image-file').files[0];
    if (imageFile && category === 'The Tucker') {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Promotion';
        return; // uploadImage handles its own errors toast
      }
    }

    if (id) {
      // Edit
      const promoIndex = dbState.promotions.findIndex(p => p.id == id);
      if (promoIndex > -1) {
        dbState.promotions[promoIndex] = { id: parseInt(id), category, title, price, description, image: imageUrl, featured };
      }
    } else {
      // Add
      const newId = dbState.promotions.length > 0 ? Math.max(...dbState.promotions.map(p => p.id)) + 1 : 1;
      dbState.promotions.push({ id: newId, category, title, price, description, image: imageUrl, featured });
    }

    saveDatabase();
    modalPromo.classList.add('hidden');
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Promotion';
  });

  window.editPromo = (id) => {
    const promo = dbState.promotions.find(p => p.id == id);
    if (!promo) return;

    document.getElementById('promo-id').value = promo.id;
    document.getElementById('promo-category').value = promo.category;
    document.getElementById('promo-title').value = promo.title;
    document.getElementById('promo-price').value = promo.price;
    document.getElementById('promo-desc').value = promo.description;
    document.getElementById('promo-featured').checked = promo.featured;

    if (promo.category === 'The Tucker') {
      promoImageGroup.style.display = 'block';
      if (promo.image) {
        document.getElementById('promo-img-preview').src = promo.image;
        document.getElementById('promo-preview-wrap').classList.remove('hidden');
      } else {
        document.getElementById('promo-preview-wrap').classList.add('hidden');
      }
    } else {
      promoImageGroup.style.display = 'none';
      document.getElementById('promo-preview-wrap').classList.add('hidden');
    }

    promoModalTitle.textContent = 'Edit Promotion';
    modalPromo.classList.remove('hidden');
  };

  window.deletePromo = (id) => {
    if (!confirm('Are you sure you want to delete this promotion?')) return;
    dbState.promotions = dbState.promotions.filter(p => p.id != id);
    saveDatabase();
  };

  // --- Tab 4: Events Calendar Uploader ---
  const formEvent = document.getElementById('form-event');

  function loadEventsForm() {
    const event = dbState.events ? dbState.events[0] : null;
    if (!event) return;

    document.getElementById('event-title').value = event.title || '';
    document.getElementById('event-day').value = event.day || '';
    document.getElementById('event-time').value = event.time || '';
    document.getElementById('event-desc').value = event.description || '';
    
    if (event.image) {
      document.getElementById('event-img-preview').src = event.image;
      document.getElementById('event-preview-wrap').classList.remove('hidden');
    } else {
      document.getElementById('event-preview-wrap').classList.add('hidden');
    }
  }

  // Trigger input photo previews
  document.getElementById('event-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('event-img-preview').src = event.target.result;
        document.getElementById('event-preview-wrap').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  formEvent.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = formEvent.querySelector('button[type="submit"]');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Saving details...';

    const title = document.getElementById('event-title').value;
    const day = document.getElementById('event-day').value;
    const time = document.getElementById('event-time').value;
    const description = document.getElementById('event-desc').value;
    
    let imageUrl = dbState.events[0] ? dbState.events[0].image : '';
    const imageFile = document.getElementById('event-image-file').files[0];

    if (imageFile) {
      try {
        imageUrl = await uploadImage(imageFile);
      } catch (err) {
        saveBtn.disabled = false;
        saveBtn.textContent = 'Save Event Settings';
        return;
      }
    }

    dbState.events[0] = {
      id: 1,
      title,
      day,
      time,
      description,
      image: imageUrl,
      ctaText: 'REGISTER TEAM'
    };

    saveDatabase();
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save Event Settings';
    document.getElementById('event-image-file').value = '';
  });

  // --- Tab 5: Gallery Manager CRUD ---
  const adminGalleryList = document.getElementById('admin-gallery-list');
  const btnAddGallery = document.getElementById('btn-add-gallery');
  const modalGallery = document.getElementById('modal-gallery');
  const formGallery = document.getElementById('form-gallery');
  const galleryModalClose = document.getElementById('gallery-modal-close');

  function renderGalleryList() {
    const list = dbState.gallery || [];
    adminGalleryList.innerHTML = '';

    if (list.length === 0) {
      adminGalleryList.innerHTML = '<div class="card-glass" style="grid-column: 1/-1; text-align:center;">No gallery images found.</div>';
      return;
    }

    list.forEach(item => {
      const itemHTML = `
        <div class="admin-gallery-item">
          <div class="admin-gallery-photo-wrap">
            <img src="${item.url}" alt="${item.caption}">
          </div>
          <div class="admin-gallery-details">
            <p class="admin-gallery-caption">${item.caption}</p>
            <button class="btn-delete btn-sm" onclick="deleteGalleryItem(${item.id})">Delete Image</button>
          </div>
        </div>
      `;
      adminGalleryList.insertAdjacentHTML('beforeend', itemHTML);
    });
  }

  document.getElementById('gallery-image-file').addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        document.getElementById('gallery-img-preview').src = event.target.result;
        document.getElementById('gallery-preview-wrap').classList.remove('hidden');
      };
      reader.readAsDataURL(file);
    }
  });

  btnAddGallery.addEventListener('click', () => {
    formGallery.reset();
    document.getElementById('gallery-preview-wrap').classList.add('hidden');
    modalGallery.classList.remove('hidden');
  });

  galleryModalClose.addEventListener('click', () => modalGallery.classList.add('hidden'));

  formGallery.addEventListener('submit', async (e) => {
    e.preventDefault();
    const saveBtn = document.getElementById('btn-save-gallery');
    saveBtn.disabled = true;
    saveBtn.textContent = 'Uploading photo...';

    const caption = document.getElementById('gallery-caption').value;
    const file = document.getElementById('gallery-image-file').files[0];

    if (!file) {
      showToast('Please select an image file', 'error');
      saveBtn.disabled = false;
      saveBtn.textContent = 'Upload to Gallery';
      return;
    }

    try {
      const imageUrl = await uploadImage(file);
      const newId = dbState.gallery.length > 0 ? Math.max(...dbState.gallery.map(g => g.id)) + 1 : 1;
      
      dbState.gallery.push({
        id: newId,
        url: imageUrl,
        caption: caption
      });

      saveDatabase();
      modalGallery.classList.add('hidden');
    } catch (err) {
      // toast is shown by uploadImage
    } finally {
      saveBtn.disabled = false;
      saveBtn.textContent = 'Upload to Gallery';
    }
  });

  window.deleteGalleryItem = (id) => {
    if (!confirm('Are you sure you want to delete this gallery image?')) return;
    dbState.gallery = dbState.gallery.filter(g => g.id != id);
    saveDatabase();
  };

  // --- Tab 6: Guest Bookings Management ---
  const bookingsTableBody = document.getElementById('bookings-table-body');
  const btnClearBookings = document.getElementById('btn-clear-bookings');

  function renderBookingsTable() {
    const list = dbState.bookings || [];
    bookingsTableBody.innerHTML = '';

    if (list.length === 0) {
      bookingsTableBody.innerHTML = '<tr><td colspan="7" class="text-center">No table bookings received yet.</td></tr>';
      return;
    }

    list.forEach(booking => {
      const statusClass = booking.status ? booking.status.toLowerCase() : 'pending';
      const displayId = booking.id.toString().slice(-6); // Last 6 digits
      
      let actionsHTML = '';
      if (booking.status === 'Pending') {
        actionsHTML = `
          <button class="btn-status-confirm" onclick="confirmBooking(${booking.id})">Confirm</button>
          <button class="btn-delete" onclick="cancelBooking(${booking.id})">Cancel</button>
        `;
      } else {
        actionsHTML = `<button class="btn-delete" onclick="deleteBooking(${booking.id})">Delete Log</button>`;
      }

      const row = `
        <tr>
          <td><code>#${displayId}</code></td>
          <td><strong>${booking.name}</strong></td>
          <td>
            <div style="font-size:0.85rem;">📞 ${booking.phone}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary)">✉️ ${booking.email}</div>
          </td>
          <td>
            <div>📅 ${booking.date}</div>
            <div style="font-size:0.8rem; color:var(--text-secondary)">⏰ ${booking.time}</div>
          </td>
          <td><strong>${booking.guests} Guests</strong></td>
          <td><span class="status-pill ${statusClass}">${booking.status}</span></td>
          <td>
            <div class="btn-action-group">
              ${actionsHTML}
            </div>
          </td>
        </tr>
      `;
      bookingsTableBody.insertAdjacentHTML('beforeend', row);
    });
  }

  window.confirmBooking = (id) => {
    const index = dbState.bookings.findIndex(b => b.id == id);
    if (index > -1) {
      dbState.bookings[index].status = 'Confirmed';
      saveDatabase();
    }
  };

  window.cancelBooking = (id) => {
    const index = dbState.bookings.findIndex(b => b.id == id);
    if (index > -1) {
      dbState.bookings[index].status = 'Cancelled';
      saveDatabase();
    }
  };

  window.deleteBooking = (id) => {
    if (!confirm('Remove booking log completely from history?')) return;
    dbState.bookings = dbState.bookings.filter(b => b.id != id);
    saveDatabase();
  };

  btnClearBookings.addEventListener('click', () => {
    if (!confirm('Are you sure you want to delete ALL booking logs? This cannot be undone.')) return;
    dbState.bookings = [];
    saveDatabase();
  });

  // --- Notification Toast Component ---
  const dbToast = document.getElementById('db-toast');
  let toastTimer = null;

  function showToast(message, type = 'success') {
    clearTimeout(toastTimer);
    
    dbToast.textContent = message;
    dbToast.classList.remove('hidden', 'error');
    
    if (type === 'error') {
      dbToast.classList.add('error');
    }

    toastTimer = setTimeout(() => {
      dbToast.classList.add('hidden');
    }, 3500);
  }
});
