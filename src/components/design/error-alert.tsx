'use client';

import { AlertCircle, Info, XCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState } from 'react';

interface ErrorAlertProps {
  title: string;
  message: string;
  errorType: string;
  canRetry?: boolean;
  onRetry?: () => void;
  technicalDetails?: string;
}

export function ErrorAlert({ title, message, errorType, canRetry, onRetry, technicalDetails }: ErrorAlertProps) {
  const [showTechnical, setShowTechnical] = useState(false);

  const Icon =
    errorType === 'CONFIGURATION_ERROR' ? XCircle :
    errorType === 'CONTENT_POLICY' ? AlertTriangle :
    errorType === 'PARTIAL_SUCCESS' ? Info :
    AlertCircle;

  const variant = errorType === 'CONFIGURATION_ERROR' ? 'destructive' : 'default';

  return (
    <Alert variant={variant}>
      <Icon className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="mt-2">
        <p className="mb-3">{message}</p>

        <div className="flex gap-2">
          {canRetry && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
          {!canRetry && (
            <Button variant="outline" size="sm" asChild>
              <a href="mailto:support@genai-merch.com">Contact Support</a>
            </Button>
          )}
        </div>

        {technicalDetails && (
          <Collapsible open={showTechnical} onOpenChange={setShowTechnical} className="mt-4">
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="p-0 h-auto">
                {showTechnical ? 'Hide' : 'Show'} Technical Details
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-2">
              <pre className="text-xs bg-muted p-3 rounded overflow-x-auto">
                {technicalDetails}
              </pre>
            </CollapsibleContent>
          </Collapsible>
        )}
      </AlertDescription>
    </Alert>
  );
}
