import { Routes, Route, Navigate } from "react-router-dom";
import { trpc } from "./lib/trpc";
import Login from "./pages/Login";
import Layout from "./components/Layout";
import Calculator from "./pages/Calculator";
import History from "./pages/History";
import Owners from "./pages/Owners";
import Ports from "./pages/Ports";
import RateTables from "./pages/RateTables";
import Users from "./pages/Users";
import Profile from "./pages/Profile";
import { Toaster } from "react-hot-toast";

export default function App() {
  const { data: user, isLoading } = trpc.auth.me.useQuery();

  if (isLoading) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center" }}>
          <div style={{
            width: 48, height: 48, border: "3px solid var(--surface-3)",
            borderTopColor: "var(--primary)", borderRadius: "50%",
            animation: "spin 0.8s linear infinite", margin: "0 auto 16px",
          }} />
          <p style={{ color: "var(--text-secondary)" }}>加载中...</p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: "var(--surface-2)", color: "var(--text)", border: "1px solid var(--border)" },
          success: { iconTheme: { primary: "var(--success)", secondary: "white" } },
          error: { iconTheme: { primary: "var(--danger)", secondary: "white" } },
        }}
      />
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" replace /> : <Login />} />
        <Route path="/" element={user ? <Layout user={user} /> : <Navigate to="/login" replace />}>
          <Route index element={<Calculator />} />
          <Route path="history" element={<History />} />
          <Route path="owners" element={<Owners user={user} />} />
          <Route path="ports" element={<Ports user={user} />} />
          <Route path="rate-tables" element={<RateTables user={user} />} />
          {user.role === "admin" && <Route path="users" element={<Users />} />}
          <Route path="profile" element={<Profile />} />
        </Route>
      </Routes>
    </>
  );
}
