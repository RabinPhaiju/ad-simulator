// =============================================================================
// js/recorder.js  –  Records the <main> mobile preview pane
//
// Strategy (in priority order):
//   1. getDisplayMedia + Region Capture API (Chrome 104+)
//      → pixel-perfect, no CSS/font issues, crops to exactly <main>
//   2. getDisplayMedia without crop (fallback for older Chrome)
//      → records full tab, user must crop manually after
//   3. html2canvas canvas stream (last resort, lower fidelity)
//
// Recording status (pulsing dot + timer) is shown ONLY in the Stop button
// on the right panel — never inside the captured region.
//
// Auto-restarts the chat animation when Record is clicked.
// Auto-stops recording when the animation sequence ends.
// Auto-downloads the file when Stop is clicked (.mp4 on Safari, .webm elsewhere).
// =============================================================================

(function () {
  "use strict";

  // ── State ────────────────────────────────────────────────────────────────────
  var mediaRecorder  = null;
  var recordedChunks = [];
  var timerInterval  = null;
  var elapsedSeconds = 0;
  var activeStream   = null;   // kept so we can stop all tracks on Stop
  var autoStopBound  = null;   // bound auto-stop listener ref for cleanup

  // Fallback canvas (used only if getDisplayMedia unavailable)
  var fallbackCanvas = document.createElement("canvas");
  var fallbackCtx    = fallbackCanvas.getContext("2d");
  var fallbackLoop   = null;
  var fallbackBusy   = false;
  var isRecordingCanvas = false;

  // ── DOM refs ─────────────────────────────────────────────────────────────────
  var btnRecord, btnStop, timerDisplay;

  // ── Helpers ──────────────────────────────────────────────────────────────────

  function formatTime(s) {
    var m   = Math.floor(s / 60).toString().padStart(2, "0");
    var sec = (s % 60).toString().padStart(2, "0");
    return m + ":" + sec;
  }

  /** Best MIME type the browser supports */
  function pickMimeType() {
    var types = [
      "video/mp4",                   // Safari
      "video/webm;codecs=vp9",
      "video/webm;codecs=vp8",
      "video/webm",
    ];
    for (var i = 0; i < types.length; i++) {
      if (MediaRecorder.isTypeSupported(types[i])) return types[i];
    }
    return "";
  }

  /** Extension that matches the MIME type */
  function extForMime(mime) {
    return mime.startsWith("video/mp4") ? ".mp4" : ".webm";
  }

  // ── UI helpers ────────────────────────────────────────────────────────────────

  function showRecordingUI() {
    btnRecord.style.display = "none";
    btnStop.style.display   = "flex";
    if (timerDisplay) timerDisplay.textContent = "00:00";

    // Visual rectangle on the <main> element
    var main = document.querySelector(".mobile-view-wrapper main");
    if (main) main.classList.add("is-recording");
  }

  function hideRecordingUI() {
    btnRecord.style.display = "flex";
    btnStop.style.display   = "none";

    var main = document.querySelector(".mobile-view-wrapper main");
    if (main) main.classList.remove("is-recording");

    // Show hamburger menu again
    var menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) menuToggle.style.display = "";
  }

  function startTimer() {
    elapsedSeconds = 0;
    timerInterval  = setInterval(function () {
      elapsedSeconds++;
      if (timerDisplay) timerDisplay.textContent = formatTime(elapsedSeconds);
    }, 1000);
  }

  function stopTimer() {
    clearInterval(timerInterval);
    timerInterval = null;
  }

  // ── Auto-download ─────────────────────────────────────────────────────────────

  function download(chunks, mime) {
    var blob = new Blob(chunks, { type: mime || "video/webm" });
    var url  = URL.createObjectURL(blob);
    var a    = document.createElement("a");
    a.href     = url;
    a.download = "recording-" + Date.now() + extForMime(mime || "");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 8000);
  }

  // ── Auto-stop ─────────────────────────────────────────────────────────────────
  // app.js dispatches "animationSequenceEnd" on document when all typing is done.
  // We listen for that event and auto-stop recording after a small grace period.

  function onAnimationEnd() {
    console.log("[recorder] animation ended — auto-stopping in 800ms");
    removeAutoStop();
    setTimeout(function () {
      if (mediaRecorder && mediaRecorder.state !== "inactive") {
        stopRecording();
      }
    }, 800);
  }

  function addAutoStop() {
    removeAutoStop(); // ensure no duplicates
    autoStopBound = onAnimationEnd;
    document.addEventListener("animationSequenceEnd", autoStopBound);
    console.log("[recorder] auto-stop listener added");
  }

  function removeAutoStop() {
    if (autoStopBound) {
      document.removeEventListener("animationSequenceEnd", autoStopBound);
      autoStopBound = null;
    }
  }

  // ── Begin recording (no countdown) ─────────────────────────────────────────

  function beginRecording(stream) {
    // Register auto-stop listener
    addAutoStop();

    // Close mobile editor if open
    var editorPanel = document.querySelector(".editor-panel");
    var backdrop = document.getElementById("editor-backdrop");
    var menuToggle = document.getElementById("menu-toggle");
    if (editorPanel && editorPanel.classList.contains("open")) {
      editorPanel.classList.remove("open");
      if (backdrop) backdrop.classList.remove("show");
      if (menuToggle) {
        var icon = menuToggle.querySelector(".material-symbols-rounded");
        if (icon) icon.textContent = "menu";
      }
    }

    // Show stop button immediately so the user knows it's starting
    btnRecord.style.display = "none";
    btnStop.style.display   = "flex";
    if (timerDisplay) timerDisplay.textContent = "Starting…";

    // Hide hamburger menu immediately so it's not in the 1s delay or recording
    var menuToggle = document.getElementById("menu-toggle");
    if (menuToggle) menuToggle.style.display = "none";

    // Give the stream 1 second to stabilise (replaces old 5s countdown).
    // Then use the same order that always worked:
    //   startSequence() first  →  startMediaRecorder() second.
    setTimeout(function () {
      if (window.startSequence) window.startSequence();
      startMediaRecorder(stream);
    }, 1000);
  }

  // ── Strategy 1 & 2: getDisplayMedia (Region Capture) ─────────────────────────

  function startWithDisplayMedia() {
    // Ask browser to share — preferCurrentTab skips the picker on Chrome 94+
    var constraints = {
      video: { frameRate: 30 },
      audio: false,
      preferCurrentTab: true,      // Chrome hint (non-standard but widely supported)
    };

    navigator.mediaDevices.getDisplayMedia(constraints).then(function (stream) {
      activeStream = stream;
      var main     = document.querySelector(".mobile-view-wrapper main");

      // We MUST crop. If we can't crop, we shouldn't use getDisplayMedia
      // (otherwise we record the user's entire screen/tab, which looks wrong).
      if (!main || typeof CropTarget === "undefined" || !CropTarget.fromElement) {
        // Region Capture not supported. Stop the stream and fallback.
        stream.getTracks().forEach(function(t) { t.stop(); });
        activeStream = null;
        console.warn("Region Capture API (CropTarget) not supported. Falling back to html2canvas.");
        startWithCanvas();
        return;
      }

      CropTarget.fromElement(main)
        .then(function (cropTarget) {
          var track = stream.getVideoTracks()[0];
          return track.cropTo(cropTarget);
        })
        .then(function () {
          // Cropping succeeded — start recording immediately.
          beginRecording(stream);
        })
        .catch(function (err) {
          // Crop failed. Stop the stream and fallback.
          stream.getTracks().forEach(function(t) { t.stop(); });
          activeStream = null;
          console.warn("track.cropTo() failed. Falling back to html2canvas:", err);
          startWithCanvas();
        });

    }).catch(function (err) {
      // User cancelled or browser doesn't support it → fall back to html2canvas
      console.warn("getDisplayMedia failed, falling back to html2canvas:", err);
      startWithCanvas();
    });
  }

  // ── Strategy 3: html2canvas canvas stream (fallback) ─────────────────────────

  function captureFrame() {
    if (fallbackBusy || !isRecordingCanvas) return;
    var target = document.querySelector(".mobile-view-wrapper main");
    if (!target) return;

    fallbackBusy = true;
    var rect = target.getBoundingClientRect();

    html2canvas(target, {
      scale:        1,
      useCORS:      true,
      allowTaint:   true,
      logging:      false,
      width:        Math.round(rect.width),
      height:       Math.round(rect.height),
      windowWidth:  window.innerWidth,
      windowHeight: window.innerHeight,
    }).then(function (c) {
      if (!isRecordingCanvas) return; // if stopped while rendering
      if (fallbackCanvas.width !== c.width || fallbackCanvas.height !== c.height) {
        fallbackCanvas.width  = c.width;
        fallbackCanvas.height = c.height;
      }
      fallbackCtx.clearRect(0, 0, fallbackCanvas.width, fallbackCanvas.height);
      fallbackCtx.drawImage(c, 0, 0);
      fallbackBusy = false;
      
      // Request next frame recursively
      fallbackLoop = setTimeout(captureFrame, 1000 / 30);
    }).catch(function () { 
      fallbackBusy = false; 
      if (isRecordingCanvas) fallbackLoop = setTimeout(captureFrame, 1000 / 30);
    });
  }

  function startWithCanvas() {
    var target = document.querySelector(".mobile-view-wrapper main");
    if (!target) return;
    var rect = target.getBoundingClientRect();
    fallbackCanvas.width  = Math.round(rect.width);
    fallbackCanvas.height = Math.round(rect.height);

    isRecordingCanvas = true;
    var stream = fallbackCanvas.captureStream(30);
    
    // Start drawing to canvas
    captureFrame();
    
    // Start recording immediately
    beginRecording(stream);
  }

  // ── Shared MediaRecorder setup ────────────────────────────────────────────────

  function startMediaRecorder(stream) {
    var mime = pickMimeType();
    recordedChunks = [];

    mediaRecorder = new MediaRecorder(stream, mime ? { mimeType: mime } : {});

    mediaRecorder.ondataavailable = function (e) {
      if (e.data && e.data.size > 0) recordedChunks.push(e.data);
    };

    mediaRecorder.onstop = function () {
      download(recordedChunks, mime);
    };

    mediaRecorder.start(200);
    showRecordingUI();
    startTimer();

    // When user closes the browser share dialog / stops sharing externally
    stream.getVideoTracks()[0].onended = function () { stopRecording(); };
  }

  // ── Public start / stop ───────────────────────────────────────────────────────

  function startRecording() {
    if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
      startWithDisplayMedia();
    } else if (typeof html2canvas !== "undefined") {
      startWithCanvas();
    } else {
      alert("Recording is not supported in this browser.");
    }
  }

  function stopRecording() {
    // Remove auto-stop listener
    removeAutoStop();

    // Stop canvas fallback loop if active
    if (isRecordingCanvas) { 
      isRecordingCanvas = false;
      if (fallbackLoop) { 
        clearTimeout(fallbackLoop); 
        fallbackLoop = null; 
      }
    }

    // Stop all stream tracks (releases browser share indicator)
    if (activeStream) {
      activeStream.getTracks().forEach(function (t) { t.stop(); });
      activeStream = null;
    }

    // Finalise MediaRecorder → triggers onstop → download
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }

    stopTimer();
    hideRecordingUI();
  }

  // ── Init ─────────────────────────────────────────────────────────────────────
  document.addEventListener("DOMContentLoaded", function () {
    btnRecord    = document.getElementById("btn-record");
    btnStop      = document.getElementById("btn-stop");
    timerDisplay = document.getElementById("stop-timer-text");

    if (!btnRecord || !btnStop) return;

    // Disable button if nothing is supported
    var supported = (
      (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) ||
      typeof html2canvas !== "undefined"
    );
    if (!supported || typeof MediaRecorder === "undefined") {
      btnRecord.title         = "Recording not supported in this browser";
      btnRecord.style.opacity = "0.4";
      btnRecord.style.cursor  = "not-allowed";
      return;
    }

    btnRecord.addEventListener("click", startRecording);
    btnStop.addEventListener("click",   stopRecording);
  });
})();
