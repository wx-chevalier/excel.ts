// @flow
import { extractRulesFromClass, instantiate } from "../../src/entity/factory";
import User from "../../demo/entity/auth/User";
import UserProperty from "../../demo/entity/auth/UserProperty";

describe("测试实体类信息抽取", () => {
  test("测试 User 类校验规则提取", () => {
    expect(extractRulesFromClass(User)).toMatchObject({
      id: "required",
      email: "email"
    });
  });
});

describe("测试实体类实例化函数", () => {
  test("测试 User 类实例化校验", () => {
    expect(() => {
      instantiate(User, {
        name: "name"
      }).toThrowError(/validate fail!/);
    });

    let user = instantiate(User, {
      id: 0,
      name: "name",
      email: "a@q.com"
    });

    // 判断是否为 User 实例
    expect(user).toBeInstanceOf(User);
  });

  test("测试 ignore 参数可以允许忽略校验", () => {
    instantiate(
      User,
      {
        name: "name"
      },
      {
        ignore: true
      }
    );
  });

  test("测试 strict 参数可以控制是否忽略额外参数", () => {
    let user = instantiate(
      User,
      {
        name: "name",
        external: "external"
      },
      {
        ignore: true,
        strict: true
      }
    );

    expect(user).not.toHaveProperty("external", "external");

    user = instantiate(
      User,
      {
        name: "name",
        external: "external"
      },
      {
        ignore: true,
        strict: false
      }
    );

    expect(user).toHaveProperty("external", "external");
  });
});

describe("测试嵌套实例生成", () => {
  test("测试可以递归生成嵌套实体类", () => {
    let user = instantiate(User, {
      id: 0,
      property: {
        friends: [0]
      }
    });

    expect(user.property).toBeInstanceOf(UserProperty);
  });
});

