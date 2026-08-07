import React, { useState } from 'react';
import { Upload, X, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

interface AvatarUploaderProps {
  currentAvatar?: string;
  onUpload: (base64: string) => void;
  onRemove: () => void;
}

export default function AvatarUploader({ currentAvatar, onUpload, onRemove }: AvatarUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentAvatar || null);

  const processFile = (file: File) => {
    if (!file) return;

    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      toast.error('Only JPG, PNG or WEBP formats are supported');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onUpload(base64String);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  return (
    <div className="rounded-3xl border border-slate-200/60 dark:border-white/5 bg-white dark:bg-night-900 p-6 shadow-lg space-y-4">
      <h3 className="text-base font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
        <Camera className="h-5 w-5 text-blue-500" /> Avatar Image
      </h3>

      <div className="flex flex-col md:flex-row items-center gap-6">
        <div className="relative h-28 w-28 rounded-3xl bg-slate-100 dark:bg-night-850 border border-slate-200 dark:border-white/10 flex items-center justify-center overflow-hidden">
          {preview ? (
            <img src={preview} alt="Preview" className="h-full w-full object-cover" />
          ) : (
            <Upload className="h-8 w-8 text-slate-400" />
          )}
        </div>

        <div 
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          className={`flex-1 w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
            dragActive 
              ? 'border-blue-500 bg-blue-500/5' 
              : 'border-slate-200 dark:border-white/10 hover:border-slate-350 dark:hover:border-white/20'
          }`}
        >
          <input 
            type="file" 
            id="avatar-input" 
            className="hidden" 
            accept="image/jpeg,image/png,image/webp" 
            onChange={handleChange}
          />
          <label htmlFor="avatar-input" className="cursor-pointer space-y-1 block">
            <p className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Drag & drop your file here, or <span className="text-blue-650 dark:text-cyan-400 hover:underline">browse</span>
            </p>
            <p className="text-xs text-slate-450 dark:text-slate-500">
              Supports JPG, PNG or WEBP up to 5MB.
            </p>
          </label>
        </div>
      </div>

      {preview && (
        <div className="flex justify-end">
          <button
            onClick={() => {
              setPreview(null);
              onRemove();
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-red-200 dark:border-red-500/20 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors"
          >
            <X className="h-3.5 w-3.5" /> Remove Photo
          </button>
        </div>
      )}
    </div>
  );
}
