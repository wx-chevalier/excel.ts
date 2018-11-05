// @flow

function nope() {
  throw new Error('Object is immutable');
}

const objectHandler = {
  setPrototypeOf: nope,
  preventExtensions: nope,
  defineProperty: nope,
  deleteProperty: nope,
  set: nope
};

const blacklistedArrayMethods = [
  'copyWithin',
  'fill',
  'pop',
  'push',
  'reverse',
  'shift',
  'sort',
  'splice',
  'unshift'
];

const arrayHandler = Object.assign({}, objectHandler, {
  get(target, property) {
    if (blacklistedArrayMethods.includes(property)) {
      return nope;
    } else {
      return target[property];
    }
  }
});

export function makeImmutable(x) {
  if (Array.isArray(x)) {
    return new Proxy(x, arrayHandler);
  } else {
    return new Proxy(x, objectHandler);
  }
}
