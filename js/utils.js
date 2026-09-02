export function dataUrlToBlob(dataUrl){
  const [header,data]=dataUrl.split(",");
  const mime=header.match(/data:(.*?);base64/)?.[1]||"image/jpeg";
  const binary=atob(data);
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++) bytes[i]=binary.charCodeAt(i);
  return new Blob([bytes],{type:mime});
}

export function downloadDataUrl(dataUrl,filename){
  const a=document.createElement("a");
  a.href=dataUrl;a.download=filename;
  document.body.appendChild(a);a.click();a.remove();
}

export async function copyBase64(dataUrl){
  await navigator.clipboard.writeText(dataUrl.split(",")[1]||"");
}

export async function shareImage(dataUrl,filename){
  if(!navigator.share) throw new Error("Share is not supported on this browser.");
  const file=new File([dataUrlToBlob(dataUrl)],filename,{type:"image/jpeg"});
  if(navigator.canShare && !navigator.canShare({files:[file]}))
    throw new Error("This browser cannot share image files.");
  await navigator.share({files:[file],title:"Converted photo"});
}

export function humanBytes(bytes){
  const u=["B","KB","MB","GB"];let v=bytes,i=0;
  while(v>=1024&&i<u.length-1){v/=1024;i++}
  return `${v.toFixed(i?1:0)} ${u[i]}`;
}
