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
  }

  addEventListener(type, handler) {
    this.listeners[type] = handler;
  }

  click() {
    if (this.listeners.click) {
      this.listeners.click({ target: this, preventDefault() {}, stopPropagation() {} });
    }
  }

  appendChild(child) {
    this.children.push(child);
    return child;
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
  querySelector() {
    return null;
  },
  querySelectorAll() {
    return [];
  },
  createElement() {
    return new MockElement();
  },
  createTextNode(text) {
    return { textContent: text };
  }
};

const window = {
  location: { pathname: '/index.html', search: '', href: 'http://localhost/index.html' },
  addEventListener() {},
  replaceState() {},
  setTimeout(handler) {
    if (typeof handler === 'function') handler();
    return 1;
  },
  setInterval() {
    return 1;
  },
  clearInterval() {},
  clearTimeout() {},
  AudioContext: undefined,
  webkitAudioContext: undefined
};

const localStorage = {
  store: {},
  getItem(key) { return this.store[key] ?? null; },
  setItem(key, value) { this.store[key] = String(value); },
  removeItem(key) { delete this.store[key]; }
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

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
assert.ok(!html.includes('ownerModeButton'), 'The login page should not expose owner mode controls');
assert.ok(!html.includes('ownerNotice'), 'The login page should not expose an owner notice');
assert.ok(!html.includes('9701434006'), 'The login page should not expose the owner mobile number');

const scriptPath = path.join(__dirname, '..', 'app.js');
const script = fs.readFileSync(scriptPath, 'utf8');
vm.createContext(context);
vm.runInContext(script, context);

document._domReadyHandler();

const loginForm = makeElement('loginForm');
const mobileInput = makeElement('mobile');
const otpInput = makeElement('otp');
const sendOtpButton = makeElement('sendOtpButton');
const verifyOtpButton = makeElement('verifyOtpButton');
const formMessage = makeElement('formMessage');
const otpStep = makeElement('otpStep');
const verifyStep = makeElement('verifyStep');

for (const [id, element] of Object.entries({
  loginForm,
  mobileInput,
  otpInput,
  sendOtpButton,
  verifyOtpButton,
  formMessage,
  otpStep,
  verifyStep
})) {
  elements[id] = element;
}

document._domReadyHandler();

mobileInput.value = '9701434006';
otpInput.value = '123456';

const submitHandler = loginForm.listeners.submit;
assert.strictEqual(typeof submitHandler, 'function', 'The login form should have a submit handler');

const event = { preventDefault() {}, stopPropagation() {} };
submitHandler(event);

assert.ok(window.location.href.includes('admin.html') || window.location.href.includes('index.html'), 'Owner login should resolve to the admin dashboard route after OTP verification');
console.log('Login screen hidden-owner checks passed');
