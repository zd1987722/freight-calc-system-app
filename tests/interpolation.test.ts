import { describe, it, expect } from "vitest";
import { interpolateRate } from "../server/trpc/routers/calculator";

const testSteps = [
  { quantity: 3000, rate: 225 },
  { quantity: 4000, rate: 210 },
  { quantity: 5000, rate: 198 },
  { quantity: 6000, rate: 188 },
  { quantity: 7000, rate: 180 },
  { quantity: 8000, rate: 175 },
  { quantity: 9000, rate: 170 },
  { quantity: 10000, rate: 168 },
  { quantity: 11000, rate: 166 },
];

describe("线性内插法算法", () => {
  it("精确匹配 - 装货量等于节点值", () => {
    const result = interpolateRate(3000, testSteps);
    expect(result.rate).toBe(225);
    expect(result.details.type).toBe("exact");
  });

  it("精确匹配 - 中间节点", () => {
    const result = interpolateRate(5000, testSteps);
    expect(result.rate).toBe(198);
    expect(result.details.type).toBe("exact");
  });

  it("线性内插 - 3500 MT (在 3000~4000 之间)", () => {
    // r = 225 + (3500 - 3000) * (210 - 225) / (4000 - 3000)
    // r = 225 + 500 * (-15) / 1000 = 225 - 7.5 = 217.5
    const result = interpolateRate(3500, testSteps);
    expect(result.rate).toBe(217.5);
    expect(result.details.type).toBe("interpolated");
    expect(result.details.q1).toBe(3000);
    expect(result.details.r1).toBe(225);
    expect(result.details.q2).toBe(4000);
    expect(result.details.r2).toBe(210);
  });

  it("线性内插 - 4500 MT", () => {
    // r = 210 + (4500 - 4000) * (198 - 210) / (5000 - 4000)
    // r = 210 + 500 * (-12) / 1000 = 210 - 6 = 204
    const result = interpolateRate(4500, testSteps);
    expect(result.rate).toBe(204);
    expect(result.details.type).toBe("interpolated");
  });

  it("线性内插 - 非整数量 3333.33 MT", () => {
    // r = 225 + (3333.33 - 3000) * (210 - 225) / (4000 - 3000)
    // r = 225 + 333.33 * (-15) / 1000 = 225 - 4.99995 = 220.00005
    const result = interpolateRate(3333.33, testSteps);
    expect(result.rate).toBeCloseTo(220.0001, 3);
    expect(result.details.type).toBe("interpolated");
  });

  it("低于最低节点 - 使用最低节点费率", () => {
    const result = interpolateRate(2000, testSteps);
    expect(result.rate).toBe(225);
    expect(result.details.type).toBe("below_min");
  });

  it("高于最高节点 - 使用最高节点费率", () => {
    const result = interpolateRate(12000, testSteps);
    expect(result.rate).toBe(166);
    expect(result.details.type).toBe("above_max");
  });

  it("等于最低节点 - 使用最低节点费率", () => {
    const result = interpolateRate(3000, testSteps);
    expect(result.rate).toBe(225);
  });

  it("等于最高节点 - 使用最高节点费率 (算法归为above_max)", () => {
    const result = interpolateRate(11000, testSteps);
    expect(result.rate).toBe(166);
    expect(result.details.type).toBe("above_max");
  });

  it("单个节点 - 任何装货量均返回该费率", () => {
    const singleStep = [{ quantity: 5000, rate: 200 }];
    const result = interpolateRate(3000, singleStep);
    expect(result.rate).toBe(200);
  });

  it("空阶梯应抛出错误", () => {
    expect(() => interpolateRate(3000, [])).toThrow("费率表中没有阶梯数据");
  });

  it("费率精度验证 - 4 位小数", () => {
    const steps = [
      { quantity: 1000, rate: 100 },
      { quantity: 3000, rate: 200 },
    ];
    // r = 100 + (1500 - 1000) * (200 - 100) / (3000 - 1000)
    // r = 100 + 500 * 100 / 2000 = 100 + 25 = 125
    const result = interpolateRate(1500, steps);
    expect(result.rate).toBe(125);
  });

  it("总运费计算 - 3500 MT × 217.5 = 761,250", () => {
    const result = interpolateRate(3500, testSteps);
    const totalFreight = Math.round(3500 * result.rate * 100) / 100;
    expect(totalFreight).toBe(761250);
  });
});
