
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ImageKitUploadResponse {
  success: boolean;
  url?: string;
  thumbnailUrl?: string;
  fileId?: string;
  size?: number;
  width?: number;
  height?: number;
  error?: string;
}

serve(async (req) => {
  console.log('🚀 ImageKit upload function called')
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Check if ImageKit configuration exists
    const imagekitPublicKey = Deno.env.get('IMAGEKIT_PUBLIC_KEY')
    const imagekitPrivateKey = Deno.env.get('IMAGEKIT_PRIVATE_KEY')
    const imagekitUrlEndpoint = Deno.env.get('IMAGEKIT_URL_ENDPOINT')

    console.log('🔍 Checking ImageKit configuration...')
    console.log('Public Key exists:', !!imagekitPublicKey)
    console.log('Private Key exists:', !!imagekitPrivateKey)
    console.log('URL Endpoint exists:', !!imagekitUrlEndpoint)

    if (!imagekitPublicKey || !imagekitPrivateKey || !imagekitUrlEndpoint) {
      console.error('❌ Missing ImageKit configuration')
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'ImageKit not configured. Please add IMAGEKIT_PUBLIC_KEY, IMAGEKIT_PRIVATE_KEY, and IMAGEKIT_URL_ENDPOINT to your Supabase secrets.' 
        }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const formData = await req.formData()
    const file = formData.get('file') as File
    const vehicleId = formData.get('vehicleId') as string
    const isMainImage = formData.get('isMainImage') === 'true'
    const sortOrder = parseInt(formData.get('sortOrder') as string) || 0

    if (!file) {
      console.error('❌ No file provided')
      return new Response(
        JSON.stringify({ success: false, error: 'No file provided' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    console.log(`📤 Processing ${file.name} (${file.size} bytes)`)

    // Convert file to base64 using a more efficient method
    const arrayBuffer = await file.arrayBuffer()
    const uint8Array = new Uint8Array(arrayBuffer)
    
    // Convert to base64 using btoa with chunking to avoid stack overflow
    const chunkSize = 8192
    let base64 = ''
    
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      const chunk = uint8Array.slice(i, i + chunkSize)
      const binaryString = Array.from(chunk, byte => String.fromCharCode(byte)).join('')
      base64 += btoa(binaryString)
    }

    // Generate unique filename
    const timestamp = Date.now()
    const fileExtension = file.name.split('.').pop()
    const fileName = `vehicle-${vehicleId}-${timestamp}-${sortOrder}.${fileExtension}`

    console.log(`🏷️ Generated filename: ${fileName}`)

    // ImageKit upload
    const uploadData = {
      file: base64,
      fileName: fileName,
      folder: '/vehicles',
      useUniqueFileName: false,
      tags: [`vehicle-${vehicleId}`, isMainImage ? 'main' : 'secondary'],
    }

    console.log('🚀 Uploading to ImageKit...')

    const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${btoa(imagekitPrivateKey + ':')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(uploadData),
    })

    console.log(`📡 ImageKit response status: ${response.status}`)

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ ImageKit upload failed:', errorText)
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: `ImageKit upload failed: ${response.status} - ${errorText}` 
        }),
        { 
          status: response.status, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      )
    }

    const result = await response.json()
    console.log('✅ ImageKit upload successful:', result.fileId)

    const responseData: ImageKitUploadResponse = {
      success: true,
      url: result.url,
      thumbnailUrl: result.thumbnailUrl,
      fileId: result.fileId,
      size: result.size,
      width: result.width,
      height: result.height,
    }

    return new Response(
      JSON.stringify(responseData),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error) {
    console.error('❌ Unexpected error:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: `Unexpected error: ${error.message}` 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})
