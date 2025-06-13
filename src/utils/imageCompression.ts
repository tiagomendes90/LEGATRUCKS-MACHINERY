
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
    let imageFile: File;
    
    if (typeof file === 'string') {
      // If it's a URL, fetch and convert to blob
      if (file.startsWith('http')) {
        const response = await fetch(file);
        const blob = await response.blob();
        imageFile = new File([blob], 'image.jpg', { type: blob.type });
      } else if (file.startsWith('data:')) {
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
      } else {
        // If it's already a compressed base64, return as is
        return file;
      }
    } else {
      imageFile = file;
    }

    return new Promise((resolve, reject) => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();

      const handleLoad = () => {
        try {
          // Calculate new dimensions
          let { width, height } = img;
          
          // Only resize if image is larger than target
          if (opts.maxWidth && width > opts.maxWidth) {
            height = Math.round((height * opts.maxWidth) / width);
            width = opts.maxWidth;
          }
          
          if (opts.maxHeight && height > opts.maxHeight) {
            width = Math.round((width * opts.maxHeight) / height);
            height = opts.maxHeight;
          }

          canvas.width = width;
          canvas.height = height;

          if (ctx) {
            // Set white background for JPEG
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(0, 0, width, height);
            
            // Draw image with smooth scaling
            ctx.imageSmoothingEnabled = true;
            ctx.imageSmoothingQuality = 'high';
            ctx.drawImage(img, 0, 0, width, height);
            
            // Start with target quality
            let quality = opts.quality || 0.8;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Quick size check and adjustment if needed
            if (opts.maxSizeKB) {
              const sizeKB = (compressedDataUrl.length * 0.75) / 1024;
              
              if (sizeKB > opts.maxSizeKB && quality > 0.3) {
                // Reduce quality more aggressively for faster processing
                quality = Math.max(0.3, quality * 0.7);
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
              }
            }
            
            resolve(compressedDataUrl);
          } else {
            reject(new Error('Could not get canvas context'));
          }
        } catch (error) {
          reject(error);
        }
      };

      const handleError = () => {
        reject(new Error('Failed to load image'));
      };

      // Set up event listeners properly to avoid infinite recursion
      img.addEventListener('load', handleLoad, { once: true });
      img.addEventListener('error', handleError, { once: true });
      
      // Create object URL for file
      if (imageFile instanceof File) {
        const objectUrl = URL.createObjectURL(imageFile);
        img.src = objectUrl;
        
        // Clean up object URL after processing
        img.addEventListener('load', () => {
          URL.revokeObjectURL(objectUrl);
        }, { once: true });
      } else {
        img.src = file as string;
      }
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
  // Process images in smaller batches for better performance
  const batchSize = 3;
  const results: string[] = [];
  
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(image => compressImage(image, options))
    );
    results.push(...batchResults);
  }
  
  return results;
};

export const getImageSizeKB = (base64String: string): number => {
  return (base64String.length * 0.75) / 1024;
};
