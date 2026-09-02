import { fileToImage, renderCenterCrop, canvasToJpegDataUrl } from "./imageProcessor.js";
import { addCompatibilityExif } from "./exif.js";
import { downloadDataUrl, copyBase64, shareImage, humanBytes } from "./utils.js";

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

let selectedFile = null;
let outputDataUrl = null;

function setStatus(message, kind = "") {
  status.textContent = message;
  status.className = `status ${kind}`;
}

function setOutputReady(ready) {
  downloadBtn.disabled = !ready;
  copyBtn.disabled = !ready;
  shareBtn.disabled = !ready;
}

async function chooseFile(file) {
  if (!file || !file.type.startsWith("image/")) {
    setStatus("Please choose a valid image file.", "err");
    return;
  }
  selectedFile = file;
  outputDataUrl = null;
  setOutputReady(false);

  const img = await fileToImage(file);
  preview.src = URL.createObjectURL(file);
  previewWrap.classList.remove("hidden");
  fileMeta.textContent = `${file.name} • ${img.naturalWidth}×${img.naturalHeight} • ${humanBytes(file.size)}`;
  convertBtn.disabled = false;
  setStatus("Image ready. Press Convert Image.");
}

fileInput.addEventListener("change", () => chooseFile(fileInput.files?.[0]));

["dragenter","dragover"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault();
  dropzone.style.borderColor = "#8a8a96";
}));

["dragleave","drop"].forEach(type => dropzone.addEventListener(type, e => {
  e.preventDefault();
  dropzone.style.borderColor = "";
}));

dropzone.addEventListener("drop", e => chooseFile(e.dataTransfer.files?.[0]));

convertBtn.addEventListener("click", async () => {
  if (!selectedFile) return;
  try {
    convertBtn.disabled = true;
    setStatus("Converting…");
    const img = await fileToImage(selectedFile);
    const canvas = renderCenterCrop(img);
    const jpeg = canvasToJpegDataUrl(canvas);
    outputDataUrl = addCompatibilityExif(jpeg);
    preview.src = outputDataUrl;
    setOutputReady(true);
    setStatus("Done — 3024×4032 JPEG is ready.", "ok");
  } catch (err) {
    console.error(err);
    setStatus(err.message || "Conversion failed.", "err");
  } finally {
    convertBtn.disabled = false;
  }
});

downloadBtn.addEventListener("click", () => {
  if (outputDataUrl) downloadDataUrl(outputDataUrl, `converted-${Date.now()}.jpg`);
});

copyBtn.addEventListener("click", async () => {
  try {
    await copyBase64(outputDataUrl);
    setStatus("Base64 copied to clipboard.", "ok");
  } catch {
    setStatus("Clipboard access failed. Serve the site over HTTPS or localhost.", "err");
  }
});

shareBtn.addEventListener("click", async () => {
  try {
    await shareImage(outputDataUrl, `converted-${Date.now()}.jpg`);
  } catch (err) {
    setStatus(err.message, "err");
  }
});

resetBtn.addEventListener("click", () => {
  selectedFile = null;
  outputDataUrl = null;
  fileInput.value = "";
  preview.removeAttribute("src");
  previewWrap.classList.add("hidden");
  convertBtn.disabled = true;
  setOutputReady(false);
  setStatus("Choose an image to begin.");
});
