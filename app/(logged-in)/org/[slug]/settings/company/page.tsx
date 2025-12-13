'use client';

import { Controller, useForm, useWatch } from 'react-hook-form';

import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';

import { trpc } from '@/lib/trpc/client';
import { orgCompanyInfoFormSchema } from '@/lib/trpc/schemas/organizations';
import type { z } from 'zod';

import { useOrganization } from '@/hooks/use-organization';
import { useToast } from '@/hooks/use-toast';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Skeleton } from '@/components/ui/skeleton';
import { Textarea } from '@/components/ui/textarea';

type CompanyInfoFormValues = z.infer<typeof orgCompanyInfoFormSchema>;

function CompanyInfoSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-96" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-3 w-64" />
          </div>
        ))}
        <Skeleton className="h-10 w-32" />
      </CardContent>
    </Card>
  );
}

export default function CompanyInfoPage() {
  const { organization, isLoading: isLoadingOrg } = useOrganization();
  const { toast } = useToast();
  const utils = trpc.useUtils();

  const form = useForm<CompanyInfoFormValues>({
    resolver: zodResolver(orgCompanyInfoFormSchema),
    values: {
      companyDescription: organization?.companyDescription || '',
      productDescription: organization?.productDescription || '',
      serviceDescription: organization?.serviceDescription || '',
    },
  });

  const updateCompanyInfo = trpc.organizations.updateCompanyInfo.useMutation({
    onSuccess: () => {
      toast({ title: 'Success', description: 'Company information updated successfully' });
      // Invalidate both queries to ensure all caches are updated
      utils.organizations.getOrganization.invalidate();
      utils.organizations.getOrganizationBySlug.invalidate();
    },
    onError: (error) => {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    },
  });

  const onSubmit = async (data: CompanyInfoFormValues) => {
    if (!organization?.id) return;

    await updateCompanyInfo.mutateAsync({
      organizationId: organization.id,
      companyDescription: data.companyDescription || null,
      productDescription: data.productDescription || null,
      serviceDescription: data.serviceDescription || null,
    });
  };

  // Track changes
  const watchedCompanyDesc = useWatch({ control: form.control, name: 'companyDescription' });
  const watchedProductDesc = useWatch({ control: form.control, name: 'productDescription' });
  const watchedServiceDesc = useWatch({ control: form.control, name: 'serviceDescription' });

  const hasChanges =
    watchedCompanyDesc !== (organization?.companyDescription || '') ||
    watchedProductDesc !== (organization?.productDescription || '') ||
    watchedServiceDesc !== (organization?.serviceDescription || '');

  if (isLoadingOrg) {
    return <CompanyInfoSkeleton />;
  }

  if (!organization) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="font-semibold text-lg mb-1">Organization not found</h3>
        <p className="text-sm text-muted-foreground">The organization could not be loaded.</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Company Information</CardTitle>
        <CardDescription>
          Provide details about your company to personalize sales decks. This information will be
          used when generating decks for potential clients.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form id="company-info-form" onSubmit={form.handleSubmit(onSubmit)}>
          <FieldGroup>
            <Controller
              name="companyDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="company-description">Company Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="company-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Describe your company, mission, and what you do..."
                    rows={4}
                    disabled={updateCompanyInfo.isPending}
                    maxLength={500}
                  />
                  <FieldDescription>
                    A brief overview of your company (max 500 characters)
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="productDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="product-description">Product Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="product-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Describe your main product offerings..."
                    rows={4}
                    disabled={updateCompanyInfo.isPending}
                    maxLength={500}
                  />
                  <FieldDescription>
                    Key products you offer (max 500 characters)
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Controller
              name="serviceDescription"
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor="service-description">Service Description</FieldLabel>
                  <Textarea
                    {...field}
                    id="service-description"
                    aria-invalid={fieldState.invalid}
                    placeholder="Describe your services and what makes them unique..."
                    rows={4}
                    disabled={updateCompanyInfo.isPending}
                    maxLength={500}
                  />
                  <FieldDescription>
                    Services you provide (max 500 characters)
                  </FieldDescription>
                  {fieldState.invalid && <FieldError errors={[fieldState.error]} />}
                </Field>
              )}
            />

            <Button type="submit" disabled={updateCompanyInfo.isPending || !hasChanges}>
              {updateCompanyInfo.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
            </Button>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  );
}

