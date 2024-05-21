// Fungsi untuk membaca file gambar
function readImageFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

// Fungsi untuk mengembedkan watermark ke dalam gambar cover menggunakan algoritma QIM
// embedWatermarkQIM
function embedWatermarkQIM(coverImageData, watermarkImageData) {
    const coverImageWidth = coverImageData.width;
    const coverImageHeight = coverImageData.height;
    const watermarkImageWidth = watermarkImageData.width;
    const watermarkImageHeight = watermarkImageData.height;

    const coverImagePixels = coverImageData.data;
    const watermarkImagePixels = watermarkImageData.data;

    const resultImageData = new ImageData(coverImageWidth, coverImageHeight);
    const resultPixels = resultImageData.data;

    const qStep = 10; // Kuantisasi langkah (quantum step)
    const coverAlpha = 255; // Nilai alpha (opasitas) untuk gambar cover
    const watermarkAlpha = 1000; // Nilai alpha (opasitas) untuk watermark pada gambar hasil

    let watermarkX = 0;
    let watermarkY = 0;

    for (let y = 0; y < coverImageHeight; y++) {
        for (let x = 0; x < coverImageWidth; x++) {
            const coverPixelIndex = (y * coverImageWidth + x) * 4;
            const watermarkPixelIndex = ((watermarkY * watermarkImageWidth) + watermarkX) * 4;

            const coverPixelValue = coverImagePixels[coverPixelIndex];
            const watermarkBit = (watermarkImagePixels[watermarkPixelIndex] > 128) ? 1 : 0;

            const newPixelValue = Math.floor((coverPixelValue + watermarkBit * qStep) / (2 * qStep)) * (2 * qStep) + watermarkBit * qStep;

            resultPixels[coverPixelIndex] = newPixelValue;
            resultPixels[coverPixelIndex + 1] = coverImagePixels[coverPixelIndex + 1];
            resultPixels[coverPixelIndex + 2] = coverImagePixels[coverPixelIndex + 2];
            resultPixels[coverPixelIndex + 3] = coverAlpha; // Set nilai alpha (opasitas) untuk gambar cover

            // Menangani watermark
            if (watermarkBit === 1) {
                resultPixels[coverPixelIndex + 3] = watermarkAlpha; // Set nilai alpha (opasitas) untuk watermark
            }

            watermarkX = (watermarkX + 1) % watermarkImageWidth;
            if (watermarkX === 0) {
                watermarkY = (watermarkY + 1) % watermarkImageHeight;
            }
        }
    }

    return resultImageData;
}
    
    // Fungsi untuk mengembedkan watermark ke dalam gambar cover
    async function embedWatermark() {
        const coverImageFile = document.getElementById('cover-image').files[0];
        const watermarkImageFile = document.getElementById('watermark-image').files[0];
    
        if (!coverImageFile || !watermarkImageFile) {
            alert('Harap pilih gambar cover dan watermark.');
            return;
        }
    
        const loadingElement = document.getElementById('loading');
        loadingElement.style.display = 'block'; // Tampilkan indikator proses sedang berjalan
    
        const coverImageData = await readImageFile(coverImageFile);
        const watermarkImageData = await readImageFile(watermarkImageFile);
    
        const coverImage = new Image();
        const watermarkImage = new Image();
    
        coverImage.src = coverImageData;
        watermarkImage.src = watermarkImageData;
    
        coverImage.onload = () => {
            watermarkImage.onload = () => {
                const coverImageCanvas = document.createElement('canvas');
                const watermarkImageCanvas = document.createElement('canvas');
    
                coverImageCanvas.width = coverImage.width;
                coverImageCanvas.height = coverImage.height;
                const coverImageContext = coverImageCanvas.getContext('2d');
                coverImageContext.drawImage(coverImage, 0, 0);
    
                watermarkImageCanvas.width = watermarkImage.width;
                watermarkImageCanvas.height = watermarkImage.height;
                const watermarkImageContext = watermarkImageCanvas.getContext('2d');
                watermarkImageContext.drawImage(watermarkImage, 0, 0);
    
                const coverImageData = coverImageContext.getImageData(0, 0, coverImage.width, coverImage.height);
                const watermarkImageData = watermarkImageContext.getImageData(0, 0, watermarkImage.width, watermarkImage.height);
    
                const resultCanvas = document.getElementById('result-canvas');
                const resultContext = resultCanvas.getContext('2d');
    
                const resultImageData = embedWatermarkQIM(coverImageData, watermarkImageData);
    
                resultCanvas.width = coverImage.width;
                resultCanvas.height = coverImage.height;
                resultContext.putImageData(resultImageData, 0, 0);
    
                loadingElement.style.display = 'none'; // Sembunyikan indikator proses sedang berjalan
    
                // Menyimpan gambar hasil embedding watermark
                const downloadLink = document.getElementById('download-link');
                resultCanvas.toBlob((blob) => {
                    const url = URL.createObjectURL(blob);
                    downloadLink.href = url;
                    downloadLink.style.display = 'inline-block';
                }, 'image/png');
            };
        };
    }
    
    // Event listener untuk tombol "Embed Watermark"
    document.getElementById('embed-watermark').addEventListener('click', embedWatermark);