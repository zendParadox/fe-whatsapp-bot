"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Trash2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  userName?: string | null;
  onAvatarChange: (url: string | null) => void;
}

export default function AvatarUpload({
  currentAvatarUrl,
  userName,
  onAvatarChange,
}: AvatarUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getInitials = () => {
    if (!userName) return "?";
    const names = userName.trim().split(" ");
    if (names.length === 1) return names[0][0]?.toUpperCase() || "?";
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const handleFileSelect = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      toast.error("File harus berupa gambar");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Ukuran file maksimal 5MB");
      return;
    }

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Upload file
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const res = await fetch("/api/profile/avatar", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Gagal mengupload");
      }

      const data = await res.json();
      onAvatarChange(data.avatar_url);
      toast.success("Foto profil berhasil diperbarui");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast.error(error.message || "Gagal mengupload foto");
      setPreviewUrl(null);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    setIsUploading(true);
    try {
      const res = await fetch("/api/profile/avatar", {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error("Gagal menghapus foto");
      }

      onAvatarChange(null);
      setPreviewUrl(null);
      toast.success("Foto profil berhasil dihapus");
    } catch (err) {
      const error = err instanceof Error ? err : new Error("Unknown error");
      toast.error(error.message || "Gagal menghapus foto");
    } finally {
      setIsUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const displayUrl = previewUrl || currentAvatarUrl;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Avatar Container */}
      <div
        className={`relative group cursor-pointer transition-all duration-300 ${isDragging ? "scale-105" : ""
          }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={() => fileInputRef.current?.click()}
      >
        {/* Avatar Image or Initials */}
        <div
          className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 transition-all duration-300 ${isDragging
              ? "border-emerald-500 shadow-lg shadow-emerald-500/30"
              : "border-white dark:border-slate-700 shadow-lg"
            }`}
        >
          {displayUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={displayUrl}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-emerald-400 to-teal-600 flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-bold text-white">
                {getInitials()}
              </span>
            </div>
          )}
        </div>

        {/* Overlay on hover */}
        <div className="absolute inset-0 rounded-full bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          {isUploading ? (
            <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </div>

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFileSelect(file);
          }}
          disabled={isUploading}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          Upload
        </Button>
        {(currentAvatarUrl || previewUrl) && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDeleteAvatar}
            disabled={isUploading}
            className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Hapus
          </Button>
        )}
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-400 text-center">
        Klik atau drag gambar untuk mengupload
        <br />
        Format: JPG, PNG, WebP (maks. 5MB)
      </p>
    </div>
  );
}
