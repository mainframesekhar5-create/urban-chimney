document.addEventListener('DOMContentLoaded', () => {
  const AUTH_KEYS = {
    active: 'urbanChimneyAuth',
    loginTime: 'urbanChimneyLoginTime',
    sessionExpiry: 'urbanChimneySessionExpiry',
    ownerActive: 'urbanChimneyOwnerAuth',
    ownerLoginTime: 'urbanChimneyOwnerLoginTime',
    ownerSessionExpiry: 'urbanChimneyOwnerSessionExpiry',
    mobile: 'customerMobile',
    name: 'customerName',
    city: 'customerCity',
    bookingHistory: 'bookingHistory',
    bookingId: 'bookingId',
    selectedService: 'selectedService',
    address: 'address',
    date: 'date',
    time: 'time',
    location: 'location',
    paymentMethod: 'paymentMethod',
    paymentStatus: 'paymentStatus',
    bookingStatus: 'bookingStatus',
    bookingAmount: 'bookingAmount',
    bookingPriceLabel: 'bookingPriceLabel',
    customerEmail: 'customerEmail',
    bookingTime: 'bookingTime'
  };

  const SESSION_DURATION_MS = 30 * 60 * 1000;
  const DEMO_OTP = '123456';
  const OWNER_MOBILE = '9701434006';
  const OWNER_CONTACT = {
    mobile: '+91 90000 12345',
    email: 'KRS.MF66@gmail.com'
  };

  let adminSearchQuery = '';
  let adminFilterType = 'today';

  const clearCustomerSession = () => {
    [AUTH_KEYS.active, AUTH_KEYS.loginTime, AUTH_KEYS.sessionExpiry, AUTH_KEYS.mobile, AUTH_KEYS.name, AUTH_KEYS.city].forEach((key) => localStorage.removeItem(key));
  };

  const clearOwnerSession = () => {
    [AUTH_KEYS.ownerActive, AUTH_KEYS.ownerLoginTime, AUTH_KEYS.ownerSessionExpiry].forEach((key) => localStorage.removeItem(key));
  };

  const saveAuthSession = (mobile) => {
    localStorage.setItem(AUTH_KEYS.active, 'active');
    localStorage.setItem(AUTH_KEYS.mobile, mobile);
    localStorage.setItem(AUTH_KEYS.loginTime, String(Date.now()));
    localStorage.setItem(AUTH_KEYS.sessionExpiry, String(Date.now() + SESSION_DURATION_MS));
    localStorage.setItem(AUTH_KEYS.name, localStorage.getItem(AUTH_KEYS.name) || 'Guest');
    localStorage.setItem(AUTH_KEYS.city, localStorage.getItem(AUTH_KEYS.city) || 'Not provided');
  };

  const saveOwnerSession = () => {
    localStorage.setItem(AUTH_KEYS.ownerActive, 'active');
    localStorage.setItem(AUTH_KEYS.ownerLoginTime, String(Date.now()));
    localStorage.setItem(AUTH_KEYS.ownerSessionExpiry, String(Date.now() + SESSION_DURATION_MS));
  };

  const isSessionValid = () => {
    const expiry = Number(localStorage.getItem(AUTH_KEYS.sessionExpiry) || 0);
    const isActive = localStorage.getItem(AUTH_KEYS.active) === 'active';
    return isActive && expiry > Date.now();
  };

  const isOwnerSessionValid = () => {
    const expiry = Number(localStorage.getItem(AUTH_KEYS.ownerSessionExpiry) || 0);
    const isActive = localStorage.getItem(AUTH_KEYS.ownerActive) === 'active';
    return isActive && expiry > Date.now();
  };

  const redirectBasedOnSession = () => {
    if (currentPage === 'index.html') {
      if (isOwnerSessionValid()) {
        window.location.replace('admin.html');
        return;
      }
      if (isSessionValid()) {
        window.location.replace('home.html');
      }
      return;
    }

    if (currentPage === 'admin.html') {
      if (isOwnerSessionValid()) return;
      if (isSessionValid()) {
        window.location.replace('home.html');
        return;
      }
      clearOwnerSession();
      clearCustomerSession();
      window.location.replace('index.html');
      return;
    }

    if (protectedPages.includes(currentPage)) {
      if (isOwnerSessionValid()) {
        window.location.replace('admin.html');
        return;
      }
      if (!isSessionValid()) {
        clearCustomerSession();
        window.location.replace('index.html');
      }
    }
  };

  const checkSession = () => {
    if (currentPage === 'admin.html') {
      if (!isOwnerSessionValid()) {
        if (isSessionValid()) {
          window.location.replace('home.html');
          return true;
        }
        clearOwnerSession();
        clearCustomerSession();
        window.location.replace('index.html');
        return true;
      }
      return false;
    }

    if (protectedPages.includes(currentPage)) {
      if (isOwnerSessionValid()) {
        window.location.replace('admin.html');
        return true;
      }
      if (!isSessionValid()) {
        clearCustomerSession();
        window.location.replace('index.html');
        return true;
      }
    }
    return false;
  };
  const protectedPages = ['home.html', 'booking.html', 'payment.html', 'profile.html', 'track.html', 'success.html', 'services.html', 'spare-parts.html', 'admin.html', 'settings.html', 'bookings.html'];
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const body = document.body;
  const loginForm = document.getElementById('loginForm');
  const bookingForm = document.getElementById('bookingForm');
  const locationButton = document.getElementById('locationButton');
  const locationField = document.getElementById('location');
  const mobileInput = document.getElementById('mobile');
  const otpInput = document.getElementById('otp');
  const sendOtpButton = document.getElementById('sendOtpButton');
  const verifyOtpButton = document.getElementById('verifyOtpButton');
  const formMessage = document.getElementById('formMessage');
  const otpStep = document.getElementById('otpStep');
  const verifyStep = document.getElementById('verifyStep');

  const toggleOtpFields = (visible) => {
    if (otpStep) otpStep.hidden = !visible;
    if (verifyStep) verifyStep.hidden = !visible;
  };

  const showToast = (message, type = 'info') => {
    const stack = document.getElementById('toastStack');
    if (!stack) return;
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;
    stack.appendChild(toast);
    window.setTimeout(() => toast.classList.add('show'), 10);
    window.setTimeout(() => {
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 220);
    }, 3200);
  };

  const setFormMessage = (message, type) => {
    if (!formMessage) return;
    formMessage.textContent = message;
    formMessage.className = `form-message ${type}`;
  };

  const isOwnerMobile = (mobile) => mobile === OWNER_MOBILE;

  const showLoading = (message = 'Working on it...') => {
    let overlay = document.getElementById('loadingOverlay');
    if (!overlay) {
      overlay = document.createElement('div');
      overlay.id = 'loadingOverlay';
      overlay.className = 'loading-overlay';
      overlay.innerHTML = '<div class="loading-card"><div class="spinner"></div><p></p></div>';
      document.body.appendChild(overlay);
    }
    overlay.querySelector('p').textContent = message;
    overlay.classList.add('active');
  };

  const hideLoading = () => {
    const overlay = document.getElementById('loadingOverlay');
    if (overlay) {
      overlay.classList.remove('active');
    }
  };

  const clearAuthState = () => {
    [AUTH_KEYS.active, AUTH_KEYS.loginTime, AUTH_KEYS.sessionExpiry, AUTH_KEYS.ownerActive, AUTH_KEYS.ownerLoginTime, AUTH_KEYS.ownerSessionExpiry, AUTH_KEYS.mobile, AUTH_KEYS.name, AUTH_KEYS.city, AUTH_KEYS.bookingId, AUTH_KEYS.selectedService, AUTH_KEYS.address, AUTH_KEYS.date, AUTH_KEYS.time, AUTH_KEYS.location, AUTH_KEYS.paymentMethod, AUTH_KEYS.paymentStatus, AUTH_KEYS.bookingAmount, AUTH_KEYS.bookingPriceLabel, AUTH_KEYS.customerEmail, AUTH_KEYS.bookingTime].forEach((key) => localStorage.removeItem(key));
  };

  const requestOtp = async (mobile) => new Promise((resolve) => {
    window.setTimeout(() => resolve({ ok: true, message: `Demo OTP sent to +91 ${mobile}. Use ${DEMO_OTP} to continue.` }), 250);
  });

  const verifyOtp = async (otp) => new Promise((resolve) => {
    window.setTimeout(() => resolve(otp === DEMO_OTP), 250);
  });

  const startResendCountdown = (button, seconds = 30) => {
    if (!button) return;
    let remaining = seconds;
    button.disabled = true;
    button.textContent = `Resend OTP (${remaining}s)`;

    const countdown = window.setInterval(() => {
      remaining -= 1;
      if (remaining > 0) {
        button.textContent = `Resend OTP (${remaining}s)`;
      } else {
        window.clearInterval(countdown);
        button.disabled = false;
        button.textContent = 'Resend OTP';
      }
    }, 1000);
  };

  const getBookingHistory = () => {
    try {
      return JSON.parse(localStorage.getItem(AUTH_KEYS.bookingHistory) || '[]');
    } catch (error) {
      return [];
    }
  };

  const notifyBookingHistoryChanged = () => {
    if (typeof window !== 'undefined' && typeof window.dispatchEvent === 'function') {
      try {
        window.dispatchEvent(new CustomEvent('urbanChimneyBookingsChanged'));
      } catch (error) {
        // Ignore custom event issues in older environments.
      }
    }
  };

  const saveBookingHistory = (booking) => {
    const history = getBookingHistory();
    history.unshift(booking);
    localStorage.setItem(AUTH_KEYS.bookingHistory, JSON.stringify(history));
    notifyBookingHistoryChanged();
  };

  const formatLocalDate = (dateString) => {
    const date = new Date(dateString);
    if (Number.isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  };

  const isSameDay = (dateA, dateB) => {
    const a = new Date(dateA);
    const b = new Date(dateB);
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  };

  const isBookingToday = (booking) => {
    if (booking.createdAt) {
      return isSameDay(booking.createdAt, new Date());
    }
    return isSameDay(booking.bookingTime, new Date());
  };

  const getBookingDateValue = (booking) => booking.serviceDate || booking.date || booking.bookingDate || '';

  const getBookingDateTimestamp = (dateValue) => {
    if (!dateValue) return Number.MAX_SAFE_INTEGER;
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return Number.MAX_SAFE_INTEGER;
    return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
  };

  const formatBookingDateLabel = (dateValue) => {
    if (!dateValue) return 'Unscheduled';
    const date = new Date(dateValue);
    if (Number.isNaN(date.getTime())) return 'Unscheduled';
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const buildAdminBookingSections = (history, options = {}) => {
    const searchQuery = (options.searchQuery || '').trim().toLowerCase();
    const filterType = options.filterType || 'all';

    const filteredHistory = history.filter((booking) => {
      const searchText = [booking.customerName, booking.mobile, booking.id, booking.service, booking.address]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      const matchesSearch = !searchQuery || searchText.includes(searchQuery);
      if (!matchesSearch) return false;

      if (filterType === 'today') {
        return booking.bookingStatus !== 'Completed' && isSameDay(getBookingDateValue(booking), new Date());
      }
      if (filterType === 'pending') {
        return booking.bookingStatus !== 'Completed';
      }
      if (filterType === 'completed') {
        return booking.bookingStatus === 'Completed';
      }
      return true;
    });

    const sections = [];
    const sectionMap = new Map();
    const completedBookings = [];

    filteredHistory.forEach((booking) => {
      if (booking.bookingStatus === 'Completed') {
        completedBookings.push(booking);
        return;
      }

      const bookingDateValue = getBookingDateValue(booking);
      const bookingDate = bookingDateValue ? new Date(bookingDateValue) : null;
      const isToday = bookingDate && isSameDay(bookingDate, new Date());
      const sectionLabel = isToday ? "Today's Bookings" : formatBookingDateLabel(bookingDateValue);
      const sectionKey = isToday ? '__today__' : `${bookingDateValue || 'unscheduled'}:${sectionLabel}`;

      if (!sectionMap.has(sectionKey)) {
        sectionMap.set(sectionKey, {
          label: sectionLabel,
          sortValue: isToday ? 0 : getBookingDateTimestamp(bookingDateValue),
          bookings: []
        });
      }

      sectionMap.get(sectionKey).bookings.push(booking);
    });

    sections.push(...Array.from(sectionMap.values()).sort((left, right) => left.sortValue - right.sortValue));

    return { sections, completedBookings };
  };

  const updateBookingStatus = (bookingId, status) => {
    const history = getBookingHistory();
    const updatedHistory = history.map((booking) => {
      if (booking.id === bookingId) {
        return { ...booking, bookingStatus: status };
      }
      return booking;
    });
    localStorage.setItem(AUTH_KEYS.bookingHistory, JSON.stringify(updatedHistory));
    notifyBookingHistoryChanged();
    renderAdminPanel();
  };

  const deleteBooking = (bookingId) => {
    const history = getBookingHistory().filter((booking) => booking.id !== bookingId);
    localStorage.setItem(AUTH_KEYS.bookingHistory, JSON.stringify(history));
    notifyBookingHistoryChanged();
    renderAdminPanel();
  };

  const getBookingCardMarkup = (item) => {
    const isCompleted = item.bookingStatus === 'Completed';
    return `
      <article class="admin-booking-card ${isCompleted ? 'booking-completed' : item.bookingStatus === 'Pending' ? 'booking-pending' : ''}">
        <div class="admin-booking-card-header">
          <div>
            <span class="booking-id">${item.id}</span>
            <span class="booking-status badge badge-${(item.bookingStatus || 'Pending').toLowerCase().replace(/\s+/g, '-')}">${item.bookingStatus || 'Pending'}</span>
          </div>
          <div class="booking-actions">
            <button class="btn btn-secondary btn-small toggle-details" data-action="toggle-details" data-id="${item.id}">View Details</button>
            ${!isCompleted ? `<button class="btn btn-success btn-small" data-action="mark-completed" data-id="${item.id}">Mark as Completed</button>` : ''}
            <button class="btn btn-danger btn-small" data-action="delete-booking" data-id="${item.id}">Delete</button>
          </div>
        </div>
        <div class="booking-meta">
          <div><span>Customer</span><strong>${item.customerName}</strong></div>
          <div><span>Mobile</span><strong>${item.mobile}</strong></div>
          <div><span>Service</span><strong>${item.service}</strong></div>
          <div><span>Price</span><strong>₹${item.amount || item.bookingAmount || getServiceAmount(item.service)}</strong></div>
        </div>
        <div class="booking-meta booking-meta-row">
          <div><span>Date</span><strong>${item.date || 'Not selected'}</strong></div>
          <div><span>Time</span><strong>${item.time || 'Not selected'}</strong></div>
          <div><span>Payment</span><strong>${item.paymentStatus || item.paymentMethod || 'Pending'}</strong></div>
        </div>
        <div class="booking-details" hidden>
          <div class="detail-row"><span>Address</span><strong>${item.address}</strong></div>
          <div class="detail-row"><span>Email</span><strong>${item.customerEmail || '—'}</strong></div>
          <div class="detail-row"><span>Booking Time</span><strong>${item.bookingTime || '—'}</strong></div>
        </div>
      </article>
    `;
  };

  window.UrbanChimneyAdmin = {
    buildAdminBookingSections
  };

  const getServiceDetails = (service) => {
    const services = {
      'Chimney Basic Cleaning': { amount: 599, priceLabel: '₹599' },
      'Chimney Deep Cleaning': { amount: 1199, priceLabel: '₹1199' },
      'Chimney Repair': { amount: 0, priceLabel: 'Price After Inspection' },
      'Chimney Cleaning': { amount: 799, priceLabel: '₹799' },
      'AC Service': { amount: 699, priceLabel: '₹699' },
      Electrical: { amount: 599, priceLabel: '₹599' },
      Plumbing: { amount: 649, priceLabel: '₹649' },
      Cleaning: { amount: 749, priceLabel: '₹749' },
      Painting: { amount: 899, priceLabel: '₹899' }
    };
    return services[service] || { amount: 599, priceLabel: '₹599' };
  };

  const getServiceAmount = (service) => getServiceDetails(service).amount;
  const getServicePriceLabel = (service) => getServiceDetails(service).priceLabel;

  const fillProfileFields = () => {
    const fields = [
      { id: 'profileName', value: localStorage.getItem(AUTH_KEYS.name) || 'Guest' },
      { id: 'profileMobile', value: localStorage.getItem(AUTH_KEYS.mobile) || 'Not available' },
      { id: 'profileCity', value: localStorage.getItem(AUTH_KEYS.city) || 'Not provided' },
      { id: 'settingsName', value: localStorage.getItem(AUTH_KEYS.name) || 'Guest' },
      { id: 'settingsMobile', value: localStorage.getItem(AUTH_KEYS.mobile) || 'Not available' },
      { id: 'settingsCity', value: localStorage.getItem(AUTH_KEYS.city) || 'Not provided' }
    ];

    fields.forEach(({ id, value }) => {
      const element = document.getElementById(id);
      if (element) element.value = value;
    });
  };

  const renderBookingHistory = () => {
    const list = document.getElementById('bookingHistoryList');
    if (!list) return;

    const history = getBookingHistory();
    if (!history.length) {
      list.innerHTML = '<div class="empty-state">No bookings yet. Your recent service requests will appear here.</div>';
      return;
    }

    list.innerHTML = history.map((item) => `
      <div class="history-item">
        <div>
          <strong>${item.service}</strong>
          <p>${item.address}</p>
        </div>
        <span>${item.date} • ${item.time}</span>
      </div>
    `).join('');
  };

  const renderAdminPanel = () => {
    const statsContainer = document.getElementById('adminStats');
    const emptyState = document.getElementById('adminEmptyState');
    const tableWrap = document.getElementById('adminBookingsTable');
    if (!statsContainer && !emptyState && !tableWrap) return;

    const history = getBookingHistory();
    const todayBookings = history.filter((booking) => booking.bookingStatus !== 'Completed' && isSameDay(getBookingDateValue(booking), new Date()));
    const pendingBookings = history.filter((booking) => booking.bookingStatus !== 'Completed');
    const completedBookings = history.filter((booking) => booking.bookingStatus === 'Completed');
    const todayRevenue = history
      .filter((booking) => booking.bookingStatus === 'Completed' && isSameDay(getBookingDateValue(booking), new Date()))
      .reduce((sum, booking) => sum + Number(booking.amount || booking.bookingAmount || 0), 0);

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card admin-stat-card">
          <span class="stat-label">Today's Bookings</span>
          <strong>${todayBookings.length}</strong>
        </div>
        <div class="stat-card admin-stat-card">
          <span class="stat-label">Pending Bookings</span>
          <strong>${pendingBookings.length}</strong>
        </div>
        <div class="stat-card admin-stat-card">
          <span class="stat-label">Completed Bookings</span>
          <strong>${completedBookings.length}</strong>
        </div>
        <div class="stat-card admin-stat-card">
          <span class="stat-label">Today's Revenue</span>
          <strong>₹${todayRevenue.toLocaleString()}</strong>
        </div>`;
    }

    const { sections, completedBookings: filteredCompletedBookings } = buildAdminBookingSections(history, {
      searchQuery: adminSearchQuery,
      filterType: adminFilterType
    });
    const hasVisibleBookings = sections.some((section) => section.bookings.length) || filteredCompletedBookings.length;

    if (emptyState) {
      emptyState.hidden = hasVisibleBookings;
      emptyState.textContent = hasVisibleBookings ? '' : 'No matching bookings found.';
    }

    if (tableWrap) {
      if (!hasVisibleBookings) {
        tableWrap.innerHTML = '';
        return;
      }

      const sectionMarkup = [
        ...sections.map((section) => `
          <section class="admin-date-section">
            <div class="admin-date-section-header">
              <h3>${section.label}</h3>
              <span>${section.bookings.length} booking${section.bookings.length === 1 ? '' : 's'}</span>
            </div>
            <div class="admin-date-section-body">
              ${section.bookings.map((item) => getBookingCardMarkup(item)).join('')}
            </div>
          </section>
        `),
        filteredCompletedBookings.length ? `
          <section class="admin-date-section completed-section">
            <div class="admin-date-section-header">
              <h3>Completed Bookings</h3>
              <span>${filteredCompletedBookings.length} booking${filteredCompletedBookings.length === 1 ? '' : 's'}</span>
            </div>
            <div class="admin-date-section-body">
              ${filteredCompletedBookings.map((item) => getBookingCardMarkup(item)).join('')}
            </div>
          </section>
        ` : ''
      ].filter(Boolean).join('');

      tableWrap.innerHTML = sectionMarkup;
    }
  };

  const setupAdminPanel = () => {
    const resetButton = document.getElementById('resetBookingsButton');
    const searchInput = document.getElementById('adminSearchInput');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const tableWrap = document.getElementById('adminBookingsTable');
    if (!resetButton || !tableWrap) return;

    resetButton.addEventListener('click', () => {
      [AUTH_KEYS.bookingHistory, AUTH_KEYS.bookingId, AUTH_KEYS.selectedService, AUTH_KEYS.address, AUTH_KEYS.date, AUTH_KEYS.time, AUTH_KEYS.location, AUTH_KEYS.paymentMethod, AUTH_KEYS.bookingAmount].forEach((key) => localStorage.removeItem(key));
      showToast('Demo bookings reset successfully.', 'success');
      adminSearchQuery = '';
      adminFilterType = 'all';
      if (searchInput) searchInput.value = '';
      filterButtons.forEach((button) => button.classList.toggle('active', button.dataset.filter === 'all'));
      renderAdminPanel();
    });

    if (searchInput) {
      searchInput.addEventListener('input', (event) => {
        adminSearchQuery = event.target.value.trim();
        renderAdminPanel();
      });
    }

    filterButtons.forEach((button) => {
      button.addEventListener('click', () => {
        adminFilterType = button.dataset.filter || 'all';
        filterButtons.forEach((item) => item.classList.toggle('active', item === button));
        renderAdminPanel();
      });
    });

    tableWrap.addEventListener('click', (event) => {
      const button = event.target.closest('button');
      if (!button) return;
      const bookingId = button.dataset.id;
      const action = button.dataset.action;
      if (action === 'toggle-details') {
        const card = button.closest('.admin-booking-card');
        const details = card?.querySelector('.booking-details');
        if (details) details.hidden = !details.hidden;
      }
      if (action === 'mark-completed') {
        updateBookingStatus(bookingId, 'Completed');
        showToast('Booking marked as completed.', 'success');
      }
      if (action === 'delete-booking') {
        deleteBooking(bookingId);
        showToast('Booking deleted successfully.', 'success');
      }
    });
  };

  const renderTracking = () => {
    const bookingIdEl = document.getElementById('trackBookingId');
    const serviceEl = document.getElementById('trackService');
    const addressEl = document.getElementById('trackAddress');
    const dateEl = document.getElementById('trackDate');
    const timeEl = document.getElementById('trackTime');
    const timelineEl = document.getElementById('trackTimeline');
    if (!bookingIdEl && !serviceEl && !addressEl && !dateEl && !timeEl && !timelineEl) return;

    const booking = {
      bookingId: localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001',
      service: localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Cleaning',
      address: localStorage.getItem(AUTH_KEYS.address) || 'Not provided',
      date: localStorage.getItem(AUTH_KEYS.date) || 'Today',
      time: localStorage.getItem(AUTH_KEYS.time) || 'As scheduled'
    };

    if (bookingIdEl) bookingIdEl.textContent = booking.bookingId;
    if (serviceEl) serviceEl.textContent = booking.service;
    if (addressEl) addressEl.textContent = booking.address;
    if (dateEl) dateEl.textContent = booking.date;
    if (timeEl) timeEl.textContent = booking.time;

    if (timelineEl) {
      timelineEl.innerHTML = `
        <div class="timeline-item active"><div class="timeline-dot"></div><div><strong>Booked</strong><p>Your service request is confirmed.</p></div></div>
        <div class="timeline-item active"><div class="timeline-dot"></div><div><strong>Technician assigned</strong><p>A verified professional is preparing for your home.</p></div></div>
        <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Technician on the way</strong><p>Our expert is travelling to your location.</p></div></div>
        <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Service started</strong><p>Work has begun at your home.</p></div></div>
        <div class="timeline-item"><div class="timeline-dot"></div><div><strong>Service completed</strong><p>We have completed the job and checked quality.</p></div></div>`;
    }
  };

  const playSuccessTone = () => {
    if (!window.AudioContext && !window.webkitAudioContext) return;
    try {
      const context = new (window.AudioContext || window.webkitAudioContext)();
      const oscillator = context.createOscillator();
      const gainNode = context.createGain();
      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(880, context.currentTime);
      gainNode.gain.setValueAtTime(0.0025, context.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.24);
      oscillator.connect(gainNode);
      gainNode.connect(context.destination);
      oscillator.start();
      oscillator.stop(context.currentTime + 0.24);
    } catch (error) {
      console.warn('Success sound not supported.', error);
    }
  };

  const createSuccessConfetti = () => {
    const existing = document.querySelector('.success-confetti');
    if (existing) existing.remove();
    const confetti = document.createElement('div');
    confetti.className = 'success-confetti';
    const count = 22;
    for (let i = 0; i < count; i += 1) {
      const dot = document.createElement('span');
      dot.className = 'confetti-dot';
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.background = `hsl(${110 + Math.random() * 70}, 82%, ${50 + Math.random() * 12}%)`;
      dot.style.width = `${8 + Math.random() * 8}px`;
      dot.style.height = dot.style.width;
      dot.style.animationDuration = `${1.4 + Math.random() * 0.8}s`;
      dot.style.animationDelay = `${Math.random() * 0.2}s`;
      dot.style.transform = `rotate(${Math.random() * 360}deg)`;
      confetti.appendChild(dot);
    }
    document.body.appendChild(confetti);
    window.setTimeout(() => confetti.remove(), 2400);
  };

  const animateSuccessScreen = () => {
    const badge = document.querySelector('.success-badge');
    if (badge) badge.classList.add('success-badge-animate');
    playSuccessTone();
    createSuccessConfetti();
  };

  const renderSuccessPage = () => {
    const bookingIdEl = document.getElementById('successBookingId');
    const customerNameEl = document.getElementById('successCustomerName');
    const serviceEl = document.getElementById('successService');
    const paymentEl = document.getElementById('successPayment');
    const dateEl = document.getElementById('successDate');
    const timeEl = document.getElementById('successTime');
    const amountEl = document.getElementById('successAmount');
    if (!bookingIdEl && !customerNameEl && !serviceEl && !paymentEl && !dateEl && !timeEl && !amountEl) return;

    const bookingId = localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001';
    const customerName = localStorage.getItem(AUTH_KEYS.name) || 'Guest';
    const service = localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Cleaning';
    const payment = localStorage.getItem(AUTH_KEYS.paymentMethod) || 'UPI';
    const date = localStorage.getItem(AUTH_KEYS.date) || 'Today';
    const time = localStorage.getItem(AUTH_KEYS.time) || 'As scheduled';
    const amount = localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || getServicePriceLabel(service);

    if (bookingIdEl) bookingIdEl.textContent = bookingId;
    if (customerNameEl) customerNameEl.textContent = customerName;
    if (serviceEl) serviceEl.textContent = service;
    if (paymentEl) paymentEl.textContent = payment;
    if (dateEl) dateEl.textContent = date;
    if (timeEl) timeEl.textContent = time;
    if (amountEl) amountEl.textContent = amount;

    window.setTimeout(animateSuccessScreen, 120);
  };

  const renderHomeDashboard = () => {
    const welcomeName = document.getElementById('welcomeName');
    const welcomeMobile = document.getElementById('welcomeMobile');
    const bookingSnapshot = document.getElementById('bookingSnapshot');
    if (!welcomeName && !welcomeMobile && !bookingSnapshot) return;

    const customerName = localStorage.getItem(AUTH_KEYS.name) || 'Guest';
    const mobile = localStorage.getItem(AUTH_KEYS.mobile) || 'Not available';
    const lastBooking = getBookingHistory()[0];

    if (welcomeName) welcomeName.textContent = `Welcome back, ${customerName}`;
    if (welcomeMobile) welcomeMobile.textContent = `Mobile: ${mobile}`;
    if (bookingSnapshot) {
      bookingSnapshot.innerHTML = lastBooking
        ? `<strong>Next up:</strong> ${lastBooking.service} on ${lastBooking.date}`
        : '<strong>Next up:</strong> Book your first premium service';
    }
  };

  const setupBookingWizard = () => {
    const bookingForm = document.getElementById('bookingForm');
    const serviceField = document.getElementById('service');
    const servicePriceField = document.getElementById('servicePrice');
    const address = document.getElementById('address');
    const date = document.getElementById('date');
    const time = document.getElementById('time');
    const customerEmailField = document.getElementById('customerEmail');
    const serviceNameEl = document.getElementById('bookingServiceName');
    const servicePriceEl = document.getElementById('bookingPriceLabel');

    if (!bookingForm) return;

    const params = new URLSearchParams(window.location.search);
    const initialService = params.get('service') || localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Basic Cleaning';
    const initialPrice = params.get('price') || '';
    const selectedServiceDetails = getServiceDetails(initialService);
    const displayPrice = initialPrice || selectedServiceDetails.priceLabel;

    if (serviceField) serviceField.value = initialService;
    if (servicePriceField) servicePriceField.value = displayPrice;
    if (serviceNameEl) serviceNameEl.textContent = initialService;
    if (servicePriceEl) servicePriceEl.textContent = displayPrice;

    const updateBookingSummary = () => {
      if (serviceNameEl) serviceNameEl.textContent = serviceField?.value || 'Chimney Basic Cleaning';
      if (servicePriceEl) servicePriceEl.textContent = servicePriceField?.value || 'Price After Inspection';
    };

    [address, date, time].forEach((field) => {
      if (field) {
        field.addEventListener('input', updateBookingSummary);
        field.addEventListener('change', updateBookingSummary);
      }
    });

    bookingForm.addEventListener('submit', (event) => {
      event.preventDefault();
      if (!date?.value) {
        showToast('Please select a booking date.', 'error');
        return;
      }
      if (!time?.value) {
        showToast('Please select a preferred time.', 'error');
        return;
      }
      if (!address?.value.trim()) {
        showToast('Please add your full address.', 'error');
        return;
      }

      const bookingId = `UC-${Math.floor(10000 + Math.random() * 90000)}`;
      const serviceValue = serviceField?.value || initialService;
      const customerEmail = customerEmailField?.value.trim() || '';
      const bookingTime = new Date().toLocaleString();
      const booking = {
        id: bookingId,
        service: serviceValue,
        address: address.value.trim(),
        date: date.value,
        time: time.value,
        city: localStorage.getItem(AUTH_KEYS.city) || 'Not provided',
        mobile: localStorage.getItem(AUTH_KEYS.mobile) || 'N/A',
        customerName: localStorage.getItem(AUTH_KEYS.name) || 'Guest',
        customerEmail,
        paymentMethod: 'Pending selection',
        paymentStatus: 'Pending',
        bookingTime,
        createdAt: bookingTime
      };

      const bookingAmount = getServiceAmount(serviceValue);
      const bookingPriceLabel = servicePriceField?.value || getServicePriceLabel(serviceValue);
      localStorage.setItem(AUTH_KEYS.bookingId, bookingId);
      localStorage.setItem(AUTH_KEYS.selectedService, booking.service);
      localStorage.setItem(AUTH_KEYS.address, booking.address);
      localStorage.setItem(AUTH_KEYS.date, booking.date);
      localStorage.setItem(AUTH_KEYS.time, booking.time);
      localStorage.setItem(AUTH_KEYS.location, localStorage.getItem(AUTH_KEYS.location) || '');
      localStorage.setItem(AUTH_KEYS.bookingAmount, String(bookingAmount));
      localStorage.setItem(AUTH_KEYS.bookingPriceLabel, bookingPriceLabel);
      localStorage.setItem(AUTH_KEYS.paymentMethod, 'Pending selection');
      localStorage.setItem(AUTH_KEYS.paymentStatus, 'Pending');
      localStorage.setItem(AUTH_KEYS.customerEmail, customerEmail);
      localStorage.setItem(AUTH_KEYS.bookingTime, bookingTime);
      showToast('Booking saved. Continue to payment.', 'success');
      window.setTimeout(() => window.location.href = 'payment.html', 400);
    });
  };

  const setupPayments = () => {
    const confirmButton = document.getElementById('confirmPaymentButton');
    const paymentOptions = document.querySelectorAll('.payment-option');
    const amountLabel = document.getElementById('paymentAmountLabel');
    if (!paymentOptions.length) return;

    const currentAmount = localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || '₹599';
    if (amountLabel) {
      amountLabel.textContent = currentAmount;
    }

    paymentOptions.forEach((option) => {
      option.addEventListener('click', (event) => {
        if (event.target.closest('button[data-copy], button[data-open]')) {
          return;
        }
        paymentOptions.forEach((item) => item.classList.remove('selected'));
        option.classList.add('selected');
        const input = option.querySelector('input');
        if (input) input.checked = true;
      });
    });

    document.querySelectorAll('button[data-copy]').forEach((button) => {
      button.addEventListener('click', async (event) => {
        event.preventDefault();
        event.stopPropagation();
        try {
          await navigator.clipboard.writeText(button.getAttribute('data-copy') || '');
          showToast('UPI ID copied successfully.', 'success');
        } catch (error) {
          showToast('Copy failed. Please copy manually.', 'error');
        }
      });
    });

    document.querySelectorAll('button[data-open]').forEach((button) => {
      button.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        const amount = Number(localStorage.getItem(AUTH_KEYS.bookingAmount) || '599');
        const upiLink = `upi://pay?pa=9701434006-2@OKAXIS&pn=Rajasekhar&am=${Number.isFinite(amount) ? amount : 599}&tn=Urban%20Chimney%20Service`;
        const deepLink = button.getAttribute('data-open') === 'phonepe'
          ? `phonepe://pay?pa=9701434006-2@OKAXIS&pn=Rajasekhar&am=${Number.isFinite(amount) ? amount : 599}&tn=Urban%20Chimney%20Service`
          : `tez://upi/pay?pa=9701434006-2@OKAXIS&pn=Rajasekhar&am=${Number.isFinite(amount) ? amount : 599}&tn=Urban%20Chimney%20Service`;
        window.location.href = deepLink;
        window.setTimeout(() => {
          window.location.href = upiLink;
        }, 800);
      });
    });

    if (confirmButton) {
      confirmButton.addEventListener('click', async () => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (!selectedPayment) {
          showToast('Please choose a payment method.', 'error');
          return;
        }

        const paymentMethod = selectedPayment.value;
        const bookingId = localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001';
        const bookingTime = localStorage.getItem(AUTH_KEYS.bookingTime) || new Date().toLocaleString();
        const bookingRecord = {
          id: bookingId,
          service: localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Basic Cleaning',
          address: localStorage.getItem(AUTH_KEYS.address) || 'Not provided',
          date: localStorage.getItem(AUTH_KEYS.date) || 'Today',
          time: localStorage.getItem(AUTH_KEYS.time) || 'As scheduled',
          mobile: localStorage.getItem(AUTH_KEYS.mobile) || 'N/A',
          customerName: localStorage.getItem(AUTH_KEYS.name) || 'Guest',
          customerEmail: localStorage.getItem(AUTH_KEYS.customerEmail) || '',
          amount: localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || '₹599',
          paymentMethod,
          paymentStatus: 'Completed',
          bookingStatus: 'Pending',
          bookingTime,
          createdAt: bookingTime,
          serviceDate: localStorage.getItem(AUTH_KEYS.date) || new Date().toISOString().slice(0, 10)
        };

        localStorage.setItem(AUTH_KEYS.paymentMethod, paymentMethod);
        localStorage.setItem(AUTH_KEYS.paymentStatus, 'Completed');
        localStorage.setItem(AUTH_KEYS.bookingTime, bookingTime);
        saveBookingHistory(bookingRecord);

        showLoading('Finalizing your booking...');
        try {
          await sendBookingConfirmationEmails(bookingRecord);
          showToast('Payment received. Your booking is confirmed.', 'success');
        } catch (error) {
          console.error('Unable to send booking emails.', error);
          showToast('Booking confirmed. Email delivery could not be completed automatically.', 'error');
        } finally {
          hideLoading();
          window.setTimeout(() => {
            window.location.href = 'success.html';
          }, 400);
        }
      });
    }
  };

  const setupReceiptDownload = () => {
    const button = document.getElementById('downloadReceiptButton');
    if (!button) return;

    button.addEventListener('click', () => {
      const receipt = [
        'Urban Chimney Receipt',
        `Booking ID: ${localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001'}`,
        `Customer: ${localStorage.getItem(AUTH_KEYS.name) || 'Guest'}`,
        `Service: ${localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Basic Cleaning'}`,
        `Date: ${localStorage.getItem(AUTH_KEYS.date) || 'Today'}`,
        `Time: ${localStorage.getItem(AUTH_KEYS.time) || 'As scheduled'}`,
        `Address: ${localStorage.getItem(AUTH_KEYS.address) || 'Not provided'}`,
        `Payment: ${localStorage.getItem(AUTH_KEYS.paymentMethod) || 'UPI'}`,
        `Amount: ${localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || '₹599'}`
      ].join('\n');
      const blob = new Blob([receipt], { type: 'text/plain;charset=utf-8' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = 'urban-chimney-receipt.txt';
      link.click();
      URL.revokeObjectURL(link.href);
      showToast('Receipt downloaded successfully.', 'success');
    });
  };

  const sendBookingConfirmationEmails = async (booking) => {
    const emailService = window.UrbanChimneyEmail;
    const customerName = booking.customerName || localStorage.getItem(AUTH_KEYS.name) || 'Guest';
    const mobileNumber = booking.mobile || localStorage.getItem(AUTH_KEYS.mobile) || 'N/A';
    const amount = booking.amount || localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || getServicePriceLabel(booking.service);
    const paymentMethod = booking.paymentMethod || localStorage.getItem(AUTH_KEYS.paymentMethod) || 'Pending selection';
    const bookingTime = booking.bookingTime || localStorage.getItem(AUTH_KEYS.bookingTime) || new Date().toLocaleString();
    const paymentStatus = booking.paymentStatus || localStorage.getItem(AUTH_KEYS.paymentStatus) || 'Completed';

    const bookingPayload = {
      customerName,
      mobile: mobileNumber,
      address: booking.address || localStorage.getItem(AUTH_KEYS.address) || 'Not provided',
      service: booking.service || localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Cleaning',
      date: booking.date || localStorage.getItem(AUTH_KEYS.date) || 'Today',
      time: booking.time || localStorage.getItem(AUTH_KEYS.time) || 'As scheduled',
      paymentMethod,
      paymentStatus,
      id: booking.id || localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001',
      bookingTime,
      customerEmail: booking.customerEmail || localStorage.getItem(AUTH_KEYS.customerEmail) || '',
      createdAt: bookingTime
    };

    if (!emailService || typeof emailService.buildEmailParams !== 'function' || typeof emailService.buildCustomerEmailParams !== 'function') {
      throw new Error('Email service helper is unavailable.');
    }

    if (!emailService.isConfigured()) {
      console.warn('EmailJS is not configured yet. Update the placeholder values in email-service.js before deployment.');
      return;
    }

    if (!window.emailjs || typeof window.emailjs.init !== 'function' || typeof window.emailjs.send !== 'function') {
      throw new Error('EmailJS SDK is not available.');
    }

    window.emailjs.init(emailService.EMAILJS_CONFIG.publicKey);
    const ownerEmail = emailService.buildEmailParams(bookingPayload);
    await window.emailjs.send(emailService.EMAILJS_CONFIG.serviceId, emailService.EMAILJS_CONFIG.templateId, ownerEmail.params);

    if (bookingPayload.customerEmail) {
      const customerEmail = emailService.buildCustomerEmailParams(bookingPayload);
      await window.emailjs.send(emailService.EMAILJS_CONFIG.serviceId, emailService.EMAILJS_CONFIG.templateId, customerEmail.params);
    }
  };

  const initAuth = () => {
    if (currentPage === 'index.html') {
      redirectBasedOnSession();
      return;
    }

    if (protectedPages.includes(currentPage)) {
      redirectBasedOnSession();
      window.setInterval(checkSession, 1000);
    }
  };

  const initHeaderActions = () => {
    document.querySelectorAll('#logoutButton').forEach((button) => {
      button.addEventListener('click', () => {
        clearAuthState();
        clearOwnerSession();
        window.location.href = 'index.html';
      });
    });
  };

  const initDrawerMenu = () => {
    const drawerToggle = document.getElementById('drawerToggle');
    const drawerClose = document.getElementById('drawerClose');
    const drawerOverlay = document.getElementById('drawerOverlay');
    const sideDrawer = document.getElementById('sideDrawer');
    const drawerItems = document.querySelectorAll('.drawer-item');

    if (!drawerToggle || !drawerClose || !drawerOverlay || !sideDrawer) return;

    const closeDrawer = () => {
      sideDrawer.classList.remove('open');
      drawerOverlay.classList.remove('active');
      document.body.classList.remove('drawer-open');
      drawerOverlay.setAttribute('aria-hidden', 'true');
      sideDrawer.setAttribute('aria-hidden', 'true');
    };

    const openDrawer = () => {
      sideDrawer.classList.add('open');
      drawerOverlay.classList.add('active');
      document.body.classList.add('drawer-open');
      drawerOverlay.setAttribute('aria-hidden', 'false');
      sideDrawer.setAttribute('aria-hidden', 'false');
    };

    drawerToggle.addEventListener('click', openDrawer);
    drawerClose.addEventListener('click', closeDrawer);
    drawerOverlay.addEventListener('click', closeDrawer);

    drawerItems.forEach((item) => {
      item.addEventListener('click', (event) => {
        const action = item.dataset.action;
        if (action === 'logout') {
          event.preventDefault();
          clearAuthState();
          clearOwnerSession();
          window.location.href = 'index.html';
          return;
        }
        closeDrawer();
      });
    });

    window.addEventListener('keydown', (event) => {
      if (event.key === 'Escape' && sideDrawer.classList.contains('open')) {
        closeDrawer();
      }
    });
  };

  const initLogin = () => {
    if (!loginForm) return;
    let otpSent = false;

    const updateSendOtpButtonState = () => {
      if (!sendOtpButton) return;
      sendOtpButton.disabled = !/^[0-9]{10}$/.test(mobileInput?.value.trim() || '');
    };

    const updateVerifyButtonState = () => {
      if (!verifyOtpButton || !otpInput) return;
      verifyOtpButton.disabled = !otpSent || otpInput.value.trim().length !== 6;
    };

    if (mobileInput) {
      mobileInput.addEventListener('input', () => {
        updateSendOtpButtonState();
        if (!otpSent) {
          toggleOtpFields(false);
        }
      });
    }

    if (otpInput) {
      otpInput.addEventListener('input', updateVerifyButtonState);
    }

    if (sendOtpButton) {
      sendOtpButton.addEventListener('click', async () => {
        const mobile = mobileInput?.value.trim() || '';
        if (!/^[0-9]{10}$/.test(mobile)) {
          setFormMessage('Please enter a valid 10-digit mobile number.', 'error');
          showToast('Please enter a valid 10-digit mobile number.', 'error');
          return;
        }

        showLoading('Sending OTP...');
        const result = await requestOtp(mobile);
        hideLoading();
        otpSent = true;
        toggleOtpFields(true);
        if (otpInput) {
          otpInput.value = '';
          otpInput.focus();
        }
        updateVerifyButtonState();
        startResendCountdown(sendOtpButton);
        setFormMessage(result.message, 'success');
      });
    }

    loginForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      const mobile = mobileInput?.value.trim() || '';
      const otp = otpInput?.value.trim() || '';

      if (!/^[0-9]{10}$/.test(mobile)) {
        setFormMessage('Please enter a valid 10-digit mobile number.', 'error');
        return;
      }
      if (!otpSent) {
        setFormMessage('Please request the OTP first.', 'error');
        return;
      }
      if (!/^[0-9]{6}$/.test(otp)) {
        setFormMessage('Please enter a valid 6-digit OTP.', 'error');
        return;
      }

      showLoading('Verifying OTP...');
      const isValidOtp = await verifyOtp(otp);
      hideLoading();
      if (!isValidOtp) {
        setFormMessage('Incorrect OTP. Use 123456 for the demo.', 'error');
        return;
      }

      if (isOwnerMobile(mobile)) {
        saveOwnerSession();
        setFormMessage('Login successful. Redirecting...', 'success');
        showToast('Login successful. Redirecting...', 'success');
        window.setTimeout(() => window.location.href = 'admin.html', 500);
        return;
      }

      saveAuthSession(mobile);
      localStorage.setItem(AUTH_KEYS.name, 'Guest');
      localStorage.setItem(AUTH_KEYS.city, 'Not provided');
      setFormMessage('Login successful. Redirecting to your dashboard...', 'success');
      showToast('Login successful. Redirecting to your dashboard...', 'success');
      window.setTimeout(() => window.location.href = 'home.html', 500);
    });

    updateSendOtpButtonState();
    updateVerifyButtonState();
    toggleOtpFields(false);
  };

  const initLocation = () => {
    if (!locationButton || !locationField) return;
    locationButton.addEventListener('click', () => {
      if (!navigator.geolocation) {
        showToast('Geolocation is not supported on this device.', 'error');
        return;
      }
      showLoading('Finding your location...');
      navigator.geolocation.getCurrentPosition(
        (position) => {
          hideLoading();
          locationField.value = `https://www.google.com/maps?q=${position.coords.latitude},${position.coords.longitude}`;
          showToast('Location attached successfully.', 'success');
        },
        () => {
          hideLoading();
          showToast('Location access was denied. Please add it manually.', 'error');
        }
      );
    });
  };

  initAuth();
  initHeaderActions();
  initDrawerMenu();
  initLogin();
  initLocation();
  fillProfileFields();
  renderBookingHistory();
  renderTracking();
  renderSuccessPage();
  renderHomeDashboard();
  setupBookingWizard();
  setupPayments();
  setupReceiptDownload();
  setupAdminPanel();
  renderAdminPanel();

  const toastStack = document.getElementById('toastStack');
  if (!toastStack) {
    const stack = document.createElement('div');
    stack.id = 'toastStack';
    stack.className = 'toast-stack';
    document.body.appendChild(stack);
  }

  window.addEventListener('beforeunload', hideLoading);
});
