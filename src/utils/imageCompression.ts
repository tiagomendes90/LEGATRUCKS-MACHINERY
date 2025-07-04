
// Utility for automatic image compression with WebP conversion
export interface CompressionOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeKB?: number;
  format?: 'webp' | 'jpeg' | 'png';
}

const DEFAULT_OPTIONS: CompressionOptions = {
  maxWidth: 1280,
  maxHeight: 1280,
  quality: 0.8,
  maxSizeKB: 1024, // 1MB
  format: 'webp'
};

export const compressImage = async (
  file: File, 
  options: CompressionOptions = {}
): Promise<File> => {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      try {
        // Calculate new dimensions maintaining aspect ratio
        let { width, height } = img;
        
        if (width > opts.maxWidth! || height > opts.maxHeight!) {
          const aspectRatio = width / height;
          
          if (width > height) {
            width = opts.maxWidth!;
            height = width / aspectRatio;
          } else {
            height = opts.maxHeight!;
            width = height * aspectRatio;
          }
        }

        canvas.width = width;
        canvas.height = height;

        if (ctx) {
          // Enable high-quality image rendering
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          // Draw the resized image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to WebP with progressive quality reduction if needed
          let quality = opts.quality!;
          
          const tryCompress = (currentQuality: number): void => {
            canvas.toBlob(
              (blob) => {
                if (!blob) {
                  reject(new Error('Failed to compress image'));
                  return;
                }

                const sizeKB = blob.size / 1024;
                
                // If size is acceptable or we've reached minimum quality, create final file
                if (sizeKB <= opts.maxSizeKB! || currentQuality <= 0.3) {
                  const compressedFile = new File(
                    [blob], 
                    `${file.name.split('.')[0]}.webp`, 
                    { 
                      type: 'image/webp',
                      lastModified: Date.now()
                    }
                  );
                  resolve(compressedFile);
                } else {
                  // Reduce quality and try again
                  tryCompress(Math.max(0.3, currentQuality - 0.1));
                }
              },
              `image/${opts.format}`,
              currentQuality
            );
          };

          tryCompress(quality);
        } else {
          reject(new Error('Could not get canvas context'));
        }
      } catch (error) {
        reject(error);
      }
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    // Create object URL for the file
    const objectUrl = URL.createObjectURL(file);
    img.src = objectUrl;
    
    // Clean up object URL after loading
    img.onload = (event) => {
      URL.revokeObjectURL(objectUrl);
      // Call the original onload handler
      if (event.target) {
        const originalHandler = img.onload;
        img.onload = null;
        if (typeof originalHandler === 'function') {
          originalHandler.call(img, event);
        }
      }
    };
  });
};

export const compressMultipleImages = async (
  files: File[],
  options?: CompressionOptions
): Promise<File[]> => {
  const compressedFiles: File[] = [];
  
  // Process images sequentially to avoid overwhelming the browser
  for (const file of files) {
    try {
      const compressedFile = await compressImage(file, options);
      compressedFiles.push(compressedFile);
    } catch (error) {
      console.error(`Error compressing ${file.name}:`, error);
      // In case of error, use original file as fallback
      compressedFiles.push(file);
    }
  }
  
  return compressedFiles;
};

export const getImageSizeKB = (file: File): number => {
  return file.size / 1024;
};
