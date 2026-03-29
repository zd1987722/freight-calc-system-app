import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Table2, Plus, Pencil, Trash2, Eye, ChevronDown, ChevronUp } from "lucide-react";

interface Props {
  user: { role: string };
}

export default function RateTables({ user }: Props) {
  const { data: tables, refetch } = trpc.rateTable.list.useQuery();
  const { data: owners } = trpc.owner.list.useQuery();
  const { data: portList } = trpc.port.list.useQuery();
  const deleteMutation = trpc.rateTable.delete.useMutation();
  const createMutation = trpc.rateTable.create.useMutation();
  const updateMutation = trpc.rateTable.update.useMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [form, setForm] = useState({
    ownerId: 0, loadPortId: 0, dischargePortId: 0,
    validFrom: "", validTo: "",
    steps: [{ quantity: "", rate: "" }] as Array<{ quantity: string; rate: string }>,
  });

  const isAdmin = user.role === "admin";

  const { data: expandedDetail } = trpc.rateTable.getById.useQuery(
    { id: expandedId! },
    { enabled: expandedId !== null }
  );

  const openCreate = () => {
    setEditing(null);
    setForm({
      ownerId: 0, loadPortId: 0, dischargePortId: 0,
      validFrom: new Date().toISOString().slice(0, 10),
      validTo: new Date(Date.now() + 365 * 86400000).toISOString().slice(0, 10),
      steps: [{ quantity: "", rate: "" }],
    });
    setShowModal(true);
  };

  const openEdit = async (t: any) => {
    setEditing(t);
    // 获取详情
    const detail = expandedDetail?.id === t.id ? expandedDetail : null;
    setForm({
      ownerId: t.ownerId, loadPortId: t.loadPortId, dischargePortId: t.dischargePortId,
      validFrom: t.validFrom, validTo: t.validTo,
      steps: detail?.steps?.map((s: any) => ({ quantity: String(s.quantity), rate: String(s.rate) })) || [{ quantity: "", rate: "" }],
    });
    setShowModal(true);
  };

  const addStep = () => setForm({ ...form, steps: [...form.steps, { quantity: "", rate: "" }] });
  const removeStep = (i: number) => setForm({ ...form, steps: form.steps.filter((_, idx) => idx !== i) });
  const updateStep = (i: number, field: "quantity" | "rate", val: string) => {
    const steps = [...form.steps];
    steps[i] = { ...steps[i], [field]: val };
    setForm({ ...form, steps });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const steps = form.steps.map(s => ({ quantity: parseFloat(s.quantity), rate: parseFloat(s.rate) })).filter(s => !isNaN(s.quantity) && !isNaN(s.rate));
    if (steps.length === 0) { toast.error("至少需要一个阶梯数据"); return; }

    try {
      if (editing) {
        await updateMutation.mutateAsync({
          id: editing.id, validFrom: form.validFrom, validTo: form.validTo, steps,
        });
        toast.success("费率表更新成功");
      } else {
        if (!form.ownerId || !form.loadPortId || !form.dischargePortId) {
          toast.error("请选择完整的航线信息");
          return;
        }
        await createMutation.mutateAsync({
          ownerId: form.ownerId, loadPortId: form.loadPortId, dischargePortId: form.dischargePortId,
          validFrom: form.validFrom, validTo: form.validTo, steps,
        });
        toast.success("费率表创建成功");
      }
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("确认删除此费率表？")) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("已删除");
      refetch();
    } catch { toast.error("删除失败"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Table2 size={28} /> 费率表管理
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>管理船东航线费率与阶梯定价</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}><Plus size={16} /> 新增费率表</button>
        )}
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>船东</th><th>装货港</th><th>卸货港</th><th>有效期</th><th>状态</th>
              <th style={{ textAlign: "center" }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {tables?.map((t: any) => (
              <>
                <tr key={t.id}>
                  <td style={{ fontWeight: 500, color: "var(--text)" }}>{t.owner?.name || "-"}</td>
                  <td>{t.loadPort?.nameCn || "-"}</td>
                  <td>{t.dischargePort?.nameCn || "-"}</td>
                  <td style={{ fontSize: 13 }}>{t.validFrom} ~ {t.validTo}</td>
                  <td>
                    <span className={`badge ${t.status ? "badge-success" : "badge-danger"}`}>
                      {t.status ? "有效" : "无效"}
                    </span>
                  </td>
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => setExpandedId(expandedId === t.id ? null : t.id)}>
                        {expandedId === t.id ? <ChevronUp size={13} /> : <Eye size={13} />}
                      </button>
                      {isAdmin && (
                        <>
                          <button className="btn btn-secondary btn-sm" onClick={() => openEdit(t)}><Pencil size={13} /></button>
                          <button className="btn btn-danger btn-sm" onClick={() => handleDelete(t.id)}><Trash2 size={13} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
                {expandedId === t.id && expandedDetail && (
                  <tr key={`detail-${t.id}`}>
                    <td colSpan={6} style={{ padding: 0 }}>
                      <div style={{ padding: "16px 24px", background: "rgba(99,102,241,0.03)" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 10, color: "var(--text)" }}>📊 阶梯费率明细</div>
                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 8 }}>
                          {expandedDetail.steps?.map((s: any, i: number) => (
                            <div key={i} style={{
                              background: "var(--surface)", padding: "8px 12px", borderRadius: 8,
                              border: "1px solid rgba(71,85,105,0.3)", fontSize: 13,
                            }}>
                              <div style={{ color: "var(--text-muted)", fontSize: 11 }}>装货量</div>
                              <div style={{ fontWeight: 600, color: "var(--text)" }}>{s.quantity.toLocaleString()} MT</div>
                              <div style={{ color: "var(--accent)", fontWeight: 500 }}>¥{s.rate}/MT</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
        {!tables?.length && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>暂无费率表数据</div>}
      </div>

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" style={{ maxWidth: 640 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>{editing ? "编辑费率表" : "新增费率表"}</h3>
            <form onSubmit={handleSubmit}>
              {!editing && (
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginBottom: 14 }}>
                  <div>
                    <label className="form-label">船东 *</label>
                    <select className="form-select" value={form.ownerId} onChange={e => setForm({...form, ownerId: +e.target.value})} required>
                      <option value={0}>选择船东</option>
                      {owners?.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">装货港 *</label>
                    <select className="form-select" value={form.loadPortId} onChange={e => setForm({...form, loadPortId: +e.target.value})} required>
                      <option value={0}>选择装货港</option>
                      {portList?.map(p => <option key={p.id} value={p.id}>{p.nameCn}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="form-label">卸货港 *</label>
                    <select className="form-select" value={form.dischargePortId} onChange={e => setForm({...form, dischargePortId: +e.target.value})} required>
                      <option value={0}>选择卸货港</option>
                      {portList?.map(p => <option key={p.id} value={p.id}>{p.nameCn}</option>)}
                    </select>
                  </div>
                </div>
              )}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 18 }}>
                <div>
                  <label className="form-label">生效日期 *</label>
                  <input className="form-input" type="date" value={form.validFrom} onChange={e => setForm({...form, validFrom: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">失效日期 *</label>
                  <input className="form-input" type="date" value={form.validTo} onChange={e => setForm({...form, validTo: e.target.value})} required />
                </div>
              </div>

              <div style={{ marginBottom: 14 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                  <label className="form-label" style={{ margin: 0 }}>阶梯费率 *</label>
                  <button type="button" className="btn btn-secondary btn-sm" onClick={addStep}><Plus size={12} /> 添加</button>
                </div>
                <div style={{ display: "grid", gap: 8 }}>
                  {form.steps.map((s, i) => (
                    <div key={i} style={{ display: "grid", gridTemplateColumns: "1fr 1fr 40px", gap: 8, alignItems: "end" }}>
                      <div>
                        {i === 0 && <label className="form-label">装货量 (MT)</label>}
                        <input className="form-input" type="number" step="0.01" placeholder="装货量" value={s.quantity} onChange={e => updateStep(i, "quantity", e.target.value)} required />
                      </div>
                      <div>
                        {i === 0 && <label className="form-label">费率 (¥/MT)</label>}
                        <input className="form-input" type="number" step="0.0001" placeholder="费率" value={s.rate} onChange={e => updateStep(i, "rate", e.target.value)} required />
                      </div>
                      <button type="button" className="btn btn-danger btn-sm" style={{ height: 40 }} onClick={() => removeStep(i)} disabled={form.steps.length <= 1}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>取消</button>
                <button type="submit" className="btn btn-primary">确认</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
