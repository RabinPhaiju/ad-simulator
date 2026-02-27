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

  // ── Animation sequence ─────────────────────────────────────────────────────
  var activeTimeouts = [];

  /** Cancel all pending animation timeouts. */
  function clearTimeouts() {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
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
    // skipScroll = true → delay auto-scroll for the first N word chunks
    // so the view doesn't jump while there is still visible space.
    var t1 = setTimeout(function () {
      typeWords("typing-response", "typing-cursor", text1, function () {
        scrollChat(true); // Force scroll once response is complete

        // ── Phase 2: Show user follow-up bubble ───────────────────────────
        fadeIn("follow-up-block");
        scrollChat(true);

        var t2 = setTimeout(function () {
          // ── Phase 3: Show second AI response, then type it ───────────────
          fadeIn("ai-response-2-block");
          scrollChat(true);

          var t3 = setTimeout(function () {
            // skipScroll = false → scroll immediately on every step
            typeWords("typing-response-2", "typing-cursor-2", text2, function () {
              scrollChat(true);          // Final force scroll
              setText("credits-value", "1.2"); // Deduct credits
            }, false);
          }, 400);
          activeTimeouts.push(t3);

        }, CONFIG.GAP);
        activeTimeouts.push(t2);

      }, true); // ← skipScroll for first response
    }, CONFIG.DELAY1);
    activeTimeouts.push(t1);
  }

  // ── Boot ───────────────────────────────────────────────────────────────────
  injectStaticText();        // Fill static text from DIALOGS
  initEditor(startSequence); // Wire up editor panel (passes restart fn)
  startSequence();           // Begin animation
})();
