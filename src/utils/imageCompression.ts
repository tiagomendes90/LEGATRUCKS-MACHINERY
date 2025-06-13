
// Utility for automatic image compression
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1200,
  maxHeight: 800,
  quality: 0.8,
  maxSizeKB: 500
};

export const compressImage = async (
  file: File | string, 
  options: CompressionOptions = {}
): Promise<string> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  try {
    // If it's already a base64 string (URL), convert back to process
    let imageFile: File;
    
    if (typeof file === 'string') {
      // If it's a URL, fetch and convert to blob
      if (file.startsWith('http')) {
        const response = await fetch(file);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: blob.type });
      } else {
        // If it's base64, convert to blob
        const base64Data = file.split(',')[1];
        const mimeType = file.split(';')[0].split(':')[1];
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: mimeType });
        imageFile = new File([blob], 'image.jpg', { type: mimeType });
      }
    } else {
      imageFile = file;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      img.onload = () => {
        // Calculate new dimensions
        let { width, height } = img;
        
        // Resize if too large
        if (opts.maxWidth && width > opts.maxWidth) {
          height = (height * opts.maxWidth) / width;
          width = opts.maxWidth;
        }
        
        if (opts.maxHeight && height > opts.maxHeight) {
          width = (width * opts.maxHeight) / height;
          height = opts.maxHeight;
        }

        canvas.width = width;
        canvas.height = height;

        // Draw and compress
        if (ctx) {
          ctx.fillStyle = '#FFFFFF';
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Try different quality levels to meet size requirement
          let quality = opts.quality || 0.8;
          let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
          
          // Check size and reduce quality if needed
          const sizeKB = (compressedDataUrl.length * 0.75) / 1024; // Approximate size
          
          if (opts.maxSizeKB && sizeKB > opts.maxSizeKB && quality > 0.1) {
            // Reduce quality to meet size requirement
            const targetQuality = Math.max(0.1, quality * (opts.maxSizeKB / sizeKB));
            compressedDataUrl = canvas.toDataURL('image/jpeg', targetQuality);
          }
          
          resolve(compressedDataUrl);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      
      // Create object URL for file
      const objectUrl = URL.createObjectURL(imageFile);
      img.src = objectUrl;
      
      // Clean up object URL after loading
      img.onload = (...args) => {
        URL.revokeObjectURL(objectUrl);
        (img.onload as any)(...args);
      };
    });
  } catch (error) {
    console.error('Error compressing image:', error);
    throw error;
  }
};

export const compressMultipleImages = async (
  images: (File | string)[],
  options?: CompressionOptions
): Promise<string[]> => {
  const compressionPromises = images.map(image => compressImage(image, options));
  return Promise.all(compressionPromises);
};

export const getImageSizeKB = (base64String: string): number => {
  return (base64String.length * 0.75) / 1024;
};
