// =============================================================================
// js/config.js – Animation timing constants
//
// Centralised configuration. Adjust these values to change the pace
// and behaviour of the typing animation and scroll logic.
// =============================================================================

var CONFIG = {
  /** Delay (ms) before the first typing animation starts after page load. */
  DELAY1: 800,

  /** Pause (ms) between conversation phases (e.g. after AI response 1 ends). */
  GAP: 800,

  /** Number of words appended to the bubble on each animation step. */
  WORDS_PER_STEP: 3,

  /** Time (ms) between each word-chunk step. Lower = faster typing. */
  STEP_INTERVAL: 250,

  /**
   * How many word-chunk steps to skip auto-scroll for at the START of the
   * FIRST AI response only — prevents the view jumping while there is still
   * visible space in the chat container.
   */
  SCROLL_SKIP_STEPS: 12,
};
