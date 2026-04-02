/**
 * Compress an image file before uploading to Firebase Storage.
 * Uses canvas to resize and re-encode the image as WebP.
 *
 * @param {File} file - The original image file
 * @param {Object} options
 * @param {number} options.maxWidth - Max width in pixels (default: 800)
 * @param {number} options.maxHeight - Max height in pixels (default: 800)
 * @param {number} options.quality - Compression quality 0-1 (default: 0.8)
 * @returns {Promise<Blob>} Compressed image blob
 */
export function compressImage(file, { maxWidth = 800, maxHeight = 800, quality = 0.8 } = {}) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            let { width, height } = img;

            // Scale down if larger than max dimensions
            if (width > maxWidth || height > maxHeight) {
                const ratio = Math.min(maxWidth / width, maxHeight / height);
                width = Math.round(width * ratio);
                height = Math.round(height * ratio);
            }

            const canvas = document.createElement('canvas');
            canvas.width = width;
            canvas.height = height;

            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        resolve(blob);
                    } else {
                        reject(new Error('Canvas toBlob failed'));
                    }
                },
                'image/webp',
                quality
            );
        };
        img.onerror = () => reject(new Error('Image load failed'));
        img.src = URL.createObjectURL(file);
    });
}
