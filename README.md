# KOY CALENDAR

Your page. Your rules.

---

## HOW TO GET THIS LIVE ON THE INTERNET

Follow these steps in order. Each one takes about 2-3 minutes.
You don't need to understand code. You just need to click where I tell you.

---

### STEP 1: Create the GitHub repo

1. Open your browser. Go to github.com
2. Make sure you're logged in (you should see your profile icon in the top-right)
3. Click the "+" button in the top-right corner (next to your profile icon)
4. Click "New repository"
5. In the "Repository name" box, type: koy-calendar
6. Make sure "Public" is selected (not Private)
7. Do NOT check any boxes (no README, no .gitignore, no license)
8. Click the green "Create repository" button
9. You'll land on a page with setup instructions. LEAVE THIS TAB OPEN. You'll come back to it.

---

### STEP 2: Upload the project files

1. On that same page from Step 1, look for the link that says "uploading an existing file" — click it
2. Open your computer's file explorer (the folder icon on your taskbar)
3. Find the "koy-calendar" folder that you downloaded
4. Open the folder so you can see what's inside: package.json, vite.config.js, index.html, and a "src" folder
5. Select ALL of these files and folders (Ctrl+A to select all)
6. Drag them into the browser window where GitHub is waiting
7. Wait for all files to upload (you'll see a progress bar)
8. At the bottom of the page, click the green "Commit changes" button
9. Done! Your code is now on GitHub.

---

### STEP 3: Connect to Vercel

1. Open a new browser tab. Go to vercel.com
2. Log in with your GitHub account (you already set this up)
3. Click "Add New Project" (or "New Project")
4. You should see "koy-calendar" in your list of GitHub repos. Click "Import"
5. On the next screen, you don't need to change anything. Just click "Deploy"
6. Wait about 60 seconds. Vercel is building your app.
7. When it's done, you'll see a "Congratulations!" screen with a URL like: koy-calendar-xxxx.vercel.app
8. Click that URL. Your app is live on the internet.

---

### STEP 4: Open it and test

1. Click the URL from Step 3
2. You should see the KOY CALENDAR start screen with all your templates
3. Pick a template. Everything should work — drag blocks, customize, the whole thing
4. YouTube and SoundCloud embeds will now actually PLAY (they didn't work in the chat preview)
5. Share the URL with a friend. They can see your page.

---

## MAKING CHANGES LATER

When you want to update the app:
1. Claude (in chat) writes you updated code
2. You go to github.com/YOUR_USERNAME/koy-calendar
3. Click on the file that changed (usually src/App.jsx)
4. Click the pencil icon (edit)
5. Replace the contents with the new code
6. Click "Commit changes"
7. Vercel automatically rebuilds. New version is live in ~60 seconds.

---

## WHAT'S IN THIS PROJECT

- package.json — tells the computer what tools to use
- vite.config.js — build settings
- index.html — the page shell (title, favicon)
- src/main.jsx — starts the React app
- src/App.jsx — THE ENTIRE APP (all templates, all blocks, all customization)

For now, everything lives in one file (App.jsx). As the app grows, we'll split it into
separate files for cleaner organization. But for launch, one file keeps things simple.
