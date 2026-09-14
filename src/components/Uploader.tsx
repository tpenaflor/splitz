"use client";

import { useState } from 'react';
import { Upload } from 'lucide-react';
import { useAppStore } from '../store/useAppStore';
import { parseGPX, parseFIT } from '../lib/parser';

export default function Uploader() {
  const [isDragging, setIsDragging] = useState(false);
  const { addActivity } = useAppStore();

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragging(true);
    } else if (e.type === "dragleave") {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        const id = Math.random().toString(36).substr(2, 9);
        const name = file.name.toLowerCase();
        let data = null;

        if (name.endsWith('.gpx')) {
          data = await parseGPX(file, id);
        } else if (name.endsWith('.fit')) {
          data = await parseFIT(file, id);
        } else {
          alert(`Unsupported file type: ${file.name}. Please upload .gpx or .fit files.`);
          continue;
        }

        if (data) {
          addActivity(data);
        }
      }
    }
  };

  return (
    <div 
      className={`w-full p-8 border-2 border-dashed rounded-lg flex flex-col items-center justify-center transition-colors ${
        isDragging ? 'border-purple-500 bg-purple-500/10' : 'border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800'
      }`}
      onDragEnter={handleDrag}
      onDragLeave={handleDrag}
      onDragOver={handleDrag}
      onDrop={handleDrop}
    >
      <Upload className="w-12 h-12 text-gray-400 mb-4" />
      <p className="text-gray-700 dark:text-gray-200 font-medium">Drag & drop files here</p>
      <p className="text-gray-400 text-sm mt-2">Supports .fit and .gpx files</p>
    </div>
  );
}
