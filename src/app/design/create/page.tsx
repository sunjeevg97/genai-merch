/**
 * Design Studio - Main Page
 *
 * The primary design creation interface where users can:
 * - Upload logos
 * - Position and customize designs on mockups
 * - Preview final products
 * - Save designs to the database
 */

'use client';

import { useState } from 'react';
import { FileUpload } from '@/components/design/FileUpload';

export default function CreateDesignPage() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);

  const handleFileSelected = (file: File) => {
    console.log('File selected:', file.name, file.size, file.type);
    setUploadedFile(file);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <h1 className="text-3xl font-bold mb-8">Create Design</h1>

        {/* Design Studio Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left Sidebar - Upload & Controls */}
          <div className="space-y-4">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Upload Logo</h2>
              <FileUpload onFileSelected={handleFileSelected} />
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Product</h2>
              {/* ProductSelector component will go here */}
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Design Controls</h2>
              {/* DesignControls component will go here */}
            </div>
          </div>

          {/* Center - Design Canvas */}
          <div className="lg:col-span-2">
            <div className="bg-card rounded-lg border p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Design Canvas</h2>
                <div className="flex gap-2">
                  {/* Toolbar buttons will go here */}
                </div>
              </div>
              {/* DesignCanvas component will go here */}
            </div>

            <div className="mt-4 bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Preview</h2>
              {/* MockupPreview component will go here */}
            </div>

            <div className="mt-4 bg-card rounded-lg border p-6">
              <h2 className="text-xl font-semibold mb-4">Validation</h2>
              {/* ValidationPanel component will go here */}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
