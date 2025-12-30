// ===== Firebase Imports =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth, signInWithPopup, GoogleAuthProvider }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, query, where }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore.js";
import { getAnalytics, logEvent }
    from "https://www.gstatic.com/firebasejs/10.7.1/firebase-analytics.js";

// ===== Firebase Config =====
const firebaseConfig = {
    apiKey: "AIzaSyDQDwpcke88HdW03bLSQPSdNktCIEeGYag",
    authDomain: "smart-study-planner-86f98.firebaseapp.com",
    projectId: "smart-study-planner-86f98",
    storageBucket: "smart-study-planner-86f98.appspot.com",
    messagingSenderId: "64379293730",
    appId: "1:64379293730:web:2c99028a478c0e81e05b0b"
};

// ===== Initialize Firebase =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const provider = new GoogleAuthProvider();
const db = getFirestore(app);
const analytics = getAnalytics(app);

let currentUser = null;

// ===== Dark Mode Persistence =====
if (localStorage.getItem("darkMode") === "on") {
    document.body.classList.add("dark");
}

document.getElementById("darkModeBtn").onclick = () => {
    document.body.classList.toggle("dark");
    localStorage.setItem(
        "darkMode",
        document.body.classList.contains("dark") ? "on" : "off"
    );
};

// ===== Login =====
document.getElementById("loginBtn").onclick = () => {
    signInWithPopup(auth, provider)
        .then(result => {
            currentUser = result.user;
            alert("Welcome " + currentUser.displayName);
            logEvent(analytics, "login_success");
            loadTasks();
        })
        .catch(() => alert("Login failed"));
};

// ===== Save Task =====
document.getElementById("saveTaskBtn").onclick = async () => {
    if (!currentUser) {
        alert("Please login first");
        return;
    }

    const subject = subjectInput();
    const task = taskInput();
    const deadline = deadlineInput();
    const hours = hoursInput();

    if (!subject || !task || !deadline || !hours) {
        alert("Fill all fields");
        return;
    }

    await addDoc(collection(db, "tasks"), {
        uid: currentUser.uid,
        subject,
        task,
        deadline,
        hours: Number(hours),
        createdAt: new Date()
    });

    logEvent(analytics, "task_added");
    document.getElementById("status").innerText = "Task saved successfully!";
    loadTasks();
};

// ===== Load Tasks + Analytics =====
async function loadTasks() {
    const taskList = document.getElementById("taskList");
    const analyticsBox = document.getElementById("analytics");

    taskList.innerHTML = "";
    let totalHours = 0;
    const tasks = [];

    const q = query(collection(db, "tasks"), where("uid", "==", currentUser.uid));
    const snapshot = await getDocs(q);

    snapshot.forEach(doc => {
        const t = doc.data();
        tasks.push(t);
        totalHours += t.hours;

        const li = document.createElement("li");
        li.innerText = `${t.subject} - ${t.task} (${t.hours} hrs, ${t.deadline})`;
        taskList.appendChild(li);
    });

    analyticsBox.innerText =
        `Total Tasks: ${tasks.length} | Total Study Hours: ${totalHours}`;

    updateProgress(totalHours);
    generateTimetable(tasks);
}

// ===== Progress Bar =====
function updateProgress(hours) {
    const score = Math.min((hours / 10) * 100, 100);
    document.getElementById("progressBar").style.width = `${score}%`;
    document.getElementById("progressText").innerText =
        `Productivity Score: ${score.toFixed(0)}%`;
}

// ===== Adaptive Timetable =====
function generateTimetable(tasks) {
    const box = document.getElementById("timetable");

    if (tasks.length === 0) {
        box.innerText = "No tasks available to generate a plan.";
        return;
    }

    let totalHours = 0;
    let nearest = null;

    tasks.forEach(t => {
        totalHours += t.hours;
        const d = new Date(t.deadline);
        if (!nearest || d < nearest) nearest = d;
    });

    const days = Math.max(
        Math.ceil((nearest - new Date()) / (1000 * 60 * 60 * 24)),
        1
    );

    box.innerText =
        `Study about ${(totalHours / days).toFixed(1)} hours/day for the next ${days} days.`;
}

// ===== Helpers =====
const subjectInput = () => document.getElementById("subject").value;
const taskInput = () => document.getElementById("task").value;
const deadlineInput = () => document.getElementById("deadline").value;
const hoursInput = () => document.getElementById("hours").value;
