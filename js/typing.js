// =============================================================================
// js/typing.js – Word-by-word typing animation engine
//
// Depends on: config.js (CONFIG), scroll.js (scrollChat)
// =============================================================================

/**
 * Animates text into a paragraph element word-by-word, placing each chunk
 * before the blinking cursor span.
 *
 * Scroll behaviour:
 *   - When `skipScroll` is true (first AI response): auto-scroll is suppressed
 *     for the first CONFIG.SCROLL_SKIP_STEPS steps to avoid jarring movement
 *     while the container still has visible space.
 *   - After the skip window, or when `skipScroll` is false (all subsequent
 *     responses), auto-scroll happens on every step.
 *   - A smooth scroll always runs after typing completes.
 *
 * @param {string}   paragraphId - ID of the <p> element to type into.
 * @param {string}   cursorId    - ID of the cursor <span> inside that <p>.
 * @param {string}   text        - Full text to type out.
 * @param {Function} onDone      - Callback fired after a final delay (CONFIG.GAP).
 * @param {boolean}  skipScroll  - true = delay scroll for first N steps.
 */
function typeWords(paragraphId, cursorId, text, onDone, skipScroll) {
  var target = document.getElementById(paragraphId);
  var cursor = document.getElementById(cursorId);

  if (!target || !cursor) {
    if (onDone) onDone();
    return;
  }

  var words     = text.split(/\s+/).filter(Boolean);
  var index     = 0;
  var stepCount = 0;

  function step() {
    if (index < words.length) {
      // Append next chunk of words before the cursor
      var chunk = words.slice(index, index + CONFIG.WORDS_PER_STEP).join(" ") + " ";
      target.insertBefore(document.createTextNode(chunk), cursor);

      index += CONFIG.WORDS_PER_STEP;
      stepCount++;

      // Schedule next chunk
      setTimeout(step, CONFIG.STEP_INTERVAL);

      // Auto-scroll: skip early steps on first response to avoid jumping
      if (!skipScroll || stepCount > CONFIG.SCROLL_SKIP_STEPS) {
        scrollChat(false, true); // instant scroll during typing
      }
    } else {
      // Typing complete – hide cursor and do a final smooth scroll
      cursor.classList.add("done");
      scrollChat(false, false); // smooth final scroll

      if (onDone) setTimeout(onDone, CONFIG.GAP);
    }
  }

  step();
}
