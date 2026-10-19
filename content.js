/**
 * YouTube Live Sinhala Subtitles - Content Script (Manifest V3)
 * Powered by PTM Prime | Copyright © 2026 PTM Prime. All rights reserved.
 * Real-time DOM observation, multilingual caption extraction & Sinhala overlay.
 */

(() => {
  "use strict";

  // Prevent duplicate script execution
  if (window.__YOUTUBE_SINHALA_SUBTITLES_LOADED__) return;
  window.__YOUTUBE_SINHALA_SUBTITLES_LOADED__ = true;

  // ============================================================================
  // 1. Extension State & Defaults
  // ============================================================================
  let state = {
    enabled: true,
    fontSize: 24,
    textColor: "#FFEB3B",
    textShadow: true,
    backgroundColor: "#0d0f17",
    backgroundOpacity: 80,
    sourceLang: "auto", // Auto-detect: English, Hindi, Korean, Japanese, Tamil, etc.
    dualSubtitles: false,
    enTextColor: "#E2E8F0",
    positionPreset: "bottom-center",
    customX: null,
    customY: null,
    latencyMode: "balanced", // fast: 100ms, balanced: 200ms, smooth: 350ms
    hideNativeSubs: true,
    showBadgeTooltip: true
  };

  // Fast In-Memory LRU Cache for active tab (up to 300 items, 0ms latency)
  const localCache = new Map();
  const MAX_LOCAL_CACHE = 300;

  // Active translation tracking
  let currentRequestId = 0;
  let debounceTimer = null;
  let autoHideTimer = null;
  let lastExtractedText = "";
  let isDragging = false;
  let currentUrl = window.location.href;

  // DOM Elements
  let playerContainer = null;
  let overlayEl = null;
  let subCardEl = null;
  let subContentEl = null;
  let enSubEl = null;
  let siSubEl = null;
  let dragHandleEl = null;
  let controlBtnEl = null;
  let toastEl = null;

  // Observers & Intervals
  let captionObserver = null;
  let pollIntervalId = null;

  // Latency lookup map (ms)
  const LATENCY_DELAYS = {
    fast: 100,
    balanced: 200,
    smooth: 350
  };

  // ============================================================================
  // 2. Initialization & Preferences Synchronization
  // ============================================================================
  async function init() {
    try {
      if (chrome?.storage?.sync) {
        const stored = await chrome.storage.sync.get(null);
        if (stored && Object.keys(stored).length > 0) {
          state = { ...state, ...stored };
        }
      }
    } catch (err) {
      console.warn("[YouTube Sinhala Subtitles] Storage sync read error:", err);
    }

    // Attach to player and DOM
    setupPlayerAttachment();

    // Listen to storage changes from popup or background
    if (chrome?.storage?.onChanged) {
      chrome.storage.onChanged.addListener((changes, area) => {
        if (area === "sync") {
          for (const [key, { newValue }] of Object.entries(changes)) {
            state[key] = newValue;
          }
          applyStateToUI();
        }
      });
    }

    // Listen to direct messages from popup
    if (chrome?.runtime?.onMessage) {
      chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
        if (!message || !message.action) return false;

        switch (message.action) {
          case "updateSettings": {
            state = { ...state, ...message.settings };
            applyStateToUI();
            sendResponse({ success: true });
            return false;
          }

          case "toggleState": {
            state.enabled = !state.enabled;
            if (chrome?.storage?.sync) {
              chrome.storage.sync.set({ enabled: state.enabled });
            }
            applyStateToUI();
            showToast(
              state.enabled
                ? "YouTube Sinhala Subtitles: Active ✓"
                : "YouTube Sinhala Subtitles: Disabled",
              state.enabled ? "info" : "warn"
            );
            sendResponse({ success: true, enabled: state.enabled });
            return false;
          }

          case "resetPosition": {
            state.positionPreset = "bottom-center";
            state.customX = null;
            state.customY = null;
            if (chrome?.storage?.sync) {
              chrome.storage.sync.set({
                positionPreset: "bottom-center",
                customX: null,
                customY: null
              });
            }
            applyPosition();
            showToast("Subtitle position reset to Bottom Center", "info");
            sendResponse({ success: true });
            return false;
          }

          case "getStatus": {
            const isCCActive = checkNativeCCActive();
            sendResponse({
              success: true,
              enabled: state.enabled,
              isCCActive,
              hasPlayer: Boolean(playerContainer)
            });
            return false;
          }

          default:
            return false;
        }
      });
    }

    // YouTube SPA Navigation Listeners
    window.addEventListener("yt-navigate-finish", handleYouTubeNavigation);
    window.addEventListener("spfdone", handleYouTubeNavigation);

    // Backup URL watcher for YouTube Single Page Navigation
    setInterval(() => {
      if (window.location.href !== currentUrl) {
        currentUrl = window.location.href;
        handleYouTubeNavigation();
      }
    }, 1000);
  }

  function handleYouTubeNavigation() {
    lastExtractedText = "";
    hideOverlay(true);
    setTimeout(() => {
      setupPlayerAttachment();
      checkCCStatusAndPrompt();
    }, 600);
  }

  // ============================================================================
  // 3. Player Attachment & DOM Injection
  // ============================================================================
  function setupPlayerAttachment() {
    // Locate the actual YouTube video player container (never the outer layout div)
    playerContainer =
      document.querySelector("#movie_player") ||
      document.querySelector(".html5-video-player");

    if (!playerContainer) {
      setTimeout(setupPlayerAttachment, 400);
      return;
    }

    // 1. Create or attach overlay
    try {
      createSubtitleOverlay();
    } catch (err) {
      console.error("[YouTube Sinhala Subtitles] Overlay creation error:", err);
    }

    // 2. Apply styling and classes
    try {
      applyStateToUI();
    } catch (err) {
      console.error("[YouTube Sinhala Subtitles] Apply state error:", err);
    }

    // 3. Start Caption Observation
    try {
      startCaptionObservation();
    } catch (err) {
      console.error("[YouTube Sinhala Subtitles] Caption observer error:", err);
    }

    // 4. Safely inject control button
    try {
      injectControlButton();
    } catch (err) {
      console.warn("[YouTube Sinhala Subtitles] Button injection error:", err);
    }
  }

  /**
   * Constructs the custom floating Subtitle Overlay inside YouTube Player
   */
  function createSubtitleOverlay() {
    if (!playerContainer) return;

    overlayEl = document.querySelector("#sinhala-sub-overlay");

    if (!overlayEl) {
      overlayEl = document.createElement("div");
      overlayEl.id = "sinhala-sub-overlay";
      overlayEl.className = "sinhala-hidden";

      subCardEl = document.createElement("div");
      subCardEl.className = "sinhala-sub-card";

      dragHandleEl = document.createElement("div");
      dragHandleEl.className = "sinhala-drag-handle";
      dragHandleEl.title = "Drag to reposition subtitles";
      dragHandleEl.innerHTML = `<span>⋮⋮</span><span>Drag</span>`;

      subContentEl = document.createElement("div");
      subContentEl.className = "sinhala-sub-content";

      enSubEl = document.createElement("div");
      enSubEl.className = "sinhala-sub-en";
      enSubEl.style.display = "none";

      siSubEl = document.createElement("div");
      siSubEl.className = "sinhala-sub-si";

      subContentEl.appendChild(enSubEl);
      subContentEl.appendChild(siSubEl);
      subCardEl.appendChild(dragHandleEl);
      subCardEl.appendChild(subContentEl);
      overlayEl.appendChild(subCardEl);

      initDragHandlers(dragHandleEl, overlayEl);
    } else {
      subCardEl = overlayEl.querySelector(".sinhala-sub-card");
      subContentEl = overlayEl.querySelector(".sinhala-sub-content");
      enSubEl = overlayEl.querySelector(".sinhala-sub-en");
      siSubEl = overlayEl.querySelector(".sinhala-sub-si");
      dragHandleEl = overlayEl.querySelector(".sinhala-drag-handle");
    }

    // Always ensure overlay is inside the active video player
    if (overlayEl.parentElement !== playerContainer) {
      playerContainer.appendChild(overlayEl);
    }
  }

  /**
   * Injects the toggle button inside YouTube's right control bar safely
   */
  function injectControlButton() {
    if (!playerContainer) return;

    const rightControls = playerContainer.querySelector(".ytp-right-controls");
    if (!rightControls) {
      setTimeout(injectControlButton, 800);
      return;
    }

    if (playerContainer.querySelector(".ytp-sinhala-sub-btn")) {
      controlBtnEl = playerContainer.querySelector(".ytp-sinhala-sub-btn");
      updateButtonVisuals();
      return;
    }

    controlBtnEl = document.createElement("button");
    controlBtnEl.className = "ytp-button ytp-sinhala-sub-btn";
    controlBtnEl.setAttribute("aria-label", "Toggle YouTube Sinhala Subtitles");
    controlBtnEl.setAttribute("title", "YouTube Sinhala Subtitles (ON/OFF)");

    // SVG icon with Sinhala 'සි' badge & CC glyph
    controlBtnEl.innerHTML = `
      <svg viewBox="0 0 36 36" fill="currentColor">
        <path d="M11 11 C8 11 6 13 6 16 L6 20 C6 23 8 25 11 25 L15 25 C16 25 17 24 17 23 L15 23 C14.5 23 14 23.5 13 23.5 L11 23.5 C9.5 23.5 8 22.5 8 20 L8 16 C8 13.5 9.5 12.5 11 12.5 L13 12.5 C14 12.5 14.5 13 15 13 L17 13 C17 12 16 11 15 11 Z" fill-rule="evenodd"/>
        <path d="M23 11 C20 11 18 13 18 16 L18 20 C18 23 20 25 23 25 L27 25 C28 25 29 24 29 23 L27 23 C26.5 23 26 23.5 25 23.5 L23 23.5 C21.5 23.5 20 22.5 20 20 L20 16 C20 13.5 21.5 12.5 23 12.5 L25 12.5 C26 12.5 26.5 13 27 13 L29 13 C29 12 28 11 27 11 Z" fill-rule="evenodd"/>
        <circle cx="28" cy="8" r="4.5" fill="#EB0F19"/>
        <text x="28" y="10.5" font-size="6" font-family="'Noto Sans Sinhala', sans-serif" font-weight="bold" fill="#FFEB3B" text-anchor="middle">සි</text>
      </svg>
      <div class="ytp-sinhala-active-bar"></div>
    `;

    controlBtnEl.addEventListener("click", (e) => {
      e.stopPropagation();
      e.preventDefault();
      state.enabled = !state.enabled;
      if (chrome?.storage?.sync) {
        chrome.storage.sync.set({ enabled: state.enabled });
      }
      applyStateToUI();

      if (state.enabled) {
        showToast("YouTube Sinhala Subtitles Enabled", "info");
        checkCCStatusAndPrompt();
      } else {
        showToast("YouTube Sinhala Subtitles Disabled", "warn");
      }
    });

    // Safely insert into right controls without throwing NotFoundError
    try {
      const settingsButton = rightControls.querySelector(".ytp-settings-button");
      if (settingsButton && settingsButton.parentNode === rightControls) {
        rightControls.insertBefore(controlBtnEl, settingsButton);
      } else if (settingsButton && settingsButton.parentElement) {
        settingsButton.parentElement.insertBefore(controlBtnEl, settingsButton);
      } else {
        rightControls.prepend(controlBtnEl);
      }
    } catch (err) {
      // Robust fallback
      rightControls.appendChild(controlBtnEl);
    }

    updateButtonVisuals();
  }

  function updateButtonVisuals() {
    if (!controlBtnEl) return;
    if (state.enabled) {
      controlBtnEl.classList.add("active");
      controlBtnEl.setAttribute(
        "title",
        "YouTube Sinhala Subtitles: Active (Click to disable)"
      );
    } else {
      controlBtnEl.classList.remove("active");
      controlBtnEl.setAttribute(
        "title",
        "YouTube Sinhala Subtitles: Inactive (Click to enable)"
      );
    }
  }

  // ============================================================================
  // 4. Subtitle Capturing & Mutation Observer
  // ============================================================================
  function startCaptionObservation() {
    if (captionObserver) {
      captionObserver.disconnect();
    }

    captionObserver = new MutationObserver(() => {
      if (!state.enabled) return;
      handleCaptionChange();
    });

    // Observe playerContainer with subtree & characterData to detect every caption change
    const target = playerContainer || document.body;
    captionObserver.observe(target, {
      childList: true,
      subtree: true,
      characterData: true
    });

    // Heartbeat interval (350ms) as a bulletproof re-attacher and caption tracker
    if (pollIntervalId) clearInterval(pollIntervalId);
    pollIntervalId = setInterval(() => {
      if (!state.enabled) return;

      const player =
        document.querySelector("#movie_player") ||
        document.querySelector(".html5-video-player");

      if (player) {
        if (playerContainer !== player) {
          playerContainer = player;
        }

        // Ensure overlay is attached to current active player
        if (!overlayEl || overlayEl.parentElement !== player) {
          createSubtitleOverlay();
          applyStateToUI();
        }

        // Ensure control button is in right controls
        if (!document.querySelector(".ytp-sinhala-sub-btn")) {
          injectControlButton();
        }

        // Ensure native captions visual suppression is active
        if (state.hideNativeSubs && !player.classList.contains("sinhala-hide-native")) {
          player.classList.add("sinhala-hide-native");
        }
      }

      handleCaptionChange();
    }, 350);
  }

  /**
   * Robustly extracts visible caption text from any YouTube caption element
   */
  function extractCaptionText() {
    const root =
      document.querySelector("#movie_player") ||
      playerContainer ||
      document;

    // 1. Primary selector: .ytp-caption-segment
    let segments = root.querySelectorAll(".ytp-caption-segment");
    if (segments && segments.length > 0) {
      const text = Array.from(segments)
        .map((seg) => seg.textContent || "")
        .filter(Boolean)
        .join(" ");
      const clean = sanitizeCaptionText(text);
      if (clean) return clean;
    }

    // 2. Secondary selector: .caption-visual-line
    const lines = root.querySelectorAll(".caption-visual-line");
    if (lines && lines.length > 0) {
      const text = Array.from(lines)
        .map((l) => l.textContent || "")
        .filter(Boolean)
        .join(" ");
      const clean = sanitizeCaptionText(text);
      if (clean) return clean;
    }

    // 3. Fallback: Entire caption container
    const container = root.querySelector(".ytp-caption-window-container");
    if (container && container.textContent && container.textContent.trim()) {
      const clean = sanitizeCaptionText(container.textContent);
      if (clean) return clean;
    }

    // 4. Document-level fallback
    const docSegments = document.querySelectorAll(".ytp-caption-segment");
    if (docSegments && docSegments.length > 0) {
      const text = Array.from(docSegments)
        .map((seg) => seg.textContent || "")
        .filter(Boolean)
        .join(" ");
      const clean = sanitizeCaptionText(text);
      if (clean) return clean;
    }

    return "";
  }

  /**
   * Handles caption updates and triggers translation
   */
  function handleCaptionChange() {
    if (!state.enabled) {
      hideOverlay(true);
      return;
    }

    const cleanText = extractCaptionText();

    if (!cleanText) {
      scheduleAutoHide();
      return;
    }

    // If identical to last extracted text, keep overlay visible without redundant API calls
    if (cleanText === lastExtractedText) {
      clearTimeout(autoHideTimer);
      autoHideTimer = setTimeout(() => {
        hideOverlay();
      }, 4000);
      return;
    }

    lastExtractedText = cleanText;
    clearTimeout(autoHideTimer);

    // Debounce translation based on user latency preference
    const delay = LATENCY_DELAYS[state.latencyMode] || 200;
    clearTimeout(debounceTimer);

    debounceTimer = setTimeout(() => {
      processTranslation(cleanText);
    }, delay);
  }

  /**
   * Sanitizes caption text:
   * - Completely strips ANYTHING inside square brackets [ ... ] (e.g. [Music], [संगीत], [__], [Applause])
   * - Strips speaker change indicators (>>, >>>, >)
   * - Strips musical symbols (♪, ♫)
   * - Leaves all spoken dialogue 100% untouched
   * - If no spoken words/letters remain (e.g. caption was solely in brackets), returns empty ""
   */
  function sanitizeCaptionText(text) {
    if (!text) return "";

    let cleaned = text
      // 1. Remove musical symbols
      .replace(/[\u2669-\u266F♪♫♩♬]/g, " ")
      // 2. Remove HTML entities like &gt;&gt;
      .replace(/&(?:gt|lt|amp|quot);/gi, " ")
      // 3. Remove speaker change indicators (>> or >>> or > or <)
      .replace(/>{1,4}/g, " ")
      .replace(/<{1,4}/g, " ")
      // 4. REMOVE ALL CONTENT INSIDE SQUARE BRACKETS [ ... ]
      .replace(/\[[^\]]*\]/g, " ")
      // 5. Remove censor masks like ___ or ---
      .replace(/_{2,}/g, " ")
      .replace(/-{2,}/g, " ")
      // 6. Remove leftover empty brackets
      .replace(/\[\s*\]/g, " ")
      // 7. Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Verify if any actual spoken letters or digits remain
    const hasWordChars = /[\p{L}\p{N}]/u.test(cleaned);
    if (!hasWordChars) {
      return "";
    }

    return cleaned;
  }

  /**
   * Direct Google Translate fetch fallback if background service worker is unreachable
   */
  async function directTranslateFallback(text) {
    const sl = state.sourceLang || "auto";
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(sl)}&tl=si&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (data && Array.isArray(data[0])) {
      return data[0]
        .map((s) => (Array.isArray(s) ? s[0] : ""))
        .filter(Boolean)
        .join("")
        .trim();
    }
    return "";
  }

  /**
   * Translates text to Sinhala with local LRU caching and sequence tracking
   */
  async function processTranslation(captionText) {
    if (!captionText || !state.enabled) return;

    const sl = state.sourceLang || "auto";
    const cacheKey = `${sl}:${captionText.toLowerCase().trim()}`;

    // 1. Instant local tab LRU cache lookup (0ms)
    if (localCache.has(cacheKey)) {
      const cached = localCache.get(cacheKey);
      renderSubtitles(captionText, cached);
      return;
    }

    const requestId = ++currentRequestId;
    let translatedText = "";

    try {
      // 2. Send translation request to background service worker
      if (chrome?.runtime?.id) {
        const response = await chrome.runtime.sendMessage({
          action: "translate",
          text: captionText,
          sourceLang: sl,
          targetLang: "si"
        });

        if (response && response.success && response.translated) {
          translatedText = response.translated;
        }
      }
    } catch (err) {
      console.warn("[YouTube Sinhala Subtitles] Background message error, attempting direct fallback:", err);
    }

    // Direct fallback if background returned empty or failed
    if (!translatedText) {
      try {
        translatedText = await directTranslateFallback(captionText);
      } catch (fallbackErr) {
        console.warn("[YouTube Sinhala Subtitles] Direct translation fallback error:", fallbackErr);
      }
    }

    // Ignore if a newer translation was triggered in the meantime
    if (requestId !== currentRequestId) return;

    if (translatedText) {
      // Save to local cache
      if (localCache.size >= MAX_LOCAL_CACHE) {
        const oldest = localCache.keys().next().value;
        localCache.delete(oldest);
      }
      localCache.set(cacheKey, translatedText);

      renderSubtitles(captionText, translatedText);
    }
  }

  /**
   * Renders the translated Sinhala and optional English text into the player overlay
   */
  function renderSubtitles(captionText, sinhalaText) {
    if (!overlayEl || !state.enabled) return;

    // Safety filter: strip any square brackets from translated and original text
    const cleanSinhala = (sinhalaText || "")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
    const cleanCaption = (captionText || "")
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    // If cleaned Sinhala is empty or contains no spoken letters/digits, do not display
    if (!cleanSinhala || !/[\p{L}\p{N}]/u.test(cleanSinhala)) {
      hideOverlay();
      return;
    }

    // Sinhala text
    siSubEl.textContent = cleanSinhala;

    // English / Original text (Dual Subtitle Mode)
    if (state.dualSubtitles) {
      enSubEl.textContent = cleanCaption;
      enSubEl.style.display = "block";
    } else {
      enSubEl.style.display = "none";
    }

    // Display overlay
    overlayEl.classList.remove("sinhala-hidden");
    overlayEl.classList.add("sinhala-visible");

    siSubEl.classList.remove("sinhala-pulse");
    void siSubEl.offsetWidth; // Force reflow
    siSubEl.classList.add("sinhala-pulse");

    // Reset auto-hide timer
    clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(() => {
      hideOverlay();
    }, 4500);
  }

  function scheduleAutoHide() {
    clearTimeout(autoHideTimer);
    autoHideTimer = setTimeout(() => {
      hideOverlay();
    }, 1800);
  }

  function hideOverlay(immediate = false) {
    if (!overlayEl) return;
    if (immediate) {
      overlayEl.style.transition = "none";
      overlayEl.classList.remove("sinhala-visible");
      overlayEl.classList.add("sinhala-hidden");
      setTimeout(() => {
        if (overlayEl) overlayEl.style.transition = "";
      }, 50);
    } else {
      overlayEl.classList.remove("sinhala-visible");
      overlayEl.classList.add("sinhala-hidden");
    }
  }

  // ============================================================================
  // 5. Visual Styling & Positioning
  // ============================================================================
  function applyStateToUI() {
    updateButtonVisuals();

    if (!overlayEl || !subCardEl || !siSubEl || !enSubEl) return;

    if (!state.enabled) {
      hideOverlay(true);
      if (playerContainer) {
        playerContainer.classList.remove("sinhala-hide-native");
      }
      return;
    }

    // Suppress native YouTube captions visuals if enabled
    if (playerContainer) {
      if (state.hideNativeSubs) {
        playerContainer.classList.add("sinhala-hide-native");
      } else {
        playerContainer.classList.remove("sinhala-hide-native");
      }
    }

    // Background color & opacity
    const bgRgb = hexToRgb(state.backgroundColor) || { r: 13, g: 15, b: 23 };
    const opacityFraction = Math.max(0, Math.min(100, state.backgroundOpacity)) / 100;
    subCardEl.style.backgroundColor = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${opacityFraction})`;

    // Sinhala Typography
    siSubEl.style.fontSize = `${state.fontSize}px`;
    siSubEl.style.color = state.textColor;
    if (state.textShadow) {
      siSubEl.classList.add("sinhala-text-shadow");
    } else {
      siSubEl.classList.remove("sinhala-text-shadow");
    }

    // Dual Subtitles English Typography
    if (state.dualSubtitles) {
      enSubEl.style.color = state.enTextColor || "#E2E8F0";
      enSubEl.style.fontSize = `${Math.max(12, Math.round(state.fontSize * 0.72))}px`;
    }

    applyPosition();
  }

  function applyPosition() {
    if (!overlayEl) return;

    overlayEl.classList.remove(
      "pos-bottom-center",
      "pos-top-center",
      "pos-bottom-left",
      "pos-bottom-right",
      "pos-custom"
    );

    if (
      state.positionPreset === "custom" &&
      state.customX !== null &&
      state.customY !== null
    ) {
      overlayEl.classList.add("pos-custom");
      overlayEl.style.left = `${state.customX}px`;
      overlayEl.style.top = `${state.customY}px`;
      overlayEl.style.bottom = "auto";
      overlayEl.style.right = "auto";
      overlayEl.style.transform = "none";
    } else {
      overlayEl.style.left = "";
      overlayEl.style.top = "";
      overlayEl.style.bottom = "";
      overlayEl.style.right = "";
      overlayEl.style.transform = "";

      const presetClass = `pos-${state.positionPreset || "bottom-center"}`;
      overlayEl.classList.add(presetClass);
    }
  }

  // ============================================================================
  // 6. Interactive Drag & Repositioning
  // ============================================================================
  function initDragHandlers(handle, target) {
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener("mousedown", (e) => {
      if (!playerContainer) return;
      e.preventDefault();
      e.stopPropagation();
      isDragging = true;

      const playerRect = playerContainer.getBoundingClientRect();
      const targetRect = target.getBoundingClientRect();

      startX = e.clientX;
      startY = e.clientY;
      initialLeft = targetRect.left - playerRect.left;
      initialTop = targetRect.top - playerRect.top;

      target.classList.remove(
        "pos-bottom-center",
        "pos-top-center",
        "pos-bottom-left",
        "pos-bottom-right"
      );
      target.classList.add("pos-custom");
      target.style.transform = "none";
      target.style.left = `${initialLeft}px`;
      target.style.top = `${initialTop}px`;
      target.style.bottom = "auto";
      target.style.right = "auto";

      const onMouseMove = (moveEvent) => {
        if (!isDragging || !playerContainer) return;
        moveEvent.preventDefault();

        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        const maxLeft = playerContainer.clientWidth - target.offsetWidth - 10;
        const maxTop = playerContainer.clientHeight - target.offsetHeight - 40;

        newLeft = Math.max(10, Math.min(newLeft, maxLeft));
        newTop = Math.max(10, Math.min(newTop, maxTop));

        target.style.left = `${newLeft}px`;
        target.style.top = `${newTop}px`;
      };

      const onMouseUp = () => {
        if (!isDragging) return;
        isDragging = false;
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);

        state.positionPreset = "custom";
        state.customX = parseFloat(target.style.left) || initialLeft;
        state.customY = parseFloat(target.style.top) || initialTop;

        if (chrome?.storage?.sync) {
          chrome.storage.sync.set({
            positionPreset: "custom",
            customX: state.customX,
            customY: state.customY
          });
        }
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    });
  }

  // ============================================================================
  // 7. On-Player Floating Toast System
  // ============================================================================
  function showToast(message, type = "info") {
    if (!playerContainer) return;

    if (!toastEl) {
      toastEl = document.createElement("div");
      toastEl.className = "sinhala-player-toast";
      playerContainer.appendChild(toastEl);
    }

    const icon = type === "warn" ? "⚠️" : "💡";
    toastEl.innerHTML = `
      <span class="toast-icon">${icon}</span>
      <span class="toast-text">${message}</span>
      <button class="toast-close" title="Close">&times;</button>
    `;

    toastEl.querySelector(".toast-close").onclick = (e) => {
      e.stopPropagation();
      toastEl.classList.remove("show");
    };

    toastEl.classList.add("show");

    clearTimeout(toastEl._timer);
    toastEl._timer = setTimeout(() => {
      if (toastEl) toastEl.classList.remove("show");
    }, 4200);
  }

  function checkNativeCCActive() {
    if (!playerContainer) return false;
    const ccBtn = playerContainer.querySelector(".ytp-subtitles-button");
    if (!ccBtn) return false;
    return (
      ccBtn.getAttribute("aria-pressed") === "true" ||
      ccBtn.classList.contains("ytp-button-active")
    );
  }

  function checkCCStatusAndPrompt() {
    if (!state.enabled || !state.showBadgeTooltip) return;

    setTimeout(() => {
      const isCCActive = checkNativeCCActive();
      if (!isCCActive) {
        showToast(
          "English Captions (CC) are OFF. Press 'C' or turn on YouTube CC to feed Sinhala subtitles.",
          "warn"
        );
      }
    }, 1800);
  }

  // Helper function: Hex to RGB
  function hexToRgb(hex) {
    if (!hex) return null;
    const sanitized = hex.replace("#", "");
    if (sanitized.length === 3) {
      return {
        r: parseInt(sanitized[0] + sanitized[0], 16),
        g: parseInt(sanitized[1] + sanitized[1], 16),
        b: parseInt(sanitized[2] + sanitized[2], 16)
      };
    } else if (sanitized.length === 6) {
      return {
        r: parseInt(sanitized.substring(0, 2), 16),
        g: parseInt(sanitized.substring(2, 4), 16),
        b: parseInt(sanitized.substring(4, 6), 16)
      };
    }
    return null;
  }

  // ============================================================================
  // 8. Start Execution
  // ============================================================================
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
