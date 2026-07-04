const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.innerHTML = '';
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.listeners = {};
    this.className = '';
    this.children = [];
    this.attributes = {};
    this.classList = { add() {}, remove() {}, contains() { return false; } };
  }
  addEventListener(type, handler) { this.listeners[type] = handler; }
  appendChild(child) { this.children.push(child); return child; }
  remove() { this.removed = true; }
  setAttribute(name, value) { this.attributes[name] = value; }
  getAttribute(name) { return this.attributes[name] ?? null; }
  removeAttribute(name) { delete this.attributes[name]; }
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
  getElementById(id) { return elements[id] || null; },
  createElement(tag) { return new MockElement(tag); },
  createTextNode(text) { return { textContent: text }; },
  querySelector() { return null; },
  querySelectorAll() { return []; }
};

const localStorage = {
  store: {},
  getItem(key) { return this.store[key] ?? null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; }
};

const window = {
  location: {
    pathname: '/track.html',
    search: '',
    href: 'http://localhost/track.html',
    replace(target) {
      this.href = `http://localhost/${target}`;
      this.pathname = `/${target}`;
    }
  },
  addEventListener() {},
  setTimeout(handler) { if (typeof handler === 'function') handler(); return 1; },
  clearTimeout() {},
  setInterval() { return 1; },
  clearInterval() {},
  URL: { createObjectURL() { return 'blob:receipt'; }, revokeObjectURL() {} },
  Blob: global.Blob,
  CustomEvent: class CustomEvent { constructor(type, init = {}) { this.type = type; this.detail = init.detail; } }
};

const context = {
  document,
  window,
  localStorage,
  console,
  navigator: {},
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
  Blob: global.Blob,
  URL: window.URL,
  location: window.location,
  history: { replaceState() {} }
};
context.window.window = window;
context.window.document = document;
context.window.localStorage = localStorage;
context.window.navigator = navigator;
context.global = context;
context.globalThis = context;

makeElement('trackBookingId');
makeElement('trackService');
makeElement('trackAddress');
makeElement('trackDate');
makeElement('trackTime');
makeElement('trackTimeline');
makeElement('trackStatusBadge');
makeElement('trackStatusMessage');

localStorage.setItem('bookingHistory', JSON.stringify([{ id: 'UC-1001', service: 'Chimney Basic Cleaning', address: '1 Main Road', date: '2026-07-10', time: '10:30', bookingStatus: 'Technician On The Way', bookingTime: '2026-07-04' }]));
localStorage.setItem('bookingId', 'UC-1001');
localStorage.setItem('selectedService', 'Chimney Basic Cleaning');
localStorage.setItem('address', '1 Main Road');
localStorage.setItem('date', '2026-07-10');
localStorage.setItem('time', '10:30');

const appScript = fs.readFileSync(path.join(__dirname, '..', 'app.js'), 'utf8');
vm.createContext(context);
vm.runInContext(appScript, context);
document._domReadyHandler();

const badge = elements.trackStatusBadge;
const message = elements.trackStatusMessage;
const timeline = elements.trackTimeline;

assert.ok(badge && badge.textContent.includes('Technician On The Way'), 'Tracking page should show the latest booking status badge');
assert.ok(message && message.textContent.includes('Technician is on the way'), 'Tracking page should show a status message for the current booking');
assert.ok(timeline && timeline.innerHTML.includes('timeline-item active'), 'Tracking page should render active timeline steps for the current status');

console.log('Booking status tracking tests passed');
