import { type InferInsertModel, type InferSelectModel, relations } from 'drizzle-orm';
import {
  boolean,
  index,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
} from 'drizzle-orm/pg-core';

// Enums
export const taskPriorityEnum = pgEnum('task_priority', ['low', 'medium', 'high']);
export const orgRoleEnum = pgEnum('org_role', ['owner', 'admin', 'member']);
export const orderStatusEnum = pgEnum('order_status', [
  'pending',
  'processing',
  'shipped',
  'delivered',
  'cancelled',
]);
export const deckStatusEnum = pgEnum('deck_status', [
  'pending',
  'processing',
  'completed',
  'failed',
]);
export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  displayName: text('display_name').notNull(),
  profileImageUrl: text('profile_image_url'),
  stripeCustomerId: text('stripe_customer_id').unique(), // Stripe customer ID
  notificationSettings: text('notification_settings'), // JSON string for notification preferences
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  role: text('role'),
  banned: boolean('banned').default(false),
  banReason: text('ban_reason'),
  banExpires: timestamp('ban_expires'),
});

export const sessions = pgTable('sessions', {
  id: uuid('id').defaultRandom().primaryKey(),
  expiresAt: timestamp('expires_at').notNull(),
  token: text('token').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  userId: uuid('user_id')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  activeOrganizationId: uuid('active_organization_id').references(() => organizations.id, {
    onDelete: 'set null',
  }),
  activeOrganizationSlug: text('active_organization_slug').references(() => organizations.slug, {
    onDelete: 'set null',
  }),
});

export const accounts = pgTable(
  'accounts',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('accounts_userId_idx').on(table.userId)]
);

export const verifications = pgTable(
  'verifications',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('verifications_identifier_idx').on(table.identifier)]
);

export const organizations = pgTable('organizations', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
  logo: text('logo'), // TODO make nullable
  metadata: text('metadata'),
  companyDescription: text('company_description'),
  productDescription: text('product_description'),
  serviceDescription: text('service_description'),
});

// Organization Memberships - Links users to organizations
export const orgMemberships = pgTable(
  'org_memberships',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    userId: uuid('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    role: orgRoleEnum('role').notNull(),
    createdAt: timestamp('created_at').notNull(),
  },
  (table) => [
    index('org_memberships_organizationId_idx').on(table.organizationId),
    index('org_memberships_userId_idx').on(table.userId),
  ]
);

export const invitations = pgTable(
  'invitations',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    organizationId: uuid('organization_id')
      .notNull()
      .references(() => organizations.id, { onDelete: 'cascade' }),
    email: text('email').notNull(),
    role: orgRoleEnum('role').notNull(),
    status: text('status').default('pending').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    inviterId: uuid('inviter_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
  },
  (table) => [
    index('invitations_organizationId_idx').on(table.organizationId),
    index('invitations_email_idx').on(table.email),
  ]
);

// User Subscriptions
export const userSubscriptions = pgTable('user_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }), // Nullable for personal subscriptions
  subscriptionType: text('subscription_type').notNull().default('personal'), // 'personal' | 'organization'
  stripeSubscriptionId: text('stripe_subscription_id').unique(), // Stripe subscription ID (nullable for free tier)
  stripeCustomerId: text('stripe_customer_id'), // Stripe customer ID (nullable for free tier)
  stripePriceId: text('stripe_price_id'), // Stripe price ID (nullable for free tier)
  status: text('status').notNull(), // 'active', 'canceled', 'past_due', 'unpaid', 'incomplete'
  tier: text('tier').notNull(), // 'free', 'pro', 'business'
  currentPeriodStart: timestamp('current_period_start'),
  currentPeriodEnd: timestamp('current_period_end'),
  cancelAtPeriodEnd: text('cancel_at_period_end').notNull().default('false'), // 'true' or 'false' - Stripe cancellation pattern
  scheduledDowngradeTier: text('scheduled_downgrade_tier'), // Target tier for scheduled downgrade (nullable)
  canceledAt: timestamp('canceled_at'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Activity Logs - Optional app-specific logging
export const activityLogs = pgTable('activity_logs', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  action: text('action').notNull(),
  timestamp: timestamp('timestamp').notNull().defaultNow(),
  ipAddress: varchar('ip_address', { length: 45 }),
  metadata: text('metadata'), // JSON string for additional context
});

// Tasks - Simple todo list functionality with organization support
export const tasks = pgTable('tasks', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id').references(() => organizations.id, {
    onDelete: 'cascade',
  }), // Nullable for personal tasks
  title: text('title').notNull(),
  description: text('description'),
  completed: text('completed').notNull().default('false'), // 'true' or 'false' as text
  priority: taskPriorityEnum('priority').notNull().default('medium'),
  dueDate: timestamp('due_date'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Orders - Customer orders with organization support
export const orders = pgTable('orders', {
  id: uuid('id').defaultRandom().primaryKey(), // Serves as both ID and order number
  customerName: text('customer_name').notNull(),
  userId: uuid('user_id').notNull(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }), // Orders always belong to an organization
  status: orderStatusEnum('status').notNull().default('pending'),
  amount: text('amount').notNull(), // Stored as text to preserve decimal precision (e.g., "1250.50")
  currency: text('currency').notNull().default('USD'),
  orderDate: timestamp('order_date').notNull().defaultNow(),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Order History - Tracks all status changes and updates to orders
export const orderHistory = pgTable('order_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  orderId: uuid('order_id')
    .notNull()
    .references(() => orders.id, {
      onDelete: 'cascade',
    }),
  userId: uuid('user_id'), // User who made the change (nullable for external/automated updates)
  status: orderStatusEnum('status').notNull(), // Status at this point in history
  notes: text('notes'), // Optional notes about the change
  createdAt: timestamp('created_at').defaultNow().notNull(), // When this status was set
});

// Decks - Sales deck generation for organizations
export const decks = pgTable('decks', {
  id: uuid('id').defaultRandom().primaryKey(),
  organizationId: uuid('organization_id')
    .notNull()
    .references(() => organizations.id, {
      onDelete: 'cascade',
    }),
  userId: uuid('user_id').notNull(), // Creator of the deck
  name: text('name').notNull(), // Derived from domain
  domain: text('domain').notNull(),
  status: deckStatusEnum('status').notNull().default('pending'),
  crawledContent: text('crawled_content'), // Markdown from Firecrawl
  errorMessage: text('error_message'),
  retryCount: text('retry_count').notNull().default('0'), // Stored as text like completed field
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Deck Slides - Individual slides within a deck
export const deckSlides = pgTable('deck_slides', {
  id: uuid('id').defaultRandom().primaryKey(),
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, {
      onDelete: 'cascade',
    }),
  slideNumber: text('slide_number').notNull(), // 1-5 stored as text for consistency
  title: text('title').notNull(),
  content: text('content').notNull(), // Markdown content
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deck Shares - Public share links for decks
export const deckShares = pgTable('deck_shares', {
  id: uuid('id').defaultRandom().primaryKey(), // This is the public share ID in the URL
  deckId: uuid('deck_id')
    .notNull()
    .references(() => decks.id, {
      onDelete: 'cascade',
    }),
  isActive: boolean('is_active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Deck Views - Track views of shared decks
export const deckViews = pgTable(
  'deck_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deckId: uuid('deck_id')
      .notNull()
      .references(() => decks.id, {
        onDelete: 'cascade',
      }),
    shareId: uuid('share_id').references(() => deckShares.id, {
      onDelete: 'set null',
    }), // Nullable - can track views from logged-in users too
    viewDuration: text('view_duration'), // Duration in seconds, stored as text
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  },
  (table) => [
    index('deck_views_deckId_idx').on(table.deckId),
    index('deck_views_viewedAt_idx').on(table.viewedAt),
  ]
);

// Slide Views - Track individual slide views within deck sessions
export const slideViews = pgTable(
  'slide_views',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    deckViewId: uuid('deck_view_id')
      .notNull()
      .references(() => deckViews.id, {
        onDelete: 'cascade',
      }),
    slideId: uuid('slide_id')
      .notNull()
      .references(() => deckSlides.id, {
        onDelete: 'cascade',
      }),
    viewedAt: timestamp('viewed_at').defaultNow().notNull(),
  },
  (table) => [
    index('slide_views_deckViewId_idx').on(table.deckViewId),
    index('slide_views_slideId_idx').on(table.slideId),
  ]
);

export const userRelations = relations(users, ({ many }) => ({
  accounts: many(accounts),
  members: many(orgMemberships),
  invitations: many(invitations),
}));

export const accountRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));

export const organizationRelations = relations(organizations, ({ many }) => ({
  members: many(orgMemberships),
  invitations: many(invitations),
  decks: many(decks),
}));

export const memberRelations = relations(orgMemberships, ({ one }) => ({
  organization: one(organizations, {
    fields: [orgMemberships.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [orgMemberships.userId],
    references: [users.id],
  }),
}));

export const invitationRelations = relations(invitations, ({ one }) => ({
  organization: one(organizations, {
    fields: [invitations.organizationId],
    references: [organizations.id],
  }),
  user: one(users, {
    fields: [invitations.inviterId],
    references: [users.id],
  }),
}));

export const deckRelations = relations(decks, ({ one, many }) => ({
  organization: one(organizations, {
    fields: [decks.organizationId],
    references: [organizations.id],
  }),
  slides: many(deckSlides),
  shares: many(deckShares),
  views: many(deckViews),
}));

export const deckSlideRelations = relations(deckSlides, ({ one, many }) => ({
  deck: one(decks, {
    fields: [deckSlides.deckId],
    references: [decks.id],
  }),
  views: many(slideViews),
}));

export const deckShareRelations = relations(deckShares, ({ one, many }) => ({
  deck: one(decks, {
    fields: [deckShares.deckId],
    references: [decks.id],
  }),
  views: many(deckViews),
}));

export const deckViewRelations = relations(deckViews, ({ one, many }) => ({
  deck: one(decks, {
    fields: [deckViews.deckId],
    references: [decks.id],
  }),
  share: one(deckShares, {
    fields: [deckViews.shareId],
    references: [deckShares.id],
  }),
  slideViews: many(slideViews),
}));

export const slideViewRelations = relations(slideViews, ({ one }) => ({
  deckView: one(deckViews, {
    fields: [slideViews.deckViewId],
    references: [deckViews.id],
  }),
  slide: one(deckSlides, {
    fields: [slideViews.slideId],
    references: [deckSlides.id],
  }),
}));

// Enums for type safety
export enum SubscriptionTier {
  FREE = 'free',
  PRO = 'pro',
  BUSINESS = 'business',
}

export enum SubscriptionStatus {
  ACTIVE = 'active',
  CANCELED = 'canceled',
  PAST_DUE = 'past_due',
  UNPAID = 'unpaid',
  INCOMPLETE = 'incomplete',
}

export enum ActivityType {
  SIGN_UP = 'sign_up',
  SIGN_IN = 'sign_in',
  SIGN_OUT = 'sign_out',
  UPDATE_PASSWORD = 'update_password',
  DELETE_ACCOUNT = 'delete_account',
  UPDATE_ACCOUNT = 'update_account',
  UPDATE_PREFERENCES = 'update_preferences',
  UPDATE_PROFILE = 'update_profile',
  PROFILE_IMAGE_UPDATED = 'profile_image_updated',
  SUBSCRIPTION_CREATED = 'subscription_created',
  SUBSCRIPTION_UPDATED = 'subscription_updated',
  SUBSCRIPTION_CANCELED = 'subscription_canceled',
  ORG_CREATED = 'org_created',
  ORG_UPDATED = 'org_updated',
  ORG_DELETED = 'org_deleted',
  ORG_MEMBER_ADDED = 'org_member_added',
  ORG_MEMBER_REMOVED = 'org_member_removed',
  ORG_MEMBER_ROLE_UPDATED = 'org_member_role_updated',
}

// Types (derive from Drizzle schema to avoid Zod instance mismatches)
export type User = InferSelectModel<typeof users>;
export type NewUser = InferInsertModel<typeof users>;
export type Session = InferSelectModel<typeof sessions>;
export type NewSession = InferInsertModel<typeof sessions>;
export type Verification = InferSelectModel<typeof verifications>;
export type NewVerification = InferInsertModel<typeof verifications>;
export type UserSubscription = InferSelectModel<typeof userSubscriptions>;
export type NewUserSubscription = InferInsertModel<typeof userSubscriptions>;
export type ActivityLog = InferSelectModel<typeof activityLogs>;
export type NewActivityLog = InferInsertModel<typeof activityLogs>;
export type Task = InferSelectModel<typeof tasks>;
export type NewTask = InferInsertModel<typeof tasks>;
export type Organization = InferSelectModel<typeof organizations>;
export type NewOrganization = InferInsertModel<typeof organizations>;
export type OrgMembership = InferSelectModel<typeof orgMemberships>;
export type NewOrgMembership = InferInsertModel<typeof orgMemberships>;
export type Order = InferSelectModel<typeof orders>;
export type NewOrder = InferInsertModel<typeof orders>;
export type OrderHistory = InferSelectModel<typeof orderHistory>;
export type NewOrderHistory = InferInsertModel<typeof orderHistory>;

// Infer enum types from schema
export type TaskPriority = (typeof taskPriorityEnum.enumValues)[number];
export type OrgRole = (typeof orgRoleEnum.enumValues)[number];
export type OrderStatus = (typeof orderStatusEnum.enumValues)[number];
export type DeckStatus = (typeof deckStatusEnum.enumValues)[number];

// Deck types
export type Deck = InferSelectModel<typeof decks>;
export type NewDeck = InferInsertModel<typeof decks>;
export type DeckSlide = InferSelectModel<typeof deckSlides>;
export type NewDeckSlide = InferInsertModel<typeof deckSlides>;
export type DeckShare = InferSelectModel<typeof deckShares>;
export type NewDeckShare = InferInsertModel<typeof deckShares>;
export type DeckView = InferSelectModel<typeof deckViews>;
export type NewDeckView = InferInsertModel<typeof deckViews>;
export type SlideView = InferSelectModel<typeof slideViews>;
export type NewSlideView = InferInsertModel<typeof slideViews>;
