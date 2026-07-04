document.addEventListener('DOMContentLoaded', () => {
  const AUTH_KEYS = {
    active: 'urbanChimneyAuth',
    loginTime: 'urbanChimneyLoginTime',
    sessionExpiry: 'urbanChimneySessionExpiry',
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
    bookingAmount: 'bookingAmount',
    bookingPriceLabel: 'bookingPriceLabel'
  };

  const SESSION_DURATION_MS = 30 * 60 * 1000;
  const DEMO_OTP = '123456';
  const OWNER_CONTACT = {
    mobile: '+91 90000 12345',
    email: 'contact@urbanchimney.com'
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
    [AUTH_KEYS.active, AUTH_KEYS.loginTime, AUTH_KEYS.sessionExpiry, AUTH_KEYS.mobile, AUTH_KEYS.name, AUTH_KEYS.city, AUTH_KEYS.bookingId, AUTH_KEYS.selectedService, AUTH_KEYS.address, AUTH_KEYS.date, AUTH_KEYS.time, AUTH_KEYS.location, AUTH_KEYS.paymentMethod, AUTH_KEYS.bookingAmount, AUTH_KEYS.bookingPriceLabel].forEach((key) => localStorage.removeItem(key));
  };

  const saveAuthSession = (mobile) => {
    localStorage.setItem(AUTH_KEYS.active, 'active');
    localStorage.setItem(AUTH_KEYS.mobile, mobile);
    localStorage.setItem(AUTH_KEYS.loginTime, String(Date.now()));
    localStorage.setItem(AUTH_KEYS.sessionExpiry, String(Date.now() + SESSION_DURATION_MS));
    localStorage.setItem(AUTH_KEYS.name, localStorage.getItem(AUTH_KEYS.name) || 'Guest');
    localStorage.setItem(AUTH_KEYS.city, localStorage.getItem(AUTH_KEYS.city) || 'Not provided');
  };

  const isSessionValid = () => {
    const expiry = Number(localStorage.getItem(AUTH_KEYS.sessionExpiry) || 0);
    const isActive = localStorage.getItem(AUTH_KEYS.active) === 'active';
    return isActive && expiry > Date.now();
  };

  const redirectBasedOnSession = () => {
    if (currentPage === 'index.html') {
      if (isSessionValid()) {
        window.location.replace('home.html');
      }
      return;
    }

    if (!isSessionValid()) {
      clearAuthState();
      window.location.replace('index.html');
    }
  };

  const checkSession = () => {
    if (protectedPages.includes(currentPage) && !isSessionValid()) {
      clearAuthState();
      window.location.replace('index.html');
      return true;
    }
    return false;
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

  const saveBookingHistory = (booking) => {
    const history = getBookingHistory();
    history.unshift(booking);
    localStorage.setItem(AUTH_KEYS.bookingHistory, JSON.stringify(history.slice(0, 8)));
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
    const serviceCounts = history.reduce((counts, item) => {
      counts[item.service] = (counts[item.service] || 0) + 1;
      return counts;
    }, {});
    const topService = Object.entries(serviceCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'No data';
    const paidCount = history.filter((item) => item.paymentMethod && item.paymentMethod !== 'Pending selection').length;

    if (statsContainer) {
      statsContainer.innerHTML = `
        <div class="stat-card"><strong>${history.length}</strong><span class="muted">Total bookings</span></div>
        <div class="stat-card"><strong>${topService}</strong><span class="muted">Most requested service</span></div>
        <div class="stat-card"><strong>${paidCount}</strong><span class="muted">Payments confirmed</span></div>
        <div class="stat-card"><strong>${history.length ? 'Live' : 'Waiting'}</strong><span class="muted">Demo booking status</span></div>`;
    }

    if (emptyState) {
      emptyState.hidden = history.length > 0;
    }

    if (tableWrap) {
      if (!history.length) {
        tableWrap.innerHTML = '';
        return;
      }

      tableWrap.innerHTML = `
        <div class="history-list">
          ${history.map((item) => `
            <div class="history-item">
              <div>
                <strong>${item.id} • ${item.service}</strong>
                <p>${item.customerName} • ${item.mobile}</p>
                <p>${item.address}</p>
              </div>
              <div class="muted" style="text-align: right;">
                <div>${item.date} • ${item.time}</div>
                <div>${item.paymentMethod || 'Pending'}</div>
                <div>₹${item.amount || getServiceAmount(item.service)}</div>
              </div>
            </div>
          `).join('')}
        </div>`;
    }
  };

  const setupAdminPanel = () => {
    const resetButton = document.getElementById('resetBookingsButton');
    if (!resetButton) return;

    resetButton.addEventListener('click', () => {
      [AUTH_KEYS.bookingHistory, AUTH_KEYS.bookingId, AUTH_KEYS.selectedService, AUTH_KEYS.address, AUTH_KEYS.date, AUTH_KEYS.time, AUTH_KEYS.location, AUTH_KEYS.paymentMethod, AUTH_KEYS.bookingAmount].forEach((key) => localStorage.removeItem(key));
      showToast('Demo bookings reset successfully.', 'success');
      renderAdminPanel();
      renderBookingHistory();
      renderTracking();
      renderSuccessPage();
      renderHomeDashboard();
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

  const renderSuccessPage = () => {
    const bookingIdEl = document.getElementById('successBookingId');
    const serviceEl = document.getElementById('successService');
    const paymentEl = document.getElementById('successPayment');
    const dateEl = document.getElementById('successDate');
    const timeEl = document.getElementById('successTime');
    const addressEl = document.getElementById('successAddress');
    const amountEl = document.getElementById('successAmount');
    if (!bookingIdEl && !serviceEl && !paymentEl && !dateEl && !timeEl && !addressEl && !amountEl) return;

    const bookingId = localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001';
    const service = localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Cleaning';
    const payment = localStorage.getItem(AUTH_KEYS.paymentMethod) || 'UPI';
    const date = localStorage.getItem(AUTH_KEYS.date) || 'Today';
    const time = localStorage.getItem(AUTH_KEYS.time) || 'As scheduled';
    const address = localStorage.getItem(AUTH_KEYS.address) || 'Not provided';
    const amount = localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || getServicePriceLabel(service);

    if (bookingIdEl) bookingIdEl.textContent = bookingId;
    if (serviceEl) serviceEl.textContent = service;
    if (paymentEl) paymentEl.textContent = payment;
    if (dateEl) dateEl.textContent = date;
    if (timeEl) timeEl.textContent = time;
    if (addressEl) addressEl.textContent = address;
    if (amountEl) amountEl.textContent = amount;
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
      const booking = {
        id: bookingId,
        service: serviceValue,
        address: address.value.trim(),
        date: date.value,
        time: time.value,
        city: localStorage.getItem(AUTH_KEYS.city) || 'Not provided',
        mobile: localStorage.getItem(AUTH_KEYS.mobile) || 'N/A',
        customerName: localStorage.getItem(AUTH_KEYS.name) || 'Guest',
        createdAt: new Date().toLocaleString()
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
      saveBookingHistory(booking);
      sendBookingNotificationEmail({
        ...booking,
        amount: bookingPriceLabel,
        paymentMethod: 'Pending selection'
      });
      showToast('Booking confirmed. Continue to payment.', 'success');
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
      confirmButton.addEventListener('click', () => {
        const selectedPayment = document.querySelector('input[name="payment"]:checked');
        if (!selectedPayment) {
          showToast('Please choose a payment method.', 'error');
          return;
        }
        const paymentMethod = selectedPayment.value;
        localStorage.setItem(AUTH_KEYS.paymentMethod, paymentMethod);
        sendBookingNotificationEmail({
          id: localStorage.getItem(AUTH_KEYS.bookingId) || 'UC-1001',
          service: localStorage.getItem(AUTH_KEYS.selectedService) || 'Chimney Basic Cleaning',
          address: localStorage.getItem(AUTH_KEYS.address) || 'Not provided',
          date: localStorage.getItem(AUTH_KEYS.date) || 'Today',
          time: localStorage.getItem(AUTH_KEYS.time) || 'As scheduled',
          mobile: localStorage.getItem(AUTH_KEYS.mobile) || 'N/A',
          customerName: localStorage.getItem(AUTH_KEYS.name) || 'Guest',
          amount: localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || '₹599',
          paymentMethod
        });
        showToast('Payment selected. Your booking is confirmed.', 'success');
        window.setTimeout(() => {
          window.location.href = 'success.html';
        }, 400);
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

  const sendBookingNotificationEmail = (booking) => {
    const customerName = booking.customerName || localStorage.getItem(AUTH_KEYS.name) || 'Guest';
    const mobileNumber = booking.mobile || localStorage.getItem(AUTH_KEYS.mobile) || 'N/A';
    const amount = booking.amount || localStorage.getItem(AUTH_KEYS.bookingPriceLabel) || localStorage.getItem(AUTH_KEYS.bookingAmount) || getServicePriceLabel(booking.service);
    const paymentMethod = booking.paymentMethod || localStorage.getItem(AUTH_KEYS.paymentMethod) || 'Pending selection';
    const subject = `Urban Chimney Booking Confirmation - ${booking.id}`;
    const body = [
      `Customer Name: ${customerName}`,
      `Mobile Number: ${mobileNumber}`,
      `Selected Service: ${booking.service}`,
      `Booking Date: ${booking.date}`,
      `Booking Time: ${booking.time}`,
      `Address: ${booking.address}`,
      `Payment Method: ${paymentMethod}`,
      `Amount: ${amount}`,
      `Booking ID: ${booking.id}`
    ].join('%0A');

    const mailtoLink = `mailto:${encodeURIComponent(OWNER_CONTACT.email)}?subject=${encodeURIComponent(subject)}&body=${body}`;
    try {
      window.location.href = mailtoLink;
    } catch (error) {
      console.warn('Unable to open mail client.', error);
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
