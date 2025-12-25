'use client';

import { useState } from 'react';

import Link from 'next/link';

import { motion } from 'framer-motion';
import {
  ArrowRight,
  ChevronDown,
  ChevronUp,
  Eye,
  Layers,
  Palette,
  Plug,
  Search,
  Sparkles,
  Star,
  Target,
  Wand2,
  Zap,
} from 'lucide-react';

import { useOrganization } from '@/hooks/use-organization';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

const features = [
  {
    icon: Zap,
    badge: '< 60s setup',
    title: 'Instant Creation',
    description: 'Input a URL to generate a tailored sales deck.',
  },
  {
    icon: Search,
    badge: 'Auto-Enrichment',
    title: 'Deep Research',
    description: 'AI scans news and reports for high-relevance insights.',
  },
  {
    icon: Palette,
    badge: '100% On-Brand',
    title: 'Brand Guardrails',
    description: 'Decks automatically match your fonts, colors, and logos.',
  },
  {
    icon: Plug,
    badge: 'Integration Ready',
    title: 'CRM Sync',
    description: 'Push activity, assets, and engagement data directly to your CRM.',
  },
];

const reviews = [
  {
    name: 'Sarah Chen',
    role: 'VP of Sales',
    company: 'TechFlow',
    rating: 5,
    comment:
      'XDeck cut our deck prep time from 2 hours to under a minute. Our team is closing deals 40% faster.',
  },
  {
    name: 'Marcus Johnson',
    role: 'Account Executive',
    company: 'CloudScale',
    rating: 5,
    comment:
      'The prospect research is incredible. Every deck feels custom-made and our open rates have doubled.',
  },
  {
    name: 'Emily Rodriguez',
    role: 'Sales Director',
    company: 'DataPrime',
    rating: 5,
    comment:
      'Finally, a tool that keeps our brand consistent while giving reps the speed they need. Game changer.',
  },
];

const faqs = [
  {
    question: 'How long does it take to generate a personalized sales deck?',
    answer:
      "Less than 60 seconds. Simply input your prospect's company URL or LinkedIn profile, and XDeck automatically researches their business, identifies pain points, and generates a fully branded presentation deck ready to send or present.",
  },
  {
    question: 'Does XDeck integrate with my existing CRM?',
    answer:
      'Yes. XDeck syncs activity data, engagement metrics, and generated assets directly to leading CRM platforms like HubSpot, Salesforce, and Pipedrive, keeping all your sales intelligence in one place.',
  },
  {
    question: 'Can I customize the AI-generated slides?',
    answer:
      'Absolutely. Use the built-in AI chat editor to rewrite copy, adjust tone, add or remove slides, or tweak any element instantly. You maintain full creative control while the AI handles the heavy lifting.',
  },
  {
    question: 'Will the decks match our brand guidelines?',
    answer:
      'Every deck automatically follows your brand guardrails—fonts, colors, logos, and messaging tone are applied consistently across all generated assets to ensure 100% on-brand output.',
  },
  {
    question: 'What kind of prospect research does XDeck perform?',
    answer:
      'XDeck scans company websites, recent news, funding announcements, industry reports, and social signals to surface relevant insights and talking points that make your outreach hyper-personalized and timely.',
  },
  {
    question: 'Can I track if prospects view my deck?',
    answer:
      'Yes. XDeck provides real-time engagement tracking showing when prospects open your deck, how long they spend on it, and which slides capture their attention most—helping you prioritize follow-ups and tailor conversations.',
  },
  {
    question: 'Is XDeck suitable for both outbound and inbound sales?',
    answer:
      'Completely. Generate cold email teasers with custom deck links for outbound prospecting, or create full presentation decks for scheduled demos and inbound opportunities. The AI adapts content to fit each context perfectly.',
  },
  {
    question: 'Do I need design skills to use XDeck?',
    answer:
      "No design experience required. XDeck's AI handles layout, visual hierarchy, and professional formatting automatically. Your team can focus on selling while the platform creates presentation-ready assets instantly.",
  },
];

export function Home() {
  const { organization } = useOrganization();

  const dashboardUrl = organization ? `/org/${organization.slug}/dashboard` : '/sign-up';

  return (
    <div className="bg-background min-h-screen w-full pt-[60px]">
      {/* Hero Section */}
      <section className="px-4 pt-12 pb-16 sm:px-6 sm:pt-20 sm:pb-32">
        <div className="container mx-auto max-w-6xl">
          {/* Main headline */}
          <motion.div
            className="mb-8 text-center sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.3 }}
            >
              <Badge
                variant="outline"
                className="relative mb-4 cursor-default overflow-hidden px-2 py-1 text-xs sm:mb-6 sm:px-3"
              >
                {/* Shine effect */}
                <motion.div
                  className="absolute inset-0 -top-1 -bottom-1 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                  initial={{ x: '-100%' }}
                  animate={{ x: '200%' }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    repeatDelay: 3,
                    ease: 'easeInOut',
                  }}
                />
                <Sparkles className="mr-1 h-3 w-3" />
                AI Sales Deck Designer
              </Badge>
            </motion.div>

            <h1 className="mb-4 px-2 text-3xl leading-tight font-bold tracking-tight sm:mb-6 sm:text-5xl lg:text-7xl">
              Personalize Sales Decks
              <br />
              in Seconds
            </h1>

            <p className="text-muted-foreground mx-auto mb-6 max-w-2xl px-2 font-sans text-base sm:mb-8 sm:text-lg lg:text-xl">
              Generate custom outbound assets and presentation decks instantly. Powered by deep
              prospect research and your marketing guidelines.
            </p>
          </motion.div>

          {/* CTA Buttons */}
          <motion.div
            className="flex flex-col items-center justify-center gap-3 px-2 sm:flex-row sm:gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href={dashboardUrl}>
                <Wand2 className="mr-2 h-4 w-4" />
                Start Generate
              </Link>
            </Button>

            <Button size="lg" variant="outline" className="w-full sm:w-auto" asChild>
              <Link href="#features">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Bento Grid - Value Props */}
      <section className="bg-background py-12 sm:py-20" id="features">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="mb-12 text-center sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl">
              Why sales leaders choose us
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl px-2 font-sans text-base sm:text-lg">
              Eliminate manual prep work and focus on the conversation.
            </p>
          </motion.div>

          <div className="mx-auto max-w-6xl">
            <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
              {/* Big Block - Left */}
              <motion.div
                className="md:row-span-3"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6 }}
              >
                <Card className="bg-card border-border hover:bg-card/80 h-full border p-6 transition-all duration-300 sm:p-8">
                  <CardContent className="flex h-full flex-col justify-between p-0">
                    <div>
                      <div className="mb-4 flex items-center gap-3 sm:mb-6">
                        <div className="bg-muted rounded-lg p-2">
                          <Layers className="text-foreground h-5 w-5 sm:h-6 sm:w-6" />
                        </div>
                        <h3 className="text-lg font-semibold sm:text-xl">
                          Outbound & Inbound Engines
                        </h3>
                      </div>
                      <p className="text-muted-foreground mb-6 font-sans text-sm leading-relaxed sm:text-base">
                        Whether you need a cold email teaser or a full presentation for a scheduled
                        call, XDeck adapts the narrative to fit the context perfectly.
                      </p>
                    </div>
                    <div className="space-y-3 text-sm">
                      <div className="flex items-start gap-3">
                        <div className="bg-muted mt-0.5 rounded-full p-1">
                          <div className="bg-foreground h-1.5 w-1.5 rounded-full" />
                        </div>
                        <span className="text-foreground">
                          Generate email with custom deck link
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-muted mt-0.5 rounded-full p-1">
                          <div className="bg-foreground h-1.5 w-1.5 rounded-full" />
                        </div>
                        <span className="text-foreground">
                          Export assets ready for screen-share
                        </span>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="bg-muted mt-0.5 rounded-full p-1">
                          <div className="bg-foreground h-1.5 w-1.5 rounded-full" />
                        </div>
                        <span className="text-foreground">
                          Auto-adapt content to prospect needs
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Small Block 1 - Right Top */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Card className="bg-card/50 border-border hover:bg-card/80 h-full border p-4 transition-all duration-300 sm:p-6">
                  <CardContent className="p-0">
                    <div className="mb-3 flex items-center gap-2 sm:mb-4">
                      <Target className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="text-base font-semibold sm:text-lg">Smart Prospecting</h3>
                    </div>
                    <p className="text-muted-foreground font-sans text-sm">
                      Input ICP traits to find and validate leads using real-time company data.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Small Block 2 - Right Middle */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.2 }}
              >
                <Card className="bg-card/50 border-border hover:bg-card/80 h-full border p-4 transition-all duration-300 sm:p-6">
                  <CardContent className="p-0">
                    <div className="mb-3 flex items-center gap-2 sm:mb-4">
                      <Wand2 className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="text-base font-semibold sm:text-lg">AI-Assisted Editing</h3>
                    </div>
                    <p className="text-muted-foreground font-sans text-sm">
                      Tweak slides, rewrite copy, or adjust tone instantly with a simple chatbot
                      prompt.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Small Block 3 - Right Bottom */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: 0.3 }}
              >
                <Card className="bg-card/50 border-border hover:bg-card/80 h-full border p-4 transition-all duration-300 sm:p-6">
                  <CardContent className="p-0">
                    <div className="mb-3 flex items-center gap-2 sm:mb-4">
                      <Eye className="text-foreground h-4 w-4 sm:h-5 sm:w-5" />
                      <h3 className="text-base font-semibold sm:text-lg">Engagement Tracking</h3>
                    </div>
                    <p className="text-muted-foreground font-sans text-sm">
                      Know exactly when prospects open your deck and which slides they view most.
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="bg-background py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="mb-12 text-center sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl">
              The Perfect Slide for Each Lead
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl px-2 font-sans text-base sm:text-lg">
              The complete toolkit for modern sales teams to close deals faster.
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-2">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full py-4 transition-colors">
                  <CardContent className="py-0">
                    <div className="mb-3 flex items-start justify-between sm:mb-4">
                      <div className="bg-muted text-muted-foreground rounded-lg p-2">
                        <feature.icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {feature.badge}
                      </Badge>
                    </div>

                    <h3 className="mb-2 text-lg font-semibold sm:mb-3 sm:text-xl">
                      {feature.title}
                    </h3>

                    <p className="text-muted-foreground font-sans text-sm leading-relaxed sm:text-base">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Fake Reviews */}
      <section className="bg-muted/30 py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="mb-12 text-center sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl">
              Trusted by Sales Teams
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl px-2 font-sans text-base sm:text-lg">
              See how XDeck is transforming sales workflows
            </p>
          </motion.div>

          <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 sm:gap-8 md:grid-cols-3">
            {reviews.map((review, index) => (
              <motion.div
                key={review.name}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: index * 0.1 }}
              >
                <Card className="h-full">
                  <CardContent className="p-6">
                    <div className="mb-4 flex gap-1">
                      {Array.from({ length: review.rating }).map((_, i) => (
                        <Star key={i} className="text-foreground h-4 w-4 fill-current" />
                      ))}
                    </div>
                    <p className="text-muted-foreground mb-4 font-sans text-sm leading-relaxed">
                      &quot;{review.comment}&quot;
                    </p>
                    <div>
                      <p className="text-sm font-semibold">{review.name}</p>
                      <p className="text-muted-foreground text-xs">
                        {review.role}, {review.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="bg-background py-12 sm:py-20">
        <div className="container mx-auto px-4 sm:px-6">
          <motion.div
            className="mb-12 text-center sm:mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-3 text-2xl font-bold sm:mb-4 sm:text-3xl lg:text-4xl">
              Frequently Asked Questions
            </h2>
            <p className="text-muted-foreground mx-auto max-w-2xl px-2 font-sans text-base sm:text-lg">
              Everything you need to know about XDeck
            </p>
          </motion.div>

          <motion.div
            className="mx-auto max-w-3xl space-y-4"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            {faqs.map((faq, index) => (
              <FAQItem key={index} question={faq.question} answer={faq.answer} />
            ))}
          </motion.div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-background px-4 py-16 sm:px-6 sm:py-32">
        <div className="container mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="mb-4 text-3xl font-bold sm:mb-6 sm:text-4xl lg:text-5xl">
              Ready to boost sales?
            </h2>

            <p className="text-muted-foreground mb-8 px-2 font-sans text-base sm:mb-12 sm:text-lg">
              Join the sales teams automating their slides creation and converting more pipeline
              today.
            </p>

            <Button size="lg" className="w-full sm:w-auto" asChild>
              <Link href={dashboardUrl}>
                <Wand2 className="mr-2 h-4 w-4" />
                Try XDeck free
              </Link>
            </Button>
          </motion.div>
        </div>
      </section>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Collapsible open={isOpen} onOpenChange={setIsOpen}>
      <Card>
        <CollapsibleTrigger className="w-full">
          <CardContent className="flex items-center justify-between">
            <h3 className="text-left text-sm font-semibold sm:text-base">{question}</h3>
            {isOpen ? (
              <ChevronUp className="text-muted-foreground h-5 w-5 shrink-0" />
            ) : (
              <ChevronDown className="text-muted-foreground h-5 w-5 shrink-0" />
            )}
          </CardContent>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="px-4 pt-0 pb-4">
            <p className="text-muted-foreground font-sans text-sm leading-relaxed">{answer}</p>
          </CardContent>
        </CollapsibleContent>
      </Card>
    </Collapsible>
  );
}
