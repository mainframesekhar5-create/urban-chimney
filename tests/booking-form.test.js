const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.className = '';
    this.listeners = {};
    this.children = [];
    this.attributes = {};
    this.classList = {
      toggle() {},
      add() {},
      remove() {},
      contains() { return false; }
    };
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  appendChild(child) {
    this.children.push(child);
    return child;
  }

  remove() {
    this.removed = true;
  }

  setAttribute(name, value) {
    this.attributes[name] = value;
  }

  getAttribute(name) {
    return this.attributes[name] ?? null;
  }

  removeAttribute(name) {
    delete this.attributes[name];
  }

  focus() {}

  querySelector() { return null; }
  querySelectorAll() { return []; }
  closest() { return null; }
}

const elements = {};
const makeElement = (id) => {
  const element = new MockElement(id);
  elements[id] = element;
  return element;
};

const document = {
  body: new MockElement('body'),
  addEventListener(eventName, handler) {
    if (eventName === 'DOMContentLoaded') {
      this._domReadyHandler = handler;
    }
  },
  getElementById(id) {
    return elements[id] || null;
  },
  querySelector() { return null; },
  querySelectorAll() { return []; },
  createElement() { return new MockElement(); },
  createTextNode(text) { return { textContent: text }; }
};

const localStorage = {
  store: {},
  getItem(key) { return this.store[key] ?? null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; }
};

const window = {
  location: {
    pathname: '/booking.html',
    search: '',
    href: 'http://localhost/booking.html',
    replace(target) {
      this.href = `http://localhost/${target}`;
      this.pathname = `/${target}`;
    }
  },
  addEventListener() {},
  setTimeout(handler) {
    if (typeof handler === 'function') handler();
    return 1;
  },
  setInterval() { return 1; },
  clearInterval() {},
  clearTimeout() {},
  AudioContext: undefined,
  webkitAudioContext: undefined
};

const navigator = { geolocation: null };

const context = {
  document,
  window,
  localStorage,
  navigator,
  console,
  URLSearchParams,
  setTimeout: window.setTimeout,
  clearTimeout: window.clearTimeout,
  setInterval: window.setInterval,
  clearInterval: window.clearInterval,
  Date,
  Math,
  Array,
  Object,
  String,
  Number,
  Boolean,
  Error,
  RegExp,
  JSON,
  NodeJS: true,
  location: window.location,
  history: { replaceState() {} }
};

context.window.window = window;
context.window.document = document;
context.window.localStorage = localStorage;
context.window.navigator = navigator;
context.global = context;
context.globalThis = context;

const bookingHtml = fs.readFileSync(path.join(__dirname, '..', 'booking.html'), 'utf8');
assert.ok(bookingHtml.includes('id="address"'), 'The booking form should include an address field');
assert.ok(bookingHtml.includes('id="date"'), 'The booking form should include a date field');
assert.ok(bookingHtml.includes('id="time"'), 'The booking form should include a time field');
assert.ok(!bookingHtml.includes('id="customerEmail"'), 'The booking form should not include an email field');

const bookingForm = makeElement('bookingForm');
const serviceField = makeElement('service');
const servicePriceField = makeElement('servicePrice');
const address = makeElement('address');
const date = makeElement('date');
const time = makeElement('time');
const bookingServiceName = makeElement('bookingServiceName');
const bookingPriceLabel = makeElement('bookingPriceLabel');
const locationButton = makeElement('locationButton');
const locationField = makeElement('location');
const logoutButton = makeElement('logoutButton');
const formMessage = makeElement('formMessage');
const toastStack = makeElement('toastStack');

for (const [id, element] of Object.entries({
  bookingForm,
  serviceField,
  servicePriceField,
  address,
  date,
  time,
  bookingServiceName,
  bookingPriceLabel,
  locationButton,
  locationField,
  logoutButton,
  formMessage,
  toastStack
})) {
  elements[id] = element;
}

const appScript = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
vm.createContext(context);
vm.runInContext(appScript, context);

document._domReadyHandler();

serviceField.value = 'Chimney Basic Cleaning';
servicePriceField.value = '₹599';
address.value = '1 Main Road';
date.value = '2026-07-10';
time.value = '10:30';
localStorage.setItem('customerName', 'Asha');
localStorage.setItem('customerMobile', '9999999999');

const submitEvent = { preventDefault() {}, stopPropagation() {} };
bookingForm.listeners.submit(submitEvent);

assert.strictEqual(localStorage.getItem('bookingId')?.startsWith('UC-'), true, 'A booking record should be stored after submission');
assert.strictEqual(localStorage.getItem('selectedService'), 'Chimney Basic Cleaning', 'The selected service should be saved');
assert.strictEqual(localStorage.getItem('address'), '1 Main Road', 'The booking address should be saved');
assert.strictEqual(localStorage.getItem('customerMobile'), '9999999999', 'The customer mobile should be preserved');

console.log('Booking form flow tests passed');
