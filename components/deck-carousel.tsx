'use client';

import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';

import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import remarkGfm from 'remark-gfm';

import type { DeckSlide } from '@/lib/types';
import { cn } from '@/lib/utils';

import { Button } from '@/components/ui/button';

interface DeckCarouselProps {
  slides: DeckSlide[];
  viewOnly?: boolean; // For public share pages
  onSlideChange?: (slideIndex: number) => void; // Track slide views
  defaultFullscreen?: boolean; // Auto-enter fullscreen mode
}

export function DeckCarousel({
  slides,
  viewOnly = false,
  onSlideChange,
  defaultFullscreen = false,
}: DeckCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(defaultFullscreen);

  const goToNext = () => {
    if (currentSlide < slides.length - 1) {
      const nextSlide = currentSlide + 1;
      setCurrentSlide(nextSlide);
      onSlideChange?.(nextSlide);
    }
  };

  const goToPrevious = () => {
    if (currentSlide > 0) {
      const prevSlide = currentSlide - 1;
      setCurrentSlide(prevSlide);
      onSlideChange?.(prevSlide);
    }
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
    onSlideChange?.(index);
  };

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        goToNext();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        goToPrevious();
      } else if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault();
        setIsFullscreen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSlide, slides.length, isFullscreen]);

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mb-1 text-lg font-semibold">No slides found</h3>
        <p className="text-muted-foreground text-sm">This deck doesn&apos;t have any slides yet.</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  // Custom markdown components for better presentation
  const markdownComponents: Partial<Components> = {
    h1: ({ children }) => (
      <h1 className="from-primary to-primary/60 mb-8 bg-gradient-to-r bg-clip-text text-5xl leading-tight font-bold text-transparent md:text-6xl lg:text-7xl">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="mb-6 text-4xl leading-tight font-bold md:text-5xl">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="mb-4 text-3xl leading-tight font-semibold md:text-4xl">{children}</h3>
    ),
    p: ({ children }) => <p className="mb-6 text-xl leading-relaxed md:text-2xl">{children}</p>,
    ul: ({ children }) => <ul className="mb-6 space-y-4 text-xl md:text-2xl">{children}</ul>,
    ol: ({ children }) => (
      <ol className="mb-6 list-inside list-decimal space-y-4 text-xl md:text-2xl">{children}</ol>
    ),
    li: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="text-primary mt-1.5">•</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    strong: ({ children }) => <strong className="text-primary font-bold">{children}</strong>,
    em: ({ children }) => <em className="text-muted-foreground italic">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="border-primary my-6 border-l-4 py-2 pl-6 text-xl italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-muted rounded px-2 py-1 font-mono text-lg">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted my-6 overflow-x-auto rounded-lg p-6 font-mono text-sm">
        {children}
      </pre>
    ),
  };

  const slideContent = (
    <>
      {/* Main Slide Display */}
      <div
        className={cn(
          'from-background via-background to-muted/20 relative bg-gradient-to-br',
          'flex flex-col',
          isFullscreen
            ? 'fixed inset-0 z-50 p-12 md:p-16 lg:p-20'
            : 'border-border min-h-[600px] rounded-lg border p-12 md:p-16'
        )}
      >
        {/* Fullscreen Toggle */}
        <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
          <div className="text-muted-foreground bg-muted/80 rounded-full px-3 py-1.5 text-sm backdrop-blur-sm">
            {currentSlide + 1} / {slides.length}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="bg-muted/80 hover:bg-muted h-8 w-8 rounded-full p-0 backdrop-blur-sm"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          {isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="bg-muted/80 hover:bg-muted h-8 w-8 rounded-full p-0 backdrop-blur-sm"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Slide Content */}
        <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col justify-center">
          {/* Slide Title */}
          <div className="mb-8">
            <h1 className="from-foreground to-foreground/70 bg-gradient-to-r bg-clip-text text-4xl leading-tight font-bold md:text-5xl lg:text-6xl">
              {slide.title}
            </h1>
          </div>

          {/* Slide Content with Custom Styling */}
          <div className="prose-custom max-w-none space-y-6">
            <ReactMarkdown components={markdownComponents} remarkPlugins={[remarkGfm]}>
              {slide.content}
            </ReactMarkdown>
          </div>
        </div>

        {/* Navigation Arrows - Always Visible in Fullscreen */}
        {isFullscreen && (
          <>
            <button
              onClick={goToPrevious}
              disabled={currentSlide === 0}
              className={cn(
                'absolute top-1/2 left-4 h-12 w-12 -translate-y-1/2 rounded-full',
                'bg-muted/80 hover:bg-muted backdrop-blur-sm transition-all',
                'flex items-center justify-center',
                currentSlide === 0 && 'cursor-not-allowed opacity-30'
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentSlide === slides.length - 1}
              className={cn(
                'absolute top-1/2 right-4 h-12 w-12 -translate-y-1/2 rounded-full',
                'bg-muted/80 hover:bg-muted backdrop-blur-sm transition-all',
                'flex items-center justify-center',
                currentSlide === slides.length - 1 && 'cursor-not-allowed opacity-30'
              )}
              aria-label="Next slide"
            >
              <ChevronRight className="h-6 w-6" />
            </button>
          </>
        )}
      </div>

      {/* Navigation Controls - Hidden in Fullscreen */}
      {!isFullscreen && (
        <div className="flex items-center justify-between gap-4">
          <Button variant="outline" size="lg" onClick={goToPrevious} disabled={currentSlide === 0}>
            <ChevronLeft />
            Previous
          </Button>

          {/* Slide Indicators */}
          <div className="flex items-center gap-2">
            {slides.map((_, index) => (
              <button
                key={index}
                onClick={() => goToSlide(index)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  index === currentSlide
                    ? 'bg-primary w-8'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
                )}
                aria-label={`Go to slide ${index + 1}`}
              />
            ))}
          </div>

          <Button
            variant="outline"
            size="lg"
            onClick={goToNext}
            disabled={currentSlide === slides.length - 1}
          >
            Next
            <ChevronRight />
          </Button>
        </div>
      )}

      {/* Slide Thumbnails - Hidden in view-only mode and fullscreen */}
      {!viewOnly && !isFullscreen && (
        <div className="grid grid-cols-5 gap-4">
          {slides.map((s, index) => (
            <button
              key={s.id}
              onClick={() => goToSlide(index)}
              className={cn(
                'group relative rounded-lg border-2 p-4 text-left transition-all',
                index === currentSlide
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-primary/50'
              )}
            >
              <div className="text-muted-foreground mb-1 text-xs font-medium">
                Slide {index + 1}
              </div>
              <div className="line-clamp-2 text-sm font-semibold">{s.title}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  return <div className="space-y-6">{slideContent}</div>;
}
