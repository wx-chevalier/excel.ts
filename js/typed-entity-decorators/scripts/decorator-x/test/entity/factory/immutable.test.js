// @flow

import { makeImmutable } from '../../../src/entity/factory/immutable';

const immutableArray = makeImmutable(['a', 'b', 'c']);

try {
  immutableArray[0] = 'd'; // klappt nicht
} catch (err) {
  console.error(err.message); // "Object is immutable"
} finally {
  console.log(immutableArray[0]); // "a"
}

try {
  immutableArray.push('d'); // klappt nicht
} catch (err) {
  console.error(err.message); // "Object is immutable"
} finally {
  console.log(immutableArray.length); // 3
}

const immutableObject = makeImmutable({ foo: 23 });

try {
  immutableObject.foo = 42; // klappt nicht
} catch (err) {
  console.error(err.message); // "Object is immutable"
} finally {
  console.log(immutableObject.foo); // 23
}

try {
  Object.defineProperty(immutableObject, 'bar', {
    value: 1337
  }); // klappt nicht
} catch (err) {
  console.error(err.message); // "Object is immutable"
} finally {
  console.log(immutableObject.bar); // undefined
}
