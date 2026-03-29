import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { trpc } from "../lib/trpc";
import { Calculator, History, Ship, Anchor, Table2, Users, User, LogOut, Menu, X } from "lucide-react";
import { useState } from "react";

interface LayoutProps {
  user: { id: number; username: string | null; name: string | null; role: string };
}

const navItems = [
  { path: "/", icon: Calculator, label: "运费计算", roles: ["user", "admin"] },
  { path: "/history", icon: History, label: "计算历史", roles: ["user", "admin"] },
  { path: "/owners", icon: Ship, label: "船东管理", roles: ["user", "admin"] },
  { path: "/ports", icon: Anchor, label: "港口管理", roles: ["user", "admin"] },
  { path: "/rate-tables", icon: Table2, label: "费率表", roles: ["user", "admin"] },
  { path: "/users", icon: Users, label: "用户管理", roles: ["admin"] },
  { path: "/profile", icon: User, label: "个人设置", roles: ["user", "admin"] },
];

export default function Layout({ user }: LayoutProps) {
  const navigate = useNavigate();
  const logoutMutation = trpc.auth.logout.useMutation();
  const utils = trpc.useUtils();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await logoutMutation.mutateAsync();
    utils.auth.me.invalidate();
    navigate("/login");
  };

  const filteredNav = navItems.filter(item => item.roles.includes(user.role));

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden" }}>
      {/* 移动端遮罩 */}
      {sidebarOpen && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)", zIndex: 40 }}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 侧边栏 */}
      <aside
        className="glass"
        style={{
          width: 260,
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0, bottom: 0, left: sidebarOpen ? 0 : -260,
          zIndex: 50,
          transition: "left 0.3s ease",
        }}
      >
        {/* Logo */}
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(71,85,105,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              🚢
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>运费计算系统</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Freight Calculator</div>
            </div>
          </div>
        </div>

        {/* 导航 */}
        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              onClick={() => setSidebarOpen(false)}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                marginBottom: 4, textDecoration: "none",
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--text)" : "var(--text-secondary)",
                background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                transition: "all 0.2s ease",
              })}
            >
              <item.icon size={18} style={{ opacity: 0.8 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        {/* 用户信息 */}
        <div style={{ padding: "16px", borderTop: "1px solid rgba(71,85,105,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600,
            }}>
              {(user.name || user.username || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.username}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {user.role === "admin" ? "管理员" : "操作员"}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </aside>

      {/* 桌面端侧边栏 */}
      <aside
        className="glass"
        style={{
          width: 260, minWidth: 260,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid rgba(71,85,105,0.3)",
        }}
      >
        <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid rgba(71,85,105,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 18,
            }}>
              🚢
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 700, color: "var(--text)" }}>运费计算系统</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>Freight Calculator</div>
            </div>
          </div>
        </div>

        <nav style={{ flex: 1, padding: "12px 10px", overflowY: "auto" }}>
          {filteredNav.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === "/"}
              style={({ isActive }) => ({
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 14px", borderRadius: 10,
                marginBottom: 4, textDecoration: "none",
                fontSize: 14, fontWeight: isActive ? 600 : 400,
                color: isActive ? "var(--text)" : "var(--text-secondary)",
                background: isActive ? "rgba(99,102,241,0.12)" : "transparent",
                transition: "all 0.2s ease",
              })}
            >
              <item.icon size={18} style={{ opacity: 0.8 }} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div style={{ padding: "16px", borderTop: "1px solid rgba(71,85,105,0.3)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <div style={{
              width: 34, height: 34, borderRadius: "50%",
              background: "var(--gradient-primary)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, fontWeight: 600,
            }}>
              {(user.name || user.username || "U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500 }}>{user.name || user.username}</div>
              <div style={{ fontSize: 11, color: "var(--text-muted)" }}>
                {user.role === "admin" ? "管理员" : "操作员"}
              </div>
            </div>
          </div>
          <button onClick={handleLogout} className="btn btn-secondary btn-sm" style={{ width: "100%" }}>
            <LogOut size={14} /> 退出登录
          </button>
        </div>
      </aside>

      {/* 主内容 */}
      <main style={{ flex: 1, overflow: "auto", background: "var(--surface)" }}>
        {/* 移动端顶栏 */}
        <div style={{
          display: "none", padding: "12px 16px", background: "var(--surface-2)",
          borderBottom: "1px solid rgba(71,85,105,0.3)", alignItems: "center",
        }}>
          <button onClick={() => setSidebarOpen(true)} style={{
            background: "none", border: "none", color: "var(--text)", cursor: "pointer",
          }}>
            <Menu size={22} />
          </button>
        </div>

        <div className="animate-fade-in" style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
