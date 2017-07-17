// @flow

import observe from '../../src/proxy/observe';
import User from '../../../../../demo/entity/User';

const obj = observe(new User(), {
  recursive: true
});

obj.property = {};

obj.property.listen(changes => {
  console.log(changes);
  console.log('changes in obj');
});

obj.property.name = 1;

obj.property.arr = [];

obj.property.arr.listen(changes => {
  // console.log('changes in obj.arr');
});

// changes in the single event loop will be print out

setTimeout(() => {
  obj.property.arr.push(1);

  obj.property.arr.push(2);

  obj.property.arr.splice(0, 0, 3);
}, 500);