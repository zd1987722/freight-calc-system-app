import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Users as UsersIcon, Plus, Shield, ShieldOff, UserCheck, UserX, KeyRound } from "lucide-react";

export default function UsersPage() {
  const { data: userList, refetch } = trpc.userAdmin.list.useQuery();
  const setRoleMutation = trpc.userAdmin.setRole.useMutation();
  const setActiveMutation = trpc.userAdmin.setActive.useMutation();
  const createMutation = trpc.userAdmin.createLocal.useMutation();
  const resetPwdMutation = trpc.userAdmin.resetPassword.useMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [showReset, setShowReset] = useState<number | null>(null);
  const [form, setForm] = useState({ name: "", username: "", email: "", phone: "", password: "", role: "user" as "user" | "admin" });
  const [newPwd, setNewPwd] = useState("");

  const handleToggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === "admin" ? "user" : "admin";
    try {
      await setRoleMutation.mutateAsync({ id, role: newRole });
      toast.success(`已切换为${newRole === "admin" ? "管理员" : "操作员"}`);
      refetch();
    } catch { toast.error("操作失败"); }
  };

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await setActiveMutation.mutateAsync({ id, isActive: !isActive });
      toast.success(isActive ? "已禁用" : "已启用");
      refetch();
    } catch { toast.error("操作失败"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createMutation.mutateAsync(form);
      toast.success("用户创建成功");
      setShowCreate(false);
      setForm({ name: "", username: "", email: "", phone: "", password: "", role: "user" });
      refetch();
    } catch (e: any) { toast.error(e.message || "创建失败"); }
  };

  const handleResetPassword = async () => {
    if (!showReset || !newPwd) return;
    try {
      await resetPwdMutation.mutateAsync({ id: showReset, newPassword: newPwd });
      toast.success("密码已重置");
      setShowReset(null);
      setNewPwd("");
    } catch { toast.error("重置失败"); }
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <UsersIcon size={28} /> 用户管理
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>管理系统用户及权限</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowCreate(true)}>
          <Plus size={16} /> 创建用户
        </button>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        <table className="data-table">
          <thead>
            <tr><th>用户名</th><th>姓名</th><th>邮箱</th><th>手机</th><th>角色</th><th>状态</th><th>最后登录</th><th style={{ textAlign: "center" }}>操作</th></tr>
          </thead>
          <tbody>
            {userList?.map(u => (
              <tr key={u.id}>
                <td style={{ fontWeight: 500, color: "var(--text)" }}>{u.username || "-"}</td>
                <td>{u.name || "-"}</td>
                <td style={{ fontSize: 13 }}>{u.email || "-"}</td>
                <td style={{ fontSize: 13 }}>{u.phone || "-"}</td>
                <td>
                  <span className={`badge ${u.role === "admin" ? "badge-warning" : "badge-primary"}`}>
                    {u.role === "admin" ? "管理员" : "操作员"}
                  </span>
                </td>
                <td>
                  <span className={`badge ${u.isActive ? "badge-success" : "badge-danger"}`}>
                    {u.isActive ? "启用" : "禁用"}
                  </span>
                </td>
                <td style={{ fontSize: 12, color: "var(--text-muted)" }}>{u.lastSignedIn?.replace("T", " ").slice(0, 19) || "-"}</td>
                <td style={{ textAlign: "center" }}>
                  <div style={{ display: "flex", gap: 4, justifyContent: "center" }}>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleToggleRole(u.id, u.role)} title="切换角色">
                      {u.role === "admin" ? <ShieldOff size={13} /> : <Shield size={13} />}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => handleToggleActive(u.id, u.isActive)} title={u.isActive ? "禁用" : "启用"}>
                      {u.isActive ? <UserX size={13} /> : <UserCheck size={13} />}
                    </button>
                    <button className="btn btn-secondary btn-sm" onClick={() => { setShowReset(u.id); setNewPwd(""); }} title="重置密码">
                      <KeyRound size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 创建用户弹窗 */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>创建用户</h3>
            <form onSubmit={handleCreate}>
              <div style={{ display: "grid", gap: 14 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label className="form-label">用户名 *</label><input className="form-input" value={form.username} onChange={e => setForm({...form, username: e.target.value})} required /></div>
                  <div><label className="form-label">姓名 *</label><input className="form-input" value={form.name} onChange={e => setForm({...form, name: e.target.value})} required /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label className="form-label">邮箱</label><input className="form-input" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                  <div><label className="form-label">手机</label><input className="form-input" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                  <div><label className="form-label">密码 *</label><input className="form-input" type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={6} /></div>
                  <div>
                    <label className="form-label">角色 *</label>
                    <select className="form-select" value={form.role} onChange={e => setForm({...form, role: e.target.value as "user"|"admin"})}>
                      <option value="user">操作员</option>
                      <option value="admin">管理员</option>
                    </select>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowCreate(false)}>取消</button>
                <button type="submit" className="btn btn-primary">创建</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 重置密码弹窗 */}
      {showReset && (
        <div className="modal-overlay" onClick={() => setShowReset(null)}>
          <div className="modal-content" style={{ maxWidth: 400 }} onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: 20 }}>重置密码</h3>
            <div>
              <label className="form-label">新密码 *</label>
              <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} minLength={6} placeholder="至少6位" />
            </div>
            <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
              <button className="btn btn-secondary" onClick={() => setShowReset(null)}>取消</button>
              <button className="btn btn-primary" onClick={handleResetPassword} disabled={newPwd.length < 6}>确认重置</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
