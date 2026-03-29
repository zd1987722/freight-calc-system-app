import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Anchor, Plus, Pencil, Trash2 } from "lucide-react";

interface Props {
  user: { role: string };
}

export default function Ports({ user }: Props) {
  const { data: portList, refetch } = trpc.port.list.useQuery();
  const createMutation = trpc.port.create.useMutation();
  const updateMutation = trpc.port.update.useMutation();
  const deleteMutation = trpc.port.delete.useMutation();

  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState({ code: "", nameCn: "", nameEn: "", country: "" });

  const isAdmin = user.role === "admin";

  const openCreate = () => {
    setEditing(null);
    setForm({ code: "", nameCn: "", nameEn: "", country: "" });
    setShowModal(true);
  };

  const openEdit = (p: any) => {
    setEditing(p);
    setForm({ code: p.code, nameCn: p.nameCn, nameEn: p.nameEn || "", country: p.country || "" });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        await updateMutation.mutateAsync({ id: editing.id, ...form });
        toast.success("港口更新成功");
      } else {
        await createMutation.mutateAsync(form);
        toast.success("港口创建成功");
      }
      setShowModal(false);
      refetch();
    } catch (e: any) {
      toast.error(e.message || "操作失败");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`确认删除港口「${name}」？`)) return;
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
            <Anchor size={28} /> 港口管理
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>管理港口基础信息</p>
        </div>
        {isAdmin && (
          <button className="btn btn-primary" onClick={openCreate}>
            <Plus size={16} /> 新增港口
          </button>
        )}
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead><tr><th>港口代码</th><th>中文名</th><th>英文名</th><th>国家</th>{isAdmin && <th style={{ textAlign: "center" }}>操作</th>}</tr></thead>
          <tbody>
            {portList?.map(p => (
              <tr key={p.id}>
                <td><span className="badge badge-primary">{p.code}</span></td>
                <td style={{ fontWeight: 500, color: "var(--text)" }}>{p.nameCn}</td>
                <td>{p.nameEn || "-"}</td>
                <td>{p.country || "-"}</td>
                {isAdmin && (
                  <td style={{ textAlign: "center" }}>
                    <div style={{ display: "flex", gap: 6, justifyContent: "center" }}>
                      <button className="btn btn-secondary btn-sm" onClick={() => openEdit(p)}><Pencil size={13} /></button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(p.id, p.nameCn)}><Trash2 size={13} /></button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {!portList?.length && <div style={{ padding: 40, textAlign: "center", color: "var(--text-muted)" }}>暂无港口数据</div>}
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>{editing ? "编辑港口" : "新增港口"}</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: "grid", gap: 14 }}>
                <div>
                  <label className="form-label">港口代码 *</label>
                  <input className="form-input" value={form.code} onChange={e => setForm({...form, code: e.target.value})} required disabled={!!editing} />
                </div>
                <div>
                  <label className="form-label">中文名 *</label>
                  <input className="form-input" value={form.nameCn} onChange={e => setForm({...form, nameCn: e.target.value})} required />
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div>
                    <label className="form-label">英文名</label>
                    <input className="form-input" value={form.nameEn} onChange={e => setForm({...form, nameEn: e.target.value})} />
                  </div>
                  <div>
                    <label className="form-label">国家</label>
                    <input className="form-input" value={form.country} onChange={e => setForm({...form, country: e.target.value})} />
                  </div>
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
