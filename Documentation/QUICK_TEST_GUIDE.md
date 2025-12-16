# ⚡ Quick Testing Guide - Collapsible Sidebar

**Server URL:** http://localhost:3000/dashboard

> **Note:** You must be logged in. If not logged in, the app will redirect you to /login

---

## 🚀 Quick Test Sequence (5 minutes)

### Step 1: Open Browser & Navigate
1. Open your browser
2. Go to: `http://localhost:3000/dashboard`
3. You should be logged in already

### Step 2: Test Desktop Expand/Collapse (30 seconds)
1. Open DevTools: Press `F12`
2. Open Device Emulation: Press `Ctrl+Shift+M` (or `Cmd+Shift+M` on Mac)
3. Set viewport to **1280x720** (Desktop)
4. You should see:
   - Sidebar on the left with full text (Dashboard, Accounts, etc.)
   - Blue toggle button (☰) in top-right of sidebar
5. **Click the toggle button** → Sidebar shrinks to just icons
6. **Click toggle again** → Sidebar expands back
7. ✅ If smooth animation and correct widths, PASS

### Step 3: Test Tooltips (30 seconds)
1. Keep sidebar collapsed (narrow)
2. Hover your mouse over the Dashboard icon
3. A black tooltip should appear with text "Dashboard"
4. Hover over other icons
5. ✅ If tooltips appear correctly, PASS

### Step 4: Test Active Route (30 seconds)
1. Expand sidebar back to full width
2. Click on "Accounts" in the sidebar
3. It should:
   - Highlight in light blue (bg-blue-100)
   - Text become blue
   - URL change to `/dashboard/accounts`
4. Click on other items
5. ✅ If highlighting follows navigation, PASS

### Step 5: Test localStorage (30 seconds)
1. Keep sidebar collapsed
2. Right-click on page → Inspect (or F12)
3. Go to **Application** → **Local Storage**
4. Find and click on `http://localhost:3000`
5. Look for key: `sidebar-storage`
6. You should see: `{"state":{"isCollapsed":true},"version":0}`
7. Refresh page (F5)
8. Sidebar should still be collapsed
9. ✅ If state persisted, PASS

### Step 6: Test Tablet View (30 seconds)
1. In DevTools, change viewport to **800x600**
2. Sidebar should start collapsed by default
3. Click toggle to expand
4. Click toggle to collapse
5. ✅ If responsive and works, PASS

### Step 7: Test Mobile View (1 minute)
1. In DevTools, change viewport to **375x667** (iPhone)
2. You should see:
   - NO sidebar visible
   - Blue button (☰) in bottom-right corner
3. Click the blue button
4. Drawer should slide in from left
5. Background should darken
6. Button icon should change to X
7. Click "Accounts" in drawer
8. Drawer should close and navigate to Accounts
9. ✅ If drawer works, PASS

### Step 8: Check Console (30 seconds)
1. Open Console tab in DevTools
2. Look for any red errors
3. Should be clean (only normal logs)
4. ✅ If no errors, PASS

---

## ✅ Overall Test Results

| Test | Status | Notes |
|------|--------|-------|
| Desktop Expand/Collapse | ✅ / ❌ | Smooth animation at 300ms |
| Tooltips on Hover | ✅ / ❌ | Only visible when collapsed |
| Active Route Highlight | ✅ / ❌ | Blue background + blue text |
| localStorage Persistence | ✅ / ❌ | State survives page reload |
| Tablet Responsive | ✅ / ❌ | Starts collapsed, expandable |
| Mobile FAB + Drawer | ✅ / ❌ | Slide-in from left, closes on nav |
| Console Clean | ✅ / ❌ | No red errors |

---

## 🎯 Success Criteria

✅ **All tests pass** → Ready for PR
❌ **Any test fails** → Fix and re-test

---

## 📝 Detailed Testing Guide

For more comprehensive testing with all edge cases, refer to:
- **[TESTING_SIDEBAR.md](./TESTING_SIDEBAR.md)** - Full testing guide
- **[SIDEBAR_TEST_REPORT.md](./SIDEBAR_TEST_REPORT.md)** - Detailed test report template

---

## 🐛 Troubleshooting

### "I don't see a sidebar"
- Are you logged in? Check if you're redirected to /login
- Are you on /dashboard page? Not on home page
- Check DevTools Console for errors (F12 → Console)

### "Tooltips don't appear"
- Sidebar must be in collapsed state (narrow)
- Hover over the icons, not the background
- Wait ~200ms for tooltip to show

### "Sidebar doesn't collapse"
- Click the ☰ button in the top-right corner of sidebar
- On mobile, there's only a blue FAB button at bottom-right
- On tablet, might start collapsed by default

### "localStorage data not showing"
- DevTools → Application → Local Storage → http://localhost:3000
- Refresh page if you just toggled sidebar
- Check browser console for any errors

---

**Ready to test?** Open http://localhost:3000/dashboard in your browser! 🚀
