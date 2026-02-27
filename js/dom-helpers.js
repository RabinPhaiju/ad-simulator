// =============================================================================
// js/dom-helpers.js – Lightweight DOM utility functions
//
// Pure helpers with no side-effects. No dependencies on other modules.
// =============================================================================

/**
 * Safely sets the textContent of an element by ID.
 * Does nothing if the element is not found or value is falsy.
 *
 * @param {string} id    - The element ID to target.
 * @param {string} value - The text to set.
 */
function setText(id, value) {
  var el = document.getElementById(id);
  if (el && value !== undefined && value !== null) el.textContent = value;
}

/**
 * Fades in a previously hidden element by setting its opacity to "1".
 * The element must already have a CSS transition on opacity to animate.
 *
 * @param {string} id - The element ID to fade in.
 */
function fadeIn(id) {
  var el = document.getElementById(id);
  if (el) el.style.opacity = "1";
}
