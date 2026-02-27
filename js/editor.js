// =============================================================================
// js/editor.js – Content editor panel logic
//
// Wires up:
//   • Live text editing (data-dialog fields → DIALOGS → DOM)
//   • Restart animation button
//   • AI Response Position toggle (left / right)
//   • Show / Hide visibility toggles (chart, CTA, birth details, user msg 1)
//
// Depends on: dom-helpers.js (setText), dialogs.js (DIALOGS)
// The `startSequence` function is injected at call time from app.js.
// =============================================================================

/**
 * Initialise the content editor panel.
 *
 * @param {Function} startSequence - The animation restart function from app.js.
 */
function initEditor(startSequence) {

  // ── Live text editing ────────────────────────────────────────────────────────
  // Every <input> / <textarea> with data-dialog="KEY" is pre-filled from DIALOGS
  // and updates DIALOGS[KEY] live as the user types, triggering a DOM re-inject.
  var editorInputs = document.querySelectorAll("[data-dialog]");
  editorInputs.forEach(function (input) {
    var key = input.getAttribute("data-dialog");
    input.value = DIALOGS[key] || "";

    input.addEventListener("input", function () {
      DIALOGS[key] = input.value;
      if (window.injectStaticText) window.injectStaticText();
    });
  });

  // ── Restart button ───────────────────────────────────────────────────────────
  var restartBtn = document.getElementById("restart-animation");
  if (restartBtn) {
    restartBtn.addEventListener("click", startSequence);
  }

  // ── AI Response Position toggle ──────────────────────────────────────────────
  var posToggle    = document.getElementById("ai-position-toggle");
  var labelRight   = document.getElementById("toggle-label-right");
  var labelLeft    = document.getElementById("toggle-label-left");
  var messagesList = document.getElementById("messages-list");

  // Both AI response row elements (spacing must differ on toggle)
  var aiRow1 = document.querySelector(".ai-msg-row:not(#ai-response-2-block)");
  var aiRow2 = document.getElementById("ai-response-2-block");

  /**
   * Add or remove `space-x-2` from AI rows.
   * When AI is on the LEFT (row-reversed), Tailwind space-x breaks — use gap instead.
   * When AI is on the RIGHT (default), space-x-2 provides the avatar gap correctly.
   *
   * @param {boolean} isLeft - true when the AI side is toggled to the left.
   */
  function setAiSpacing(isLeft) {
    [aiRow1, aiRow2].forEach(function (row) {
      if (!row) return;
      if (isLeft) {
        row.classList.remove("space-x-2");
      } else {
        row.classList.add("space-x-2");
      }
    });
  }

  /**
   * Highlight the active label (Right or Left) based on toggle state.
   *
   * @param {boolean} isLeft
   */
  function updatePositionLabels(isLeft) {
    if (labelRight) labelRight.className = "toggle-option" + (isLeft ? ""       : " active");
    if (labelLeft)  labelLeft.className  = "toggle-option" + (isLeft ? " active" : "");
  }

  // Apply initial state (toggle starts checked = AI on left by default)
  var initiallyLeft = posToggle ? posToggle.checked : false;
  if (messagesList && initiallyLeft) messagesList.classList.add("ai-on-left");
  setAiSpacing(initiallyLeft);
  updatePositionLabels(initiallyLeft);

  if (posToggle && messagesList) {
    posToggle.addEventListener("change", function () {
      var isLeft = posToggle.checked;
      messagesList.classList.toggle("ai-on-left", isLeft);
      setAiSpacing(isLeft);
      updatePositionLabels(isLeft);
    });
  }

  // ── Visibility toggles ───────────────────────────────────────────────────────
  /**
   * Bind a checkbox toggle to show / hide a DOM element.
   *
   * @param {string} toggleId  - ID of the <input type="checkbox">.
   * @param {string} elementId - ID of the element to show / hide.
   */
  function bindVisibilityToggle(toggleId, elementId) {
    var toggleEl = document.getElementById(toggleId);
    var targetEl = document.getElementById(elementId);
    if (!toggleEl || !targetEl) return;

    toggleEl.addEventListener("change", function () {
      targetEl.style.display = toggleEl.checked ? "" : "none";
    });
  }

  bindVisibilityToggle("toggle-chart",      "chart-block");      // Chart image
  bindVisibilityToggle("toggle-cta",        "cta-button");       // CTA button
  bindVisibilityToggle("toggle-birth",      "birth-block");      // Birth details bubble
  bindVisibilityToggle("toggle-user-msg-1", "user-msg-1-block"); // First user message

  // Turn 2 toggle: hides/shows both the follow-up bubble and AI response 2 together
  var turn2Toggle   = document.getElementById("toggle-turn-2");
  var followUpBlock = document.getElementById("follow-up-block");
  var aiBlock2      = document.getElementById("ai-response-2-block");

  if (turn2Toggle) {
    turn2Toggle.addEventListener("change", function () {
      var display = turn2Toggle.checked ? "" : "none";
      if (followUpBlock) followUpBlock.style.display = display;
      if (aiBlock2)      aiBlock2.style.display      = display;
    });
  }
}
