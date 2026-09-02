export function addCompatibilityExif(jpegDataUrl) {
  if (!window.piexif) return jpegDataUrl;

  const zeroth = {};
  const exif = {};

  // User-selectable compatibility-style labels.
  // They are not evidence of the real capture device.
  zeroth[piexif.ImageIFD.Make] = "Meta AI";
  zeroth[piexif.ImageIFD.Model] = "Ray-Ban Meta Smart Glasses 2";
  zeroth[piexif.ImageIFD.Orientation] = 1;
  zeroth[piexif.ImageIFD.Software] = "Browser Photo Converter";

  const now = new Date();
  const pad = n => String(n).padStart(2, "0");
  const stamp = `${now.getFullYear()}:${pad(now.getMonth()+1)}:${pad(now.getDate())} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`;
  exif[piexif.ExifIFD.DateTimeOriginal] = stamp;

  const exifObj = {
    "0th": zeroth,
    "Exif": exif,
    "GPS": {},
    "1st": {},
    "thumbnail": null
  };

  const bytes = piexif.dump(exifObj);
  return piexif.insert(bytes, jpegDataUrl);
}
