
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.8';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ImageKitUploadResponse {
  fileId: string;
  name: string;
  url: string;
  thumbnailUrl: string;
  height: number;
  width: number;
  size: number;
  filePath: string;
  tags?: string[];
  isPrivateFile: boolean;
  customCoordinates: string | null;
  fileType: string;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const imagekitPrivateKey = Deno.env.get('IMAGEKIT_PRIVATE_KEY');
    const imagekitPublicKey = 'public_X11SgFx2nWjB4PHnOv4H8jMA3fY=';
    const imagekitEndpoint = 'https://ik.imagekit.io/trucksandmachinery';

    if (!imagekitPrivateKey) {
      throw new Error('ImageKit private key not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const vehicleId = formData.get('vehicleId') as string;
    const isMainImage = formData.get('isMainImage') === 'true';
    const sortOrder = formData.get('sortOrder') as string;

    if (!file) {
      throw new Error('No file provided');
    }

    console.log(`📤 Uploading to ImageKit: ${file.name} (${file.size} bytes)`);

    // Create form data for ImageKit
    const imagekitFormData = new FormData();
    imagekitFormData.append('file', file);
    
    // Set folder and filename based on vehicle and image type
    const folder = `/vehicles/${vehicleId}`;
    const fileName = isMainImage ? 'main' : `image-${sortOrder || Date.now()}`;
    
    imagekitFormData.append('fileName', fileName);
    imagekitFormData.append('folder', folder);
    
    // Add tags for better organization
    const tags = ['vehicle', vehicleId];
    if (isMainImage) tags.push('main');
    imagekitFormData.append('tags', tags.join(','));

    // Set transformation for automatic optimization
    imagekitFormData.append('transformation', JSON.stringify({
      pre: 'l-text,i-Powered by ImageKit,fs-16,l-end',
      post: [
        {
          type: 'transformation',
          value: 'w-1280,h-1280,c-at_max,f-webp,q-80'
        }
      ]
    }));

    // Create basic auth header
    const auth = btoa(`${imagekitPrivateKey}:`);

    // Upload to ImageKit
    const uploadResponse = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
      },
      body: imagekitFormData
    });

    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      console.error('ImageKit upload error:', errorText);
      throw new Error(`ImageKit upload failed: ${uploadResponse.status}`);
    }

    const uploadResult: ImageKitUploadResponse = await uploadResponse.json();
    
    console.log(`✅ ImageKit upload successful: ${uploadResult.url}`);

    // Update vehicle record in Supabase if this is the main image
    if (isMainImage && vehicleId) {
      const supabase = createClient(
        'https://fwwizgcjpytcutgkzfed.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d2l6Z2NqcHl0Y3V0Z2t6ZmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzIzNzcsImV4cCI6MjA2Mzk0ODM3N30.Oo9oSIf7plnPVapsZtlIBHsDyjewNootzJ0xa5cS8iI'
      );

      const { error: vehicleUpdateError } = await supabase
        .from('vehicles')
        .update({ main_image_url: uploadResult.url })
        .eq('id', vehicleId);

      if (vehicleUpdateError) {
        console.error('Error updating vehicle main image:', vehicleUpdateError);
      } else {
        console.log('✅ Vehicle main image updated in database');
      }
    }

    // Insert into vehicle_images table if not main image or if explicitly requested
    if (vehicleId && (!isMainImage || sortOrder)) {
      const supabase = createClient(
        'https://fwwizgcjpytcutgkzfed.supabase.co',
        'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZ3d2l6Z2NqcHl0Y3V0Z2t6ZmVkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDgzNzIzNzcsImV4cCI6MjA2Mzk0ODM3N30.Oo9oSIf7plnPVapsZtlIBHsDyjewNootzJ0xa5cS8iI'
      );

      const { error: dbError } = await supabase
        .from('vehicle_images')
        .insert({
          vehicle_id: vehicleId,
          image_url: uploadResult.url,
          sort_order: parseInt(sortOrder || '0')
        });

      if (dbError) {
        console.error('Error inserting image record:', dbError);
      } else {
        console.log('✅ Image record inserted in database');
      }
    }

    return new Response(JSON.stringify({
      success: true,
      url: uploadResult.url,
      thumbnailUrl: uploadResult.thumbnailUrl,
      fileId: uploadResult.fileId,
      size: uploadResult.size,
      width: uploadResult.width,
      height: uploadResult.height
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('ImageKit upload function error:', error);
    return new Response(JSON.stringify({ 
      success: false, 
      error: error.message 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
