document.addEventListener("DOMContentLoaded", () => {
  initializeNavigation();
  initializeLoginForm();
  initializeDashboardCounters();
  initializeDashboardButtons();
  initializeTaskBoard();
  initializeSettings();
  initializeCalendarControls();
  initializeSmoothHoverEffects();
});

async function fetchTasksFromBackend() {
  try {
    const response = await fetch(API_URL);
    tasks = await response.json();
    applyCurrentFilters();
    updateDashboardCountersFromTasks();
  } catch (error) {
    console.error("Error fetching tasks:", error);
  }
}

async function createTaskInBackend(taskData) {
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(taskData),
    });

    if (!response.ok) {
      throw new Error("Failed to create task");
    }

    await fetchTasksFromBackend();
  } catch (error) {
    console.error("Error creating task:", error);
  }
}

async function deleteTaskFromBackend(taskId) {
  try {
    await fetch(`${API_URL}/${taskId}`, {
      method: "DELETE",
    });

    await fetchTasksFromBackend();
  } catch (error) {
    console.error("Error deleting task:", error);
  }
}
async function updateTaskInBackend(taskId, updatedData) {
  try {
    const response = await fetch(`${API_URL}/${taskId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updatedData),
    });

    if (!response.ok) {
      throw new Error("Failed to update task");
    }

    await fetchTasksFromBackend();
  } catch (error) {
    console.error("Error updating task:", error);
  }
}
async function clearAllTasksFromBackend() {
  try {
    await fetch(API_URL, {
      method: "DELETE",
    });

    await fetchTasksFromBackend();
  } catch (error) {
    console.error("Error clearing tasks:", error);
  }
}
function updateDashboardCountersFromTasks() {
  const total = tasks.length;
  const completed = tasks.filter((task) => task.status === "done").length;
  const inProgress = tasks.filter((task) => task.status === "progress").length;
  const overdue = tasks.filter(
    (task) => task.status !== "done" && task.deadline !== "No deadline",
  ).length;

  const counters = document.querySelectorAll(".counter");
  if (counters.length >= 4) {
    counters[0].textContent = total;
    counters[1].textContent = completed;
    counters[2].textContent = inProgress;
    counters[3].textContent = overdue;
  }
}
/* =========================
   STORAGE
========================= */

let tasks = [];
const API_URL = "http://localhost:5000/api/tasks";
let currentMonthIndex = 3;

const months = [
  "January 2025",
  "February 2025",
  "March 2025",
  "April 2025",
  "May 2025",
  "June 2025",
];

/* =========================
   NAVIGATION
========================= */

function initializeNavigation() {
  const currentPage = window.location.pathname.split("/").pop();

  document
    .querySelectorAll(".simple-nav a, .nav-links a, .side-link")
    .forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href === "#") return;

      if (href === currentPage) {
        link.classList.add("active");
      }
    });
}
function initializeLoginForm() {
  const loginForm = document.querySelector(".auth-form");
  if (!loginForm) return;

  loginForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const emailInput = document.querySelector("#email");
    const passwordInput = document.querySelector("#password");

    const email = emailInput?.value.trim();
    const password = passwordInput?.value.trim();

    if (!email || !password) {
      alert("Please enter both email and password.");
      return;
    }

    if (!email.includes("@")) {
      alert("Please enter a valid email address.");
      return;
    }

    window.location.href = "dashboard.html";
  });
}

/* =========================
   DASHBOARD
========================= */

function initializeDashboardCounters() {
  fetchTasksFromBackend();
}

function animateCounter(element, target) {
  let current = 0;
  const duration = 1200;
  const stepTime = 20;
  const increment = Math.max(1, Math.ceil(target / (duration / stepTime)));

  const timer = setInterval(() => {
    current += increment;

    if (current >= target) {
      current = target;
      clearInterval(timer);
      element.classList.add("counted");
    }

    element.textContent = current;
  }, stepTime);
}

function initializeDashboardButtons() {
  const dashboardButtons = document.querySelectorAll(
    ".dashboard-create-task-btn",
  );
  dashboardButtons.forEach((button) => {
    button.addEventListener("click", () => {
      window.location.href = "tasks.html";
    });
  });
}

/* =========================
   TASK BOARD
========================= */

function initializeTaskBoard() {
  const board = document.querySelector("#kanbanBoard");
  if (!board) return;

  initializeTaskModal();
  initializeTaskFilters();
  initializeClearAllTasks();
  fetchTasksFromBackend();
}

function renderTasks(taskArray) {
  const todoList = document.querySelector("#todo-list");
  const progressList = document.querySelector("#progress-list");
  const reviewList = document.querySelector("#review-list");
  const doneList = document.querySelector("#done-list");

  if (!todoList || !progressList || !reviewList || !doneList) return;

  todoList.innerHTML = "";
  progressList.innerHTML = "";
  reviewList.innerHTML = "";
  doneList.innerHTML = "";

  taskArray.forEach((task) => {
    const card = createTaskCard(task);

    if (task.status === "todo") todoList.appendChild(card);
    if (task.status === "progress") progressList.appendChild(card);
    if (task.status === "review") reviewList.appendChild(card);
    if (task.status === "done") doneList.appendChild(card);
  });

  updateTaskCounts(taskArray);
  updateBoardSummary(taskArray);
  setupTaskCardButtons();
}
function getPriorityClass(priority) {
  const strategies = {
    high: () => "high",
    medium: () => "medium",
    low: () => "low",
  };

  return strategies[priority] ? strategies[priority]() : "low";
}
function createTaskCard(task) {
  const article = document.createElement("article");
  article.className = "task-card";
  article.dataset.id = task.id;

  article.innerHTML = `
    <h4>${escapeHtml(task.title)}</h4>
    <p>${escapeHtml(task.description)}</p>
    <div class="task-meta">
      <span class="priority ${getPriorityClass(task.priority)}">${capitalize(task.priority)}</span>
      <span class="deadline">
        <i class="fa-regular fa-calendar"></i> ${escapeHtml(task.deadline || "No deadline")}
      </span>
    </div>
   <div class="task-buttons">
  <button class="btn btn-secondary move-btn" data-id="${task.id}">
    <i class="fa-solid fa-arrow-right"></i> Move
  </button>
  <button class="btn btn-secondary delete-btn" data-id="${task.id}">
    <i class="fa-solid fa-trash"></i> Delete
  </button>
</div>
  `;

  return article;
}

function updateTaskCounts(taskArray) {
  const statuses = ["todo", "progress", "review", "done"];

  statuses.forEach((status) => {
    const column = document.querySelector(`[data-status="${status}"]`);
    if (!column) return;

    const countElement = column.querySelector(".task-count");
    if (!countElement) return;

    countElement.textContent = taskArray.filter(
      (task) => task.status === status,
    ).length;
  });
}

function updateBoardSummary(taskArray) {
  const totalTasksValue = document.querySelector("#totalTasksValue");
  const activeTasksValue = document.querySelector("#activeTasksValue");
  const completedTasksValue = document.querySelector("#completedTasksValue");

  if (totalTasksValue) totalTasksValue.textContent = taskArray.length;
  if (activeTasksValue)
    activeTasksValue.textContent = taskArray.filter(
      (task) => task.status !== "done",
    ).length;
  if (completedTasksValue)
    completedTasksValue.textContent = taskArray.filter(
      (task) => task.status === "done",
    ).length;
}

function setupTaskCardButtons() {
  document.querySelectorAll(".move-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      moveTaskForward(id);
    });
  });

  document.querySelectorAll(".delete-btn").forEach((button) => {
    button.addEventListener("click", () => {
      const id = Number(button.dataset.id);
      deleteTask(id);
    });
  });
}

function moveTaskForward(taskId) {
  const task = tasks.find((item) => item.id === taskId);
  if (!task) return;

  let newStatus = task.status;

  if (task.status === "todo") {
    newStatus = "progress";
  } else if (task.status === "progress") {
    newStatus = "review";
  } else if (task.status === "review") {
    newStatus = "done";
  } else {
    alert("This task is already completed.");
    return;
  }

  updateTaskInBackend(taskId, { status: newStatus });
}

function deleteTask(taskId) {
  const confirmed = confirm("Delete this task?");
  if (!confirmed) return;

  deleteTaskFromBackend(taskId);
}

function initializeTaskModal() {
  const openBtn = document.querySelector("#openTaskModalBtn");
  const closeBtn = document.querySelector("#closeTaskModalBtn");
  const modal = document.querySelector("#taskModalOverlay");
  const form = document.querySelector("#taskForm");

  if (!openBtn || !closeBtn || !modal || !form) return;

  openBtn.addEventListener("click", () => {
    modal.classList.add("show");
  });

  closeBtn.addEventListener("click", () => {
    modal.classList.remove("show");
  });

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.remove("show");
    }
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const title = document.querySelector("#taskTitle")?.value.trim();
    const description = document
      .querySelector("#taskDescription")
      ?.value.trim();
    const priority = document.querySelector("#taskPriority")?.value || "medium";
    const status = document.querySelector("#taskStatus")?.value || "todo";
    const deadline =
      document.querySelector("#taskDeadline")?.value.trim() || "No deadline";

    if (!title || !description) {
      alert("Please enter both title and description.");
      return;
    }

    const newTask = {
      title,
      description,
      priority,
      deadline,
      status,
    };

    createTaskInBackend(newTask);
    form.reset();
    modal.classList.remove("show");
  });
}

function initializeTaskFilters() {
  const searchInput = document.querySelector("#taskSearchInput");
  const priorityFilter = document.querySelector("#priorityFilter");
  const statusFilter = document.querySelector("#statusFilter");

  if (!searchInput || !priorityFilter || !statusFilter) return;

  searchInput.addEventListener("input", applyCurrentFilters);
  priorityFilter.addEventListener("change", applyCurrentFilters);
  statusFilter.addEventListener("change", applyCurrentFilters);
}

function applyCurrentFilters() {
  const searchInput = document.querySelector("#taskSearchInput");
  const priorityFilter = document.querySelector("#priorityFilter");
  const statusFilter = document.querySelector("#statusFilter");

  if (!searchInput || !priorityFilter || !statusFilter) {
    renderTasks(tasks);
    return;
  }

  const searchValue = searchInput.value.toLowerCase().trim();
  const priorityValue = priorityFilter.value;
  const statusValue = statusFilter.value;

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchValue) ||
      task.description.toLowerCase().includes(searchValue);

    const matchesPriority =
      priorityValue === "all" || task.priority === priorityValue;

    const matchesStatus = statusValue === "all" || task.status === statusValue;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  renderTasks(filteredTasks);
}

function initializeClearAllTasks() {
  const clearBtn = document.querySelector("#clearAllTasksBtn");
  if (!clearBtn) return;

  clearBtn.addEventListener("click", () => {
    if (!tasks.length) {
      alert("There are no tasks to clear.");
      return;
    }

    const confirmed = confirm("Clear all tasks?");
    if (!confirmed) return;

    clearAllTasksFromBackend();
  });
}

/* =========================
   SETTINGS
========================= */

function initializeSettings() {
  const settingsGrid = document.querySelector(".settings-grid");
  if (!settingsGrid) return;

  const workspaceBtn = document.querySelector(
    ".settings-card .btn.btn-primary",
  );
  const profileBtn = document.querySelector(
    ".settings-card .btn.btn-secondary",
  );

  if (workspaceBtn) {
    workspaceBtn.addEventListener("click", () => {
      const workspaceName =
        document.querySelector("#workspaceName")?.value || "Workspace";
      alert(`Workspace settings saved for "${workspaceName}".`);
    });
  }

  if (profileBtn) {
    profileBtn.addEventListener("click", () => {
      const fullName = document.querySelector("#fullName")?.value || "User";
      alert(`Profile updated for ${fullName}.`);
    });
  }
}

/* =========================
   CALENDAR
========================= */

function initializeCalendarControls() {
  const calendarPage = document.querySelector(".calendar-wrapper");
  if (!calendarPage) return;

  const buttons = document.querySelectorAll(".page-header .btn-secondary");
  if (buttons.length < 3) return;

  const prevBtn = buttons[0];
  const monthBtn = buttons[1];
  const nextBtn = buttons[2];

  monthBtn.textContent = months[currentMonthIndex];

  prevBtn.addEventListener("click", () => {
    if (currentMonthIndex > 0) {
      currentMonthIndex--;
      monthBtn.textContent = months[currentMonthIndex];
    }
  });

  nextBtn.addEventListener("click", () => {
    if (currentMonthIndex < months.length - 1) {
      currentMonthIndex++;
      monthBtn.textContent = months[currentMonthIndex];
    }
  });
}

/* =========================
   UI EFFECTS
========================= */

function initializeSmoothHoverEffects() {
  const cards = document.querySelectorAll(
    ".floating-card, .task-card, .team-card, .feature-card, .info-card",
  );
  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => {
      card.style.transform = "translateY(-6px)";
    });

    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
    });
  });
}

/* =========================
   HELPERS
========================= */

function capitalize(word) {
  if (!word) return "";
  return word.charAt(0).toUpperCase() + word.slice(1);
}

function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}
