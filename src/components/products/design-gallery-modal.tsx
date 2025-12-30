/**
 * Design Gallery Modal
 *
 * Browse and select from user's saved designs
 */

'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { X, Search, Loader2, ImageIcon } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import type { DesignData } from './design-preview';

interface Design {
  id: string;
  name: string;
  imageUrl: string;
  vectorUrl: string | null;
  aiPrompt: string | null;
  createdAt: string;
}

interface DesignGalleryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelectDesign: (design: DesignData) => void;
}

export function DesignGalleryModal({
  open,
  onOpenChange,
  onSelectDesign,
}: DesignGalleryModalProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedDesignId, setSelectedDesignId] = useState<string | null>(null);

  // Fetch designs when modal opens
  useEffect(() => {
    if (open) {
      fetchDesigns();
    }
  }, [open, search]);

  async function fetchDesigns() {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: '50',
        offset: '0',
      });

      if (search) {
        params.append('search', search);
      }

      const response = await fetch(`/api/designs?${params}`);

      if (!response.ok) {
        throw new Error('Failed to fetch designs');
      }

      const result = await response.json();
      setDesigns(result.data.designs);
    } catch (error) {
      console.error('Failed to fetch designs:', error);
      toast.error('Failed to load designs', {
        description: 'Please try again later',
      });
    } finally {
      setLoading(false);
    }
  }

  function handleSelectDesign(design: Design) {
    setSelectedDesignId(design.id);
    onSelectDesign({
      id: design.id,
      imageUrl: design.imageUrl,
      thumbnailUrl: design.imageUrl,
    });
    onOpenChange(false);
    toast.success('Design selected', {
      description: `"${design.name}" will be applied to this product`,
    });
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle>Select a Design</DialogTitle>
          <DialogDescription>
            Choose from your previously created designs
          </DialogDescription>
        </DialogHeader>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search designs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Design Grid */}
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
            </div>
          ) : designs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                <ImageIcon className="h-8 w-8 text-gray-400" />
              </div>
              <h3 className="mb-2 font-semibold text-gray-900">No designs found</h3>
              <p className="mb-4 text-sm text-gray-600">
                {search
                  ? 'Try a different search term'
                  : 'Create your first design to get started'}
              </p>
              {!search && (
                <Button asChild variant="default" size="sm">
                  <a href="/design/create">Create with AI</a>
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {designs.map((design) => (
                <button
                  key={design.id}
                  onClick={() => handleSelectDesign(design)}
                  className={`
                    group relative aspect-square overflow-hidden rounded-lg border-2 transition-all
                    ${
                      selectedDesignId === design.id
                        ? 'border-primary ring-2 ring-primary ring-offset-2'
                        : 'border-gray-200 hover:border-primary'
                    }
                  `}
                >
                  {/* Design Image */}
                  <Image
                    src={design.imageUrl}
                    alt={design.name}
                    fill
                    className="object-cover transition-transform group-hover:scale-105"
                  />

                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/0 to-black/0 opacity-0 transition-opacity group-hover:opacity-100" />

                  {/* Design Name */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-left opacity-0 transition-opacity group-hover:opacity-100">
                    <p className="truncate text-sm font-semibold text-white">
                      {design.name}
                    </p>
                    {design.aiPrompt && (
                      <Badge
                        variant="secondary"
                        className="mt-1 bg-white/20 text-white backdrop-blur-sm"
                      >
                        AI Generated
                      </Badge>
                    )}
                  </div>

                  {/* Selected Indicator */}
                  {selectedDesignId === design.id && (
                    <div className="absolute right-2 top-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary">
                        <svg
                          className="h-4 w-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="flex items-center justify-between border-t pt-4">
          <p className="text-sm text-gray-600">
            {designs.length} design{designs.length !== 1 ? 's' : ''} available
          </p>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
