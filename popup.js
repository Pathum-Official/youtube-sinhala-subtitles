/**
 * YouTube Live Sinhala Subtitles - Popup Settings Controller
 * Handles user preferences, live subtitle preview, and Chrome storage synchronization.
 */

document.addEventListener("DOMContentLoaded", async () => {
  // ============================================================================
  // 1. DOM References
  // ============================================================================
  const masterToggle = document.getElementById("masterToggle");
  const statusDot = document.getElementById("statusDot");
  const masterStatusText = document.getElementById("masterStatusText");

  // Preview elements
  const previewSubBox = document.getElementById("previewSubBox");
  const previewSubEn = document.getElementById("previewSubEn");
  const previewSubSi = document.getElementById("previewSubSi");
  const previewModeLabel = document.getElementById("previewModeLabel");

  // Mode buttons
  const modeSiOnly = document.getElementById("modeSiOnly");
  const modeDual = document.getElementById("modeDual");

  // Sliders
  const fontSizeSlider = document.getElementById("fontSizeSlider");
  const fontSizeBadge = document.getElementById("fontSizeBadge");
  const bgOpacitySlider = document.getElementById("bgOpacitySlider");
  const bgOpacityBadge = document.getElementById("bgOpacityBadge");

  // Colors
  const textColorSwatches = document.querySelectorAll("[data-color]");
  const customTextColorPicker = document.getElementById("customTextColorPicker");
  const bgColorSwatches = document.querySelectorAll("[data-bgcolor]");
  const customBgColorPicker = document.getElementById("customBgColorPicker");
  const textShadowToggle = document.getElementById("textShadowToggle");

  // Layout & sync
  const positionSelect = document.getElementById("positionSelect");
  const resetPositionBtn = document.getElementById("resetPositionBtn");
  const latencySelect = document.getElementById("latencySelect");
  const sourceLangSelect = document.getElementById("sourceLangSelect");
  const hideNativeToggle = document.getElementById("hideNativeToggle");
  const clearCacheBtn = document.getElementById("clearCacheBtn");

  // Default state configuration
  let state = {
    enabled: true,
    fontSize: 24,
    textColor: "#FFEB3B",
    textShadow: true,
    backgroundColor: "#0d0f17",
    backgroundOpacity: 80,
    sourceLang: "auto",
    dualSubtitles: false,
    enTextColor: "#E2E8F0",
    positionPreset: "bottom-center",
    customX: null,
    customY: null,
    latencyMode: "balanced",
    hideNativeSubs: true,
    showBadgeTooltip: true
  };

  // ============================================================================
  // 2. Load Stored Settings
  // ============================================================================
  try {
    const stored = await chrome.storage.sync.get(null);
    if (stored && Object.keys(stored).length > 0) {
      state = { ...state, ...stored };
    }
  } catch (err) {
    console.warn("Failed to load settings from storage:", err);
  }

  // Reflect loaded settings in the UI
  populateUI();

  // ============================================================================
  // 3. UI Synchronization & Live Preview
  // ============================================================================
  function populateUI() {
    // Master switch
    masterToggle.checked = Boolean(state.enabled);
    updateMasterStatusVisuals(state.enabled);

    // Mode
    updateModeButtons(state.dualSubtitles);

    // Font size
    fontSizeSlider.value = state.fontSize || 24;
    fontSizeBadge.textContent = `${state.fontSize || 24}px`;

    // Opacity
    bgOpacitySlider.value = state.backgroundOpacity ?? 80;
    bgOpacityBadge.textContent = `${state.backgroundOpacity ?? 80}%`;

    // Colors
    updateActiveSwatch(textColorSwatches, state.textColor, "data-color");
    customTextColorPicker.value = state.textColor || "#FFEB3B";

    updateActiveSwatch(bgColorSwatches, state.backgroundColor, "data-bgcolor");
    customBgColorPicker.value = state.backgroundColor || "#0d0f17";

    // Text Shadow
    textShadowToggle.checked = Boolean(state.textShadow);

    // Position
    positionSelect.value = state.positionPreset || "bottom-center";

    // Source Language
    if (sourceLangSelect) {
      sourceLangSelect.value = state.sourceLang || "auto";
    }

    // Latency
    latencySelect.value = state.latencyMode || "balanced";

    // Hide native
    hideNativeToggle.checked = Boolean(state.hideNativeSubs);

    // Update the live preview
    updatePreviewBox();
  }

  function updateMasterStatusVisuals(enabled) {
    if (enabled) {
      statusDot.classList.remove("inactive");
      masterStatusText.textContent = "Sinhala Subtitles Active";
    } else {
      statusDot.classList.add("inactive");
      masterStatusText.textContent = "Sinhala Subtitles Disabled";
    }
  }

  function updateModeButtons(isDual) {
    if (isDual) {
      modeDual.classList.add("active");
      modeSiOnly.classList.remove("active");
      previewModeLabel.textContent = "Dual (EN + SI)";
      previewSubEn.style.display = "block";
    } else {
      modeSiOnly.classList.add("active");
      modeDual.classList.remove("active");
      previewModeLabel.textContent = "Sinhala Only";
      previewSubEn.style.display = "none";
    }
  }

  function updateActiveSwatch(swatchList, currentColor, attrName) {
    let matched = false;
    swatchList.forEach((swatch) => {
      const colorVal = swatch.getAttribute(attrName);
      if (colorVal && colorVal.toLowerCase() === currentColor.toLowerCase()) {
        swatch.classList.add("active");
        matched = true;
      } else {
        swatch.classList.remove("active");
      }
    });
  }

  /**
   * Dynamically renders the active settings inside the preview card
   */
  function updatePreviewBox() {
    // Background color & opacity
    const bgRgb = hexToRgb(state.backgroundColor) || { r: 13, g: 15, b: 23 };
    const opacityFraction = Math.max(0, Math.min(100, state.backgroundOpacity)) / 100;
    previewSubBox.style.backgroundColor = `rgba(${bgRgb.r}, ${bgRgb.g}, ${bgRgb.b}, ${opacityFraction})`;

    // Sinhala Typography
    // Scale font size slightly down in preview to fit nicely within card
    const previewFontSize = Math.max(13, Math.round(state.fontSize * 0.75));
    previewSubSi.style.fontSize = `${previewFontSize}px`;
    previewSubSi.style.color = state.textColor;

    if (state.textShadow) {
      previewSubSi.style.textShadow =
        "0 2px 4px rgba(0, 0, 0, 0.95), 0 0 8px rgba(0, 0, 0, 0.9), -1px -1px 0 #000, 1px -1px 0 #000, -1px 1px 0 #000, 1px 1px 0 #000";
    } else {
      previewSubSi.style.textShadow = "none";
    }

    // Dual Subtitles English Typography
    if (state.dualSubtitles) {
      previewSubEn.style.display = "block";
      previewSubEn.style.color = state.enTextColor || "#e2e8f0";
      previewSubEn.style.fontSize = `${Math.max(10, Math.round(previewFontSize * 0.72))}px`;
    } else {
      previewSubEn.style.display = "none";
    }
  }

  // ============================================================================
  // 4. Persistence & Tab Communication
  // ============================================================================
  async function saveState(partial) {
    state = { ...state, ...partial };
    updatePreviewBox();

    try {
      await chrome.storage.sync.set(partial);
    } catch (err) {
      console.warn("Storage sync failed:", err);
    }

    // Broadcast change to active YouTube tabs
    try {
      const tabs = await chrome.tabs.query({ url: "*://*.youtube.com/*" });
      for (const tab of tabs) {
        chrome.tabs.sendMessage(tab.id, {
          action: "updateSettings",
          settings: partial
        }).catch(() => {
          // Tab may not have injected content script yet
        });
      }
    } catch (e) {
      // Ignored
    }
  }

  // ============================================================================
  // 5. Event Listeners
  // ============================================================================
  // Master toggle
  masterToggle.addEventListener("change", () => {
    const isEnabled = masterToggle.checked;
    updateMasterStatusVisuals(isEnabled);
    saveState({ enabled: isEnabled });
  });

  // Mode Selection
  modeSiOnly.addEventListener("click", () => {
    updateModeButtons(false);
    saveState({ dualSubtitles: false });
  });

  modeDual.addEventListener("click", () => {
    updateModeButtons(true);
    saveState({ dualSubtitles: true });
  });

  // Font size slider
  fontSizeSlider.addEventListener("input", () => {
    const size = parseInt(fontSizeSlider.value, 10);
    fontSizeBadge.textContent = `${size}px`;
    saveState({ fontSize: size });
  });

  // Opacity slider
  bgOpacitySlider.addEventListener("input", () => {
    const opacity = parseInt(bgOpacitySlider.value, 10);
    bgOpacityBadge.textContent = `${opacity}%`;
    saveState({ backgroundOpacity: opacity });
  });

  // Sinhala text color swatches
  textColorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const color = swatch.getAttribute("data-color");
      updateActiveSwatch(textColorSwatches, color, "data-color");
      customTextColorPicker.value = color;
      saveState({ textColor: color });
    });
  });

  // Custom text color input
  customTextColorPicker.addEventListener("input", () => {
    const color = customTextColorPicker.value;
    updateActiveSwatch(textColorSwatches, color, "data-color");
    saveState({ textColor: color });
  });

  // Background color swatches
  bgColorSwatches.forEach((swatch) => {
    swatch.addEventListener("click", () => {
      const bgcolor = swatch.getAttribute("data-bgcolor");
      updateActiveSwatch(bgColorSwatches, bgcolor, "data-bgcolor");
      customBgColorPicker.value = bgcolor;
      saveState({ backgroundColor: bgcolor });
    });
  });

  // Custom background color input
  customBgColorPicker.addEventListener("input", () => {
    const bgcolor = customBgColorPicker.value;
    updateActiveSwatch(bgColorSwatches, bgcolor, "data-bgcolor");
    saveState({ backgroundColor: bgcolor });
  });

  // Text shadow checkbox
  textShadowToggle.addEventListener("change", () => {
    saveState({ textShadow: textShadowToggle.checked });
  });

  // Position select
  positionSelect.addEventListener("change", () => {
    const position = positionSelect.value;
    saveState({ positionPreset: position });
  });

  // Reset position button
  resetPositionBtn.addEventListener("click", async () => {
    positionSelect.value = "bottom-center";
    await saveState({
      positionPreset: "bottom-center",
      customX: null,
      customY: null
    });

    // Notify tab to apply reset
    try {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs[0] && tabs[0].id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "resetPosition" }).catch(() => {});
      }
    } catch (e) {}

    // Button feedback
    resetPositionBtn.innerHTML = `<span>✓</span> Reset Done!`;
    setTimeout(() => {
      resetPositionBtn.innerHTML = `<span>↺</span> Reset to Default Position`;
    }, 1500);
  });

  // Source language select
  if (sourceLangSelect) {
    sourceLangSelect.addEventListener("change", () => {
      saveState({ sourceLang: sourceLangSelect.value });
    });
  }

  // Latency mode select
  latencySelect.addEventListener("change", () => {
    saveState({ latencyMode: latencySelect.value });
  });

  // Hide native toggle
  hideNativeToggle.addEventListener("change", () => {
    saveState({ hideNativeSubs: hideNativeToggle.checked });
  });

  // Clear translation cache
  clearCacheBtn.addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "clearCache" }, (res) => {
      clearCacheBtn.innerHTML = `<span>✓</span> Cache Cleared!`;
      setTimeout(() => {
        clearCacheBtn.innerHTML = `<span>🗑️</span> Clear Translation Cache`;
      }, 1500);
    });
  });

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
});
