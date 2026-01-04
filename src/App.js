import { useEffect, useState } from "react";
import "./App.css";
import { auth, db } from "./firebase";
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged
} from "firebase/auth";
import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  deleteDoc,
  doc,
  updateDoc
} from "firebase/firestore";

function App() {
  // 🔐 Auth state
  const [user, setUser] = useState(null);

  // 📝 Task form states
  const [subject, setSubject] = useState("");
  const [taskName, setTaskName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [hours, setHours] = useState("");

  // 📋 Tasks
  const [tasks, setTasks] = useState([]);

  // ✏️ Edit mode
  const [editId, setEditId] = useState(null);

  // 🌙 Dark mode
  const [darkMode, setDarkMode] = useState(false);

  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });

  // 🔁 Auth listener
  useEffect(() => {
    onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (u) loadTasks(u.uid);
    });
  }, []);

  const login = () => signInWithPopup(auth, provider);
  const logout = () => signOut(auth);

  // 💾 Add / Update task
  const addTask = async () => {
    if (!taskName) return;

    if (editId) {
      await updateDoc(doc(db, "tasks", editId), {
        subject,
        taskName,
        deadline,
        hours: Number(hours)
      });
      setEditId(null);
    } else {
      await addDoc(collection(db, "tasks"), {
        uid: user.uid,
        subject,
        taskName,
        deadline,
        hours: Number(hours)
      });
    }

    setSubject("");
    setTaskName("");
    setDeadline("");
    setHours("");

    loadTasks(user.uid);
  };

  // 📥 Load tasks
  const loadTasks = async (uid) => {
    const q = query(collection(db, "tasks"), where("uid", "==", uid));
    const snapshot = await getDocs(q);
    setTasks(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
  };

  // ❌ Delete task
  const deleteTask = async (id) => {
    await deleteDoc(doc(db, "tasks", id));
    setTasks(tasks.filter(t => t.id !== id));
  };

  // ✏️ Edit task
  const editTask = (t) => {
    setEditId(t.id);
    setSubject(t.subject);
    setTaskName(t.taskName);
    setDeadline(t.deadline);
    setHours(t.hours);
  };

  // 📊 Productivity logic
  const totalTasks = tasks.length;
  const totalHours = tasks.reduce((s, t) => s + (t.hours || 0), 0);
  const productivityScore = Math.min(totalHours * 10, 100);
  const dailyHours = totalTasks ? (totalHours / totalTasks).toFixed(1) : 0;

  return (
    <div className={darkMode ? "app-container dark" : "app-container"}>
      <h1>Smart Study Planner & Productivity Tracker</h1>

      <button onClick={() => setDarkMode(!darkMode)}>
        {darkMode ? "Light Mode" : "Dark Mode"}
      </button>

      {!user ? (
        <button onClick={login}>Sign in with Google</button>
      ) : (
        <>
          <p>Welcome, {user.email}</p>
          <button className="logout-btn" onClick={logout}>Logout</button>

          <hr />

          <h2>{editId ? "Edit Task" : "Add Study Task"}</h2>

          <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} />
          <input placeholder="Task name" value={taskName} onChange={e => setTaskName(e.target.value)} />
          <input type="date" value={deadline} onChange={e => setDeadline(e.target.value)} />
          <input type="number" placeholder="Study hours" value={hours} onChange={e => setHours(e.target.value)} />

          <button onClick={addTask}>
            {editId ? "Update Task" : "Save Task"}
          </button>

          <hr />

          <h2>Your Tasks</h2>
          {tasks.map(t => (
            <div className="task" key={t.id}>
              <strong>{t.subject}</strong> — {t.taskName}
              <br />
              Deadline: {t.deadline || "N/A"} | Hours: {t.hours || "N/A"}
              <br />
              <button onClick={() => editTask(t)}>Edit</button>
              <button onClick={() => deleteTask(t.id)}>Delete</button>
            </div>
          ))}

          <hr />

          <h3>Productivity Summary</h3>
          <p>Total Tasks: <strong>{totalTasks}</strong></p>
          <p>Total Study Hours: <strong>{totalHours}</strong></p>

          <h3>Productivity Score</h3>
          <div className="bar">
            <div className="fill" style={{ width: `${productivityScore}%` }} />
          </div>
          <p>{productivityScore}% productive</p>

          <h3>Adaptive Study Plan</h3>
          <p>Suggested study time per task per day: <strong>{dailyHours} hrs</strong></p>

          <h3>Study Hours Chart</h3>
          {tasks.map(t => (
            <div key={t.id} className="chart-row">
              {t.subject}
              <div className="chart-bar" style={{ width: `${t.hours * 20}px` }} />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export default App;

