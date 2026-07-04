const assert = require('assert');
const { buildEmailParams, buildCustomerEmailParams, isConfigured } = require('../email-service');

const booking = {
  customerName: 'Asha',
  mobile: '9999999999',
  address: '1 Main Road',
  service: 'Chimney Basic Cleaning',
  date: '2026-07-10',
  time: '10:30',
  paymentMethod: 'UPI',
  paymentStatus: 'Completed',
  id: 'UC-12345',
  bookingTime: '2026-07-04 10:00',
  customerEmail: 'customer@example.com'
};

const ownerEmail = buildEmailParams(booking);
assert.strictEqual(ownerEmail.params.to_email, 'KRS.MF66@gmail.com');
assert.ok(ownerEmail.params.email_body.includes('Customer Name: Asha'));
assert.ok(ownerEmail.params.payment_status === 'Completed');

const customerEmail = buildCustomerEmailParams(booking);
assert.strictEqual(customerEmail.params.to_email, 'customer@example.com');
assert.strictEqual(customerEmail.subject, 'Urban Chimney Booking Confirmation');
assert.ok(!isConfigured({
  publicKey: 'YOUR_PUBLIC_KEY',
  serviceId: 'YOUR_SERVICE_ID',
  templateId: 'YOUR_TEMPLATE_ID'
}));

console.log('Email service tests passed');
