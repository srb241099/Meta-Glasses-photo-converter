export function addCompatibilityExif(jpegDataUrl){
  if(!window.piexif) return jpegDataUrl;

  const zeroth={};
  const exif={};

  zeroth[piexif.ImageIFD.Make]="Meta AI";
  zeroth[piexif.ImageIFD.Model]="Ray-Ban Meta Smart Glasses 2";
  zeroth[piexif.ImageIFD.Orientation]=1;
  zeroth[piexif.ImageIFD.Software]="Meta Converter PWA";

  const d=new Date();
  const p=n=>String(n).padStart(2,"0");
  const stamp=`${d.getFullYear()}:${p(d.getMonth()+1)}:${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
  exif[piexif.ExifIFD.DateTimeOriginal]=stamp;

  return piexif.insert(
    piexif.dump({"0th":zeroth,"Exif":exif,"GPS":{},"1st":{},"thumbnail":null}),
    jpegDataUrl
  );
}
