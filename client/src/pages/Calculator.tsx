import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Calculator as CalcIcon, ArrowRight, Info, Zap } from "lucide-react";

export default function Calculator() {
  const [ownerId, setOwnerId] = useState<number>(0);
  const [loadPortId, setLoadPortId] = useState<number>(0);
  const [dischargePortId, setDischargePortId] = useState<number>(0);
  const [quantity, setQuantity] = useState("");
  const [result, setResult] = useState<{
    rate: number; totalFreight: number;
    details: { type: string; q1?: number; r1?: number; q2?: number; r2?: number; formula?: string };
  } | null>(null);

  const { data: owners } = trpc.owner.list.useQuery();
  const { data: availablePorts } = trpc.calculate.getAvailablePorts.useQuery(
    { ownerId },
    { enabled: ownerId > 0 }
  );
  const { data: dischargePorts } = trpc.calculate.getAvailableDischargePorts.useQuery(
    { ownerId, loadPortId },
    { enabled: ownerId > 0 && loadPortId > 0 }
  );

  const computeMutation = trpc.calculate.compute.useMutation();

  const handleCalculate = async () => {
    if (!ownerId || !loadPortId || !dischargePortId || !quantity) {
      toast.error("请填写完整信息");
      return;
    }
    const qty = parseFloat(quantity);
    if (isNaN(qty) || qty <= 0) {
      toast.error("装货量必须大于0");
      return;
    }
    try {
      const res = await computeMutation.mutateAsync({
        ownerId, loadPortId, dischargePortId, confirmedQuantity: qty,
      });
      setResult(res);
      toast.success("计算完成");
    } catch (e: any) {
      toast.error(e.message || "计算失败");
    }
  };

  const handleOwnerChange = (id: number) => {
    setOwnerId(id);
    setLoadPortId(0);
    setDischargePortId(0);
    setResult(null);
  };

  const handleLoadPortChange = (id: number) => {
    setLoadPortId(id);
    setDischargePortId(0);
    setResult(null);
  };

  const typeLabels: Record<string, string> = {
    exact: "精确匹配",
    interpolated: "线性内插",
    below_min: "低于最低节点",
    above_max: "高于最高节点",
  };

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <CalcIcon size={28} /> 运费计算
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
          选择航线信息并输入装货量，系统将自动计算运费
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 左侧：输入表单 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Zap size={18} style={{ color: "var(--accent)" }} /> 计算参数
          </h2>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">船东</label>
            <select id="calc-owner" className="form-select" value={ownerId} onChange={e => handleOwnerChange(+e.target.value)}>
              <option value={0}>请选择船东</option>
              {owners?.map(o => <option key={o.id} value={o.id}>{o.name} ({o.code})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">装货港</label>
            <select id="calc-load-port" className="form-select" value={loadPortId} onChange={e => handleLoadPortChange(+e.target.value)} disabled={!ownerId}>
              <option value={0}>{ownerId ? "请选择装货港" : "请先选择船东"}</option>
              {availablePorts?.loadPorts?.map(p => <option key={p.id} value={p.id}>{p.nameCn} ({p.code})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 16 }}>
            <label className="form-label">卸货港</label>
            <select id="calc-discharge-port" className="form-select" value={dischargePortId} onChange={e => { setDischargePortId(+e.target.value); setResult(null); }} disabled={!loadPortId}>
              <option value={0}>{loadPortId ? "请选择卸货港" : "请先选择装货港"}</option>
              {dischargePorts?.map(p => <option key={p.id} value={p.id}>{p.nameCn} ({p.code})</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 24 }}>
            <label className="form-label">确认装货量 (MT)</label>
            <input
              id="calc-quantity"
              className="form-input"
              type="number"
              step="0.01"
              placeholder="请输入装货量"
              value={quantity}
              onChange={e => { setQuantity(e.target.value); setResult(null); }}
            />
          </div>

          <button id="calc-submit" className="btn btn-primary" style={{ width: "100%", padding: 12 }} onClick={handleCalculate} disabled={computeMutation.isPending}>
            {computeMutation.isPending ? "计算中..." : "开始计算"}
          </button>
        </div>

        {/* 右侧：计算结果 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20, display: "flex", alignItems: "center", gap: 8 }}>
            <Info size={18} style={{ color: "var(--primary-light)" }} /> 计算结果
          </h2>

          {result ? (
            <div className="animate-fade-in">
              {/* 结果卡片 */}
              <div style={{
                background: "var(--gradient-primary)", borderRadius: 16, padding: 24,
                marginBottom: 20, position: "relative", overflow: "hidden",
              }}>
                <div style={{
                  position: "absolute", top: -20, right: -20,
                  width: 120, height: 120, borderRadius: "50%",
                  background: "rgba(255,255,255,0.08)",
                }} />
                <div style={{ fontSize: 13, opacity: 0.8, marginBottom: 4 }}>总运费</div>
                <div style={{ fontSize: 36, fontWeight: 800, marginBottom: 8 }}>
                  ¥{result.totalFreight.toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 16, fontSize: 13, opacity: 0.9 }}>
                  <span>费率: ¥{result.rate}/MT</span>
                  <span>|</span>
                  <span>装货量: {quantity} MT</span>
                </div>
              </div>

              {/* 计算详情 */}
              <div style={{
                background: "rgba(99,102,241,0.06)", borderRadius: 12, padding: 16,
                border: "1px solid rgba(99,102,241,0.12)",
              }}>
                <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 12, color: "var(--text)" }}>
                  📊 计算详情
                </div>
                <div style={{ display: "grid", gap: 8, fontSize: 13, color: "var(--text-secondary)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>计算类型</span>
                    <span className="badge badge-primary">{typeLabels[result.details.type]}</span>
                  </div>
                  {result.details.q1 !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>下限节点</span>
                      <span>{result.details.q1} MT → ¥{result.details.r1}/MT</span>
                    </div>
                  )}
                  {result.details.q2 !== undefined && (
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>上限节点</span>
                      <span>{result.details.q2} MT → ¥{result.details.r2}/MT</span>
                    </div>
                  )}
                  {result.details.formula && (
                    <div style={{ marginTop: 8, padding: 10, borderRadius: 8, background: "var(--surface)", fontSize: 12, fontFamily: "monospace", color: "var(--accent)" }}>
                      {result.details.formula}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{
              display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
              height: 300, color: "var(--text-muted)", textAlign: "center",
            }}>
              <CalcIcon size={48} style={{ opacity: 0.2, marginBottom: 16 }} />
              <p style={{ fontSize: 14 }}>填写左侧参数后点击计算</p>
              <p style={{ fontSize: 12, marginTop: 4 }}>结果将在此处展示</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
