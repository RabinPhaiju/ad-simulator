// ─────────────────────────────────────────────────────────────────────────────
// app.js  –  Main application logic for PocketPandit AI chat interface.
// Handles typing animations, DOM helpers, and dialog injection.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Dialog data (read from dailogs.js DIALOGS namespace) ─────────────────
  var D = window.DIALOGS || {};

  // ── Animation timing constants ───────────────────────────────────────────
  var SPEED  = 30;   // ms per character
  var DELAY1 = 800;  // delay before first animation starts
  var GAP    = 800;  // pause between phases

  // ── DOM helpers ──────────────────────────────────────────────────────────

  /** Safely set the textContent of an element by ID (no-op if missing). */
  function setText(id, value) {
    var el = document.getElementById(id);
    if (el && value) el.textContent = value;
  }

  /** Fade in an element by ID (sets opacity to "1"). */
  function fadeIn(id) {
    var el = document.getElementById(id);
    if (el) el.style.opacity = "1";
  }

  /** Smoothly scroll the messages list to the bottom. */
  function scrollChat() {
    var list = document.getElementById("messages-list");
    if (list) list.scrollTo({ top: list.scrollHeight, behavior: "smooth" });
  }

  // ── Typing animation engine ──────────────────────────────────────────────

  /**
   * Type `text` character-by-character into the <p> identified by
   * `paragraphId`, placing each character before the cursor span
   * identified by `cursorId`. Calls `onDone` after finishing.
   */
  function typeInto(paragraphId, cursorId, text, onDone) {
    var target = document.getElementById(paragraphId);
    var cursor = document.getElementById(cursorId);
    var chars  = Array.from(text);   // supports Unicode correctly
    var index  = 0;

    function step() {
      if (index < chars.length) {
        target.insertBefore(document.createTextNode(chars[index]), cursor);
        index++;
        scrollChat();
        setTimeout(step, SPEED);
      } else {
        cursor.classList.add("done");
        if (onDone) setTimeout(onDone, GAP);
      }
    }

    step();
  }

  // ── Inject static text from DIALOGS namespace ────────────────────────────
  setText("page-title",      D.PAGE_TITLE);
  setText("page-subtitle",   D.PAGE_SUBTITLE);
  setText("chat-header",     D.CHAT_HEADER);
  setText("cta-button",      D.CTA_BUTTON);
  setText("user-msg-1",      D.USER_MSG_1);
  setText("user-birthdate",  D.USER_BIRTHDATE);
  setText("user-birthplace", D.USER_BIRTHPLACE);
  setText("user-msg-2",      D.USER_MSG_2);

  // ── Animation sequence ───────────────────────────────────────────────────
  var text1 = D.AI_RESPONSE_1 || "";
  var text2 = D.AI_RESPONSE_2 || "";

  // Phase 1: type first AI response
  setTimeout(function () {
    typeInto("typing-response", "typing-cursor", text1, function () {
      scrollChat();

      // Phase 2: show user follow-up bubble
      fadeIn("follow-up-block");
      scrollChat();

      setTimeout(function () {
        // Phase 3: show second AI response block, then type
        fadeIn("ai-response-2-block");
        scrollChat();

        setTimeout(function () {
          typeInto("typing-response-2", "typing-cursor-2", text2, scrollChat);
        }, 400);
      }, GAP);
    });
  }, DELAY1);
})();
