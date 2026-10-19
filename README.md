# YouTube Live Sinhala Subtitles 🎬🇱🇰
> **Real-time YouTube caption translator Chrome Extension that brings live Sinhala subtitles to any video (English, Hindi, Korean, Japanese, Tamil, etc.). Powered by PTM Prime.**

[![Manifest V3](https://img.shields.io/badge/Manifest-V3-red.svg)](https://developer.chrome.com/docs/extensions/mv3/intro/)
[![Browser Support](https://img.shields.io/badge/Browsers-Chrome%20%7C%20Edge%20%7C%20Brave-blue.svg)](#-how-to-install-anyone-can-do-it)
[![License](https://img.shields.io/badge/License-MIT%20%2F%20Open%20Source-green.svg)](#-license--credits)
[![Developer](https://img.shields.io/badge/Powered%20By-PTM%20Prime-gold.svg)](https://github.com/Pathum-Official)

---

## 🌟 Key Features

- **⚡ Real-Time Live Translation**: Automatically captures audio captions from YouTube in real-time and translates them into natural Sinhala with latency under 200ms.
- **🌐 Multilingual Source Support**: Translate from **any language** to Sinhala:
  - Auto-Detect Any Language (ස්වයංක්‍රීයව හඳුනාගැනීම)
  - English, Hindi (हिन्दी), Tamil (தமிழ்), Korean (한국어 / K-Drama), Japanese (日本語 / Anime), Spanish, French, German, Chinese, Russian, etc.
- **🛡️ Smart Bracket & Censor Cleaner**:
  - Automatically strips non-spoken sound cues like `[Music]`, `[संगीत]`, `[Applause]`, `>>`, and censor masks `[__]` without altering actual spoken dialogue.
  - Spoken words like *"That music is beautiful"* translate completely with 100% fidelity.
- **🎛️ Dual Subtitle Mode**: Choose between **Sinhala Only** or **Dual Mode** (stacked Original Language + Sinhala translation) — great for language learners.
- **🎨 Sleek, Customizable Overlay**: Modern glassmorphic subtitle card with high-contrast text outlines and drop shadows, readable across bright and dark movie scenes.
- **✋ Interactive Drag-to-Reposition**: Easily drag and reposition the subtitle box anywhere across the video player, with layout presets (Bottom Center, Top Center, Bottom Left, Bottom Right).
- **🔴 Native YouTube Control Integration**: Injects a custom **"සි"** button directly into YouTube's control bar for instant one-click toggling.
- **✨ Native Caption Suppression**: Suppresses YouTube's default caption visuals so they don't overlap, while keeping the background caption stream actively reading.
- **🧭 Continuous Heartbeat & SPA Navigation**: Seamlessly re-attaches across YouTube video switches without reloading the page.
- **⚙️ Modern Settings Popup**:
  - Subtitle Font Size slider (16px – 38px).
  - Background Box Opacity slider (0% – 100%).
  - Text & Background Color pickers with curated swatches + custom color pickers.
  - Live interactive preview box reflecting styling changes in real-time.
  - Settings synced across browser sessions via `chrome.storage.sync`.

---

## 📥 How to Install (Anyone can do it!)

You don't need any programming knowledge to use this extension. Follow these simple steps:

### Method 1: Download ZIP (Recommended for regular users)

1. **Download the code**:
   - Click the green **`<> Code`** button at the top of this GitHub page.
   - Click **`Download ZIP`** (or [click here to download](https://github.com/Pathum-Official/youtube-sinhala-subtitles/archive/refs/heads/main.zip)).
2. **Extract the ZIP file**:
   - Right-click the downloaded `.zip` file on your computer and select **"Extract All..."** (හෝ Extract Here).
   - You will now have a folder named `youtube-sinhala-subtitles-main` (or `youtube-sinhala-subtitles`).
3. **Open Extensions in your Browser**:
   - Open **Google Chrome**, **Microsoft Edge**, or **Brave Browser**.
   - In the address bar, type:
     - Chrome: `chrome://extensions`
     - Edge: `edge://extensions`
     - Brave: `brave://extensions`
   - Press **Enter**.
4. **Enable Developer Mode**:
   - Turn **ON** the **"Developer mode"** toggle switch in the top-right corner of the Extensions page.
5. **Load the Extension**:
   - Click the **"Load unpacked"** button on the top-left.
   - Select the extracted folder containing `manifest.json`.
   - Done! 🎉 **"YouTube Live Sinhala Subtitles"** is now installed.
6. **Pin the Extension**:
   - Click the Puzzle piece icon in your browser toolbar and pin the extension icon for easy access.

---

### Method 2: Git Clone (For developers)

```bash
git clone https://github.com/Pathum-Official/youtube-sinhala-subtitles.git
```
Then load the folder into `chrome://extensions` via **Load unpacked**.

---

## 🇱🇰 සිංහලෙන් උපදෙස් (පරිගණකයට ස්ථාපනය කරගන්නා ආකාරය)

මෙම Extension එක ඔබගේ පරිගණකයට දමාගැනීමට කිසිදු විශේෂ තාක්ෂණික දැනුමක් අවශ්‍ය නොවේ. පහත සරල පියවර අනුගමනය කරන්න:

### පියවර 1: Extension එක Download කරගන්න
- මෙම GitHub පිටුවේ ඉහළ දකුණු පස ඇති කොළ පැහැති **`<> Code`** බොත්තම ඔබා **`Download ZIP`** තෝරන්න.
- *(හෝ කෙලින්ම ZIP එක බාගත කරගැනීමට [මෙතැන Click කරන්න](https://github.com/Pathum-Official/youtube-sinhala-subtitles/archive/refs/heads/main.zip))*

### පියවර 2: ZIP File එක Unzip (Extract) කරගන්න
- Download වූ `youtube-sinhala-subtitles-main.zip` ගොනුව මත Right-click කරන්න.
- **"Extract All..."** (හෝ Extract Here) තෝරා සාමාන්‍ය Folder එකක් බවට පත්කරගන්න.

### පියවර 3: ඔබගේ Browser එකේ Extensions පිටුවට යන්න
- ඔබ භාවිත කරන බ්‍රවුසරය (Google Chrome, Brave හෝ Microsoft Edge) විවෘත කරන්න.
- ඉහළ Address Bar එකේ පහත ලිපිනය Type කර **Enter** ඔබන්න:
  - **Google Chrome නම්:** `chrome://extensions`
  - **Brave Browser නම්:** `brave://extensions`
  - **Microsoft Edge නම්:** `edge://extensions`

### පියවර 4: Developer Mode On කර Extension එක Load කරන්න
1. Extensions පිටුවේ ඉහළ දකුණු කෙළවරේ ඇති **"Developer mode"** ස්විචය **ON** කරන්න.
2. පිටුවේ ඉහළ වම්පස දිස්වන **"Load unpacked"** බොත්තම Click කරන්න.
3. පියවර 2 හිදී ඔබ Unzip කළ Folder එක (`manifest.json` ගොනුව ඇති ෆෝල්ඩරය) තෝරා **"Select Folder"** ඔබන්න.
4. සුබ පැතුම්! 🎉 **YouTube Live Sinhala Subtitles** ඔබගේ බ්‍රවුසරයට සාර්ථකව එක්වී ඇත.

### පියවර 5: YouTube හි සිංහල උපසිරැසි බලන ආකාරය
1. YouTube වෙත ගොස් කැමති ඕනෑම වීඩියෝවක් (English, Hindi, Korean ආදී) Play කරන්න.
2. වීඩියෝවේ **CC (Captions)** ක්‍රියාත්මක කරන්න (Keyboard එකේ **C** අකුර ඔබන්න).  
   *(වැදගත්: YouTube එකෙන් කටහඬ හඳුනාගන්නේ CC හරහා බැවින් මෙය ක්‍රියාත්මක කර තිබිය යුතුය)*
3. දැන් වීඩියෝව මත සජීවීව පිරිසිදු සිංහල උපසිරැසි දිස්වනු ඇත!
4. YouTube Player එකේ පහළ Control Bar එකේ ඇති **"සි"** බොත්තම මඟින් අවශ්‍ය ඕනෑම මොහොතක උපසිරැසි On/Off කළ හැක.
5. බ්‍රවුසරයේ ඉහළ ඇති Extension අයිකනය Click කිරීමෙන් අකුරු විශාලත්වය, වර්ණ සහ **Dual Subtitles (මූල භාෂාව + සිංහල)** පහසුවෙන්ම වෙනස් කරගත හැක.


---

## 🎬 How to Use & Test

1. Open any YouTube video in English, Hindi, Korean, Japanese, etc.
2. **Turn ON YouTube Captions (CC)**:
   - Press **`C`** on your keyboard or click the **`CC`** button in the YouTube player.
   - *Note: YouTube CC must be enabled so the extension can read the speech stream.*
3. **Watch the Sinhala Subtitles**:
   - Spoken dialogue will be translated instantly into clean Sinhala on the player overlay!
4. **On-Player Toggle**:
   - Click the **"සි"** button in YouTube's control bar to turn subtitles on or off anytime.
5. **Drag Anywhere**:
   - Hover over the subtitle box and use the **`⋮⋮ Drag`** handle to move it anywhere on the video.
6. **Customize Settings**:
   - Click the extension icon in your browser toolbar to change font sizes, colors, background opacity, or switch to **Dual Subtitles (Original + Sinhala)**.

---

## ⚙️ Settings Overview

| Setting | Options | Description |
| :--- | :--- | :--- |
| **Master Switch** | On / Off | Enable or disable the extension globally |
| **Subtitle Mode** | Sinhala Only / Dual (EN + SI) | Show Sinhala only or stacked bilingual dialogue |
| **Font Size** | 16px – 38px | Adjust subtitle text size to your screen |
| **Background Opacity** | 0% – 100% | Control box transparency (0% = text only) |
| **Colors** | Yellow, White, Cyan, Green, Coral, Custom | Customize text and box background colors |
| **Text Shadow** | High-Contrast Outline & Shadow | Ensures readability on bright movie scenes |
| **Position Presets** | Bottom Center, Top Center, Corners, Custom | Choose preset or drag freely on the video |
| **Source Language** | Auto-Detect, English, Hindi, Korean, Japanese, etc. | Select spoken language or auto-detect |
| **Streaming Latency** | Fast (100ms) / Balanced (200ms) / Smooth (350ms) | Fine-tune translation cadence |
| **Hide Native Captions** | Checked / Unchecked | Visually hides default YouTube captions |

---

## 🏗️ Architecture & Technical Stack

```
youtube-sinhala-subtitles/
├── manifest.json       # Manifest V3 configuration, permissions & host matches
├── background.js       # Background service worker: Translation proxy & caching
├── content.js          # Core engine: Real-time caption observer, sanitization & overlay
├── styles.css          # Subtitle card, typography, drag handle, player control button
├── popup.html          # Modern dark-mode popup interface with live preview
├── popup.js            # Settings controller, storage synchronization & tab messaging
├── icons/              # Extension icons (16x16, 48x48, 128x128) with authentic 'සි' glyph
└── README.md           # Documentation, installation guide & credits
```

- **Manifest V3 Architecture**: Compliant with latest Chrome Web Store standards.
- **Fast Google Translate Endpoint**: Low latency (<200ms) translation without bulky external SDKs.
- **Two-Tier LRU Caching**: Content-script cache (0ms) + background service worker cache to prevent redundant API calls.
- **Heartbeat Observer**: 350ms loop ensures overlay and buttons remain attached across SPA video navigation.

---

## 📄 License & Credits

- **Author & Developer**: [Pathum-Official](https://github.com/Pathum-Official)
- **Powered by**: **PTM Prime**
- **Copyright**: © 2026 PTM Prime. All rights reserved.
- Free and open-source for educational, personal, and community use.
