# 🧪 TESTING INSTRUCTIONS - Collapsible Sidebar Feature

**Current Status:** ✅ Feature Complete, Ready for Testing

**Branch:** `feature/collapsible-sidebar`

**Dev Server:** http://localhost:3000 (RUNNING ✅)

---

## 📌 What You Need to Do

Test the new collapsible sidebar feature locally before we create a Pull Request.

---

## 🎯 Three Testing Options

### Option A: QUICK TEST (5 minutes) ⚡
**Best for:** You just want to verify it works

👉 **[Read QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md)**

Steps:
1. Open http://localhost:3000/dashboard
2. Follow the simple checklist
3. Report: "All tests passed ✅" or describe issues

---

### Option B: COMPREHENSIVE TEST (10 minutes) 🔍
**Best for:** Thorough quality assurance

👉 **[Read TESTING_SIDEBAR.md](./TESTING_SIDEBAR.md)**

Covers:
1. Desktop expand/collapse
2. Desktop tooltips
3. Desktop persistence
4. Tablet responsive
5. Mobile FAB + drawer
6. Animations
7. Console checking
8. All breakpoints

---

### Option C: DETAILED REPORT (15 minutes) 📊
**Best for:** Full documentation

👉 **[Use SIDEBAR_TEST_REPORT.md](./SIDEBAR_TEST_REPORT.md)**

Includes:
1. All tests from Option B
2. Detailed results for each test
3. Console output capture
4. Final sign-off

---

## 🚀 Quick Start (Right Now)

1. **Make sure you're logged in**
   - If not: http://localhost:3000/login
   - Create test account if needed

2. **Open the dashboard**
   - Go to: http://localhost:3000/dashboard

3. **Test on desktop first**
   - Press F12 to open DevTools
   - Press Ctrl+Shift+M to enable Device Emulation
   - Set viewport to 1280x720
   - Try clicking the ☰ button in sidebar to collapse/expand

4. **Test on mobile**
   - Change viewport to 375x667 (iPhone)
   - Look for blue button in bottom-right corner
   - Click it to open/close drawer

5. **If everything works smooth** → Tell me "All tests pass ✅"

6. **If anything breaks** → Tell me what went wrong and I'll fix it

---

## ✅ What Should Happen

### Desktop (1280px+)
```
┌─────────────────────────────────┐
│  ☰ 💰 Finance          Logout   │  ← Top bar
├──────────────────────────────────┤
│ 💰│  Dashboard         │         │
│ 💳│  Accounts          │         │
│ 📊│  Transactions      │         │
│ 👥│  Groups            │ Content │
│ 📤│  Import            │         │
│ ⚙️│  Settings          │         │
│ v1.0.0                           │
└──────────────────────────────────┘
 ↑
Click ☰ to collapse → shows only icons
Hover icons → tooltips appear
```

### Mobile (375px)
```
┌────────────────────────┐
│ ☰ FinanceApp   Logout  │  ← Top bar
├────────────────────────┤
│                        │
│    Dashboard Content   │
│                        │
│                        │
└────────────────────────┘
            ☰  ← Blue button (click to open drawer)

When clicked:
┌─────────────────┐
│ 💰 Finance      │  ← Drawer (slides in)
│ 🏠 Dashboard    │
│ 💳 Accounts     │
│ 📊 Transactions │
│ 👥 Groups       │
│ 📤 Import       │
│ ⚙️  Settings     │
└─────────────────┘
(dark background behind drawer)
```

---

## 🧪 Three Key Things to Test

### 1️⃣ Desktop Toggle (30 seconds)
- [ ] Click ☰ button → sidebar narrows to just icons
- [ ] Click ☰ button again → sidebar expands back
- [ ] Animation is smooth (not jerky)

### 2️⃣ Tooltips (30 seconds)
- [ ] Collapse the sidebar
- [ ] Hover over each icon
- [ ] Black tooltip appears with text (Dashboard, Accounts, etc.)

### 3️⃣ Mobile Drawer (30 seconds)
- [ ] Resize to 375x667 (mobile)
- [ ] Blue ☰ button appears bottom-right
- [ ] Click it → drawer slides in from left
- [ ] Click an item → drawer closes and page changes
- [ ] Click outside drawer → drawer closes

---

## 💾 Expected Behavior Details

| Feature | Expected | ✅/❌ |
|---------|----------|-------|
| Desktop sidebar toggles 256px ↔ 64px | Smooth 300ms animation | |
| Collapsed icons show only | No text visible | |
| Hover over icons shows tooltips | Black box with white text | |
| Click navigation item | Blue highlight, URL updates | |
| Reload page | Sidebar state remembered | |
| Tablet (768px) | Sidebar starts collapsed | |
| Mobile (375px) | FAB button visible | |
| Mobile drawer | Slides from left, darkens background | |
| Mobile drawer close | Click item or outside area | |
| Console | No red errors | |

---

## 🔗 Documentation Files

```
📄 README_TESTING.md          ← Overview (read first)
📄 QUICK_TEST_GUIDE.md         ← 5-min test checklist
📄 TESTING_SIDEBAR.md          ← Full testing guide (10 tests)
📄 SIDEBAR_TEST_REPORT.md      ← Detailed report template
📄 PR_TEMPLATE.md              ← PR description (ready to use)
```

---

## 🎯 After Testing

### If All Tests Pass ✅
```bash
Tell me: "All tests pass ✅"

Then we:
1. Commit the documentation
2. Create a Pull Request
3. Merge to master
4. Done! 🚀
```

### If Something Breaks ❌
```bash
Tell me:
1. What was wrong?
2. What did you expect?
3. What happened instead?
4. Any red errors in console?

I'll fix it and we test again.
```

---

## 🔧 Tech Stack (FYI)

- **State Management:** Zustand with localStorage persist
- **Styling:** Tailwind CSS responsive breakpoints
- **Icons:** Lucide-react
- **Animations:** CSS transitions (300ms collapse, 200ms tooltip delay)

No new external libraries needed - uses what's already in the project.

---

## ⏰ Timeline

**Now:** You test (5-15 minutes)
**After:** I commit documentation (2 minutes)
**After:** Create PR (1 minute)
**After:** Merge to master (1 minute)

---

## 🆘 Need Help?

### "I don't see the sidebar"
→ Are you logged in? Check `/login` first

### "Where's the test button?"
→ Look for ☰ button in top-right of sidebar (desktop) or bottom-right (mobile)

### "Tooltips not showing?"
→ Sidebar must be collapsed (narrow). Hover over icons.

### "Anything weird happens?"
→ Open DevTools (F12) → Console tab, look for red errors

### "Just want to see it working?"
→ Open http://localhost:3000/dashboard → Click ☰ button → Done!

---

## 🎉 Ready?

**Choose your testing style:**

- **Quick?** → [QUICK_TEST_GUIDE.md](./QUICK_TEST_GUIDE.md) (5 min)
- **Thorough?** → [TESTING_SIDEBAR.md](./TESTING_SIDEBAR.md) (10 min)
- **Detailed?** → [SIDEBAR_TEST_REPORT.md](./SIDEBAR_TEST_REPORT.md) (15 min)

**Open http://localhost:3000/dashboard and start testing! 🚀**

Report results when done → We'll create the PR right away.
