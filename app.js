// ─────────────────────────────────────────────────────────────────────────────
// app.js  –  Main application logic for PocketPandit AI chat interface.
// Handles typing animations, DOM helpers, and dialog injection.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  // ── Dialog data (read from dailogs.js DIALOGS namespace) ─────────────────
  var D = window.DIALOGS || {};

  // ── Animation timing constants ───────────────────────────────────────────
  var SPEED  = 30;   // ms per character (for reference)
  var DELAY1 = 800;  // delay before first animation starts
  var GAP    = 800;  // pause between phases
  var WORDS_PER_STEP = 2; // Number of words to type at a time (e.g., 1, 2, or 3)
  var STEP_INTERVAL = 150; // Delay between steps (ms)

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
   * Type `text` word-by-word into the <p> identified by
   * `paragraphId`, placing each word before the cursor span
   * identified by `cursorId`. Calls `onDone` after finishing.
   * Speed is 100ms per word for a faster feel.
   */
  function typeWords(paragraphId, cursorId, text, onDone) {
    var target = document.getElementById(paragraphId);
    var cursor = document.getElementById(cursorId);
    var words = text.split(/\s+/).filter(Boolean); // split into words
    var index = 0;

    function step() {
      if (index < words.length) {
        // Extract the next chunk of words
        var chunk = words.slice(index, index + WORDS_PER_STEP).join(' ') + ' ';
        target.insertBefore(document.createTextNode(chunk), cursor);
        
        index += WORDS_PER_STEP;
        scrollChat();
        setTimeout(step, STEP_INTERVAL); 
      } else {
        cursor.classList.add('done');
        if (onDone) setTimeout(onDone, GAP);
      }
    }

    step();
  }

  // ── Inject static text from DIALOGS namespace ────────────────────────────
  function injectStatic() {
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

  // ── Editor Logic ──────────────────────────────────────────────────────────
  function initEditor() {
    var editorInputs = document.querySelectorAll("[data-dialog]");
    editorInputs.forEach(function (input) {
      var key = input.getAttribute("data-dialog");
      input.value = D[key] || "";

      input.addEventListener("input", function () {
        D[key] = input.value;
        injectStatic(); // Re-inject static text live
      });
    });

    var restartBtn = document.getElementById("restart-animation");
    if (restartBtn) {
      restartBtn.addEventListener("click", function () {
        startSequence();
      });
    }
  }

  // ── Animation sequence ───────────────────────────────────────────────────
  var activeTimeouts = [];

  function clearTimeouts() {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
  }

  function startSequence() {
    clearTimeouts();
    
    // Reset UI state
    setText("typing-response", "");
    setText("typing-response-2", "");
    
    var r1 = document.getElementById("typing-response");
    var r2 = document.getElementById("typing-response-2");
    if (r1) r1.innerHTML = '<span class="typing-cursor" id="typing-cursor"></span>';
    if (r2) r2.innerHTML = '<span class="typing-cursor" id="typing-cursor-2"></span>';
    
    var followUp = document.getElementById("follow-up-block");
    var aiBlock2 = document.getElementById("ai-response-2-block");
    if (followUp) followUp.style.opacity = "0";
    if (aiBlock2) aiBlock2.style.opacity = "0";
    
    setText("credits-value", "2.0");

    var text1 = D.AI_RESPONSE_1 || "";
    var text2 = D.AI_RESPONSE_2 || "";

    // Phase 1: type first AI response
    var t1 = setTimeout(function () {
      typeWords('typing-response', 'typing-cursor', text1, function () {
        scrollChat();

        // Phase 2: show user follow-up bubble
        fadeIn('follow-up-block');
        scrollChat();

        var t2 = setTimeout(function () {
          // Phase 3: show second AI response block, then type
          fadeIn('ai-response-2-block');
          scrollChat();

          var t3 = setTimeout(function () {
            typeWords('typing-response-2', 'typing-cursor-2', text2, function() {
              scrollChat();
              setText("credits-value", "1.2");
            });
          }, 400);
          activeTimeouts.push(t3);
        }, GAP);
        activeTimeouts.push(t2);
      });
    }, DELAY1);
    activeTimeouts.push(t1);
  }

  // Initialize everything
  injectStatic();
  initEditor();
  startSequence();
})();
