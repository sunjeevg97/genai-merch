/**
 * Product Selector Component
 * 
 * Gallery-style selector for choosing product mockups
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { MOCKUPS, type Mockup } from '@/lib/design/mockups';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Check } from 'lucide-react';
import Image from 'next/image';

export interface ProductSelectorProps {
  selectedMockupId: string;
  onMockupChange: (mockupId: string) => void;
}

export function ProductSelector({ selectedMockupId, onMockupChange }: ProductSelectorProps) {
  const [focusedIndex, setFocusedIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const selectedIndex = MOCKUPS.findIndex((m) => m.id === selectedMockupId);
    if (selectedIndex !== -1) {
      setFocusedIndex(selectedIndex);
    }
  }, [selectedMockupId]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      const newIndex = Math.max(0, focusedIndex - 1);
      setFocusedIndex(newIndex);
      onMockupChange(MOCKUPS[newIndex].id);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      const newIndex = Math.min(MOCKUPS.length - 1, focusedIndex + 1);
      setFocusedIndex(newIndex);
      onMockupChange(MOCKUPS[newIndex].id);
    }
  };

  const handleMockupClick = (mockup: Mockup, index: number) => {
    setFocusedIndex(index);
    onMockupChange(mockup.id);
  };

  return (
    <div className='w-full' onKeyDown={handleKeyDown} tabIndex={0}>
      <h3 className='text-sm font-semibold mb-3'>Select Product</h3>
      <ScrollArea className='w-full whitespace-nowrap rounded-lg'>
        <div className='flex gap-3 pb-4' ref={scrollRef}>
          {MOCKUPS.map((mockup, index) => {
            const isSelected = mockup.id === selectedMockupId;
            return (
              <Card
                key={mockup.id}
                className={`relative cursor-pointer transition-all hover:shadow-lg ${
                  isSelected ? 'ring-2 ring-primary shadow-lg' : 'hover:ring-1 hover:ring-muted-foreground'
                }`}
                onClick={() => handleMockupClick(mockup, index)}
                role='button'
                tabIndex={-1}
                aria-pressed={isSelected}
              >
                <div className='p-3 space-y-2' style={{ width: '150px' }}>
                  <div className='relative aspect-square bg-muted rounded-md overflow-hidden'>
                    <div className='w-full h-full flex items-center justify-center text-xs text-muted-foreground'>
                      {mockup.name}
                    </div>
                    {isSelected && (
                      <div className='absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1'>
                        <Check className='h-3 w-3' />
                      </div>
                    )}
                  </div>
                  <div className='space-y-1'>
                    <p className='text-xs font-medium truncate'>{mockup.name}</p>
                    <div className='flex items-center gap-1'>
                      <div
                        className='w-3 h-3 rounded-full border'
                        style={{
                          backgroundColor: mockup.color === 'white' ? '#fff' : mockup.color === 'black' ? '#000' : mockup.color === 'gray' ? '#6b7280' : mockup.color === 'navy' ? '#1e3a8a' : mockup.color,
                          borderColor: mockup.color === 'white' ? '#e5e7eb' : 'transparent'
                        }}
                      />
                      <span className='text-xs text-muted-foreground capitalize'>{mockup.color}</span>
                    </div>
                    <Badge variant='outline' className='text-xs capitalize'>{mockup.productType}</Badge>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
        <ScrollBar orientation='horizontal' />
      </ScrollArea>
    </div>
  );
}
