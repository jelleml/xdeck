'use client';

import { useState } from 'react';

import { Plus } from 'lucide-react';

import { useOrganization } from '@/hooks/use-organization';
import { useDecks } from '@/hooks/use-decks';

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
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

import { CreateDeckDialog } from './components/create-deck-dialog';
import { DeckCard } from './components/deck-card';

function DecksPageSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-96" />
        </div>
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
        {Array.from({ length: 10 }).map((_, i) => (
          <Card key={i} className="p-6">
            <div className="space-y-5">
              <div className="space-y-1">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
              <Skeleton className="h-5 w-24" />
              <div className="flex items-center justify-between pt-2">
                <Skeleton className="h-3 w-32" />
                <Skeleton className="h-9 w-24" />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

export default function DecksPage() {
  const { organization, isLoading: isLoadingOrg } = useOrganization();
  const { decks, isLoading, createDeck, isCreating, deleteDeck, isDeleting, retryDeck } = useDecks(
    organization?.id || ''
  );

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deckToDelete, setDeckToDelete] = useState<{ id: string; name: string } | null>(null);

  const handleCreateDeck = (domain: string) => {
    if (!organization?.id) return;
    createDeck({ organizationId: organization.id, domain });
  };

  const handleDeleteClick = (id: string, name: string) => {
    setDeckToDelete({ id, name });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (!deckToDelete) return;
    deleteDeck({ id: deckToDelete.id });
    setDeleteDialogOpen(false);
    setDeckToDelete(null);
  };

  const handleRetry = (id: string) => {
    retryDeck({ id });
  };

  if (isLoadingOrg || isLoading) {
    return <DecksPageSkeleton />;
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="font-semibold text-lg mb-1">Organization not found</h3>
        <p className="text-sm text-muted-foreground">Please select an organization to continue.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Section */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">Sales Decks</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Generate AI-powered sales decks for your company
          </p>
        </div>
        <CreateDeckDialog onSubmit={handleCreateDeck} isSubmitting={isCreating}>
          <Button>
            <Plus />
            New Deck
          </Button>
        </CreateDeckDialog>
      </div>

      {/* Decks Grid */}
      {decks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <h3 className="font-semibold text-lg mb-1">No decks yet</h3>
          <p className="text-sm text-muted-foreground">
            Create your first AI-powered sales deck to get started
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-3 gap-6">
          {decks.map((deck) => (
            <DeckCard
              key={deck.id}
              deck={deck}
              onDelete={(id) => handleDeleteClick(id, deck.name)}
              onRetry={handleRetry}
            />
          ))}
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              {deckToDelete &&
                `Are you sure you want to delete "${deckToDelete.name}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

