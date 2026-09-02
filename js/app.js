import {fileToImage,renderCenterCrop,canvasToJpegDataUrl} from "./imageProcessor.js?v=8";
import {addCompatibilityExif} from "./exif.js?v=8";
import {downloadDataUrl,copyBase64,shareImage,humanBytes} from "./utils.js?v=8";

const $ = id => document.getElementById(id);

const fileInput = $("fileInput");
const dropzone = $("dropzone");
const previewWrap = $("previewWrap");
const preview = $("preview");
const fileMeta = $("fileMeta");
const convertBtn = $("convertBtn");
const downloadBtn = $("downloadBtn");
const copyBtn = $("copyBtn");
const shareBtn = $("shareBtn");
const resetBtn = $("resetBtn");
const status = $("status");
const installBtn = $("installBtn");

let selectedFile = null;
let outputDataUrl = null;
let deferredPrompt = null;
let previewUrl = null;

function setStatus(msg, kind = "") {
  if (!status) return;
  status.textContent = msg;
  status.className = `status ${kind}`.trim();
}

function setOutputReady(ready) {
  if (downloadBtn) downloadBtn.disabled = !ready;
  if (copyBtn) copyBtn.disabled = !ready;
  if (shareBtn) shareBtn.disabled = !ready;
}

async function chooseFile(file) {
  if (!file || !file.type?.startsWith("image/")) {
    setStatus("Please choose a valid image.", "err");
    return;
  }

  try {
    selectedFile = file;
    outputDataUrl = null;
    setOutputReady(false);
    if (convertBtn) convertBtn.disabled = true;
    setStatus("Loading image…");

    const img = await fileToImage(file);

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);

    if (preview) {
      preview.src = previewUrl;
      preview.alt = file.name || "Selected image";
    }
    previewWrap?.classList.remove("hidden");

    if (fileMeta) {
      fileMeta.textContent =
        `${file.name} • ${img.naturalWidth}×${img.naturalHeight} • ${humanBytes(file.size)}`;
    }

    if (convertBtn) convertBtn.disabled = false;
    setStatus("Ready to convert.", "ok");
  } catch (err) {
    console.error(err);
    selectedFile = null;
    if (convertBtn) convertBtn.disabled = true;
    setStatus(err?.message || "Could not load this image.", "err");
  }
}

fileInput?.addEventListener("change", () => {
  const file = fileInput.files?.[0];
  if (file) chooseFile(file);
});

["dragenter", "dragover"].forEach(type => {
  dropzone?.addEventListener(type, event => {
    event.preventDefault();
    event.stopPropagation();
  });
});

dropzone?.addEventListener("drop", event => {
  event.preventDefault();
  event.stopPropagation();
  const file = event.dataTransfer?.files?.[0];
  if (file) chooseFile(file);
});

convertBtn?.addEventListener("click", async () => {
  if (!selectedFile) {
    setStatus("Choose a photo first.", "err");
    return;
  }

  try {
    convertBtn.disabled = true;
    setOutputReady(false);
    setStatus("Converting…");

    const img = await fileToImage(selectedFile);
    const canvas = renderCenterCrop(img);
    const jpeg = canvasToJpegDataUrl(canvas);
    outputDataUrl = addCompatibilityExif(jpeg);

    if (preview) preview.src = outputDataUrl;
    previewWrap?.classList.remove("hidden");

    setOutputReady(true);
    setStatus("Done — image is ready.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err?.message || "Conversion failed.", "err");
  } finally {
    convertBtn.disabled = false;
  }
});

downloadBtn?.addEventListener("click", () => {
  if (!outputDataUrl) return;
  downloadDataUrl(outputDataUrl, `meta-converted-${Date.now()}.jpg`);
});

copyBtn?.addEventListener("click", async () => {
  if (!outputDataUrl) return;
  try {
    await copyBase64(outputDataUrl);
    setStatus("Base64 copied.", "ok");
  } catch {
    setStatus("Clipboard permission failed.", "err");
  }
});

shareBtn?.addEventListener("click", async () => {
  if (!outputDataUrl) return;
  try {
    await shareImage(outputDataUrl, `meta-converted-${Date.now()}.jpg`);
  } catch (err) {
    if (err?.name !== "AbortError") setStatus(err?.message || "Share failed.", "err");
  }
});

resetBtn?.addEventListener("click", () => {
  selectedFile = null;
  outputDataUrl = null;

  if (fileInput) fileInput.value = "";

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  if (preview) preview.removeAttribute("src");
  previewWrap?.classList.add("hidden");
  if (fileMeta) fileMeta.textContent = "";

  if (convertBtn) convertBtn.disabled = true;
  setOutputReady(false);
  setStatus("Choose a photo to begin.");
});

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./sw.js").catch(console.error);
  });
}

window.addEventListener("beforeinstallprompt", event => {
  event.preventDefault();
  deferredPrompt = event;
  installBtn?.classList.add("ready");
});

installBtn?.addEventListener("click", async () => {
  if (deferredPrompt) {
    deferredPrompt.prompt();
    const choice = await deferredPrompt.userChoice;
    deferredPrompt = null;

    if (choice.outcome === "accepted") {
      setStatus("Installing app…", "ok");
    }
    return;
  }

  const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent);

  if (isIOS) {
    setStatus("iPhone/iPad: Safari Share → Add to Home Screen.");
  } else if (window.matchMedia("(display-mode: standalone)").matches) {
    setStatus("App is already installed.", "ok");
  } else {
    setStatus("Open browser menu → Install app / Add to Home screen.");
  }
});

window.addEventListener("appinstalled", () => {
  deferredPrompt = null;
  if (installBtn) {
    installBtn.classList.add("installed");
    installBtn.textContent = "Installed";
  }
  setStatus("App installed successfully.", "ok");
});

if (convertBtn) convertBtn.disabled = true;
setOutputReady(false);
setStatus("Choose a photo to begin.");
