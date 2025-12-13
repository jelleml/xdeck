'use client';

import { useEffect, useState } from 'react';

import { ChevronLeft, ChevronRight, Maximize, Minimize, X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import type { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { cn } from '@/lib/utils';
import type { DeckSlide } from '@/lib/types';

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
        <h3 className="font-semibold text-lg mb-1">No slides found</h3>
        <p className="text-sm text-muted-foreground">This deck doesn&apos;t have any slides yet.</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  // Custom markdown components for better presentation
  const markdownComponents: Partial<Components> = {
    h1: ({ children }) => (
      <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold mb-8 leading-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
        {children}
      </h1>
    ),
    h2: ({ children }) => (
      <h2 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">{children}</h2>
    ),
    h3: ({ children }) => (
      <h3 className="text-3xl md:text-4xl font-semibold mb-4 leading-tight">{children}</h3>
    ),
    p: ({ children }) => <p className="text-xl md:text-2xl mb-6 leading-relaxed">{children}</p>,
    ul: ({ children }) => <ul className="space-y-4 mb-6 text-xl md:text-2xl">{children}</ul>,
    ol: ({ children }) => <ol className="space-y-4 mb-6 text-xl md:text-2xl list-decimal list-inside">{children}</ol>,
    li: ({ children }) => (
      <li className="flex items-start gap-3">
        <span className="text-primary mt-1.5">•</span>
        <span className="flex-1">{children}</span>
      </li>
    ),
    strong: ({ children }) => <strong className="font-bold text-primary">{children}</strong>,
    em: ({ children }) => <em className="italic text-muted-foreground">{children}</em>,
    blockquote: ({ children }) => (
      <blockquote className="border-l-4 border-primary pl-6 py-2 my-6 text-xl italic">
        {children}
      </blockquote>
    ),
    code: ({ children }) => (
      <code className="bg-muted px-2 py-1 rounded text-lg font-mono">{children}</code>
    ),
    pre: ({ children }) => (
      <pre className="bg-muted p-6 rounded-lg overflow-x-auto my-6 text-sm font-mono">
        {children}
      </pre>
    ),
  };

  const slideContent = (
    <>
      {/* Main Slide Display */}
      <div
        className={cn(
          'relative bg-gradient-to-br from-background via-background to-muted/20',
          'flex flex-col',
          isFullscreen
            ? 'fixed inset-0 z-50 p-12 md:p-16 lg:p-20'
            : 'min-h-[600px] rounded-lg border border-border p-12 md:p-16'
        )}
      >
        {/* Fullscreen Toggle */}
        <div className="absolute top-4 right-4 flex items-center gap-2 z-10">
          <div className="text-sm text-muted-foreground bg-muted/80 backdrop-blur-sm px-3 py-1.5 rounded-full">
            {currentSlide + 1} / {slides.length}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="h-8 w-8 p-0 rounded-full bg-muted/80 backdrop-blur-sm hover:bg-muted"
          >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
          </Button>
          {isFullscreen && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsFullscreen(false)}
              className="h-8 w-8 p-0 rounded-full bg-muted/80 backdrop-blur-sm hover:bg-muted"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Slide Content */}
        <div className="flex-1 flex flex-col justify-center max-w-5xl mx-auto w-full">
          {/* Slide Title */}
          <div className="mb-8">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold leading-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
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
                'absolute left-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full',
                'bg-muted/80 backdrop-blur-sm hover:bg-muted transition-all',
                'flex items-center justify-center',
                currentSlide === 0 && 'opacity-30 cursor-not-allowed'
              )}
              aria-label="Previous slide"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <button
              onClick={goToNext}
              disabled={currentSlide === slides.length - 1}
              className={cn(
                'absolute right-4 top-1/2 -translate-y-1/2 h-12 w-12 rounded-full',
                'bg-muted/80 backdrop-blur-sm hover:bg-muted transition-all',
                'flex items-center justify-center',
                currentSlide === slides.length - 1 && 'opacity-30 cursor-not-allowed'
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
                    ? 'w-8 bg-primary'
                    : 'w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50'
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
              <div className="text-xs font-medium text-muted-foreground mb-1">
                Slide {index + 1}
              </div>
              <div className="text-sm font-semibold line-clamp-2">{s.title}</div>
            </button>
          ))}
        </div>
      )}
    </>
  );

  return <div className="space-y-6">{slideContent}</div>;
}

