// Fungsi untuk membaca file gambar
// Fungsi untuk membaca file gambar
function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Fungsi untuk mengekstrak watermark dari gambar yang telah diterapkan watermark
// extractWatermarkQIM
function extractWatermarkQIM(watermarkedImageData) {
    const watermarkedImageWidth = watermarkedImageData.width;
    const watermarkedImageHeight = watermarkedImageData.height;

    const watermarkedImagePixels = watermarkedImageData.data;

    const watermarkImageData = new ImageData(watermarkedImageWidth, watermarkedImageHeight);
    const watermarkPixels = watermarkImageData.data;

    const qStep = 10; // Kuantisasi langkah (quantum step)

    let watermarkX = 0;
    let watermarkY = 0;

    for (let y = 0; y < watermarkedImageHeight; y++) {
        for (let x = 0; x < watermarkedImageWidth; x++) {
            const pixelIndex = (y * watermarkedImageWidth + x) * 4;

            const pixelValue = watermarkedImagePixels[pixelIndex];
            const watermarkBit = Math.floor((pixelValue + qStep / 2) / qStep) % 2;

            const watermarkPixelIndex = ((watermarkY * watermarkedImageWidth) + watermarkX) * 4;
            watermarkPixels[watermarkPixelIndex] = watermarkBit * 255; // Set nilai piksel watermark ke 0 atau 255
            watermarkPixels[watermarkPixelIndex + 1] = watermarkBit * 255;
            watermarkPixels[watermarkPixelIndex + 2] = watermarkBit * 255;
            watermarkPixels[watermarkPixelIndex + 3] = 255; // Nilai alpha (opasitas) diatur ke 255 (tidak tembus pandang)

            watermarkX = (watermarkX + 1) % watermarkedImageWidth;
            if (watermarkX === 0) {
                watermarkY = (watermarkY + 1) % watermarkedImageHeight;
            }
        }
    }
    return watermarkImageData;
}

// Fungsi untuk mengekstrak watermark
async function extractWatermark() {
    const watermarkedImageFile = document.getElementById('watermarked-image').files[0];

    if (!watermarkedImageFile) {
        alert('Harap pilih gambar yang sudah diterapkan watermark.');
        return;
    }

    const loadingElement = document.getElementById('loading');
    loadingElement.style.display = 'block'; // Tampilkan indikator proses sedang berjalan

    const watermarkedImageData = await readImageFile(watermarkedImageFile);

    const watermarkedImage = new Image();
    watermarkedImage.src = watermarkedImageData;

    watermarkedImage.onload = () => {
        const watermarkedImageCanvas = document.createElement('canvas');

        watermarkedImageCanvas.width = watermarkedImage.width;
        watermarkedImageCanvas.height = watermarkedImage.height;
        const watermarkedImageContext = watermarkedImageCanvas.getContext('2d');
        watermarkedImageContext.drawImage(watermarkedImage, 0, 0);

        const watermarkedImageData = watermarkedImageContext.getImageData(0, 0, watermarkedImage.width, watermarkedImage.height);

        const watermarkCanvas = document.getElementById('watermark-canvas');
        const watermarkContext = watermarkCanvas.getContext('2d');

        const watermarkImageData = extractWatermarkQIM(watermarkedImageData);

        // Skala kontras watermark untuk membuatnya lebih jelas
        const MAX_VALUE = 500;
        const watermarkPixels = watermarkImageData.data;
        for (let i = 0; i < watermarkPixels.length; i += 4) {
            watermarkPixels[i] = watermarkPixels[i] === 0 ? 0 : MAX_VALUE;
            watermarkPixels[i + 1] = watermarkPixels[i + 1] === 0 ? 0 : MAX_VALUE;
            watermarkPixels[i + 2] = watermarkPixels[i + 2] === 0 ? 0 : MAX_VALUE;
        }

        watermarkCanvas.width = watermarkedImage.width;
        watermarkCanvas.height = watermarkedImage.height;
        watermarkContext.putImageData(watermarkImageData, 0, 0);

        loadingElement.style.display = 'none'; // Sembunyikan indikator proses sedang berjalan
    };
}

// Event listener untuk tombol "Ekstrak Watermark"
document.getElementById('extract-watermark').addEventListener('click', extractWatermark);