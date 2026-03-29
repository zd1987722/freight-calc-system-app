import { trpc } from "../lib/trpc";
import { History as HistoryIcon, Download } from "lucide-react";

export default function History() {
  const { data: records, isLoading } = trpc.calculate.history.useQuery({});

  const handleExport = () => {
    if (!records?.length) return;
    // CSV 导出
    const header = "ID,计算时间,操作员,船东,装货港,卸货港,装货量(MT),费率(元/MT),总运费(元)";
    const rows = records.map(r =>
      `${r.id},"${r.createdAt}","${r.userName}","${r.ownerName}","${r.loadPortName}","${r.dischargePortName}",${r.confirmedQuantity},${r.calculatedRate},${r.totalFreight}`
    );
    const csv = "\uFEFF" + [header, ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `计算历史_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <div>
          <h1 className="page-title" style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <HistoryIcon size={28} /> 计算历史
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: 14, marginTop: 6 }}>
            查看所有运费计算记录
          </p>
        </div>
        <button className="btn btn-secondary" onClick={handleExport} disabled={!records?.length}>
          <Download size={16} /> 导出CSV
        </button>
      </div>

      <div className="glass-card" style={{ overflow: "hidden" }}>
        {isLoading ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>加载中...</div>
        ) : !records?.length ? (
          <div style={{ padding: 60, textAlign: "center", color: "var(--text-muted)" }}>暂无计算记录</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th>时间</th>
                  <th>操作员</th>
                  <th>船东</th>
                  <th>装货港</th>
                  <th>卸货港</th>
                  <th style={{ textAlign: "right" }}>装货量 (MT)</th>
                  <th style={{ textAlign: "right" }}>费率 (¥/MT)</th>
                  <th style={{ textAlign: "right" }}>总运费 (¥)</th>
                </tr>
              </thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id}>
                    <td style={{ whiteSpace: "nowrap", fontSize: 13 }}>{r.createdAt?.replace("T", " ").slice(0, 19)}</td>
                    <td>{r.userName}</td>
                    <td style={{ fontWeight: 500, color: "var(--text)" }}>{r.ownerName}</td>
                    <td>{r.loadPortName}</td>
                    <td>{r.dischargePortName}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{Number(r.confirmedQuantity).toLocaleString()}</td>
                    <td style={{ textAlign: "right", fontFamily: "monospace" }}>{r.calculatedRate}</td>
                    <td style={{ textAlign: "right", fontWeight: 600, color: "var(--accent)", fontFamily: "monospace" }}>
                      ¥{Number(r.totalFreight).toLocaleString("zh-CN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
