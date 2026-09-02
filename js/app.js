import {fileToImage,renderCenterCrop,canvasToJpegDataUrl} from "./imageProcessor.js";
import {addCompatibilityExif} from "./exif.js";
import {downloadDataUrl,copyBase64,shareImage,humanBytes} from "./utils.js";

const $=id=>document.getElementById(id);
const fileInput=$("fileInput"),dropzone=$("dropzone"),previewWrap=$("previewWrap"),
preview=$("preview"),fileMeta=$("fileMeta"),convertBtn=$("convertBtn"),
downloadBtn=$("downloadBtn"),copyBtn=$("copyBtn"),shareBtn=$("shareBtn"),
resetBtn=$("resetBtn"),status=$("status"),installBtn=$("installBtn"),
installNavBtn=$("installNavBtn");

let selectedFile=null,outputDataUrl=null,deferredPrompt=null,previewUrl=null;

function setStatus(msg,kind=""){status.textContent=msg;status.className=`status ${kind}`}
function setOutputReady(v){downloadBtn.disabled=!v;copyBtn.disabled=!v;shareBtn.disabled=!v}

async function chooseFile(file){
  if(!file||!file.type.startsWith("image/")){
    setStatus("Please choose a valid image.","err");return;
  }
  selectedFile=file;outputDataUrl=null;setOutputReady(false);

  const img=await fileToImage(file);
  if(previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl=URL.createObjectURL(file);
  preview.src=previewUrl;
  previewWrap.classList.remove("hidden");
  fileMeta.textContent=`${file.name} • ${img.naturalWidth}×${img.naturalHeight} • ${humanBytes(file.size)}`;
  convertBtn.disabled=false;
  setStatus("Ready to convert.");
}

fileInput.addEventListener("change",()=>chooseFile(fileInput.files?.[0]));

["dragenter","dragover"].forEach(t=>dropzone.addEventListener(t,e=>{e.preventDefault()}));
dropzone.addEventListener("drop",e=>{e.preventDefault();chooseFile(e.dataTransfer.files?.[0])});

convertBtn.addEventListener("click",async()=>{
  if(!selectedFile)return;
  try{
    convertBtn.disabled=true;setStatus("Converting…");
    const img=await fileToImage(selectedFile);
    const jpeg=canvasToJpegDataUrl(renderCenterCrop(img));
    outputDataUrl=addCompatibilityExif(jpeg);
    preview.src=outputDataUrl;
    setOutputReady(true);
    setStatus("Done — image is ready.","ok");
  }catch(err){
    console.error(err);setStatus(err.message||"Conversion failed.","err");
  }finally{convertBtn.disabled=false}
});

downloadBtn.addEventListener("click",()=>{
  if(outputDataUrl) downloadDataUrl(outputDataUrl,`meta-converted-${Date.now()}.jpg`);
});
copyBtn.addEventListener("click",async()=>{
  try{await copyBase64(outputDataUrl);setStatus("Base64 copied.","ok")}
  catch{setStatus("Clipboard permission failed.","err")}
});
shareBtn.addEventListener("click",async()=>{
  try{await shareImage(outputDataUrl,`meta-converted-${Date.now()}.jpg`)}
  catch(err){setStatus(err.message,"err")}
});
resetBtn.addEventListener("click",()=>{
  selectedFile=null;outputDataUrl=null;fileInput.value="";
  if(previewUrl){URL.revokeObjectURL(previewUrl);previewUrl=null}
  preview.removeAttribute("src");previewWrap.classList.add("hidden");
  convertBtn.disabled=true;setOutputReady(false);setStatus("Choose a photo to begin.");
});

window.addEventListener("beforeinstallprompt",e=>{
  e.preventDefault();deferredPrompt=e;installBtn.classList.remove("hidden");
});
async function installApp(){
  if(deferredPrompt){
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt=null;installBtn.classList.add("hidden");
  }else{
    setStatus("On iPhone: Share → Add to Home Screen. On Android: browser menu → Install app.");
  }
}
installBtn.addEventListener("click",installApp);
installNavBtn.addEventListener("click",installApp);

window.addEventListener("appinstalled",()=>{
  installBtn.classList.add("hidden");
  setStatus("App installed successfully.","ok");
});

if("serviceWorker" in navigator){
  window.addEventListener("load",()=>navigator.serviceWorker.register("./sw.js"));
}
