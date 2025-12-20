'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';

import { AlertCircle, CheckCircle2, Clock, Loader2, MoreVertical, Trash } from 'lucide-react';

import type { Deck } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface DeckCardProps {
  deck: Deck;
  onDelete: (id: string) => void;
  onRetry: (id: string) => void;
}

export function DeckCard({ deck, onDelete, onRetry }: DeckCardProps) {
  const params = useParams();
  const slug = params.slug as string;

  const getStatusBadge = () => {
    switch (deck.status) {
      case 'completed':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-green-500/20 bg-green-500/10 px-2.5 py-1 text-green-600 dark:text-green-500">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ready</span>
          </div>
        );
      case 'failed':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="bg-destructive/10 text-destructive border-destructive/20 inline-flex cursor-help items-center gap-1.5 rounded-full border px-2.5 py-1">
                  <AlertCircle className="h-3.5 w-3.5" />
                  <span className="text-xs font-medium">Failed</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <p className="text-sm">{deck.errorMessage}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      case 'processing':
        return (
          <div className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-2.5 py-1 text-blue-600 dark:text-blue-500">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-medium">Generating...</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="bg-muted text-muted-foreground border-border inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Queued</span>
          </div>
        );
    }
  };

  const canView = deck.status === 'completed';
  const canRetry = deck.status === 'failed' && parseInt(deck.retryCount, 10) < 3;

  return (
    <Card className="group border-border/60 hover:border-primary/50 relative gap-4 overflow-hidden py-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      {/* Gradient overlay on hover */}
      <div className="from-primary/0 via-primary/0 to-primary/5 absolute inset-0 bg-linear-to-br opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

      {/* Content */}
      <div className="relative">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1 space-y-2">
              <h3 className="group-hover:text-primary truncate text-lg leading-tight font-bold transition-colors">
                {deck.name}
              </h3>
              <p className="text-muted-foreground truncate font-mono text-sm">{deck.domain}</p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 shrink-0 p-0 opacity-0 transition-opacity group-hover:opacity-100"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canRetry && (
                  <DropdownMenuItem onClick={() => onRetry(deck.id)}>
                    Retry Generation
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={() => onDelete(deck.id)} className="text-destructive">
                  <Trash className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="pb-0">{getStatusBadge()}</CardContent>

        <CardFooter className="pt-0 pb-0">
          <div className="flex w-full items-center justify-between gap-3">
            <span className="text-muted-foreground text-xs">
              {new Date(deck.createdAt).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
              })}
            </span>
            {canView ? (
              <Button asChild size="sm" className="shadow-sm">
                <Link href={`/org/${slug}/decks/${deck.id}`}>View Deck</Link>
              </Button>
            ) : (
              <Button size="sm" disabled variant="secondary">
                {deck.status === 'processing' || deck.status === 'pending'
                  ? 'Generating...'
                  : 'View Deck'}
              </Button>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}
