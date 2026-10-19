/**
 * YouTube Live Sinhala Subtitles - Background Service Worker (Manifest V3)
 * Powered by PTM Prime | Copyright © 2026 PTM Prime. All rights reserved.
 * Handles Google Translate API requests, caching, and default extension settings.
 */

// Default settings configuration
const DEFAULT_SETTINGS = {
  enabled: true,
  fontSize: 24,
  textColor: "#FFEB3B", // Vibrant yellow for optimal video contrast
  textShadow: true,
  backgroundColor: "#0d0f17", // Sleek dark slate
  backgroundOpacity: 80, // Percentage 0-100
  sourceLang: "auto", // Auto-detect: English, Hindi, Korean, Japanese, Tamil, Spanish, etc.
  dualSubtitles: false, // Sinhala Only (false) or Dual (true)
  enTextColor: "#E2E8F0", // Soft light gray for English
  positionPreset: "bottom-center", // bottom-center, top-center, bottom-left, bottom-right, custom
  customX: null,
  customY: null,
  latencyMode: "balanced", // fast (100ms), balanced (200ms), smooth (350ms)
  hideNativeSubs: true, // Hide YouTube English CC visuals to avoid overlap
  showBadgeTooltip: true
};

// Global in-memory LRU cache in background service worker
const CACHE_MAX_SIZE = 1200;
const translationCache = new Map();

/**
 * Retrieves translated text from cache or fetches from Google Translate free endpoint.
 * @param {string} text - Cleaned English text to translate
 * @param {string} sourceLang - Source language code ('en')
 * @param {string} targetLang - Target language code ('si')
 * @returns {Promise<{success: boolean, translated: string, fromCache?: boolean, error?: string}>}
 */
async function fetchTranslation(text, sourceLang = "auto", targetLang = "si") {
  // Strip anything inside square brackets [ ... ]
  const cleanInput = (text || "")
    .replace(/\[[^\]]*\]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If input contains no actual spoken words/digits, ignore it completely
  if (!cleanInput || !/[\p{L}\p{N}]/u.test(cleanInput)) {
    return { success: false, error: "Non-dialogue sound cue ignored", translated: "" };
  }

  const normalizedKey = `${sourceLang}:${targetLang}:${cleanInput.toLowerCase()}`;

  // Check cache first
  if (translationCache.has(normalizedKey)) {
    const cachedResult = translationCache.get(normalizedKey);
    // Refresh LRU position
    translationCache.delete(normalizedKey);
    translationCache.set(normalizedKey, cachedResult);
    return { success: true, translated: cachedResult, fromCache: true };
  }

  try {
    const endpoint = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${encodeURIComponent(
      sourceLang
    )}&tl=${encodeURIComponent(targetLang)}&dt=t&q=${encodeURIComponent(cleanInput)}`;

    const response = await fetch(endpoint, {
      method: "GET",
      headers: {
        Accept: "application/json"
      }
    });

    if (!response.ok) {
      throw new Error(`Google Translate API HTTP error: ${response.status}`);
    }

    const data = await response.json();

    // Data structure: data[0] is an array of segments [[translatedChunk, originalChunk, ...], ...]
    if (!data || !Array.isArray(data[0])) {
      throw new Error("Invalid response structure from translation service");
    }

    const translatedRaw = data[0]
      .map((segment) => (Array.isArray(segment) ? segment[0] : ""))
      .filter(Boolean)
      .join("")
      .trim();

    // Strip any square brackets from translated result
    const translated = translatedRaw
      .replace(/\[[^\]]*\]/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (!translated || !/[\p{L}\p{N}]/u.test(translated)) {
      throw new Error("Empty or non-dialogue translation returned");
    }

    // Save to LRU cache
    if (translationCache.size >= CACHE_MAX_SIZE) {
      const oldestKey = translationCache.keys().next().value;
      translationCache.delete(oldestKey);
    }
    translationCache.set(normalizedKey, translated);

    return { success: true, translated, fromCache: false };
  } catch (err) {
    console.error("[YouTube Sinhala Subtitles] Translation error:", err);
    return {
      success: false,
      error: err.message || "Failed to translate text",
      translated: ""
    };
  }
}

// Extension installation & defaults initialization
chrome.runtime.onInstalled.addListener(async (details) => {
  try {
    translationCache.clear();
    const stored = await chrome.storage.sync.get(null);
    const toUpdate = {};

    for (const [key, defaultValue] of Object.entries(DEFAULT_SETTINGS)) {
      if (stored[key] === undefined) {
        toUpdate[key] = defaultValue;
      }
    }

    if (Object.keys(toUpdate).length > 0) {
      await chrome.storage.sync.set(toUpdate);
    }
    console.log("[YouTube Sinhala Subtitles] Initialized settings:", {
      reason: details.reason,
      updatedKeys: Object.keys(toUpdate)
    });
  } catch (error) {
    console.error("[YouTube Sinhala Subtitles] Error initializing storage:", error);
  }
});

// Message listener for content scripts and popup UI
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (!message || !message.action) return false;

  switch (message.action) {
    case "translate": {
      const { text, sourceLang = "auto", targetLang = "si" } = message;
      if (!text || typeof text !== "string" || !text.trim()) {
        sendResponse({ success: false, error: "Empty or invalid text", translated: "" });
        return false;
      }

      fetchTranslation(text, sourceLang, targetLang)
        .then((result) => sendResponse(result))
        .catch((err) =>
          sendResponse({
            success: false,
            error: err.message || "Unexpected translation failure",
            translated: ""
          })
        );
      return true; // Keep message channel open for asynchronous sendResponse
    }

    case "clearCache": {
      translationCache.clear();
      sendResponse({ success: true, message: "Translation cache cleared" });
      return false;
    }

    case "ping": {
      sendResponse({ success: true, timestamp: Date.now() });
      return false;
    }

    default:
      return false;
  }
});
