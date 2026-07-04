const assert = require('assert');
const fs = require('fs');
const path = require('path');
const vm = require('vm');

class MockClassList {
  constructor(element) {
    this.element = element;
    this.values = new Set();
  }

  add(...tokens) {
    tokens.forEach((token) => this.values.add(token));
    this.element.className = Array.from(this.values).join(' ');
  }

  remove(...tokens) {
    tokens.forEach((token) => this.values.delete(token));
    this.element.className = Array.from(this.values).join(' ');
  }

  toggle(token, force) {
    if (force === undefined) {
      if (this.values.has(token)) {
        this.values.delete(token);
      } else {
        this.values.add(token);
      }
    } else if (force) {
      this.values.add(token);
    } else {
      this.values.delete(token);
    }
    this.element.className = Array.from(this.values).join(' ');
    return this.values.has(token);
  }

  contains(token) {
    return this.values.has(token);
  }
}

class MockElement {
  constructor(id = '') {
    this.id = id;
    this.value = '';
    this.textContent = '';
    this.hidden = false;
    this.disabled = false;
    this.dataset = {};
    this.className = '';
    this.classList = new MockClassList(this);
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

  querySelector() {
    return null;
  }

  querySelectorAll() {
    return [];
  }

  closest() {
    return null;
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
  location: { pathname: '/index.html', search: '', href: 'http://localhost/index.html', replace() {} },
  addEventListener() {},
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

const scriptPath = path.join(__dirname, '..', 'app.js');
const script = fs.readFileSync(scriptPath, 'utf8');
vm.createContext(context);
vm.runInContext(script, context);

document._domReadyHandler();

const customerModeButton = makeElement('customerModeButton');
const ownerModeButton = makeElement('ownerModeButton');
const ownerNotice = makeElement('ownerNotice');
const loginForm = makeElement('loginForm');
const mobileInput = makeElement('mobile');
const otpInput = makeElement('otp');
const sendOtpButton = makeElement('sendOtpButton');
const verifyOtpButton = makeElement('verifyOtpButton');
const formMessage = makeElement('formMessage');
const otpStep = makeElement('otpStep');
const verifyStep = makeElement('verifyStep');

const elementsById = {
  customerModeButton,
  ownerModeButton,
  ownerNotice,
  loginForm,
  mobileInput,
  otpInput,
  sendOtpButton,
  verifyOtpButton,
  formMessage,
  otpStep,
  verifyStep
};

Object.entries(elementsById).forEach(([id, element]) => {
  elements[id] = element;
});

// Re-run the DOMContentLoaded callback with the mocked elements available.
document._domReadyHandler();

ownerModeButton.click();
assert.strictEqual(ownerNotice.hidden, false, 'Owner notice should become visible in owner mode');
assert.strictEqual(ownerNotice.getAttribute('hidden'), null, 'Owner notice should not keep the hidden attribute in owner mode');
assert.ok(ownerNotice.classList.contains('is-visible'), 'Owner notice should expose a visible state class');

customerModeButton.click();
assert.strictEqual(ownerNotice.hidden, true, 'Owner notice should hide again in customer mode');
assert.strictEqual(ownerNotice.getAttribute('hidden'), '', 'Owner notice should regain the hidden attribute in customer mode');

console.log('Login mode toggle tests passed');
