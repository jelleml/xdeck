#!/usr/bin/env tsx
/**
 * Database Seed Script
 *
 * This script populates the database with dummy data for development and testing.
 * It creates users, organizations, memberships, subscriptions, tasks, and activity logs.
 *
 * ⚠️ WARNING: This script should ONLY be run in development/test environments!
 *
 * Ensure you have run `bun run db:migrate` and `bun run db:push` before running this script.
 *
 * Usage: bun run db:seed
 */
import { faker } from '@faker-js/faker';

import { db } from '@/lib/db/drizzle';
import type { NewOrder, OrderStatus } from '@/lib/types';
import { ORG_ROLES } from '@/lib/types/organization';

import {
  ActivityType,
  type NewActivityLog,
  type NewDeck,
  type NewDeckShare,
  type NewDeckSlide,
  type NewDeckView,
  type NewOrderHistory,
  type NewOrgMembership,
  type NewOrganization,
  type NewSlideView,
  type NewTask,
  type NewUser,
  type NewUserSubscription,
  SubscriptionStatus,
  SubscriptionTier,
  type TaskPriority,
  activityLogs,
  deckShares,
  deckSlides,
  deckViews,
  decks,
  orderHistory,
  orders,
  orgMemberships,
  organizations,
  slideViews,
  tasks,
  userSubscriptions,
  users,
} from '../schema';

if (process.env.NODE_ENV === 'production') {
  console.error('Error: Seed script cannot be run in production environment!');
  console.error('This script is for development and testing only.');
  process.exit(1);
}

console.log('🔒 Environment check passed: Running in development mode\n');

async function seed() {
  console.log('🌱 Starting database seed...\n');
  console.log('📌 Note: If you encounter duplicate key errors, run `bun run db:reset`');

  try {
    const janeSmithEmail = 'jane+kosuke_test@example.com';
    const johnDoeEmail = 'john+kosuke_test@example.com';

    console.log('� Creating users...');

    const johnNewUser: NewUser = {
      email: johnDoeEmail,
      displayName: 'John Doe',
      profileImageUrl: null,
      emailVerified: true,
      role: 'admin',
    };

    const janeNewUser: NewUser = {
      email: janeSmithEmail,
      displayName: 'Jane Smith',
      profileImageUrl: null,
      emailVerified: true,
      role: 'admin',
    };

    const [johnUser] = await db
      .insert(users)
      .values(johnNewUser)
      .onConflictDoUpdate({ target: users.email, set: johnNewUser })
      .returning();

    const [janeUser] = await db
      .insert(users)
      .values(janeNewUser)
      .onConflictDoUpdate({ target: users.email, set: janeNewUser })
      .returning();

    const org1Name = 'Jane Smith Co.';
    const org2Name = 'John Doe Ltd.';

    const org1Slug = 'jane-smith-co';
    const org2Slug = 'john-doe-ltd';

    const org1Data: NewOrganization = {
      name: org1Name,
      slug: org1Slug,
    };

    const org2Data: NewOrganization = {
      name: org2Name,
      slug: org2Slug,
    };

    // Insert or update organizations (in case they already exist from previous seed runs)
    const [insertedOrg1] = await db
      .insert(organizations)
      .values(org1Data)
      .onConflictDoUpdate({
        target: organizations.slug,
        set: org1Data,
      })
      .returning();

    const [insertedOrg2] = await db
      .insert(organizations)
      .values(org2Data)
      .onConflictDoUpdate({
        target: organizations.slug,
        set: org2Data,
      })
      .returning();

    const johnMembershipData: NewOrgMembership = {
      organizationId: insertedOrg1.id,
      createdAt: new Date(),
      userId: johnUser.id,
      role: ORG_ROLES.MEMBER,
    };

    const janeMembershipData: NewOrgMembership = {
      organizationId: insertedOrg1.id,
      createdAt: new Date(),
      userId: janeUser.id,
      role: ORG_ROLES.OWNER,
    };

    const johnOrg2MembershipData: NewOrgMembership = {
      organizationId: insertedOrg2.id,
      createdAt: new Date(),
      userId: johnUser.id,
      role: ORG_ROLES.OWNER,
    };

    // Insert or skip memberships if they already exist
    for (const membership of [janeMembershipData, johnMembershipData, johnOrg2MembershipData]) {
      await db.insert(orgMemberships).values(membership).onConflictDoNothing();
    }

    console.log(`  ✅ Jane is owner of ${org1Name}`);
    console.log(`  ✅ John is member of ${org1Name}`);
    console.log(`  ✅ John is owner of ${org2Name}\n`);

    // Step 6: Create subscriptions
    console.log('💳 Creating subscriptions...');

    const janeSubscription: NewUserSubscription = {
      userId: janeUser.id,
      organizationId: insertedOrg1.id,
      subscriptionType: 'organization',
      status: SubscriptionStatus.ACTIVE,
      tier: SubscriptionTier.FREE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: 'false',
    };

    const johnSubscription: NewUserSubscription = {
      userId: johnUser.id,
      organizationId: insertedOrg2.id,
      subscriptionType: 'organization',
      status: SubscriptionStatus.ACTIVE,
      tier: SubscriptionTier.FREE,
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      stripePriceId: null,
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      cancelAtPeriodEnd: 'false',
    };

    await db.insert(userSubscriptions).values([janeSubscription, johnSubscription]);

    console.log(`  ✅ ${org1Name}: Business tier`);
    console.log(`  ✅ ${org2Name}: Pro tier\n`);

    // Step 7: Create tasks
    console.log('📝 Creating tasks...');

    const taskPriorities: TaskPriority[] = ['low', 'medium', 'high'];

    // Personal tasks for Jane
    const janePersonalTasks: NewTask[] = Array.from({ length: 5 }, (_, i) => ({
      userId: janeUser.id,
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      description: faker.lorem.paragraph(),
      completed: i % 3 === 0 ? 'true' : 'false',
      priority: taskPriorities[i % 3],
      dueDate: faker.date.future(),
    }));

    // Organization tasks for org1
    const org1Tasks: NewTask[] = Array.from({ length: 5 }, (_, i) => ({
      userId: i % 2 === 0 ? janeUser.id : johnUser.id,
      organizationId: insertedOrg1.id,
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      description: faker.lorem.paragraph(),
      completed: i % 4 === 0 ? 'true' : 'false',
      priority: taskPriorities[i % 3],
      dueDate: faker.date.future(),
    }));

    // Personal tasks for John
    const johnPersonalTasks: NewTask[] = Array.from({ length: 5 }, (_, i) => ({
      userId: johnUser.id,
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      description: faker.lorem.paragraph(),
      completed: i % 2 === 0 ? 'true' : 'false',
      priority: taskPriorities[i % 3],
      dueDate: faker.date.future(),
    }));

    // Organization tasks for org2
    const org2Tasks: NewTask[] = Array.from({ length: 5 }, (_, i) => ({
      userId: johnUser.id,
      organizationId: insertedOrg2.id,
      title: faker.lorem.sentence({ min: 3, max: 6 }),
      description: faker.lorem.paragraph(),
      completed: i % 3 === 0 ? 'true' : 'false',
      priority: taskPriorities[i % 3],
      dueDate: faker.date.future(),
    }));

    await db
      .insert(tasks)
      .values([...janePersonalTasks, ...org1Tasks, ...johnPersonalTasks, ...org2Tasks]);

    console.log('  ✅ Created 5 personal tasks for Jane');
    console.log(`  ✅ Created 5 organization tasks for ${org1Name}`);
    console.log('  ✅ Created 5 personal tasks for John');
    console.log(`  ✅ Created 5 organization tasks for ${org2Name}\n`);

    // Step 8: Create activity logs
    console.log('📊 Creating activity logs...');

    const activityTypes = [
      ActivityType.SIGN_IN,
      ActivityType.UPDATE_PROFILE,
      ActivityType.PROFILE_IMAGE_UPDATED,
      ActivityType.UPDATE_PREFERENCES,
      ActivityType.ORG_CREATED,
      ActivityType.ORG_MEMBER_ADDED,
      ActivityType.SUBSCRIPTION_CREATED,
    ];

    const janeActivities: NewActivityLog[] = Array.from({ length: 5 }, (_, i) => ({
      userId: janeUser.id,
      action: activityTypes[i % activityTypes.length],
      timestamp: faker.date.recent({ days: 30 }),
      ipAddress: faker.internet.ipv4(),
      metadata: JSON.stringify({
        userAgent: faker.internet.userAgent(),
        location: faker.location.city(),
      }),
    }));

    const johnActivities: NewActivityLog[] = Array.from({ length: 5 }, (_, i) => ({
      userId: johnUser.id,
      action: activityTypes[i % activityTypes.length],
      timestamp: faker.date.recent({ days: 30 }),
      ipAddress: faker.internet.ipv4(),
      metadata: JSON.stringify({
        userAgent: faker.internet.userAgent(),
        location: faker.location.city(),
      }),
    }));

    await db.insert(activityLogs).values([...janeActivities, ...johnActivities]);

    console.log('  ✅ Created 5 activity logs for Jane');
    console.log('  ✅ Created 5 activity logs for John\n');

    // Step 9: Create orders
    console.log('🛒 Creating orders...');

    const orderStatuses: OrderStatus[] = [
      'pending',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
    ];

    // Orders for org1 (Jane's organization)
    const org1Orders: NewOrder[] = Array.from({ length: 15 }, (_, i) => {
      const amount = faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }).toFixed(2);
      const orderDate = faker.date.recent({ days: 60 });

      return {
        // orderNumber will be auto-generated by database as UUID
        customerName: faker.person.fullName(),
        userId: i % 2 === 0 ? janeUser.id : johnUser.id,
        organizationId: insertedOrg1.id,
        status: orderStatuses[i % orderStatuses.length],
        amount,
        currency: 'USD',
        orderDate,
        notes: i % 3 === 0 ? faker.lorem.sentence() : null,
        createdAt: orderDate,
      };
    });

    // Orders for org2 (John's organization)
    const org2Orders: NewOrder[] = Array.from({ length: 15 }, (_, i) => {
      const amount = faker.number.float({ min: 50, max: 5000, fractionDigits: 2 }).toFixed(2);
      const orderDate = faker.date.recent({ days: 60 });

      return {
        // orderNumber will be auto-generated by database as UUID
        customerName: faker.person.fullName(),
        userId: johnUser.id,
        organizationId: insertedOrg2.id,
        status: orderStatuses[i % orderStatuses.length],
        amount,
        currency: 'USD',
        orderDate,
        notes: i % 4 === 0 ? faker.lorem.sentence() : null,
        createdAt: orderDate,
      };
    });

    const insertedOrders = await db
      .insert(orders)
      .values([...org1Orders, ...org2Orders])
      .returning();

    console.log(`  ✅ Created 15 orders for ${org1Name}`);
    console.log(`  ✅ Created 15 orders for ${org2Name}\n`);

    // Step 10: Create order history
    console.log('📜 Creating order history...');

    const statusProgression: Record<OrderStatus, OrderStatus[]> = {
      pending: ['pending'],
      processing: ['pending', 'processing'],
      shipped: ['pending', 'processing', 'shipped'],
      delivered: ['pending', 'processing', 'shipped', 'delivered'],
      cancelled: ['pending', 'cancelled'],
    };

    const statusNotes: Record<OrderStatus, string[]> = {
      pending: ['Order created', 'Order received', 'Payment pending'],
      processing: [
        'Payment confirmed',
        'Order is being prepared',
        'Items being packaged',
        'Quality check in progress',
      ],
      shipped: [
        'Order shipped',
        'Package handed to carrier',
        'Out for delivery',
        'In transit to destination',
      ],
      delivered: [
        'Order delivered successfully',
        'Package delivered to customer',
        'Signed for delivery',
        'Left at front door',
      ],
      cancelled: [
        'Order cancelled by customer',
        'Order cancelled - payment failed',
        'Order cancelled - out of stock',
        'Cancelled due to customer request',
      ],
    };

    const allHistoryEntries: NewOrderHistory[] = [];

    for (const order of insertedOrders) {
      const progression = statusProgression[order.status];
      const orderDate = new Date(order.orderDate);

      // Calculate total days needed for all statuses
      const totalStatuses = progression.length;

      for (let i = 0; i < totalStatuses; i++) {
        const status = progression[i];
        const notes = statusNotes[status];
        const note = notes[Math.floor(Math.random() * notes.length)];

        // Calculate timestamps: start from oldest (first status) to newest (current status)
        // Work backwards from order date: last status is closest to orderDate
        const statusesFromEnd = totalStatuses - 1 - i;
        const daysOffset = statusesFromEnd * faker.number.int({ min: 1, max: 3 });
        const hoursOffset = faker.number.int({ min: 1, max: 12 });
        const statusDate = new Date(orderDate);
        statusDate.setDate(statusDate.getDate() - daysOffset);
        statusDate.setHours(statusDate.getHours() - hoursOffset);

        // 30% chance of system update (null userId), 70% chance of user update
        const isSystemUpdate = Math.random() < 0.3;
        const userId = isSystemUpdate ? null : order.userId;

        allHistoryEntries.push({
          orderId: order.id,
          userId,
          status,
          notes: note,
          createdAt: statusDate,
        });
      }
    }

    await db.insert(orderHistory).values(allHistoryEntries);

    console.log(`  ✅ Created ${allHistoryEntries.length} order history entries\n`);

    // Seed Decks
    console.log('📊 Creating decks...');

    const deckData: NewDeck[] = [
      {
        organizationId: insertedOrg1.id,
        userId: janeUser.id,
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        status: 'completed',
        crawledContent: faker.lorem.paragraphs(3),
        retryCount: '0',
      },
      {
        organizationId: insertedOrg1.id,
        userId: janeUser.id,
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        status: 'completed',
        crawledContent: faker.lorem.paragraphs(3),
        retryCount: '0',
      },
      {
        organizationId: insertedOrg1.id,
        userId: johnUser.id,
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        status: 'completed',
        crawledContent: faker.lorem.paragraphs(3),
        retryCount: '0',
      },
      {
        organizationId: insertedOrg2.id,
        userId: johnUser.id,
        name: faker.company.name(),
        domain: faker.internet.domainName(),
        status: 'completed',
        crawledContent: faker.lorem.paragraphs(3),
        retryCount: '0',
      },
    ];

    const insertedDecks = await db.insert(decks).values(deckData).returning();

    console.log(`  ✅ Created ${insertedDecks.length} decks\n`);

    // Seed Deck Slides
    console.log('📄 Creating deck slides...');

    const slideData: NewDeckSlide[] = [];
    const slideTemplates = [
      { title: 'Introduction', content: '# Introduction\n\n' + faker.lorem.paragraphs(2) },
      { title: 'Problem Statement', content: '# Problem\n\n' + faker.lorem.paragraphs(2) },
      { title: 'Solution', content: '# Our Solution\n\n' + faker.lorem.paragraphs(2) },
      { title: 'Features', content: '# Key Features\n\n' + faker.lorem.paragraphs(2) },
      { title: 'Call to Action', content: '# Get Started\n\n' + faker.lorem.paragraphs(1) },
    ];

    for (const deck of insertedDecks) {
      for (let i = 0; i < 5; i++) {
        const template = slideTemplates[i];
        slideData.push({
          deckId: deck.id,
          slideNumber: String(i + 1),
          title: template.title,
          content: template.content,
        });
      }
    }

    const insertedSlides = await db.insert(deckSlides).values(slideData).returning();

    console.log(`  ✅ Created ${insertedSlides.length} deck slides\n`);

    // Seed Deck Shares (one share per deck)
    console.log('🔗 Creating deck shares...');

    const shareData: NewDeckShare[] = insertedDecks.map((deck) => ({
      deckId: deck.id,
      isActive: true,
    }));

    const insertedShares = await db.insert(deckShares).values(shareData).returning();

    console.log(`  ✅ Created ${insertedShares.length} deck shares\n`);

    // Seed Deck Views (realistic view patterns)
    console.log('👁️ Creating deck views...');

    const viewData: NewDeckView[] = [];
    const now = new Date();

    // Create 50-100 views across all decks over the past 30 days
    const totalViews = faker.number.int({ min: 50, max: 100 });

    for (let i = 0; i < totalViews; i++) {
      const randomDeck = insertedDecks[Math.floor(Math.random() * insertedDecks.length)];
      const randomShare = insertedShares.find((s) => s.deckId === randomDeck.id);

      // Random date within past 30 days
      const daysAgo = faker.number.int({ min: 0, max: 30 });
      const hoursAgo = faker.number.int({ min: 0, max: 23 });
      const viewDate = new Date(now);
      viewDate.setDate(viewDate.getDate() - daysAgo);
      viewDate.setHours(viewDate.getHours() - hoursAgo);

      // View duration: 30 seconds to 10 minutes
      const viewDuration = String(faker.number.int({ min: 30, max: 600 }));

      viewData.push({
        deckId: randomDeck.id,
        shareId: randomShare?.id ?? null,
        viewDuration,
        viewedAt: viewDate,
      });
    }

    const insertedViews = await db.insert(deckViews).values(viewData).returning();

    console.log(`  ✅ Created ${insertedViews.length} deck views\n`);

    // Seed Slide Views (2-5 slides viewed per deck view)
    console.log('📑 Creating slide views...');

    const slideViewData: NewSlideView[] = [];

    for (const view of insertedViews) {
      // Get slides for this deck
      const deckSlidesList = insertedSlides.filter((s) => s.deckId === view.deckId);

      // View 2-5 random slides
      const slidesToView = faker.number.int({ min: 2, max: Math.min(5, deckSlidesList.length) });
      const shuffledSlides = faker.helpers.shuffle(deckSlidesList);

      for (let i = 0; i < slidesToView; i++) {
        const slide = shuffledSlides[i];
        // Slides viewed a few seconds apart
        const slideViewDate = new Date(view.viewedAt);
        slideViewDate.setSeconds(slideViewDate.getSeconds() + i * faker.number.int({ min: 5, max: 30 }));

        slideViewData.push({
          deckViewId: view.id,
          slideId: slide.id,
          viewedAt: slideViewDate,
        });
      }
    }

    const insertedSlideViews = await db.insert(slideViews).values(slideViewData).returning();

    console.log(`  ✅ Created ${insertedSlideViews.length} slide views\n`);

    console.log('✅ Database seeding completed successfully!\n');
    console.log('📊 Summary:');
    console.log('  • 2 users created');
    console.log('  • 2 organizations created');
    console.log('  • 3 organization memberships created');
    console.log('  • 2 subscriptions created');
    console.log('  • 20 tasks created');
    console.log('  • 10 activity logs created');
    console.log('  • 30 orders created');
    console.log(`  • ${allHistoryEntries.length} order history entries created`);
    console.log(`  • ${insertedDecks.length} decks created`);
    console.log(`  • ${insertedSlides.length} deck slides created`);
    console.log(`  • ${insertedShares.length} deck shares created`);
    console.log(`  • ${insertedViews.length} deck views created`);
    console.log(`  • ${insertedSlideViews.length} slide views created\n`);
    console.log('🔑 Test Users:');
    console.log(`  • ${janeSmithEmail} (Admin of ${org1Name})`);
    console.log(`  • ${johnDoeEmail} (Admin of ${org2Name}, Member of ${org1Name})\n`);
    console.log(
      "    To log in with the test users, use Kosuke's verification code: \x1b[1m424242\x1b[0m"
    );
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .catch((error) => {
    console.error('Fatal error:', error);
    process.exit(1);
  })
  .finally(() => {
    process.exit(0);
  });
