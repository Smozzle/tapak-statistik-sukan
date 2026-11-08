import { saizMuat } from './sijil.js';

export const HAD_BAIT = 900 * 1024;

function muatGambar(fail) {
  return new Promise((selesai, gagal) => {
    const url = URL.createObjectURL(fail);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); selesai(img); };
    img.onerror = () => { URL.revokeObjectURL(url); gagal(new Error('Fail gambar tidak dapat dibuka.')); };
    img.src = url;
  });
}

/**
 * Browser only. Shrinks an image file to about 1754x1240 and encodes it as JPEG under 900 KB.
 * Resolves { gambar: dataURL, orientasi }. Rejects with a Malay message.
 */
export async function mampatkanGambar(fail) {
  if (!fail?.type?.startsWith('image/')) throw new Error('Fail itu bukan gambar. Pilih fail JPG atau PNG.');
  const img = await muatGambar(fail);
  let { lebar, tinggi, orientasi } = saizMuat(img.naturalWidth, img.naturalHeight);
  for (let pusingan = 0; pusingan < 4; pusingan += 1) {
    const kanvas = document.createElement('canvas');
    kanvas.width = lebar;
    kanvas.height = tinggi;
    const ctx = kanvas.getContext('2d');
    ctx.fillStyle = '#fff'; // JPEG has no transparency
    ctx.fillRect(0, 0, lebar, tinggi);
    ctx.drawImage(img, 0, 0, lebar, tinggi);
    for (let kualiti = 0.9; kualiti >= 0.35; kualiti -= 0.1) {
      const data = kanvas.toDataURL('image/jpeg', kualiti);
      if (data.length < HAD_BAIT) return { gambar: data, orientasi };
    }
    lebar = Math.round(lebar * 0.8);
    tinggi = Math.round(tinggi * 0.8);
  }
  throw new Error('Gambar tidak dapat dimampatkan di bawah 900 KB. Cuba gambar yang lebih ringkas atau bersaiz lebih kecil.');
}
