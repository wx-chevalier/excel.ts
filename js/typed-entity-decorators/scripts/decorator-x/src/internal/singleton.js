// @flow

export type InnerEntityObject = {
  // 实体类名
  [string]: {
    // 是否为必要属性的列表
    required: [string],

    // 实体类属性信息
    properties: InnerEntityProperty
  }
};

export type InnerEntityProperty = {
  // 属性名
  [string]: {
    // 属性类型
    type: string
  }
};


export const innerAPIObject = {};

export const innerEntityObject: InnerEntityObject = {};
