import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { User, Lock, Check } from "lucide-react";

export default function Profile() {
  const { data: profile } = trpc.profile.getProfile.useQuery();
  const changePwdMutation = trpc.profile.changePassword.useMutation();

  const [oldPwd, setOldPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");

  const handleChangePwd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPwd !== confirmPwd) {
      toast.error("两次密码不一致");
      return;
    }
    try {
      const res = await changePwdMutation.mutateAsync({ oldPassword: oldPwd, newPassword: newPwd });
      if (res.success) {
        toast.success("密码修改成功");
        setOldPwd(""); setNewPwd(""); setConfirmPwd("");
      } else {
        toast.error(res.message || "修改失败");
      }
    } catch { toast.error("操作失败"); }
  };

  // 密码强度计算
  const getStrength = (pwd: string) => {
    let score = 0;
    if (pwd.length >= 6) score++;
    if (pwd.length >= 10) score++;
    if (/[A-Z]/.test(pwd)) score++;
    if (/[0-9]/.test(pwd)) score++;
    if (/[^A-Za-z0-9]/.test(pwd)) score++;
    return score;
  };

  const strength = getStrength(newPwd);
  const strengthLabels = ["", "弱", "较弱", "一般", "较强", "强"];
  const strengthColors = ["", "#ef4444", "#f59e0b", "#eab308", "#22c55e", "#10b981"];

  return (
    <div>
      <div style={{ marginBottom: 28 }}>
        <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <User size={28} /> 个人设置
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>查看个人信息与修改密码</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24 }}>
        {/* 个人信息卡片 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>👤 账户信息</h2>
          {profile && (
            <div style={{ display: "grid", gap: 16 }}>
              {[
                { label: "用户名", value: profile.username },
                { label: "姓名", value: profile.name },
                { label: "邮箱", value: profile.email },
                { label: "手机号", value: profile.phone },
                { label: "角色", value: profile.role === "admin" ? "系统管理员" : "操作员" },
                { label: "注册时间", value: profile.createdAt?.replace("T", " ").slice(0, 19) },
              ].map(item => (
                <div key={item.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(71,85,105,0.2)" }}>
                  <span style={{ fontSize: 13, color: "var(--text-muted)" }}>{item.label}</span>
                  <span style={{ fontSize: 14, fontWeight: 500, color: "var(--text)" }}>{item.value || "-"}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 修改密码卡片 */}
        <div className="glass-card" style={{ padding: 24 }}>
          <h2 style={{ fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
            <Lock size={16} style={{ display: "inline", marginRight: 8 }} />修改密码
          </h2>
          <form onSubmit={handleChangePwd}>
            <div style={{ display: "grid", gap: 14 }}>
              <div>
                <label className="form-label">原密码</label>
                <input className="form-input" type="password" value={oldPwd} onChange={e => setOldPwd(e.target.value)} required />
              </div>
              <div>
                <label className="form-label">新密码</label>
                <input className="form-input" type="password" value={newPwd} onChange={e => setNewPwd(e.target.value)} required minLength={6} />
                {newPwd && (
                  <div style={{ marginTop: 8 }}>
                    <div style={{ display: "flex", gap: 4, marginBottom: 4 }}>
                      {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} style={{
                          height: 3, flex: 1, borderRadius: 2,
                          background: i <= strength ? strengthColors[strength] : "var(--surface-3)",
                          transition: "background 0.3s",
                        }} />
                      ))}
                    </div>
                    <span style={{ fontSize: 11, color: strengthColors[strength] }}>
                      密码强度：{strengthLabels[strength]}
                    </span>
                  </div>
                )}
              </div>
              <div>
                <label className="form-label">确认新密码</label>
                <input className="form-input" type="password" value={confirmPwd} onChange={e => setConfirmPwd(e.target.value)} required />
                {confirmPwd && newPwd && (
                  <div style={{ marginTop: 4, fontSize: 12 }}>
                    {confirmPwd === newPwd ? (
                      <span style={{ color: "var(--success)", display: "flex", alignItems: "center", gap: 4 }}>
                        <Check size={12} /> 密码一致
                      </span>
                    ) : (
                      <span style={{ color: "var(--danger)" }}>密码不一致</span>
                    )}
                  </div>
                )}
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: "100%", marginTop: 20 }} disabled={changePwdMutation.isPending}>
              {changePwdMutation.isPending ? "提交中..." : "确认修改"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
