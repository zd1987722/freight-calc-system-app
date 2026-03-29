// 共享类型定义

export interface LoginInput {
  credential: string;  // 用户名/邮箱/手机号
  password: string;
}

export interface CalculateInput {
  ownerId: number;
  loadPortId: number;
  dischargePortId: number;
  confirmedQuantity: number;
}

export interface CalculateResult {
  rate: number;
  totalFreight: number;
  details: {
    type: "exact" | "interpolated" | "below_min" | "above_max";
    q1?: number;
    r1?: number;
    q2?: number;
    r2?: number;
    formula?: string;
  };
}
