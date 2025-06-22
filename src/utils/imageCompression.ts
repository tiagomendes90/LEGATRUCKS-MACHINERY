// Utility for automatic image compression
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 800, // Reduced from 1200 for faster loading
  maxHeight: 600, // Reduced from 800 for faster loading
  quality: 0.7, // Reduced from 0.8 for smaller files
  maxSizeKB: 200 // Reduced from 500 for much smaller files
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
          // Calculate new dimensions with more aggressive resizing
          let { width, height } = img;
          
          // Always resize if image is larger than target
          if (width > opts.maxWidth! || height > opts.maxHeight!) {
            if (width > height) {
              height = Math.round((height * opts.maxWidth!) / width);
              width = opts.maxWidth!;
            } else {
              width = Math.round((width * opts.maxHeight!) / height);
              height = opts.maxHeight!;
            }
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
            
            // Start with more aggressive quality reduction
            let quality = opts.quality || 0.7;
            let compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
            
            // Aggressive size reduction loop
            if (opts.maxSizeKB) {
              let sizeKB = (compressedDataUrl.length * 0.75) / 1024;
              let attempts = 0;
              
              while (sizeKB > opts.maxSizeKB && quality > 0.1 && attempts < 5) {
                quality = Math.max(0.1, quality * 0.8);
                compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
                sizeKB = (compressedDataUrl.length * 0.75) / 1024;
                attempts++;
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
  const batchSize = 2; // Reduced batch size for better performance
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

// New function to compress existing database images
export const compressExistingImages = async (images: string[]): Promise<string[]> => {
  console.log('Starting compression of', images.length, 'existing images...');
  const compressedImages: string[] = [];
  
  for (let i = 0; i < images.length; i++) {
    const image = images[i];
    if (image && image.startsWith('data:')) {
      try {
        const originalSize = getImageSizeKB(image);
        const compressed = await compressImage(image, {
          maxWidth: 800,
          maxHeight: 600,
          quality: 0.7,
          maxSizeKB: 200
        });
        const compressedSize = getImageSizeKB(compressed);
        
        console.log(`Image ${i + 1}/${images.length}: ${originalSize.toFixed(1)}KB -> ${compressedSize.toFixed(1)}KB (${((1 - compressedSize/originalSize) * 100).toFixed(1)}% reduction)`);
        compressedImages.push(compressed);
      } catch (error) {
        console.error(`Failed to compress image ${i + 1}:`, error);
        // Use original image if compression fails
        compressedImages.push(image);
      }
    } else {
      // Keep non-base64 images as they are
      compressedImages.push(image);
    }
  }
  
  return compressedImages;
};
