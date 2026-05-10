/**
 * Formatted Description Component
 *
 * Processes product descriptions from Printful API and renders them
 * with proper formatting for bullet points, newlines, and paragraphs.
 */

'use client';

import { cn } from '@/lib/utils';

interface FormattedDescriptionProps {
  description: string;
  className?: string;
}

/**
 * Detect if a line is a bullet point
 * Supports: -, •, *, ▪, ▸, ►, →
 */
function isBulletLine(line: string): boolean {
  const trimmed = line.trim();
  return /^[-•*▪▸►→]\s+/.test(trimmed);
}

/**
 * Extract bullet content (remove the bullet character)
 */
function extractBulletContent(line: string): string {
  return line.trim().replace(/^[-•*▪▸►→]\s+/, '');
}

/**
 * Parse description into structured content blocks
 */
function parseDescription(description: string): Array<{
  type: 'paragraph' | 'bullet-list';
  content: string[];
}> {
  const lines = description.split(/\n/).filter((line) => line.trim() !== '');
  const blocks: Array<{ type: 'paragraph' | 'bullet-list'; content: string[] }> = [];

  let currentBullets: string[] = [];
  let currentParagraph: string[] = [];

  const flushParagraph = () => {
    if (currentParagraph.length > 0) {
      blocks.push({ type: 'paragraph', content: [...currentParagraph] });
      currentParagraph = [];
    }
  };

  const flushBullets = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: 'bullet-list', content: [...currentBullets] });
      currentBullets = [];
    }
  };

  for (const line of lines) {
    if (isBulletLine(line)) {
      // Flush any pending paragraph before starting bullets
      flushParagraph();
      currentBullets.push(extractBulletContent(line));
    } else {
      // Flush any pending bullets before adding to paragraph
      flushBullets();
      currentParagraph.push(line.trim());
    }
  }

  // Flush remaining content
  flushParagraph();
  flushBullets();

  return blocks;
}

export function FormattedDescription({ description, className }: FormattedDescriptionProps) {
  const blocks = parseDescription(description);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className={cn('space-y-4', className)}>
      {blocks.map((block, index) => {
        if (block.type === 'paragraph') {
          return (
            <p
              key={index}
              className="text-base leading-relaxed text-muted-foreground lg:text-lg"
            >
              {block.content.join(' ')}
            </p>
          );
        }

        if (block.type === 'bullet-list') {
          return (
            <ul
              key={index}
              className="space-y-2 text-base text-muted-foreground lg:text-lg"
            >
              {block.content.map((item, itemIndex) => (
                <li
                  key={itemIndex}
                  className="flex items-start gap-3"
                >
                  <span className="mt-2 h-1.5 w-1.5 flex-shrink-0 rounded-full bg-primary/60" />
                  <span className="leading-relaxed">{item}</span>
                </li>
              ))}
            </ul>
          );
        }

        return null;
      })}
    </div>
  );
}
