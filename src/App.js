import { useState, useEffect } from "react";
import { auth, db } from "./firebase";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Auth from "./Auth";

const COLS = [
  { id: "todo", label: "TO DO", color: "#8993a4" },
  { id: "in_progress", label: "IN PROGRESS", color: "#0065ff" },
  { id: "review", label: "IN REVIEW", color: "#ff991f" },
  { id: "done", label: "DONE", color: "#36b37e" },
];

const TYPES = {
  task: { label: "Task", icon: "✓", bg: "#0065ff" },
  bug: { label: "Bug", icon: "●", bg: "#de350b" },
  story: { label: "Story", icon: "◆", bg: "#36b37e" },
  subtask: { label: "Sub-task", icon: "◇", bg: "#6554c0" },
};

const PRIORITY = {
  highest: { label: "Highest", icon: "⬆⬆", color: "#de350b" },
  high: { label: "High", icon: "⬆", color: "#de350b" },
  medium: { label: "Medium", icon: "⬛", color: "#ff991f" },
  low: { label: "Low", icon: "⬇", color: "#0065ff" },
};

const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);

const fmtDate = (d) => {
  if (!d) return "";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" });
};

const isOverdue = (d, s) => {
  if (!d || s === "done") return false;
  const t = new Date(); t.setHours(0, 0, 0, 0);
  return new Date(d + "T00:00:00") < t;
};

async function loadData(userId) {
  try {
    const docRef = doc(db, "users", userId);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        tasks: data.tasks || [],
        counter: data.counter || 0,
      };
    }
    return { tasks: [], counter: 0 };
  } catch (e) {
    console.error("Load failed", e);
    return { tasks: [], counter: 0 };
  }
}

async function saveData(userId, tasks, counter) {
  try {
    const docRef = doc(db, "users", userId);
    await setDoc(docRef, { tasks, counter, updatedAt: new Date().toISOString() });
  } catch (e) {
    console.error("Save failed", e);
  }
}

function Modal({ open, onClose, children }) {
  if (!open) return null;
  return (
    <div onClick={onClose} style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "flex-start", justifyContent: "center", zIndex: 1000, paddingTop: 60, backdropFilter: "blur(2px)" }}>
      <div onClick={e => e.stopPropagation()} style={{ background: "#1d2125", borderRadius: 8, width: "100%", maxWidth: 520, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", border: "1px solid #2c333a", maxHeight: "85vh", overflow: "auto" }}>
        {children}
      </div>
    </div>
  );
}

function TaskForm({ task, onSave, onCancel, onDelete, nextKey, defaultStatus }) {
  const [f, setF] = useState(task || {
    title: "", description: "", study: "", dueDate: "", priority: "medium",
    status: defaultStatus || "todo", type: "task", assignee: "",
  });
  const set = (k, v) => setF(p => ({ ...p, [k]: v }));

  const inp = {
    width: "100%", padding: "8px 12px", border: "1px solid #3b444c",
    borderRadius: 4, fontSize: 14, outline: "none", boxSizing: "border-box",
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    color: "#c7d1db", background: "#22272b",
  };
  const lbl = { fontSize: 11, fontWeight: 700, color: "#8c9bab", marginBottom: 4, display: "block", textTransform: "uppercase", letterSpacing: "0.5px" };

  return (
    <div>
      <div style={{ padding: "14px 20px", borderBottom: "1px solid #2c333a", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: "#c7d1db" }}>{task ? task.key : nextKey}</span>
          <span style={{ color: "#8c9bab", fontSize: 13 }}>— {task ? "Edit" : "Create"}</span>
        </div>
        <button onClick={onCancel} style={{ background: "none", border: "none", fontSize: 18, color: "#8c9bab", cursor: "pointer" }}>✕</button>
      </div>
      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 14 }}>
        <div>
          <label style={lbl}>Summary *</label>
          <input style={inp} value={f.title} onChange={e => set("title", e.target.value)} placeholder="What needs to be done?" autoFocus />
        </div>
        <div>
          <label style={lbl}>Description</label>
          <textarea style={{ ...inp, minHeight: 72, resize: "vertical" }} value={f.description} onChange={e => set("description", e.target.value)} placeholder="Add details, acceptance criteria, notes..." />
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Type</label>
            <div style={{ display: "flex", gap: 6 }}>
              {Object.entries(TYPES).map(([k, v]) => (
                <button key={k} onClick={() => set("type", k)} style={{
                  flex: 1, padding: "6px 0", borderRadius: 4, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: f.type === k ? `1.5px solid ${v.bg}` : "1px solid #3b444c",
                  background: f.type === k ? v.bg + "22" : "transparent",
                  color: f.type === k ? v.bg : "#8c9bab", fontFamily: "inherit",
                }}>
                  {v.icon} {v.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label style={lbl}>Priority</label>
            <select style={{ ...inp, cursor: "pointer" }} value={f.priority} onChange={e => set("priority", e.target.value)}>
              {Object.entries(PRIORITY).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Study / Project</label>
            <input style={inp} value={f.study} onChange={e => set("study", e.target.value)} placeholder="e.g. 817P203" />
          </div>
          <div>
            <label style={lbl}>Assignee</label>
            <input style={inp} value={f.assignee} onChange={e => set("assignee", e.target.value)} placeholder="e.g. Julio" />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
          <div>
            <label style={lbl}>Due Date</label>
            <input style={inp} type="date" value={f.dueDate} onChange={e => set("dueDate", e.target.value)} />
          </div>
          <div>
            <label style={lbl}>Status</label>
            <select style={{ ...inp, cursor: "pointer" }} value={f.status} onChange={e => set("status", e.target.value)}>
              {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
            </select>
          </div>
        </div>
      </div>
      <div style={{ padding: "12px 20px 16px", display: "flex", gap: 8, justifyContent: "flex-end", borderTop: "1px solid #2c333a", alignItems: "center" }}>
        {task && onDelete && (
          <button onClick={() => onDelete(task.id)} style={{
            padding: "7px 14px", borderRadius: 4, border: "none", background: "#de350b22",
            color: "#de350b", cursor: "pointer", fontSize: 13, fontWeight: 600, marginRight: "auto", fontFamily: "inherit",
          }}>Delete</button>
        )}
        <button onClick={onCancel} style={{
          padding: "7px 16px", borderRadius: 4, border: "none", background: "#2c333a",
          color: "#c7d1db", cursor: "pointer", fontSize: 13, fontWeight: 500, fontFamily: "inherit",
        }}>Cancel</button>
        <button onClick={() => f.title.trim() && onSave(f)} style={{
          padding: "7px 20px", borderRadius: 4, border: "none",
          background: f.title.trim() ? "#0065ff" : "#2c333a",
          color: f.title.trim() ? "#fff" : "#555", cursor: f.title.trim() ? "pointer" : "default",
          fontSize: 13, fontWeight: 700, fontFamily: "inherit",
        }}>{task ? "Save" : "Create"}</button>
      </div>
    </div>
  );
}

function Card({ task, onClick }) {
  const t = TYPES[task.type] || TYPES.task;
  const p = PRIORITY[task.priority] || PRIORITY.medium;
  const overdue = isOverdue(task.dueDate, task.status);
  const [hover, setHover] = useState(false);

  return (
    <div
      draggable
      onDragStart={e => { e.dataTransfer.setData("taskId", task.id); }}
      onClick={() => onClick(task)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        background: hover ? "#2c333a" : "#22272b",
        borderRadius: 4, padding: "10px 12px", cursor: "pointer",
        borderLeft: `3px solid ${t.bg}`,
        transition: "background 0.1s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.2)",
      }}
    >
      <div style={{ marginBottom: 6 }}>
        <span style={{ color: "#c7d1db", fontSize: 13, fontWeight: 500, lineHeight: 1.4 }}>{task.title}</span>
      </div>
      {task.description && (
        <div style={{
          color: "#6b778c", fontSize: 11, lineHeight: 1.4, marginBottom: 8,
          overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box",
          WebkitLineClamp: 2, WebkitBoxOrient: "vertical",
        }}>{task.description}</div>
      )}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
        <span style={{ fontSize: 11, color: "#8c9bab", fontWeight: 600, fontFamily: "monospace" }}>{task.key}</span>
        <span title={p.label} style={{ fontSize: 11, color: p.color, lineHeight: 1 }}>{p.icon}</span>
        {task.study && (
          <span style={{
            fontSize: 10, fontWeight: 700, padding: "2px 6px", borderRadius: 3,
            background: "#2c333a", color: "#8c9bab", letterSpacing: "0.3px",
          }}>{task.study}</span>
        )}
        {task.dueDate && (
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 6px", borderRadius: 3,
            background: overdue ? "#de350b22" : "#2c333a",
            color: overdue ? "#de350b" : "#8c9bab",
          }}>
            {overdue ? "⚠ " : ""}{fmtDate(task.dueDate)}
          </span>
        )}
        <div style={{ flex: 1 }} />
        {task.assignee && (
          <span style={{
            width: 22, height: 22, borderRadius: "50%", background: "#0065ff33",
            color: "#0065ff", fontSize: 10, fontWeight: 700,
            display: "flex", alignItems: "center", justifyContent: "center",
          }} title={task.assignee}>
            {task.assignee.slice(0, 2).toUpperCase()}
          </span>
        )}
      </div>
    </div>
  );
}

function Column({ col, tasks, onAdd, onCardClick, onDrop }) {
  const [dragOver, setDragOver] = useState(false);

  return (
    <div
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onDrop={e => { e.preventDefault(); setDragOver(false); const id = e.dataTransfer.getData("taskId"); if (id) onDrop(id, col.id); }}
      style={{
        flex: "1 1 260px", minWidth: 250, maxWidth: 340,
        background: dragOver ? col.color + "15" : col.color + "08",
        borderRadius: 6, display: "flex", flexDirection: "column",
        transition: "background 0.15s",
        border: dragOver ? `2px dashed ${col.color}88` : `1px solid ${col.color}30`,
        borderTop: `3px solid ${col.color}`,
      }}
    >
      <div style={{ padding: "12px 14px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 11, fontWeight: 800, color: col.color, letterSpacing: "0.8px" }}>{col.label}</span>
          <span style={{
            fontSize: 11, fontWeight: 700, padding: "2px 6px", borderRadius: 10,
            background: col.color + "25", color: col.color,
          }}>{tasks.length}</span>
        </div>
        <button onClick={() => onAdd(col.id)} style={{
          background: "none", border: "none", color: col.color + "aa", cursor: "pointer",
          fontSize: 18, lineHeight: 1, padding: "0 4px", borderRadius: 4,
        }}
          onMouseEnter={e => e.currentTarget.style.color = col.color}
          onMouseLeave={e => e.currentTarget.style.color = col.color + "aa"}
        >+</button>
      </div>
      <div style={{ padding: "4px 8px 12px", display: "flex", flexDirection: "column", gap: 6, flex: 1, overflowY: "auto", minHeight: 80 }}>
        {tasks.length === 0 && (
          <div style={{ padding: 16, textAlign: "center", color: "#3b444c", fontSize: 12 }}>No items</div>
        )}
        {tasks.map(t => (
          <Card key={t.id} task={t} onClick={onCardClick} />
        ))}
      </div>
    </div>
  );
}

function Filters({ filter, setFilter, typeFilter, setTypeFilter, studies, studyFilter, setStudyFilter }) {
  const chip = (active) => ({
    padding: "4px 10px", borderRadius: 4, fontSize: 12, fontWeight: 600, cursor: "pointer",
    border: "none", fontFamily: "inherit",
    background: active ? "#0065ff22" : "transparent",
    color: active ? "#0065ff" : "#8c9bab",
  });

  return (
    <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
      <input
        placeholder="Search..."
        value={filter}
        onChange={e => setFilter(e.target.value)}
        style={{
          padding: "6px 12px", background: "#22272b", border: "1px solid #3b444c",
          borderRadius: 4, color: "#c7d1db", fontSize: 13, width: 180, outline: "none", fontFamily: "inherit",
        }}
      />
      <div style={{ width: 1, height: 20, background: "#3b444c" }} />
      <button style={chip(!typeFilter)} onClick={() => setTypeFilter("")}>All</button>
      {Object.entries(TYPES).map(([k, v]) => (
        <button key={k} style={chip(typeFilter === k)} onClick={() => setTypeFilter(typeFilter === k ? "" : k)}>
          <span style={{ color: v.bg }}>{v.icon}</span> {v.label}
        </button>
      ))}
      {studies.length > 0 && (
        <>
          <div style={{ width: 1, height: 20, background: "#3b444c" }} />
          <select
            value={studyFilter}
            onChange={e => setStudyFilter(e.target.value)}
            style={{
              padding: "5px 8px", background: "#22272b", border: "1px solid #3b444c",
              borderRadius: 4, color: "#c7d1db", fontSize: 12, outline: "none", fontFamily: "inherit", cursor: "pointer",
            }}
          >
            <option value="">All Studies</option>
            {studies.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </>
      )}
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [tasks, setTasks] = useState([]);
  const [counter, setCounter] = useState(0);
  const [loaded, setLoaded] = useState(false);
  const [modal, setModal] = useState(false);
  const [editTask, setEditTask] = useState(null);
  const [defaultStatus, setDefaultStatus] = useState("todo");
  const [filter, setFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [studyFilter, setStudyFilter] = useState("");

  // Listen for auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setAuthLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Load data when user logs in
  useEffect(() => {
    if (user) {
      loadData(user.uid).then(({ tasks: t, counter: c }) => {
        setTasks(t);
        setCounter(c);
        setLoaded(true);
      });
    }
  }, [user]);

  // Save data when tasks or counter change
  useEffect(() => {
    if (loaded && user) {
      saveData(user.uid, tasks, counter);
    }
  }, [tasks, counter, loaded, user]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div style={{ minHeight: "100vh", background: "#1d2125", display: "flex", alignItems: "center", justifyContent: "center", color: "#8c9bab" }}>
        Loading...
      </div>
    );
  }

  // Show auth screen if not logged in
  if (!user) {
    return <Auth />;
  }

  const nextKey = `DASH-${counter + 1}`;

  const handleSave = (form) => {
    if (editTask) {
      setTasks(p => p.map(t => t.id === editTask.id ? { ...t, ...form } : t));
    } else {
      const nc = counter + 1;
      setCounter(nc);
      setTasks(p => [...p, { ...form, id: uid(), key: `DASH-${nc}`, created: new Date().toISOString() }]);
    }
    setModal(false); setEditTask(null);
  };

  const handleDelete = (id) => {
    setTasks(p => p.filter(t => t.id !== id));
    setModal(false); setEditTask(null);
  };

  const handleDrop = (taskId, newStatus) => {
    setTasks(p => p.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
  };

  const openAdd = (status) => { setEditTask(null); setDefaultStatus(status); setModal(true); };
  const openEdit = (task) => { setEditTask(task); setModal(true); };

  const studies = [...new Set(tasks.map(t => t.study).filter(Boolean))].sort();

  const filtered = tasks.filter(t => {
    if (filter && !(
      t.title.toLowerCase().includes(filter.toLowerCase()) ||
      t.key.toLowerCase().includes(filter.toLowerCase()) ||
      t.study?.toLowerCase().includes(filter.toLowerCase()) ||
      t.description?.toLowerCase().includes(filter.toLowerCase()) ||
      t.assignee?.toLowerCase().includes(filter.toLowerCase())
    )) return false;
    if (typeFilter && t.type !== typeFilter) return false;
    if (studyFilter && t.study !== studyFilter) return false;
    return true;
  });

  if (!loaded) return (
    <div style={{ minHeight: "100vh", background: "#1d2125", display: "flex", alignItems: "center", justifyContent: "center", color: "#8c9bab" }}>Loading...</div>
  );

  const overdueCount = tasks.filter(t => isOverdue(t.dueDate, t.status)).length;
  const doneCount = tasks.filter(t => t.status === "done").length;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;

  return (
    <div style={{ minHeight: "100vh", background: "#1d2125", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", color: "#c7d1db" }}>
      {/* Topbar */}
      <div style={{ background: "#161a1d", borderBottom: "1px solid #2c333a", padding: "0 24px" }}>
        <div style={{ maxWidth: 1440, margin: "0 auto", display: "flex", alignItems: "center", justifyContent: "space-between", height: 52, flexWrap: "wrap", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ width: 24, height: 24, borderRadius: 4, background: "#0065ff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff" }}>D</div>
            <span style={{ fontWeight: 700, fontSize: 15, color: "#c7d1db" }}>Dashboard Tracker</span>
            <span style={{ fontSize: 12, color: "#5a6778", marginLeft: 4 }}>Board</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, fontSize: 12, color: "#8c9bab" }}>
              <span><strong style={{ color: "#c7d1db" }}>{tasks.length}</strong> items</span>
              <span style={{ color: "#3b444c" }}>|</span>
              <span><strong style={{ color: "#36b37e" }}>{pct}%</strong> done</span>
              {overdueCount > 0 && (
                <>
                  <span style={{ color: "#3b444c" }}>|</span>
                  <span><strong style={{ color: "#de350b" }}>{overdueCount}</strong> overdue</span>
                </>
              )}
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{ fontSize: 12, color: "#8c9bab" }}>{user.email}</span>
              <button onClick={handleLogout} style={{
                padding: "6px 12px", borderRadius: 4, border: "1px solid #3b444c",
                background: "transparent", color: "#8c9bab", cursor: "pointer",
                fontSize: 12, fontWeight: 500, fontFamily: "inherit",
              }}>Logout</button>
            </div>
            <button onClick={() => openAdd("todo")} style={{
              padding: "6px 14px", borderRadius: 4, border: "none", background: "#0065ff",
              color: "#fff", cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
            }}>+ Create</button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div style={{ padding: "12px 24px", maxWidth: 1440, margin: "0 auto" }}>
        <Filters
          filter={filter} setFilter={setFilter}
          typeFilter={typeFilter} setTypeFilter={setTypeFilter}
          studies={studies} studyFilter={studyFilter} setStudyFilter={setStudyFilter}
        />
      </div>

      {/* Board */}
      <div style={{ padding: "4px 24px 24px", maxWidth: 1440, margin: "0 auto", display: "flex", gap: 12, overflowX: "auto", minHeight: "calc(100vh - 120px)" }}>
        {COLS.map(col => (
          <Column
            key={col.id} col={col}
            tasks={filtered.filter(t => t.status === col.id)}
            onAdd={openAdd} onCardClick={openEdit}
            onDrop={handleDrop}
          />
        ))}
      </div>

      <Modal open={modal} onClose={() => { setModal(false); setEditTask(null); }}>
        <TaskForm
          task={editTask}
          defaultStatus={defaultStatus}
          onSave={handleSave}
          onCancel={() => { setModal(false); setEditTask(null); }}
          onDelete={editTask ? handleDelete : undefined}
          nextKey={editTask ? editTask.key : nextKey}
        />
      </Modal>
    </div>
  );
}