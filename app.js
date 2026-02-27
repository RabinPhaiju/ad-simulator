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
  var WORDS_PER_STEP = 3; // Number of words to type at a time (e.g., 1, 2, or 3)
  var STEP_INTERVAL = 250; // Delay between steps (ms)
  var SCROLL_SKIP_STEPS = 12; // Skip auto-scroll for the first N steps of typing

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

  // ── Scroll tracking ─────────────────────────────────────────────────────
  var userScrolledUp = false;

  // Detect when user manually scrolls up
  (function () {
    var list = document.getElementById("messages-list");
    if (!list) return;
    list.addEventListener("scroll", function () {
      var threshold = 30;
      var isAtBottom = (list.scrollHeight - list.scrollTop) <= (list.clientHeight + threshold);
      // If user scrolled away from bottom, mark it
      if (!isAtBottom) {
        userScrolledUp = true;
      } else {
        userScrolledUp = false;
      }
    });
  })();

  /** 
   * Scroll the messages list to the bottom.
   * Skips scrolling if user has manually scrolled up, unless forced.
   */
  function scrollChat(force, instant) {
    if (userScrolledUp && !force) return;

    var list = document.getElementById("messages-list");
    if (!list) return;

    // Check if content is actually clipped below the visible area
    var listRect = list.getBoundingClientRect();
    var listVisibleBottom = listRect.bottom;

    // Get the bottom of the last element inside the list
    var lastChild = list.lastElementChild;
    if (!lastChild && !force) return;

    var contentBottom = lastChild ? lastChild.getBoundingClientRect().bottom : 0;

    // Only scroll if content is actually hidden below the visible area
    if (force || contentBottom > listVisibleBottom) {
      list.scrollTo({ 
        top: list.scrollHeight, 
        behavior: instant ? "auto" : "smooth" 
      });
    }
  }

  // ── Typing animation engine ──────────────────────────────────────────────

  /**
   * Type `text` word-by-word into the <p> identified by
   * `paragraphId`, placing each word before the cursor span
   * identified by `cursorId`. Calls `onDone` after finishing.
   */
  function typeWords(paragraphId, cursorId, text, onDone, skipScroll) {
    var target = document.getElementById(paragraphId);
    var cursor = document.getElementById(cursorId);
    var words = text.split(/\s+/).filter(Boolean);
    var index = 0;
    var stepCount = 0;

    function step() {
      if (index < words.length) {
        var chunk = words.slice(index, index + WORDS_PER_STEP).join(' ') + ' ';
        target.insertBefore(document.createTextNode(chunk), cursor);
        
        index += WORDS_PER_STEP;
        stepCount++;
        setTimeout(step, STEP_INTERVAL); 
        // Skip auto-scroll for first N steps only if skipScroll is true
        if (!skipScroll || stepCount > SCROLL_SKIP_STEPS) {
          scrollChat(false, true);
        }
      } else {
        cursor.classList.add('done');
        scrollChat(false, false); // Smooth scroll at end of typing
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

    // AI position toggle
    var toggle = document.getElementById("ai-position-toggle");
    var labelRight = document.getElementById("toggle-label-right");
    var labelLeft = document.getElementById("toggle-label-left");
    var messagesList = document.getElementById("messages-list");
    var aiRow1 = document.querySelector(".ai-msg-row:not(#ai-response-2-block)");
    var aiRow2 = document.getElementById("ai-response-2-block");

    function setAiSpacing(isLeft) {
      [aiRow1, aiRow2].forEach(function(row) {
        if (!row) return;
        if (isLeft) {
          row.classList.remove("space-x-2");
        } else {
          row.classList.add("space-x-2");
        }
      });
    }

    function updateToggleLabels(isLeft) {
      if (labelRight) labelRight.className = "toggle-option" + (isLeft ? "" : " active");
      if (labelLeft) labelLeft.className = "toggle-option" + (isLeft ? " active" : "");
    }

    // Set initial state: add space-x-2 by default (not toggled)
    setAiSpacing(false);
    updateToggleLabels(false);

    if (toggle && messagesList) {
      toggle.addEventListener("change", function () {
        if (toggle.checked) {
          messagesList.classList.add("ai-on-left");
        } else {
          messagesList.classList.remove("ai-on-left");
        }
        setAiSpacing(toggle.checked);
        updateToggleLabels(toggle.checked);
      });
    }

    // ── Visibility Toggles ──────────────────────────────────────────────────
    function bindVisibilityToggle(toggleId, elementId) {
      var toggleEl = document.getElementById(toggleId);
      var targetEl = document.getElementById(elementId);
      if (!toggleEl || !targetEl) return;
      toggleEl.addEventListener("change", function () {
        targetEl.style.display = toggleEl.checked ? "" : "none";
      });
    }

    bindVisibilityToggle("toggle-chart",      "chart-block");
    bindVisibilityToggle("toggle-cta",        "cta-button");
    bindVisibilityToggle("toggle-birth",      "birth-block");
    bindVisibilityToggle("toggle-user-msg-1", "user-msg-1-block");
  }

  // ── Animation sequence ───────────────────────────────────────────────────
  var activeTimeouts = [];

  function clearTimeouts() {
    activeTimeouts.forEach(clearTimeout);
    activeTimeouts = [];
  }

  function startSequence() {
    clearTimeouts();
    userScrolledUp = false; // Reset scroll override on restart
    
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
        scrollChat(true); // Force scroll after long response

        // Phase 2: show user follow-up bubble
        fadeIn('follow-up-block');
        scrollChat(true); // Force scroll when new bubble appears

        var t2 = setTimeout(function () {
          // Phase 3: show second AI response block, then type
          fadeIn('ai-response-2-block');
          scrollChat(true); // Force scroll when AI response starts

          var t3 = setTimeout(function () {
            typeWords('typing-response-2', 'typing-cursor-2', text2, function() {
              scrollChat(true); // Final force scroll
              setText("credits-value", "1.2");
            }, false);
          }, 400);
          activeTimeouts.push(t3);
        }, GAP);
        activeTimeouts.push(t2);
      }, true);
    }, DELAY1);
    activeTimeouts.push(t1);
  }

  // Initialize everything
  injectStatic();
  initEditor();
  startSequence();
})();
