import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Image } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ImageUpload({ files, onChange, maxFiles = 5, label = 'Upload Images' }) {
  const [previews, setPreviews] = useState([]);

  const onDrop = useCallback((acceptedFiles) => {
    const newFiles = [...files, ...acceptedFiles].slice(0, maxFiles);
    onChange(newFiles);

    const newPreviews = acceptedFiles.map(file => ({
      file,
      url: URL.createObjectURL(file),
      id: Math.random().toString(36).substr(2, 9),
    }));
    setPreviews(prev => [...prev, ...newPreviews].slice(0, maxFiles));
  }, [files, onChange, maxFiles]);

  const removeFile = (index) => {
    const newFiles = files.filter((_, i) => i !== index);
    const newPreviews = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index]?.url);
    onChange(newFiles);
    setPreviews(newPreviews);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'] },
    maxFiles: maxFiles - files.length,
    disabled: files.length >= maxFiles,
  });

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-white/70">{label}</label>

      {files.length < maxFiles && (
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
            isDragActive
              ? 'border-neon-cyan bg-neon-cyan/5'
              : 'border-white/10 hover:border-neon-cyan/40 hover:bg-white/2'
          }`}
        >
          <input {...getInputProps()} />
          <Upload size={24} className="mx-auto mb-3 text-white/30" />
          <p className="text-sm text-white/50">
            {isDragActive ? 'Drop images here...' : 'Drag & drop images, or click to select'}
          </p>
          <p className="text-xs text-white/30 mt-1">
            {files.length}/{maxFiles} images • JPEG, PNG, GIF, WebP • Max 10MB each
          </p>
        </div>
      )}

      {previews.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          <AnimatePresence>
            {previews.map((preview, index) => (
              <motion.div
                key={preview.id}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="relative group aspect-square rounded-lg overflow-hidden"
                style={{ border: '1px solid rgba(255,255,255,0.1)' }}
              >
                <img
                  src={preview.url}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
                {index === 0 && (
                  <div className="absolute bottom-1 left-1 badge-cyan text-xs">Primary</div>
                )}
                <button
                  type="button"
                  onClick={() => removeFile(index)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-500/80"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
