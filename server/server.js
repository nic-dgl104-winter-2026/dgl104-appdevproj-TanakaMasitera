const express = require("express");
const cors = require("cors");
const path = require("path");

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, "../client")));

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

let tasks = [
  {
    id: 1,
    title: "Design landing page",
    description: "Create the hero section and navigation layout.",
    priority: "high",
    deadline: "Apr 10",
    status: "todo",
  },
  {
    id: 2,
    title: "Build backend API",
    description: "Create Express routes for task CRUD operations.",
    priority: "medium",
    deadline: "Apr 12",
    status: "progress",
  },
  {
    id: 3,
    title: "Test login validation",
    description: "Check empty fields and password flow.",
    priority: "low",
    deadline: "Apr 15",
    status: "review",
  },
];

app.get("/", (req, res) => {
  res.send("🚀 TaskFlow Backend is Running");
});

app.get("/api/tasks", (req, res) => {
  res.json(tasks);
});

app.post("/api/tasks", (req, res) => {
  const { title, description, priority, deadline, status } = req.body;

  if (!title || !description) {
    return res
      .status(400)
      .json({ message: "Title and description are required." });
  }

  const newTask = {
    id: Date.now(),
    title,
    description,
    priority: priority || "medium",
    deadline: deadline || "No deadline",
    status: status || "todo",
  };

  tasks.unshift(newTask);
  res.status(201).json(newTask);
});

app.delete("/api/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);
  tasks = tasks.filter((task) => task.id !== taskId);
  res.json({ message: "Task deleted successfully." });
});
app.put("/api/tasks/:id", (req, res) => {
  const taskId = Number(req.params.id);
  const { status } = req.body;

  const task = tasks.find((task) => task.id === taskId);

  if (!task) {
    return res.status(404).json({ message: "Task not found." });
  }

  task.status = status || task.status;

  res.json(task);
});
app.delete("/api/tasks", (req, res) => {
  tasks = [];
  res.json({ message: "All tasks cleared successfully." });
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
});
