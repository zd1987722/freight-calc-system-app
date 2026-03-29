import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Ship, Plus, Pencil, Trash2 } from "lucide-react";

interface Props {
  user: { role: string };
}

export default function Owners({ user }: Props) {
  const { data: owners, refetch } = trpc.owner.list.useQuery();
  const createMutation = trpc.owner.create.useMutation();
  const updateMutation = trpc.owner.update.useMutation();
  const deleteMutation = trpc.owner.delete.useMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ name: "", code: "", contact: "", phone: "", remark: "" });

  const isAdmin = user.role === "admin";

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", contact: "", phone: "", remark: "" });
    setShowModal(true);
  };

  const openEdit = (o: any) => {
    setEditing(o);
    setForm({ name: o.name, code: o.code, contact: o.contact || "", phone: o.phone || "", remark: o.remark || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...form });
        toast.success("船东更新成功");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("船东创建成功");
      }
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确认删除船东「${name}」？`)) return;
    try {
      await deleteMutation.mutateAsync({ id });
      toast.success("已删除");
      refetch();
    } catch {
      toast.error("删除失败");
    }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <Ship size={28} /> 船东管理
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            管理船东基础信息
          </p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> 新增船东
          </button>
        )}
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr>
              <th>船东代码</th>
              <th>船东名称</th>
              <th>联系人</th>
              <th>电话</th>
              <th>备注</th>
              {isAdmin && <th style={{ textAlign: "center" }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {owners?.map(o => (
              <tr key={o.id}>
                <td><span className="badge badge-primary">{o.code}</span></td>
                <td style={{ fontWeight: 500, color: "var(--text)" }}>{o.name}</td>
                <td>{o.contact || "-"}</td>
                <td>{o.phone || "-"}</td>
                <td style={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>{o.remark || "-"}</td>
                {isAdmin && (
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(o)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(o.id, o.name)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!owners?.length && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>暂无船东数据</div>}
      </div>

      {/* 新增/编辑模态框 */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>
              {editing ? "编辑船东" : "新增船东"}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="form-label">船东名称 *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required />
                </div>
                <div>
                  <label className="form-label">船东代码 *</label>
                  <input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required disabled={!!editing} />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">联系人</label>
                    <input className="form-input" value={form.contact} onChange={e => setForm({...form, contact: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">电话</label>
                    <input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                  </div>
                </div>
                <div>
                  <label className="form-label">备注</label>
                  <input className="form-input" value={form.remark} onChange={e => setForm({...form, remark: e.target.value})} />
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
