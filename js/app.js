// =============================================================================
// js/app.js – Application entry point
//
// Orchestrates the full startup sequence:
//   1. Injects static text from DIALOGS into the DOM.
//   2. Initialises the content editor panel.
//   3. Starts the conversation animation sequence.
//
// Load order in index.html must be:
//   js/config.js  →  js/dialogs.js  →  js/dom-helpers.js
//   →  js/scroll.js  →  js/typing.js  →  js/editor.js  →  js/app.js
// =============================================================================

(function () {
  "use strict";

  // Convenience alias
  var D = window.DIALOGS || {};

  // ── Static text injection ──────────────────────────────────────────────────
  /**
   * Reads from DIALOGS and writes every piece of static text into the DOM.
   * Called once on load and again live whenever an editor field changes.
   */
  function injectStaticText() {
    setText("page-title",      D.PAGE_TITLE);
    setText("page-subtitle",   D.PAGE_SUBTITLE);
    setText("chat-header",     D.CHAT_HEADER);
    setText("cta-button",      D.CTA_BUTTON);
    setText("user-msg-1",      D.USER_MSG_1);
    setText("user-birthdate",  D.USER_BIRTHDATE);
    setText("user-birthplace", D.USER_BIRTHPLACE);
    setText("user-msg-2",      D.USER_MSG_2);

    var inputField = document.getElementById("chat-input-field");
    if (inputField && D.INPUT_PLACEHOLDER) {
      inputField.placeholder = D.INPUT_PLACEHOLDER;
    }
  }

  // Expose so editor.js can call it when a field changes
  window.injectStaticText = injectStaticText;

  // ── User Typing Indicator (follow-up only) ─────────────────────────────────
  /**
   * Shows a temporary "..." typing bubble before a user message, then reveals it.
   * @param {string}   blockId  - ID of the block to reveal.
   * @param {number}   duration - How long the dots show (ms).
   * @param {Function} onDone   - Called after the block is revealed.
   */
  function showUserTypingThenReveal(blockId, duration, onDone) {
    var block = document.getElementById(blockId);
    if (!block) { if (onDone) onDone(); return; }

    var list = document.getElementById("messages-list");
    var indicator = document.createElement("div");
    indicator.className = "user-typing-indicator user-msg-row flex items-start space-x-3";
    indicator.innerHTML =
      '<div class="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-slate-200">' +
        '<img alt="User" class="w-full h-full object-cover" src="./person.avif" />' +
      '</div>' +
      '<div class="bg-user-bubble p-2 px-4 rounded-chat rounded-tl-none shadow-sm">' +
        '<span class="user-typing-dots"><span></span><span></span><span></span></span>' +
      '</div>';

    if (list && block.parentNode === list) {
      list.insertBefore(indicator, block);
    } else if (list) {
      list.appendChild(indicator);
    }
    scrollChat(true);

    var t = setTimeout(function () {
      if (indicator.parentNode) indicator.parentNode.removeChild(indicator);
      block.style.opacity = "1";
      scrollChat(true);
      if (onDone) onDone();
    }, duration);
    activeTimeouts.push(t);
  }

  // ── Animation sequence ─────────────────────────────────────────────────────
  var activeTimeouts = [];

  /** Cancel all pending animation timeouts and remove stale typing indicators. */
  function clearTimeouts() {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
    document.querySelectorAll(".user-typing-indicator").forEach(function (el) {
      if (el.parentNode) el.parentNode.removeChild(el);
    });
  }

  /**
   * Reset and replay the full chat animation from the beginning.
   * Can be triggered by the Restart button or called programmatically.
   */
  function startSequence() {
    clearTimeouts();
    userScrolledUp = false; // Reset scroll override (from scroll.js)

    // ── Reset typing areas ──────────────────────────────────────────────────
    var r1 = document.getElementById("typing-response");
    var r2 = document.getElementById("typing-response-2");
    if (r1) r1.innerHTML = '<span class="typing-cursor" id="typing-cursor"></span>';
    if (r2) r2.innerHTML = '<span class="typing-cursor" id="typing-cursor-2"></span>';

    // ── Hide elements that fade in during the animation ─────────────────────
    var followUp = document.getElementById("follow-up-block");
    var aiBlock2 = document.getElementById("ai-response-2-block");
    if (followUp) followUp.style.opacity = "0";
    if (aiBlock2) aiBlock2.style.opacity = "0";

    // ── Reset credits counter ───────────────────────────────────────────────
    setText("credits-value", "2.0");

    var text1 = D.AI_RESPONSE_1 || "";
    var text2 = D.AI_RESPONSE_2 || "";

    // ── Phase 1: Type first AI response ─────────────────────────────────────
    var t1 = setTimeout(function () {
      typeWords("typing-response", "typing-cursor", text1, function () {
        scrollChat(true);

        // ── Phase 2: Show "..." typing dots, then reveal follow-up ────────
        showUserTypingThenReveal("follow-up-block", 800, function () {
          scrollChat(true);

          var t2 = setTimeout(function () {
            // ── Phase 3: Show second AI response, then type it ─────────────
            fadeIn("ai-response-2-block");
            scrollChat(true);

            var t3 = setTimeout(function () {
              typeWords("typing-response-2", "typing-cursor-2", text2, function () {
                scrollChat(true);
                setText("credits-value", "1.2");
              }, false);
            }, 400);
            activeTimeouts.push(t3);

          }, CONFIG.GAP);
          activeTimeouts.push(t2);
        });

      }, true); // ← skipScroll for first response
    }, CONFIG.DELAY1);
    activeTimeouts.push(t1);
  }

  // Expose so recorder.js can restart animation when recording starts
  window.startSequence = startSequence;

  // ── Boot ───────────────────────────────────────────────────────────────────
  injectStaticText();        // Fill static text from DIALOGS
  initEditor(startSequence); // Wire up editor panel (passes restart fn)
  startSequence();           // Begin animation
})();
