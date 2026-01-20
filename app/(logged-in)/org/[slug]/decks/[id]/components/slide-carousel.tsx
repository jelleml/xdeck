'use client';

import { useState } from 'react';
import ReactMarkdown from 'react-markdown';

import { ChevronLeft, ChevronRight } from 'lucide-react';

import type { DeckSlide } from '@/lib/types';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SlideCarouselProps {
  slides: DeckSlide[];
}

export function SlideCarousel({ slides }: SlideCarouselProps) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const goToNext = () => {
    setCurrentSlide((prev) => (prev + 1) % slides.length);
  };

  const goToPrevious = () => {
    setCurrentSlide((prev) => (prev - 1 + slides.length) % slides.length);
  };

  const goToSlide = (index: number) => {
    setCurrentSlide(index);
  };

  if (slides.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <h3 className="mb-1 text-lg font-semibold">No slides found</h3>
        <p className="text-muted-foreground text-sm">This deck doesn&apos;t have any slides yet.</p>
      </div>
    );
  }

  const slide = slides[currentSlide];

  return (
    <div className="space-y-6">
      {/* Main Slide Display */}
      <Card className="min-h-[500px]">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl">{slide.title}</CardTitle>
            <div className="text-muted-foreground text-sm">
              Slide {currentSlide + 1} of {slides.length}
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="prose prose-slate dark:prose-invert max-w-none">
            <ReactMarkdown>{slide.content}</ReactMarkdown>
          </div>
        </CardContent>
      </Card>

      {/* Navigation Controls */}
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
              className={`h-2 rounded-full transition-all ${
                index === currentSlide
                  ? 'bg-primary w-8'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50 w-2'
              }`}
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

      {/* Slide Thumbnails */}
      <div className="grid grid-cols-5 gap-4">
        {slides.map((s, index) => (
          <button
            key={s.id}
            onClick={() => goToSlide(index)}
            className={`group relative rounded-lg border-2 p-4 text-left transition-all ${
              index === currentSlide
                ? 'border-primary bg-primary/5'
                : 'border-border hover:border-primary/50'
            }`}
          >
            <div className="text-muted-foreground mb-1 text-xs font-medium">Slide {index + 1}</div>
            <div className="line-clamp-2 text-sm font-semibold">{s.title}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
