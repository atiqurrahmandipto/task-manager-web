# ⚡ TaskFlow — Modern Responsive Task Manager

A high-aesthetic, ultra-responsive, zero-dependency Task Management Web Application crafted with modern HTML5, CSS3, and vanilla JavaScript. Designed for peak productivity with seamless dark/light theme switching, drag-and-drop task reordering, due date tracking with smart overdue indicators, interactive statistics, and browser LocalStorage persistence.

---

## ✨ Features

- 🌓 **Sleek Dark & Light Mode**: Smooth theme transition with automatic OS preference detection and saved user preference.
- 📝 **Comprehensive Task Management (CRUD)**:
  - Add tasks with title, description, due date, time, priority, and category.
  - Quick inline add bar for rapid task logging.
  - Interactive edit modal with pre-populated values.
  - Safe delete confirmation dialog with cancel/confirm flow.
- ✅ **Animated Checkboxes & Milestones**: Custom animated checkmark with strike-through styling and celebratory confetti animations upon task/list completion.
- ✋ **Drag-and-Drop Reordering**:
  - Reorder tasks with native HTML5 Drag and Drop API.
  - Touch gesture support for mobile devices.
  - Custom drag order automatically saved to LocalStorage.
- 📅 **Smart Due Dates & Overdue Detection**:
  - Highlights *Overdue* tasks in vibrant red with relative time tracking (e.g., "Overdue by 2 days").
  - Clear tags for *Due Today*, *Tomorrow*, and specific dates/times.
- 🎯 **Multi-Criteria Filtering & Live Search**:
  - Filter by status tabs: **All**, **Pending**, **Completed** (with dynamic count badges).
  - Filter by priority: **High**, **Medium**, **Low**.
  - Filter by category pills: **Work**, **Personal**, **Study**, **Health**, **Finance**, **Other**.
  - Real-time search by task title, description, or category.
- 📊 **Productivity Metrics Dashboard**:
  - Real-time task counter cards (Total, Pending, Completed, Overdue).
  - Smooth animated progress bar with completion percentage.
- 📱 **100% Mobile & Desktop Responsive**:
  - Sticky glassmorphic header navigation.
  - Mobile Floating Action Button (FAB) for one-tap task creation.
  - Adaptive modal sheets on mobile viewports.
- ⌨️ **Keyboard Accessibility & Shortcuts**:
  - <kbd>N</kbd>: Open New Task dialog.
  - <kbd>/</kbd>: Quick focus search bar.
  - <kbd>Esc</kbd>: Dismiss modal dialogs.
- 💾 **Offline-First & Local Storage**: Instant loads, no accounts or database required — all your tasks remain private and saved in your browser.

---

## 📸 Screenshots & UI Preview

```
+-------------------------------------------------------------------------------+
|  [⚡ TaskFlow]        [ Sat, Sep 6, 2026 ]        [🔍 Search... /]  [🌓] [+ New] |
+-------------------------------------------------------------------------------+
|  [ 5 Total ]    [ 3 Pending ]    [ 2 Completed ]    [ 1 Overdue ]   [ 40% Bar ]  |
+-------------------------------------------------------------------------------+
|  [ + Add quick task... (e.g. Finish report) ]  [📅 Due] [⚡ Med] [💼 Work] [Add] |
+-------------------------------------------------------------------------------+
|  [ All Tasks (5) ] [ Pending (3) ] [ Completed (2) ]  |  Sort: [Drag Order ▾] |
|  Categories: [All] [💼 Work] [🏠 Personal] [📚 Study] [🏃 Health] [💰 Finance] |
+-------------------------------------------------------------------------------+
|  ⠿ [ ] 🔥 Design TaskFlow Dark & Light Theme System     [💼 Work] [Tomorrow] [✎][🗑]
|  ⠿ [x] ⚡ Implement Drag-and-Drop Task Reordering        [💼 Work] [Completed][✎][🗑]
|  ⠿ [ ] 🔥 Review Machine Learning research paper        [📚 Study][Overdue]  [✎][🗑]
+-------------------------------------------------------------------------------+
```

---

## 🚀 Quick Start & Setup

Because TaskFlow is built with native web standards, there is **zero build step** or package installation required.

### Method 1: Direct File Opening
Simply double-click `index.html` or open it in any modern web browser (Chrome, Edge, Firefox, Safari).

### Method 2: Local Static Server

Using Python:
```bash
# In the project directory:
python -m http.server 8000
```
Then visit `http://localhost:8000` in your browser.

Using Node.js:
```bash
npx serve .
# or
npx http-server .
```

Using VS Code / IDE:
- Right-click `index.html` and select **"Open with Live Server"**.

---

## 📂 Project Architecture

```
task-manager-app/
├── index.html        # Semantic HTML5 markup, accessible dialogs & stats dashboard
├── style.css         # Modern CSS tokens, dark/light themes, animations & responsive layout
├── app.js            # State management, LocalStorage sync, drag-and-drop & UI controllers
└── README.md         # Documentation, feature highlights & setup guide
```

---

## 🧩 Code Highlights

- **CSS Variables & Themes**: Dual theme palette with instant contrast adaptation.
- **Light Dismiss Dialogs**: Modern `<dialog closedby="any">` paired with click coordinate fallback scripts.
- **Touch & Mouse Drag Support**: Custom pointer physics for drag handles with visual drop indicators.
- **Custom Confetti FX**: Native HTML5 Canvas particle generator for celebratory task completions.

---

## 🌐 Browser Support

- Google Chrome / Edge 98+
- Mozilla Firefox 96+
- Apple Safari 15.4+
- Mobile Browsers (Chrome Android, Safari iOS)

---

## 📄 License
MIT License &mdash; Free to use, modify, and build upon.
