"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

/* ── Types ── */
interface TableInfo {
  name: string;
  label: string;
  icon: string;
}

interface TableData {
  rows: Record<string, unknown>[];
  columns: string[];
  error: string | null;
  loading: boolean;
  count: number;
}

/* ── Tables to inspect (from schema.sql) ── */
const TABLES: TableInfo[] = [
  { name: "profiles", label: "Profiles", icon: "👤" },
  { name: "skills", label: "Skills", icon: "🎯" },
  { name: "roadmaps", label: "Roadmaps", icon: "🗺️" },
  { name: "topic_progress", label: "Topic Progress", icon: "📊" },
  { name: "plans", label: "Plans", icon: "📅" },
  { name: "plan_chunks", label: "Plan Chunks", icon: "📦" },
  { name: "plan_days", label: "Plan Days", icon: "📆" },
  { name: "tasks", label: "Tasks", icon: "✅" },
  { name: "focus_sessions", label: "Focus Sessions", icon: "🎧" },
  { name: "daily_logs", label: "Daily Logs", icon: "📝" },
];

export default function MappingPage() {
  const [supabase] = useState(() => createClient());
  const [connected, setConnected] = useState<boolean | null>(null);
  const [activeTable, setActiveTable] = useState<string>("skills");
  const [tableData, setTableData] = useState<Record<string, TableData>>({});
  const [connectionError, setConnectionError] = useState<string | null>(null);

  /* ── Test Supabase connection ── */
  useEffect(() => {
    async function testConnection() {
      try {
        // A lightweight query just to check connectivity
        const { error } = await supabase.from("skills").select("id", { count: "exact", head: true });
        if (error) {
          setConnected(false);
          setConnectionError(error.message);
        } else {
          setConnected(true);
          setConnectionError(null);
        }
      } catch (err: unknown) {
        setConnected(false);
        setConnectionError(err instanceof Error ? err.message : "Unknown connection error");
      }
    }
    testConnection();
  }, [supabase]);

  /* ── Fetch table data ── */
  const fetchTable = useCallback(
    async (tableName: string) => {
      setTableData((prev) => ({
        ...prev,
        [tableName]: { rows: [], columns: [], error: null, loading: true, count: 0 },
      }));

      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select("*", { count: "exact" })
          .order("created_at", { ascending: false })
          .limit(50);

        if (error) {
          setTableData((prev) => ({
            ...prev,
            [tableName]: {
              rows: [],
              columns: [],
              error: error.message,
              loading: false,
              count: 0,
            },
          }));
          return;
        }

        const rows = data || [];
        const columns = rows.length > 0 ? Object.keys(rows[0]) : [];

        setTableData((prev) => ({
          ...prev,
          [tableName]: {
            rows,
            columns,
            error: null,
            loading: false,
            count: count ?? rows.length,
          },
        }));
      } catch (err: unknown) {
        setTableData((prev) => ({
          ...prev,
          [tableName]: {
            rows: [],
            columns: [],
            error: err instanceof Error ? err.message : "Fetch failed",
            loading: false,
            count: 0,
          },
        }));
      }
    },
    [supabase]
  );

  /* ── Fetch active table when it changes ── */
  useEffect(() => {
    if (connected && activeTable) {
      fetchTable(activeTable);
    }
  }, [connected, activeTable, fetchTable]);

  /* ── Render cell value ── */
  function renderCell(value: unknown): string {
    if (value === null || value === undefined) return "—";
    if (typeof value === "boolean") return value ? "✓" : "✗";
    if (typeof value === "object") {
      const json = JSON.stringify(value);
      return json.length > 80 ? json.slice(0, 77) + "…" : json;
    }
    const str = String(value);
    return str.length > 60 ? str.slice(0, 57) + "…" : str;
  }

  const current = tableData[activeTable];
  const activeInfo = TABLES.find((t) => t.name === activeTable);

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #0a0a1a 0%, #1a1035 50%, #0d1b2a 100%)", color: "#e0e0e0", fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif" }}>
      {/* ── Header ── */}
      <div style={{ padding: "32px 40px 24px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, margin: 0, background: "linear-gradient(90deg, #a78bfa, #818cf8, #60a5fa)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          🗄️ Mapping Database Explorer
        </h1>
        <p style={{ margin: "8px 0 0", fontSize: "14px", color: "#888" }}>
          Live view of your Supabase tables — Project: <code style={{ background: "rgba(255,255,255,0.08)", padding: "2px 8px", borderRadius: "4px", fontSize: "12px" }}>puwgnaxirdyvkcphftdb</code>
        </p>

        {/* Connection Status */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "12px" }}>
          <span style={{
            width: "10px", height: "10px", borderRadius: "50%",
            background: connected === null ? "#666" : connected ? "#4ade80" : "#f87171",
            boxShadow: connected ? "0 0 8px rgba(74, 222, 128, 0.5)" : connected === false ? "0 0 8px rgba(248, 113, 113, 0.5)" : "none"
          }} />
          <span style={{ fontSize: "13px", color: connected ? "#4ade80" : connected === false ? "#f87171" : "#666" }}>
            {connected === null ? "Checking connection…" : connected ? "Connected to Supabase" : "Connection failed"}
          </span>
        </div>

        {connectionError && (
          <div style={{ marginTop: "12px", padding: "12px 16px", background: "rgba(248, 113, 113, 0.1)", border: "1px solid rgba(248, 113, 113, 0.3)", borderRadius: "8px", fontSize: "13px" }}>
            <strong>Error:</strong> {connectionError}
          </div>
        )}
      </div>

      <div style={{ display: "flex", minHeight: "calc(100vh - 140px)" }}>
        {/* ── Sidebar – Table List ── */}
        <nav style={{ width: "220px", padding: "16px 12px", borderRight: "1px solid rgba(255,255,255,0.06)", flexShrink: 0 }}>
          <p style={{ fontSize: "11px", fontWeight: 600, textTransform: "uppercase", color: "#666", padding: "0 8px", marginBottom: "8px" }}>Tables</p>
          {TABLES.map((t) => (
            <button
              key={t.name}
              onClick={() => setActiveTable(t.name)}
              style={{
                display: "flex", alignItems: "center", gap: "8px", width: "100%",
                padding: "10px 12px", marginBottom: "2px", border: "none", borderRadius: "8px", cursor: "pointer",
                fontSize: "13px", fontWeight: activeTable === t.name ? 600 : 400, textAlign: "left",
                background: activeTable === t.name ? "rgba(139, 92, 246, 0.15)" : "transparent",
                color: activeTable === t.name ? "#a78bfa" : "#aaa",
                transition: "all 0.15s ease",
              }}
              onMouseEnter={(e) => { if (activeTable !== t.name) (e.target as HTMLButtonElement).style.background = "rgba(255,255,255,0.05)"; }}
              onMouseLeave={(e) => { if (activeTable !== t.name) (e.target as HTMLButtonElement).style.background = "transparent"; }}
            >
              <span>{t.icon}</span>
              <span>{t.label}</span>
              {tableData[t.name] && !tableData[t.name].loading && (
                <span style={{ marginLeft: "auto", fontSize: "11px", background: "rgba(255,255,255,0.08)", padding: "1px 6px", borderRadius: "10px" }}>
                  {tableData[t.name].count}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── Main Content ── */}
        <main style={{ flex: 1, padding: "24px 32px", overflow: "auto" }}>
          {!connected && connected !== null ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>🔌</div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, color: "#f87171" }}>Unable to connect to Supabase</h2>
              <p style={{ fontSize: "14px", color: "#888", maxWidth: "500px", margin: "12px auto" }}>
                Check your <code>.env.local</code> file has the correct <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY</code> values.
              </p>
            </div>
          ) : connected === null ? (
            <div style={{ textAlign: "center", padding: "60px 20px" }}>
              <div className="spinner" style={{ width: "32px", height: "32px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 16px" }} />
              <p style={{ color: "#888" }}>Connecting to Supabase…</p>
              <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <>
              {/* Table Header */}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px" }}>
                <div>
                  <h2 style={{ fontSize: "20px", fontWeight: 600, margin: 0 }}>
                    {activeInfo?.icon} {activeInfo?.label}
                  </h2>
                  <p style={{ fontSize: "13px", color: "#666", margin: "4px 0 0" }}>
                    Table: <code style={{ background: "rgba(255,255,255,0.06)", padding: "2px 6px", borderRadius: "4px" }}>{activeTable}</code>
                    {current && !current.loading && ` · ${current.count} row${current.count !== 1 ? "s" : ""}`}
                  </p>
                </div>
                <button
                  onClick={() => fetchTable(activeTable)}
                  style={{
                    padding: "8px 16px", border: "1px solid rgba(139, 92, 246, 0.3)", borderRadius: "8px",
                    background: "rgba(139, 92, 246, 0.1)", color: "#a78bfa", fontSize: "13px", fontWeight: 500,
                    cursor: "pointer", transition: "all 0.15s ease",
                  }}
                  onMouseEnter={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(139, 92, 246, 0.2)"; }}
                  onMouseLeave={(e) => { (e.target as HTMLButtonElement).style.background = "rgba(139, 92, 246, 0.1)"; }}
                >
                  🔄 Refresh
                </button>
              </div>

              {/* Loading */}
              {current?.loading && (
                <div style={{ textAlign: "center", padding: "40px" }}>
                  <div style={{ width: "28px", height: "28px", border: "3px solid rgba(255,255,255,0.1)", borderTop: "3px solid #a78bfa", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 12px" }} />
                  <p style={{ color: "#888", fontSize: "13px" }}>Loading {activeInfo?.label}…</p>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              )}

              {/* Error State */}
              {current?.error && (
                <div style={{ padding: "20px 24px", background: "rgba(248, 113, 113, 0.08)", border: "1px solid rgba(248, 113, 113, 0.25)", borderRadius: "12px" }}>
                  <h3 style={{ fontSize: "15px", fontWeight: 600, color: "#f87171", margin: "0 0 8px" }}>⚠️ Query Error</h3>
                  <p style={{ fontSize: "13px", margin: "0 0 12px", color: "#ccc" }}>{current.error}</p>
                  <div style={{ padding: "12px 16px", background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.2)", borderRadius: "8px", fontSize: "13px", color: "#fbbf24" }}>
                    <strong>💡 Tip:</strong> If this is a permissions error, check your Row Level Security (RLS) policies in Supabase.
                    You may need to add a SELECT policy:
                    <pre style={{ marginTop: "8px", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "12px", overflow: "auto", color: "#e0e0e0" }}>
{`CREATE POLICY "${activeTable}_select_own" ON public.${activeTable}
  FOR SELECT USING (user_id = auth.uid());`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Empty State */}
              {current && !current.loading && !current.error && current.rows.length === 0 && (
                <div style={{ textAlign: "center", padding: "60px 20px" }}>
                  <div style={{ fontSize: "48px", marginBottom: "16px" }}>📭</div>
                  <h3 style={{ fontSize: "18px", fontWeight: 600, color: "#888" }}>No rows found</h3>
                  <p style={{ fontSize: "13px", color: "#666", maxWidth: "460px", margin: "8px auto 0" }}>
                    The <code>{activeTable}</code> table returned 0 rows. This could mean:
                  </p>
                  <ul style={{ textAlign: "left", maxWidth: "460px", margin: "12px auto", fontSize: "13px", color: "#888", listStyle: "disc", paddingLeft: "20px" }}>
                    <li>The table is genuinely empty — no data has been inserted yet.</li>
                    <li>Row Level Security (RLS) is blocking access. Check your policies in Supabase Dashboard.</li>
                  </ul>
                  <div style={{ marginTop: "16px", padding: "12px 16px", background: "rgba(250, 204, 21, 0.08)", border: "1px solid rgba(250, 204, 21, 0.2)", borderRadius: "8px", fontSize: "13px", color: "#fbbf24", textAlign: "left", maxWidth: "480px", marginLeft: "auto", marginRight: "auto" }}>
                    <strong>💡 Suggested RLS policy for anonymous/public SELECT:</strong>
                    <pre style={{ marginTop: "8px", padding: "10px", background: "rgba(0,0,0,0.3)", borderRadius: "6px", fontSize: "12px", overflow: "auto", color: "#e0e0e0" }}>
{`-- Allow authenticated users to read their own rows:
CREATE POLICY "${activeTable}_select_own" ON public.${activeTable}
  FOR SELECT USING (user_id = auth.uid());

-- OR allow public read (use with caution):
CREATE POLICY "${activeTable}_public_read" ON public.${activeTable}
  FOR SELECT USING (true);`}
                    </pre>
                  </div>
                </div>
              )}

              {/* Data Table */}
              {current && !current.loading && !current.error && current.rows.length > 0 && (
                <div style={{ overflowX: "auto", borderRadius: "12px", border: "1px solid rgba(255,255,255,0.08)" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
                    <thead>
                      <tr style={{ background: "rgba(139, 92, 246, 0.08)" }}>
                        <th style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#a78bfa", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px" }}>#</th>
                        {current.columns.map((col) => (
                          <th key={col} style={{ padding: "10px 14px", textAlign: "left", fontWeight: 600, color: "#a78bfa", borderBottom: "1px solid rgba(255,255,255,0.08)", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.5px", whiteSpace: "nowrap" }}>
                            {col}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {current.rows.map((row, i) => (
                        <tr key={i} style={{ borderBottom: "1px solid rgba(255,255,255,0.04)", transition: "background 0.15s ease" }}
                          onMouseEnter={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "rgba(255,255,255,0.03)"; }}
                          onMouseLeave={(e) => { (e.currentTarget as HTMLTableRowElement).style.background = "transparent"; }}
                        >
                          <td style={{ padding: "10px 14px", color: "#555", fontVariantNumeric: "tabular-nums" }}>{i + 1}</td>
                          {current.columns.map((col) => (
                            <td key={col} style={{ padding: "10px 14px", maxWidth: "300px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", color: "#ccc" }}>
                              {renderCell(row[col])}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
