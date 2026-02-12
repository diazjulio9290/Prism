import { useState, useEffect, useCallback, useRef } from "react";

const COLUMNS = [
  { id: "pending", label: "Pending", color: "#F59E0B", bg: "#FEF3C7", border: "#F59E0B" },
  { id: "in_progress", label: "In Progress", color: "#3B82F6", bg: "#DBEAFE", border: "#3B82F6" },
  { id: "review", label: "Under Review", color: "#8B5CF6", bg: "#EDE9FE", border: "#8B5CF6" },
  { id: "completed", label: "Completed", color: "#10B981", bg: "#D1FAE5", border: "#10B981" },
];

const PRIORITIES = [
  { id: "low", label: "Low", color: "#6B7280" },
  { id: "medium", label: "Medium", color: "#F59E0B" },
  { id: "high", label: "High", color: "#EF4444" },
];

const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

const formatDate = (d) => {
  if (!d) return "";
  const date = new Date(d + "T00:00:00");
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const isOverdue = (d, status) => {
  if (!d || status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d + "T00:00:00");
  return due < today;
};

const isDueSoon = (d, status) => {
  if (!d || status === "completed") return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(d + "T00:00:00");
  const diff = (due - today) / (1000 * 60 * 60 * 24);
  return diff >= 0 && diff <= 3;
};

// Modal component
function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.5)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, backdropFilter: "blur(4px)",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#1a1a2e", borderRadius: 16, padding: 32, width: "90%",
          maxWidth: 480, border: "1px solid #2a2a4a", boxShadow: "0 24px 48px rgba(0,0,0,0.4)",
        }}
      >
        {children}
      </div>
    </div>
  );
}

// Task form
function TaskForm({ task, onSave, onCancel, onDelete }) {
  const [form, setForm] = useState(
    task || { title: "", description: "", study: "", dueDate: "", priority: "medium", status: "pending" }
  );

  const set = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const inputStyle = {
    width: "100%", padding: "10px 14px", background: "#0f0f23", border: "1px solid #2a2a4a",
    borderRadius: 8, color: "#e0e0e0", fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "'DM Sans', sans-serif",
  };

  const labelStyle = { color: "#9ca3af", fontSize: 12, fontWeight: 600, marginBottom: 6, display: "block", letterSpacing: "0.05em", textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif" };

  return (
    <div>
      <h2 style={{ margin: "0 0 24px", color: "#f0f0f0", fontSize: 20, fontFamily: "'Playfair Display', serif" }}>
        {task ? "Edit Task" : "New Task"}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        <div>
          <label style={labelStyle}>Title *</label>
          <input style={inputStyle} value={form.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Build Risk Dashboard" />
        </div>
        <div>
          <label style={labelStyle}>Description</label>
          <textarea style={{ ...inputStyle, minHeight: 80, resize: "vertical" }} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Details, notes, context..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Study / Project</label>
            <input style={inputStyle} value={form.study} onChange={(e) => set("study", e.target.value)} placeholder="e.g. 817P203" />
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input style={inputStyle} type="date" value={form.dueDate} onChange={(e) => set("dueDate", e.target.value)} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          <div>
            <label style={labelStyle}>Priority</label>
            <div style={{ display: "flex", gap: 8 }}>
              {PRIORITIES.map((p) => (
                <button
                  key={p.id}
                  onClick={() => set("priority", p.id)}
                  style={{
                    flex: 1, padding: "8px 0", borderRadius: 8, border: form.priority === p.id ? `2px solid ${p.color}` : "1px solid #2a2a4a",
                    background: form.priority === p.id ? p.color + "22" : "transparent",
                    color: form.priority === p.id ? p.color : "#6b7280",
                    cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
                  }}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={labelStyle}>Status</label>
            <select
              style={{ ...inputStyle, cursor: "pointer" }}
              value={form.status}
              onChange={(e) => set("status", e.target.value)}
            >
              {COLUMNS.map((c) => (
                <option key={c.id} value={c.id}>{c.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>
      <div style={{ display: "flex", gap: 10, marginTop: 28, justifyContent: "flex-end", alignItems: "center" }}>
        {task && onDelete && (
          <button
            onClick={() => onDelete(task.id)}
            style={{
              padding: "10px 18px", borderRadius: 8, border: "1px solid #7f1d1d",
              background: "transparent", color: "#ef4444", cursor: "pointer",
              fontSize: 14, fontWeight: 600, marginRight: "auto", fontFamily: "'DM Sans', sans-serif",
            }}
          >
            Delete
          </button>
        )}
        <button
          onClick={onCancel}
          style={{
            padding: "10px 22px", borderRadius: 8, border: "1px solid #2a2a4a",
            background: "transparent", color: "#9ca3af", cursor: "pointer",
            fontSize: 14, fontWeight: 500, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          Cancel
        </button>
        <button
          onClick={() => form.title.trim() && onSave(form)}
          style={{
            padding: "10px 28px", borderRadius: 8, border: "none",
            background: form.title.trim() ? "linear-gradient(135deg, #3B82F6, #8B5CF6)" : "#2a2a4a",
            color: form.title.trim() ? "#fff" : "#555", cursor: form.title.trim() ? "pointer" : "default",
            fontSize: 14, fontWeight: 600, fontFamily: "'DM Sans', sans-serif",
          }}
        >
          {task ? "Save Changes" : "Create Task"}
        </button>
      </div>
    </div>
  );
}

// Task card
function TaskCard({ task, onClick, onDragStart }) {
  const col = COLUMNS.find((c) => c.id === task.status);
  const pri = PRIORITIES.find((p) => p.id === task.priority);
  const overdue = isOverdue(task.dueDate, task.status);
  const soon = isDueSoon(task.dueDate, task.status);

  return (
    <div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("taskId", task.id);
        onDragStart(task.id);
      }}
      onClick={() => onClick(task)}
      style={{
        background: "#12122a", borderRadius: 12, padding: 16,
        border: `1px solid ${overdue ? "#ef444466" : "#1e1e3a"}`,
        cursor: "grab", transition: "all 0.2s ease",
        boxShadow: overdue ? "0 0 12px rgba(239,68,68,0.1)" : "0 2px 8px rgba(0,0,0,0.2)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = `0 8px 24px rgba(0,0,0,0.3)`;
        e.currentTarget.style.borderColor = col.color + "66";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = overdue ? "0 0 12px rgba(239,68,68,0.1)" : "0 2px 8px rgba(0,0,0,0.2)";
        e.currentTarget.style.borderColor = overdue ? "#ef444466" : "#1e1e3a";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
        <span style={{
          color: "#f0f0f0", fontSize: 14, fontWeight: 600, lineHeight: 1.4,
          fontFamily: "'DM Sans', sans-serif", flex: 1,
        }}>
          {task.title}
        </span>
        <span style={{
          width: 8, height: 8, borderRadius: "50%", background: pri.color,
          flexShrink: 0, marginLeft: 8, marginTop: 4,
        }} title={`${pri.label} priority`} />
      </div>
      {task.description && (
        <p style={{
          color: "#6b7280", fontSize: 12, margin: "0 0 10px", lineHeight: 1.5,
          overflow: "hidden", textOverflow: "ellipsis",
          display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
          fontFamily: "'DM Sans', sans-serif",
        }}>
          {task.description}
        </p>
      )}
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", alignItems: "center" }}>
        {task.study && (
          <span style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600,
            background: col.color + "18", color: col.color, letterSpacing: "0.03em",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {task.study}
          </span>
        )}
        {task.dueDate && (
          <span style={{
            padding: "3px 10px", borderRadius: 6, fontSize: 11, fontWeight: 500,
            background: overdue ? "#ef444422" : soon ? "#f59e0b22" : "#ffffff0a",
            color: overdue ? "#ef4444" : soon ? "#f59e0b" : "#9ca3af",
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {overdue ? "⚠ " : soon ? "⏰ " : ""}{formatDate(task.dueDate)}
          </span>
        )}
      </div>
    </div>
  );
}

// Column
function Column({ col, tasks, onAddClick, onCardClick, onDrop, onDragStart }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const taskId = e.dataTransfer.getData("taskId");
        if (taskId) onDrop(taskId, col.id);
      }}
      style={{
        flex: "1 1 280px", minWidth: 280, maxWidth: 360,
        background: dragOver ? "#16163a" : "#0d0d24",
        borderRadius: 16, padding: 16, display: "flex", flexDirection: "column",
        border: dragOver ? `2px dashed ${col.color}66` : "1px solid #1a1a3a",
        transition: "all 0.2s ease",
      }}
    >
      {/* Column header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, padding: "0 4px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 10, height: 10, borderRadius: "50%", background: col.color,
            boxShadow: `0 0 8px ${col.color}55`,
          }} />
          <span style={{
            color: "#e0e0e0", fontSize: 14, fontWeight: 700, letterSpacing: "0.04em",
            textTransform: "uppercase", fontFamily: "'DM Sans', sans-serif",
          }}>
            {col.label}
          </span>
          <span style={{
            background: col.color + "22", color: col.color, fontSize: 12,
            fontWeight: 700, padding: "2px 8px", borderRadius: 10,
            fontFamily: "'DM Sans', sans-serif",
          }}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={() => onAddClick(col.id)}
          style={{
            width: 28, height: 28, borderRadius: 8, border: "1px solid #2a2a4a",
            background: "transparent", color: "#6b7280", cursor: "pointer",
            fontSize: 18, display: "flex", alignItems: "center", justifyContent: "center",
            transition: "all 0.15s ease",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = col.color; e.currentTarget.style.color = col.color; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = "#2a2a4a"; e.currentTarget.style.color = "#6b7280"; }}
        >
          +
        </button>
      </div>
      {/* Cards */}
      <div style={{ display: "flex", flexDirection: "column", gap: 10, flex: 1, overflowY: "auto" }}>
        {tasks.length === 0 && (
          <div style={{
            padding: 24, textAlign: "center", color: "#3a3a5a", fontSize: 13,
            border: "1px dashed #1e1e3a", borderRadius: 12, fontFamily: "'DM Sans', sans-serif",
          }}>
            Drop tasks here
          </div>
        )}
        {tasks.map((t) => (
          <TaskCard key={t.id} task={t} onClick={onCardClick} onDragStart={onDragStart} />
        ))}
      </div>
    </div>
  );
}

// Summary bar
function Summary({ tasks }) {
  const total = tasks.length;
  const completed = tasks.filter((t) => t.status === "completed").length;
  const overdueCount = tasks.filter((t) => isOverdue(t.dueDate, t.status)).length;
  const pct = total ? Math.round((completed / total) * 100) : 0;

  return (
    <div style={{
      display: "flex", gap: 24, alignItems: "center", flexWrap: "wrap",
    }}>
      {[
        { label: "Total", value: total, color: "#e0e0e0" },
        { label: "Completed", value: completed, color: "#10B981" },
        { label: "Overdue", value: overdueCount, color: overdueCount > 0 ? "#EF4444" : "#6b7280" },
        { label: "Progress", value: `${pct}%`, color: "#8B5CF6" },
      ].map((s) => (
        <div key={s.label} style={{ display: "flex", alignItems: "baseline", gap: 6 }}>
          <span style={{ color: s.color, fontSize: 22, fontWeight: 800, fontFamily: "'Playfair Display', serif" }}>
            {s.value}
          </span>
          <span style={{ color: "#6b7280", fontSize: 12, fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.06em", fontFamily: "'DM Sans', sans-serif" }}>
            {s.label}
          </span>
        </div>
      ))}
    </div>
  );
}

// Main app
export default function App() {
  const [tasks, setTasks] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("pending");
  const [dragging, setDragging] = useState(null);
  const [filter, setFilter] = useState("");

  // Load from storage
  useEffect(() => {
    (async () => {
      try {
        const result = await window.storage.get("kanban-tasks");
        if (result && result.value) {
          setTasks(JSON.parse(result.value));
        }
      } catch (e) {
        console.log("No saved data yet");
      }
      setLoaded(true);
    })();
  }, []);

  // Save to storage
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set("kanban-tasks", JSON.stringify(tasks));
      } catch (e) {
        console.error("Save error:", e);
      }
    })();
  }, [tasks, loaded]);

  const handleSave = (form) => {
    if (editTask) {
      setTasks((prev) => prev.map((t) => (t.id === editTask.id ? { ...t, ...form } : t)));
    } else {
      setTasks((prev) => [...prev, { ...form, id: genId(), createdAt: new Date().toISOString() }]);
    }
    setModalOpen(false);
    setEditTask(null);
  };

  const handleDelete = (id) => {
    setTasks((prev) => prev.filter((t) => t.id !== id));
    setModalOpen(false);
    setEditTask(null);
  };

  const handleDrop = (taskId, newStatus) => {
    setTasks((prev) => prev.map((t) => (t.id === taskId ? { ...t, status: newStatus } : t)));
    setDragging(null);
  };

  const openAdd = (status) => {
    setEditTask(null);
    setDefaultStatus(status);
    setModalOpen(true);
  };

  const openEdit = (task) => {
    setEditTask(task);
    setModalOpen(true);
  };

  const filteredTasks = filter
    ? tasks.filter((t) =>
        t.title.toLowerCase().includes(filter.toLowerCase()) ||
        t.study?.toLowerCase().includes(filter.toLowerCase()) ||
        t.description?.toLowerCase().includes(filter.toLowerCase())
      )
    : tasks;

  if (!loaded) {
    return (
      <div style={{ minHeight: "100vh", background: "#0a0a1f", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <span style={{ color: "#6b7280", fontSize: 16, fontFamily: "'DM Sans', sans-serif" }}>Loading...</span>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: "100vh", background: "#0a0a1f", color: "#e0e0e0",
      fontFamily: "'DM Sans', sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=Playfair+Display:wght@700;800&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        padding: "28px 32px 24px", borderBottom: "1px solid #1a1a3a",
        background: "linear-gradient(180deg, #0f0f2a 0%, #0a0a1f 100%)",
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          flexWrap: "wrap", gap: 16, maxWidth: 1400, margin: "0 auto",
        }}>
          <div>
            <h1 style={{
              margin: 0, fontSize: 28, fontWeight: 800, fontFamily: "'Playfair Display', serif",
              background: "linear-gradient(135deg, #e0e0e0, #8B5CF6)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>
              Prism Dashboard Tracker
            </h1>
            <p style={{ margin: "6px 0 0", color: "#4a4a6a", fontSize: 13 }}>
              Track your work across studies and dashboards
            </p>
          </div>
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <input
              placeholder="Search tasks..."
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              style={{
                padding: "9px 16px", background: "#0d0d24", border: "1px solid #2a2a4a",
                borderRadius: 10, color: "#e0e0e0", fontSize: 13, width: 200, outline: "none",
                fontFamily: "'DM Sans', sans-serif",
              }}
            />
            <button
              onClick={() => openAdd("pending")}
              style={{
                padding: "9px 20px", borderRadius: 10, border: "none",
                background: "linear-gradient(135deg, #3B82F6, #8B5CF6)",
                color: "#fff", cursor: "pointer", fontSize: 14, fontWeight: 700,
                fontFamily: "'DM Sans', sans-serif", whiteSpace: "nowrap",
                boxShadow: "0 4px 16px rgba(99,102,241,0.3)",
              }}
            >
              + New Task
            </button>
          </div>
        </div>
        <div style={{ maxWidth: 1400, margin: "20px auto 0" }}>
          <Summary tasks={tasks} />
        </div>
      </div>

      {/* Board */}
      <div style={{
        padding: "24px 32px", maxWidth: 1400, margin: "0 auto",
        display: "flex", gap: 16, overflowX: "auto", minHeight: "calc(100vh - 180px)",
      }}>
        {COLUMNS.map((col) => (
          <Column
            key={col.id}
            col={col}
            tasks={filteredTasks.filter((t) => t.status === col.id)}
            onAddClick={openAdd}
            onCardClick={openEdit}
            onDrop={handleDrop}
            onDragStart={setDragging}
          />
        ))}
      </div>

      {/* Modal */}
      <Modal open={modalOpen} onClose={() => { setModalOpen(false); setEditTask(null); }}>
        <TaskForm
          task={editTask}
          onSave={handleSave}
          onCancel={() => { setModalOpen(false); setEditTask(null); }}
          onDelete={editTask ? handleDelete : undefined}
        />
      </Modal>
    </div>
  );
}
