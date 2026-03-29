import { useState } from "react";
import { trpc } from "../lib/trpc";
import toast from "react-hot-toast";
import { Ship, Lock, Eye, EyeOff } from "lucide-react";

export default function Login() {
  const [credential, setCredential] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const utils = trpc.useUtils();
  const loginMutation = trpc.auth.localLogin.useMutation();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credential || !password) {
      toast.error("请填写完整登录信息");
      return;
    }
    setLoading(true);
    try {
      const result = await loginMutation.mutateAsync({ credential, password });
      if (result.success) {
        toast.success("登录成功！");
        utils.auth.me.invalidate();
      } else {
        toast.error(result.message || "登录失败");
      }
    } catch {
      toast.error("网络错误，请重试");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "radial-gradient(ellipse at top, #1e293b 0%, #0f172a 50%, #020617 100%)",
      position: "relative",
      overflow: "hidden",
    }}>
      {/* 背景装饰 */}
      <div style={{
        position: "absolute", top: "-30%", right: "-20%",
        width: 600, height: 600, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(99,102,241,0.08) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "absolute", bottom: "-20%", left: "-10%",
        width: 500, height: 500, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(6,182,212,0.06) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      <div className="animate-fade-in" style={{ width: "100%", maxWidth: 420, padding: "0 20px" }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: 36 }}>
          <div style={{
            width: 64, height: 64, borderRadius: 20,
            background: "var(--gradient-primary)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
            fontSize: 32, marginBottom: 16,
            boxShadow: "0 8px 32px rgba(99,102,241,0.3)",
          }}>
            🚢
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 800, marginBottom: 6, color: "var(--text)" }}>
            运费计算系统
          </h1>
          <p style={{ fontSize: 14, color: "var(--text-muted)" }}>
            液体散装化学品船运费智能计算平台
          </p>
        </div>

        {/* 登录表单 */}
        <form onSubmit={handleLogin}>
          <div className="glass-card" style={{ padding: 28 }}>
            <h2 style={{ fontSize: 18, fontWeight: 600, marginBottom: 24, color: "var(--text)" }}>
              账户登录
            </h2>

            <div style={{ marginBottom: 18 }}>
              <label className="form-label">用户名 / 邮箱 / 手机号</label>
              <div style={{ position: "relative" }}>
                <Ship size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-credential"
                  className="form-input"
                  style={{ paddingLeft: 36 }}
                  placeholder="请输入用户名"
                  value={credential}
                  onChange={e => setCredential(e.target.value)}
                  autoComplete="username"
                />
              </div>
            </div>

            <div style={{ marginBottom: 24 }}>
              <label className="form-label">密码</label>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)" }} />
                <input
                  id="login-password"
                  className="form-input"
                  style={{ paddingLeft: 36, paddingRight: 40 }}
                  type={showPassword ? "text" : "password"}
                  placeholder="请输入密码"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)",
                    background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              id="login-submit"
              type="submit"
              className="btn btn-primary"
              disabled={loading}
              style={{ width: "100%", padding: "12px", fontSize: 15 }}
            >
              {loading ? "登录中..." : "登 录"}
            </button>

            <div style={{
              marginTop: 20, padding: 14, borderRadius: 10,
              background: "rgba(99,102,241,0.06)",
              border: "1px solid rgba(99,102,241,0.15)",
            }}>
              <p style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 6 }}>
                📌 演示账号
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                管理员：admin / admin123
              </p>
              <p style={{ fontSize: 12, color: "var(--text-secondary)" }}>
                操作员：operator / user123
              </p>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
