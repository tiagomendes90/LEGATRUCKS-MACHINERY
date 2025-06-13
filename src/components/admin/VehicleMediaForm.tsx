
import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Star, Upload, X } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VehicleMedia {
  coverImage: string;
  images: string[];
  videos: string[];
}

interface VehicleMediaFormProps {
  vehicleMedia: VehicleMedia;
  setVehicleMedia: React.Dispatch<React.SetStateAction<VehicleMedia>>;
}

const VehicleMediaForm = ({ vehicleMedia, setVehicleMedia }: VehicleMediaFormProps) => {
  const { toast } = useToast();

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = error => reject(error);
    });
  };

  const handleFileUpload = async (files: FileList | null, type: 'image' | 'video') => {
    if (!files) return;
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      if (type === 'image' && !file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select image files only.",
          variant: "destructive",
        });
        continue;
      }
      
      if (type === 'video' && !file.type.startsWith('video/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select video files only.",
          variant: "destructive",
        });
        continue;
      }

      if (type === 'image' && vehicleMedia.images.length >= 25) {
        toast({
          title: "Image Limit Reached",
          description: "Maximum of 25 images allowed.",
          variant: "destructive",
        });
        break;
      }

      if (type === 'video' && vehicleMedia.videos.length >= 3) {
        toast({
          title: "Video Limit Reached",
          description: "Maximum of 3 videos allowed.",
          variant: "destructive",
        });
        break;
      }

      try {
        const base64 = await convertFileToBase64(file);
        
        if (type === 'image') {
          if (!vehicleMedia.coverImage) {
            setVehicleMedia(prev => ({
              ...prev,
              coverImage: base64
            }));
          } else {
            setVehicleMedia(prev => ({
              ...prev,
              images: [...prev.images, base64]
            }));
          }
        } else {
          setVehicleMedia(prev => ({
            ...prev,
            videos: [...prev.videos, base64]
          }));
        }
      } catch (error) {
        toast({
          title: "Upload Error",
          description: "Failed to process file. Please try again.",
          variant: "destructive",
        });
      }
    }
  };

  const handleSetCoverImage = (imageUrl: string) => {
    setVehicleMedia(prev => ({
      ...prev,
      coverImage: imageUrl
    }));
  };

  const handleAddImage = (imageUrl: string) => {
    if (vehicleMedia.images.length >= 25) {
      toast({
        title: "Image Limit Reached",
        description: "Maximum of 25 additional images allowed.",
        variant: "destructive",
      });
      return;
    }
    setVehicleMedia(prev => ({
      ...prev,
      images: [...prev.images, imageUrl]
    }));
  };

  const handleRemoveImage = (index: number) => {
    setVehicleMedia(prev => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddVideo = (videoUrl: string) => {
    if (vehicleMedia.videos.length >= 3) {
      toast({
        title: "Video Limit Reached",
        description: "Maximum of 3 videos allowed.",
        variant: "destructive",
      });
      return;
    }
    setVehicleMedia(prev => ({
      ...prev,
      videos: [...prev.videos, videoUrl]
    }));
  };

  const handleRemoveVideo = (index: number) => {
    setVehicleMedia(prev => ({
      ...prev,
      videos: prev.videos.filter((_, i) => i !== index)
    }));
  };

  return (
    <>
      {/* Cover Image Section */}
      <div>
        <Label className="text-base font-medium flex items-center gap-2">
          <Star className="h-4 w-4 text-yellow-500" />
          Cover Image *
        </Label>
        <div className="mt-2 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter cover image URL"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    handleSetCoverImage(input.value.trim());
                    input.value = '';
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.querySelector(`input[placeholder="Enter cover image URL"]`) as HTMLInputElement;
                if (input?.value.trim()) {
                  handleSetCoverImage(input.value.trim());
                  input.value = '';
                }
              }}
            >
              <Star className="h-4 w-4 mr-2" />
              Set Cover
            </Button>
          </div>
          <div>
            <Label htmlFor="cover-file-upload" className="cursor-pointer">
              <Button type="button" variant="outline" asChild>
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Cover Image
                </span>
              </Button>
            </Label>
            <Input
              id="cover-file-upload"
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, 'image')}
            />
          </div>
          {vehicleMedia.coverImage && (
            <div className="relative inline-block">
              <img
                src={vehicleMedia.coverImage}
                alt="Cover image"
                className="w-48 h-32 object-cover rounded-lg border-2 border-yellow-500"
              />
              <Badge className="absolute top-2 left-2 bg-yellow-500">Cover</Badge>
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="absolute top-2 right-2"
                onClick={() => setVehicleMedia(prev => ({ ...prev, coverImage: "" }))}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* Additional Photos Section */}
      <div>
        <Label className="text-base font-medium">Additional Photos ({vehicleMedia.images.length}/25)</Label>
        <div className="mt-2 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter photo URL"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    handleAddImage(input.value.trim());
                    input.value = '';
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.querySelector(`input[placeholder="Enter photo URL"]`) as HTMLInputElement;
                if (input?.value.trim()) {
                  handleAddImage(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={vehicleMedia.images.length >= 25}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Photo
            </Button>
          </div>
          <div>
            <Label htmlFor="photos-file-upload" className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline" 
                asChild
                disabled={vehicleMedia.images.length >= 25}
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Photos
                </span>
              </Button>
            </Label>
            <Input
              id="photos-file-upload"
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, 'image')}
            />
          </div>
          {vehicleMedia.images.length > 0 && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {vehicleMedia.images.map((photo, index) => (
                <div key={index} className="relative group">
                  <img
                    src={photo}
                    alt={`Vehicle photo ${index + 1}`}
                    className="w-full h-24 object-cover rounded-lg border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => handleRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Video Section */}
      <div>
        <Label className="text-base font-medium">Vehicle Videos ({vehicleMedia.videos.length}/3)</Label>
        <div className="mt-2 space-y-4">
          <div className="flex gap-2">
            <Input
              placeholder="Enter video URL (YouTube, Vimeo, etc.)"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  const input = e.target as HTMLInputElement;
                  if (input.value.trim()) {
                    handleAddVideo(input.value.trim());
                    input.value = '';
                  }
                }
              }}
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                const input = document.querySelector(`input[placeholder="Enter video URL (YouTube, Vimeo, etc.)"]`) as HTMLInputElement;
                if (input?.value.trim()) {
                  handleAddVideo(input.value.trim());
                  input.value = '';
                }
              }}
              disabled={vehicleMedia.videos.length >= 3}
            >
              <Upload className="h-4 w-4 mr-2" />
              Add Video
            </Button>
          </div>
          <div>
            <Label htmlFor="videos-file-upload" className="cursor-pointer">
              <Button 
                type="button" 
                variant="outline" 
                asChild
                disabled={vehicleMedia.videos.length >= 3}
              >
                <span>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Videos
                </span>
              </Button>
            </Label>
            <Input
              id="videos-file-upload"
              type="file"
              accept="video/*"
              multiple
              className="hidden"
              onChange={(e) => handleFileUpload(e.target.files, 'video')}
            />
          </div>
          {vehicleMedia.videos.length > 0 && (
            <div className="space-y-2">
              {vehicleMedia.videos.map((video, index) => (
                <div key={index} className="relative group p-4 border rounded-lg">
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-gray-600 truncate mr-4">
                      Video {index + 1}: {video.length > 50 ? video.substring(0, 50) + '...' : video}
                    </p>
                    <Button
                      type="button"
                      variant="destructive"
                      size="sm"
                      onClick={() => handleRemoveVideo(index)}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default VehicleMediaForm;
