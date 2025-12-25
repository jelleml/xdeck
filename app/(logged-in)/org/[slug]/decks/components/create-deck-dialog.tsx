'use client';

import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import type { z } from 'zod';

import { createDeckSchema } from '@/lib/trpc/schemas/decks';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field';
import { Input } from '@/components/ui/input';

type CreateDeckFormValues = z.infer<typeof createDeckSchema>;

interface CreateDeckDialogProps {
  onSubmit: (domain: string) => void;
  isSubmitting: boolean;
  children: React.ReactNode;
}

export function CreateDeckDialog({ onSubmit, isSubmitting, children }: CreateDeckDialogProps) {
  const [open, setOpen] = useState(false);

  const form = useForm<CreateDeckFormValues>({
    resolver: zodResolver(createDeckSchema),
    defaultValues: {
      domain: '',
    },
  });

  const handleSubmit = async (data: CreateDeckFormValues) => {
    onSubmit(data.domain);
    setOpen(false);
    form.reset();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Sales Deck</DialogTitle>
          <DialogDescription>
            Enter your company domain. We&apos;ll analyze your website and generate a sales deck you
            can use to pitch your services to prospects.
          </DialogDescription>
        </DialogHeader>

        <form id="create-deck-form" onSubmit={form.handleSubmit(handleSubmit)}>
          <Controller
            name="domain"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor="domain">Company Domain</FieldLabel>
                <Input
                  {...field}
                  id="domain"
                  aria-invalid={fieldState.invalid}
                  placeholder="example.com"
                  disabled={isSubmitting}
                />
                <FieldDescription>
                  Enter the domain without https:// or www. (e.g., example.com)
                </FieldDescription>
                {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
              </Field>
            )}
          />
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button form="create-deck-form" type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              'Generate Deck'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
