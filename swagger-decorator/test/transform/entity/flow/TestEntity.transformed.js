// @flow

import { entityProperty } from 'swagger-decorator';

import AnotherEntity from './AnotherEntity';

class Entity {
  // Comment
  @entityProperty({
    type: 'string',
    required: false,
    description: 'Comment'
  })
  stringProperty: string = 0;

  @entityProperty({
    type: Entity,
    required: false
  })
  classProperty: Entity = null;

  @entityProperty({
    type: 'string',
    required: false
  })
  rawProperty;

  @entityProperty({
    type: 'string',
    description: 'this is property description',
    required: true
  })
  decoratedProperty;
}
