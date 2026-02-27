// =============================================================================
// js/scroll.js – Chat scroll tracking and controlled scrolling
//
// Tracks whether the user has manually scrolled up and exposes scrollChat(),
// which auto-scrolls the messages list only when appropriate.
// =============================================================================

/**
 * True when the user has manually scrolled up away from the bottom.
 * Resets to false when they scroll back to the bottom or the animation restarts.
 * @type {boolean}
 */
var userScrolledUp = false;

// ── Detect manual scroll ──────────────────────────────────────────────────────
(function attachScrollListener() {
  var list = document.getElementById("messages-list");
  if (!list) return;

  list.addEventListener("scroll", function () {
    var threshold = 30; // px within which we consider user "at the bottom"
    var isAtBottom = (list.scrollHeight - list.scrollTop) <= (list.clientHeight + threshold);

    // If user scrolled away from bottom mark it; clear flag when they return.
    userScrolledUp = !isAtBottom;
  });
})();

/**
 * Scroll the messages list to the bottom.
 *
 * The scroll is suppressed when:
 *   - The user has manually scrolled up (and `force` is false).
 *   - The content already fits within the visible area (nothing is hidden).
 *
 * @param {boolean} [force=false]   - If true, scroll regardless of userScrolledUp.
 * @param {boolean} [instant=false] - If true, jump instantly instead of smooth scroll.
 */
function scrollChat(force, instant) {
  // Respect manual scroll unless forced
  if (userScrolledUp && !force) return;

  var list = document.getElementById("messages-list");
  if (!list) return;

  // Only scroll if content overflows below the visible area
  var listVisibleBottom = list.getBoundingClientRect().bottom;
  var lastChild = list.lastElementChild;
  if (!lastChild && !force) return;

  var contentBottom = lastChild ? lastChild.getBoundingClientRect().bottom : 0;

  if (force || contentBottom > listVisibleBottom) {
    list.scrollTo({
      top: list.scrollHeight,
      behavior: instant ? "auto" : "smooth",
    });
  }
}
