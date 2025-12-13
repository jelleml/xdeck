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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-600 dark:text-green-500 border border-green-500/20">
            <CheckCircle2 className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Ready</span>
          </div>
        );
      case 'failed':
        return (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-destructive/10 text-destructive border border-destructive/20 cursor-help">
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
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-500 border border-blue-500/20">
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
            <span className="text-xs font-medium">Generating...</span>
          </div>
        );
      case 'pending':
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-muted text-muted-foreground border border-border">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium">Queued</span>
          </div>
        );
    }
  };

  const canView = deck.status === 'completed';
  const canRetry = deck.status === 'failed' && parseInt(deck.retryCount, 10) < 3;

  return (
    <Card className="group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border-border/60 hover:border-primary/50 py-4 gap-4">
      {/* Gradient overlay on hover */}
      <div className="absolute inset-0 bg-linear-to-br from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      
      {/* Content */}
      <div className="relative">
        <CardHeader className="pb-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 space-y-2">
              <h3 className="font-bold text-lg truncate leading-tight group-hover:text-primary transition-colors">
                {deck.name}
              </h3>
              <p className="text-sm text-muted-foreground truncate font-mono">
                {deck.domain}
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
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

        <CardContent className="pb-0">
          {getStatusBadge()}
        </CardContent>

        <CardFooter className="pt-0 pb-0">
          <div className="flex items-center justify-between w-full gap-3">
            <span className="text-xs text-muted-foreground">
              {new Date(deck.createdAt).toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric',
                year: 'numeric'
              })}
            </span>
            {canView ? (
              <Button asChild size="sm" className="shadow-sm">
                <Link href={`/org/${slug}/decks/${deck.id}`}>View Deck</Link>
              </Button>
            ) : (
              <Button size="sm" disabled variant="secondary">
                {deck.status === 'processing' || deck.status === 'pending' ? 'Generating...' : 'View Deck'}
              </Button>
            )}
          </div>
        </CardFooter>
      </div>
    </Card>
  );
}

