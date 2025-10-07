"use client"

import type React from "react"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Progress } from "@/components/ui/progress"
import { Upload, FileImage, AlertCircle, Info, CheckCircle } from "lucide-react"

interface UploadAreaProps {
  onFileUpload: (file: File) => void
  disabled?: boolean
  disabledMessage?: string
  isUploading?: boolean
  uploadProgress?: number
  fileName?: string
  fileSize?: string
  uploadedImage?: string | null
}

export function UploadArea({ 
  onFileUpload, 
  disabled = false,
  disabledMessage,
  isUploading = false,
  uploadProgress = 0,
  fileName = "",
  fileSize = "",
  uploadedImage = null
}: UploadAreaProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = ["image/png", "image/jpeg", "image/jpg", "image/webp"]

    if (!allowedTypes.includes(file.type)) {
      return "Please upload a PNG, JPG, or WebP image file"
    }

    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    return null
  }

  const compressImage = async (file: File): Promise<File> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.src = URL.createObjectURL(file);
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Failed to get canvas context'));
          return;
        }

        // Calculate new dimensions (max 1600px width/height)
        let width = img.width;
        let height = img.height;
        const maxDimension = 1600;

        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Failed to compress image'));
              return;
            }
            const compressedFile = new File([blob], file.name, {
              type: 'image/jpeg',
              lastModified: Date.now(),
            });
            resolve(compressedFile);
          },
          'image/jpeg',
          0.8 // compression quality
        );
      };
      img.onerror = () => reject(new Error('Failed to load image'));
    });
  };

  const handleFile = useCallback(
    async (file: File) => {
      if (disabled) return;

      const validationError = validateFile(file);
      if (validationError) {
        setError(validationError);
        return;
      }

      try {
        setError(null);
        const compressedFile = await compressImage(file);
        console.log('Original size:', (file.size / 1024 / 1024).toFixed(2) + 'MB');
        console.log('Compressed size:', (compressedFile.size / 1024 / 1024).toFixed(2) + 'MB');

        // Generate a unique file ID
        const fileId = Math.random().toString(36).substring(2) + Date.now().toString(36);

        // Convert file to base64
        const reader = new FileReader();
        reader.onload = async () => {
          const base64Data = (reader.result as string).split(',')[1]; // Remove data URL prefix
          
          // Split into 2MB chunks (to stay under Vercel's limit)
          const chunkSize = 2 * 1024 * 1024; // 2MB
          const chunks = [];
          for (let i = 0; i < base64Data.length; i += chunkSize) {
            chunks.push(base64Data.slice(i, i + chunkSize));
          }

          try {
            // Upload chunks
            for (let i = 0; i < chunks.length; i++) {
              const response = await fetch('/api/upload-chunk', {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  chunk: chunks[i],
                  chunkIndex: i,
                  totalChunks: chunks.length,
                  fileId
                })
              });

              if (!response.ok) {
                throw new Error('Chunk upload failed');
              }

              const result = await response.json();
              
              // Update progress
              const progress = Math.round(((i + 1) / chunks.length) * 100);
              if (onFileUpload) {
                onFileUpload(new File([progress.toString()], 'progress', { type: 'text/plain' }));
              }

              // If this was the last chunk and upload is complete
              if (result.pinataUrl) {
                // Create a mock File object with the Pinata URL
                const mockFile = new File(
                  [JSON.stringify({ url: result.pinataUrl })],
                  file.name,
                  { type: 'image/jpeg' } // Use image MIME type for storage compatibility
                );
                onFileUpload(mockFile);
                return;
              }
            }
          } catch (uploadError) {
            console.error('Upload failed:', uploadError);
            setError('Failed to upload image. Please try again.');
          }
        };
        
        reader.readAsDataURL(compressedFile);
      } catch (err) {
        console.error('Compression failed:', err);
        setError('Failed to process image. Please try a different file.');
      }
    },
    [onFileUpload, disabled],
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      setIsDragOver(false)

      const files = Array.from(e.dataTransfer.files)
      if (files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile],
  )

  const handleDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      if (!disabled) {
        setIsDragOver(true)
      }
    },
    [disabled],
  )

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files
      if (files && files.length > 0) {
        handleFile(files[0])
      }
    },
    [handleFile],
  )

  return (
    <div className="flex flex-col gap-4 h-full">
      <div
        className={`relative border-2 border-dashed rounded-lg py-8 px-6 sm:px-8 text-center transition-all duration-300 flex-1 flex items-center justify-center min-h-[160px] ${
          isDragOver
            ? "border-cyber-cyan bg-cyber-cyan/5 shadow-lg shadow-cyber-cyan/20"
            : "border-cyber-cyan/30 hover:border-cyber-cyan/50"
        } ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => !disabled && document.getElementById("file-input")?.click()}
      >
        <input
          id="file-input"
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFileInput}
          className="hidden"
          disabled={disabled}
        />

        <div className="space-y-4">
          <div className="w-16 h-16 bg-cyber-cyan/20 rounded-full flex items-center justify-center mx-auto">
            <Upload className="w-8 h-8 text-cyber-cyan" />
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-2 tracking-wider">
              {isDragOver ? "Drop your image here" : "Drag & drop your artwork"}
            </h3>
            <p className="text-gray-400 mb-4">or click to browse files</p>
          </div>

          <Button
            type="button"
            disabled={disabled}
            className="bg-cyber-dark border-2 border-cyber-pink text-cyber-pink hover:bg-cyber-pink/10 hover:shadow-lg hover:shadow-cyber-pink/20 tracking-wider"
            onClick={(e) => {
              e.stopPropagation()
              if (!disabled) {
                document.getElementById("file-input")?.click()
              }
            }}
          >
            <FileImage className="w-4 h-4 mr-2" />
            Choose File
          </Button>
        </div>
      </div>

      {/* File Requirements */}
      <div className="text-center text-xs text-gray-400">
        <p className="tracking-wide">
          <span className="whitespace-nowrap">PNG, JPG • Max: 10MB</span>
          <span className="mx-2 hidden sm:inline">•</span>
          <span className="block sm:inline">5:7 ratio works best</span>
        </p>
      </div>

      {/* Upload Progress */}
      {isUploading && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2 text-sm">
            <span className="text-gray-300 tracking-wide break-all">Uploading {fileName}</span>
            <span className="text-cyber-cyan tracking-wide flex-shrink-0">{uploadProgress}%</span>
          </div>
          <Progress 
            value={uploadProgress} 
            className="h-2 bg-cyber-darker [&>div]:bg-gradient-to-r [&>div]:from-cyber-cyan [&>div]:to-cyber-pink" 
          />
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <FileImage className="w-4 h-4 flex-shrink-0" />
            <span className="tracking-wide">{fileSize}</span>
          </div>
        </div>
      )}

      {/* Upload Success */}
      {uploadedImage && uploadedImage !== "/example-card_cardify.webp" && !isUploading && (
        <div className="p-4 bg-cyber-green/10 border border-cyber-green/30 rounded-lg">
          <div className="flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-cyber-green flex-shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-cyber-green font-bold tracking-wide">Upload Successful!</p>
              <p className="text-sm text-gray-300 tracking-wide break-all">
                {fileName} • {fileSize}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="p-4 bg-cyber-red/10 border border-cyber-red/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cyber-red flex-shrink-0" />
            <p className="text-cyber-red font-bold tracking-wide break-all">{error}</p>
          </div>
        </div>
      )}

      {/* Disabled Message */}
      {disabled && disabledMessage && (
        <div className="p-4 bg-cyber-orange/10 border border-cyber-orange/30 rounded-lg">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-cyber-orange flex-shrink-0" />
            <p className="text-cyber-orange font-bold tracking-wide break-all">{disabledMessage}</p>
          </div>
        </div>
      )}
    </div>
  )
}
