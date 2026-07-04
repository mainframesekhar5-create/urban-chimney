(function (root, factory) {
  const api = factory();

  if (typeof module !== 'undefined' && module.exports) {
    module.exports = api;
  }

  root.UrbanChimneyEmail = api;
}(typeof window !== 'undefined' ? window : this, function () {
  // Replace these placeholders with your real EmailJS credentials before deployment.
  const EMAILJS_CONFIG = Object.freeze({
    publicKey: 'YOUR_PUBLIC_KEY',
    serviceId: 'YOUR_SERVICE_ID',
    templateId: 'YOUR_TEMPLATE_ID',
    ownerEmail: 'KRS.MF66@gmail.com'
  });

  const isConfigured = (config = EMAILJS_CONFIG) => Boolean(
    config.publicKey &&
    config.publicKey !== 'YOUR_PUBLIC_KEY' &&
    config.serviceId &&
    config.serviceId !== 'YOUR_SERVICE_ID' &&
    config.templateId &&
    config.templateId !== 'YOUR_TEMPLATE_ID'
  );

  const buildEmailParams = (booking, config = EMAILJS_CONFIG) => {
    const customerName = booking.customerName || 'Guest';
    const mobileNumber = booking.mobile || 'N/A';
    const address = booking.address || 'Not provided';
    const service = booking.service || 'Chimney Cleaning';
    const bookingDate = booking.date || 'Not selected';
    const timeSlot = booking.time || 'As scheduled';
    const paymentMethod = booking.paymentMethod || 'Pending selection';
    const paymentStatus = booking.paymentStatus || 'Pending';
    const bookingId = booking.id || 'UC-1001';
    const bookingTime = booking.bookingTime || booking.createdAt || new Date().toLocaleString();
    const customerEmail = booking.customerEmail || '';
    const subject = 'New Urban Chimney Booking';
    const body = [
      `Customer Name: ${customerName}`,
      `Mobile Number: ${mobileNumber}`,
      `Address: ${address}`,
      `Service Selected: ${service}`,
      `Booking Date: ${bookingDate}`,
      `Time Slot: ${timeSlot}`,
      `Payment Method: ${paymentMethod}`,
      `Payment Status: ${paymentStatus}`,
      `Booking ID: ${bookingId}`,
      `Booking Time: ${bookingTime}`
    ].join('\n');

    return {
      subject,
      body,
      params: {
        to_email: config.ownerEmail,
        reply_to: customerEmail,
        customer_name: customerName,
        mobile_number: mobileNumber,
        address,
        service_selected: service,
        booking_date: bookingDate,
        time_slot: timeSlot,
        payment_method: paymentMethod,
        payment_status: paymentStatus,
        booking_id: bookingId,
        booking_time: bookingTime,
        email_body: body
      }
    };
  };

  const buildCustomerEmailParams = (booking, config = EMAILJS_CONFIG) => {
    const customerEmail = booking.customerEmail || '';
    const base = buildEmailParams(booking, config);

    return {
      subject: 'Urban Chimney Booking Confirmation',
      body: base.body,
      params: {
        ...base.params,
        to_email: customerEmail,
        reply_to: config.ownerEmail,
        email_body: base.body
      }
    };
  };

  return {
    EMAILJS_CONFIG,
    isConfigured,
    buildEmailParams,
    buildCustomerEmailParams
  };
}));
