'use client';

import { use, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

import { ArrowLeft, Check, Copy, Download, Loader2, Share2, Trash } from 'lucide-react';

import { trpc } from '@/lib/trpc/client';

import { useDeck } from '@/hooks/use-decks';
import { useOrganization } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';

import { DeckCarousel } from '@/components/deck-carousel';

function DeckDetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-10 w-32" />
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-4 w-96" />
      </div>
      <Skeleton className="h-[500px] w-full" />
      <div className="flex justify-between">
        <Skeleton className="h-10 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

interface DeckDetailPageProps {
  params: Promise<{
    slug: string;
    id: string;
  }>;
}

export default function DeckDetailPage({ params }: DeckDetailPageProps) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { toast } = useToast();
  const { isLoading: isLoadingOrg } = useOrganization();
  const { deck, isLoading } = useDeck(resolvedParams.id);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const utils = trpc.useUtils();

  const { data: share, isLoading: isLoadingShare } = trpc.shares.getByDeckId.useQuery(
    { deckId: resolvedParams.id },
    { enabled: !!deck }
  );

  const createShare = trpc.shares.create.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Share link created' });
      utils.shares.getByDeckId.invalidate({ deckId: resolvedParams.id });
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const handleDelete = async () => {
    if (!deck) return;
    setIsDeleting(true);
    // In real implementation, call deleteDeck mutation
    // For now, just navigate back
    router.push(`/org/${resolvedParams.slug}/decks`);
  };

  const handleShare = async () => {
    if (!deck) return;

    setShareDialogOpen(true);

    if (!share) {
      await createShare.mutateAsync({ deckId: deck.id });
    }
  };

  const handleCopyLink = () => {
    if (!share) return;

    const shareUrl = `${window.location.origin}/share/${share.id}`;
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast({ title: 'Copied', description: 'Share link copied to clipboard' });
  };

  const handleExportPDF = async () => {
    if (!deck || !deck.slides) return;

    setIsExporting(true);

    try {
      // Call Python engine to generate PDF
      const response = await fetch('/api/engine/pdf-export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          deckName: deck.name,
          slides: deck.slides.map((slide, index) => ({
            slideNumber: index + 1,
            title: slide.title,
            content: slide.content,
          })),
        }),
      });

      if (!response.ok) {
        throw new Error('PDF export failed');
      }

      const data = await response.json();

      if (!data.pdfBase64) {
        throw new Error('No PDF data received');
      }

      // Convert base64 to blob
      const byteCharacters = atob(data.pdfBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'application/pdf' });

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${deck.name}-deck.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({ title: 'Success', description: 'PDF exported successfully' });
    } catch (error) {
      console.error('PDF export failed:', error);
      toast({
        title: 'Error',
        description: 'Failed to export PDF. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoadingOrg || isLoading) {
    return <DeckDetailSkeleton />;
  }

  if (!deck) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="font-semibold text-lg mb-1">Deck not found</h3>
        <p className="text-sm text-muted-foreground mb-4">
          The deck you&apos;re looking for doesn&apos;t exist or has been deleted.
        </p>
        <Button asChild>
          <Link href={`/org/${resolvedParams.slug}/decks`}>
            <ArrowLeft />
            Back to Decks
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{deck.name}</h1>
          <p className="mt-1 text-sm text-muted-foreground">{deck.domain}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleShare}
            disabled={deck.status !== 'completed' || isLoadingShare}
          >
            <Share2 />
            Share
          </Button>
          <Button
            variant="outline"
            onClick={handleExportPDF}
            disabled={isExporting || deck.status !== 'completed'}
          >
            {isExporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download />
                Export PDF
              </>
            )}
          </Button>
          <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
            <Trash />
            Delete
          </Button>
        </div>
      </div>

      {/* Slides Carousel */}
      {deck.slides && deck.slides.length > 0 ? (
        <DeckCarousel slides={deck.slides} />
      ) : (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="font-semibold text-lg mb-1">No slides available</h3>
          <p className="text-sm text-muted-foreground">
            This deck is still being generated or failed to generate slides.
          </p>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Share Deck</DialogTitle>
            <DialogDescription>
              Anyone with this link can view your deck
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {createShare.isPending || isLoadingShare ? (
              <div className="flex items-center gap-2 py-4">
                <Loader2 className="h-4 w-4 animate-spin" />
                <p className="text-sm text-muted-foreground">Generating share link...</p>
              </div>
            ) : share ? (
              <div className="flex items-center gap-2">
                <Input
                  value={`${typeof window !== 'undefined' ? window.location.origin : ''}/share/${share.id}`}
                  readOnly
                  className="flex-1"
                />
                <Button onClick={handleCopyLink} variant="outline">
                  {copied ? <Check /> : <Copy />}
                  {copied ? 'Copied' : 'Copy'}
                </Button>
              </div>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete &quot;{deck.name}&quot;. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

