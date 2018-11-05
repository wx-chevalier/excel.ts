// @flow

import AnotherEntity from "./AnotherEntity";

class Entity {
  // Comment
  stringProperty: string = 0;

  classProperty: Entity = null;

  rawProperty;

  @entityProperty({
    type: "string",
    description: "this is property description",
    required: true
  })
  decoratedProperty;
}
