/**
 * Database Seeding Script
 *
 * Creates sample data for development and testing
 * Run with: npm run db:seed
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting database seed...");

  // Clean existing data (optional - comment out to preserve data)
  console.log("🧹 Cleaning existing data...");
  await prisma.order.deleteMany();
  await prisma.groupOrder.deleteMany();
  await prisma.design.deleteMany();
  await prisma.brandProfile.deleteMany();
  await prisma.organizationMember.deleteMany();
  await prisma.organization.deleteMany();
  await prisma.user.deleteMany();

  // Create Users
  console.log("👥 Creating users...");
  const users = await Promise.all([
    prisma.user.create({
      data: {
        id: "user-1-sarah",
        email: "sarah.johnson@example.com",
        name: "Sarah Johnson",
      },
    }),
    prisma.user.create({
      data: {
        id: "user-2-mike",
        email: "mike.chen@example.com",
        name: "Mike Chen",
      },
    }),
    prisma.user.create({
      data: {
        id: "user-3-emily",
        email: "emily.rodriguez@example.com",
        name: "Emily Rodriguez",
      },
    }),
  ]);
  console.log(`✓ Created ${users.length} users`);

  // Create Organizations
  console.log("🏢 Creating organizations...");
  const organizations = await Promise.all([
    prisma.organization.create({
      data: {
        name: "Sunrise Soccer Club",
        slug: "sunrise-soccer-club",
        members: {
          create: {
            userId: users[0].id,
            role: "owner",
          },
        },
      },
    }),
    prisma.organization.create({
      data: {
        name: "TechCorp Inc",
        slug: "techcorp-inc",
        members: {
          create: [
            {
              userId: users[1].id,
              role: "owner",
            },
            {
              userId: users[2].id,
              role: "admin",
            },
          ],
        },
      },
    }),
  ]);
  console.log(`✓ Created ${organizations.length} organizations`);

  // Create Brand Profile
  console.log("🎨 Creating brand profiles...");
  const brandProfile = await prisma.brandProfile.create({
    data: {
      organizationId: organizations[1].id,
      logoUrl: "https://images.unsplash.com/photo-1611162617474-5b21e879e113",
      colorPalette: [
        "#3B82F6", // Blue
        "#10B981", // Green
        "#F59E0B", // Amber
        "#EF4444", // Red
        "#8B5CF6", // Purple
      ],
      fonts: {
        heading: "Inter",
        body: "Inter",
        logo: "Playfair Display",
      },
    },
  });
  console.log(`✓ Created brand profile for ${organizations[1].name}`);

  // Create Designs
  console.log("🎨 Creating designs...");
  const designs = await Promise.all([
    prisma.design.create({
      data: {
        userId: users[0].id,
        name: "Summer Camp 2024 Logo",
        imageUrl: "https://images.unsplash.com/photo-1626785774573-4b799315345d",
        vectorUrl: "https://example.com/designs/summer-camp-2024.svg",
        metadata: {
          dpi: 300,
          width: 4500,
          height: 5400,
          colors: ["#FF6B6B", "#4ECDC4", "#FFE66D"],
          fileSize: 2048000,
        },
        aiPrompt:
          "Create a vibrant summer camp logo with mountains, trees, and a campfire",
      },
    }),
    prisma.design.create({
      data: {
        userId: users[0].id,
        name: "Soccer Team Champions",
        imageUrl: "https://images.unsplash.com/photo-1614632537197-38a17061f1c3",
        vectorUrl: "https://example.com/designs/soccer-champions.svg",
        metadata: {
          dpi: 300,
          width: 4500,
          height: 5400,
          colors: ["#1E40AF", "#FBBF24", "#FFFFFF"],
          fileSize: 1536000,
        },
        aiPrompt: "Design a soccer team logo with a trophy and soccer ball",
      },
    }),
    prisma.design.create({
      data: {
        userId: users[1].id,
        name: "TechCorp Conference 2024",
        imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87",
        metadata: {
          dpi: 300,
          width: 4500,
          height: 5400,
          colors: ["#3B82F6", "#10B981", "#1F2937"],
          fileSize: 1843200,
        },
        aiPrompt:
          "Modern tech conference logo with circuit board patterns and geometric shapes",
      },
    }),
    prisma.design.create({
      data: {
        userId: users[1].id,
        name: "Employee Appreciation Week",
        imageUrl: "https://images.unsplash.com/photo-1556740749-887f6717d7e4",
        metadata: {
          dpi: 300,
          width: 4500,
          height: 5400,
          colors: ["#8B5CF6", "#EC4899", "#F59E0B"],
          fileSize: 1638400,
        },
      },
    }),
    prisma.design.create({
      data: {
        userId: users[2].id,
        name: "Family Reunion 2024",
        imageUrl: "https://images.unsplash.com/photo-1511895426328-dc8714191300",
        metadata: {
          dpi: 300,
          width: 4500,
          height: 5400,
          colors: ["#10B981", "#F59E0B", "#EF4444"],
          fileSize: 2457600,
        },
        aiPrompt: "Warm family reunion design with a family tree illustration",
      },
    }),
  ]);
  console.log(`✓ Created ${designs.length} designs`);

  // Create Group Orders
  console.log("📦 Creating group orders...");
  const groupOrders = await Promise.all([
    prisma.groupOrder.create({
      data: {
        name: "Summer Camp Team Shirts",
        slug: "summer-camp-2024",
        deadline: new Date("2024-06-15"),
        status: "open",
        createdById: users[0].id,
      },
    }),
    prisma.groupOrder.create({
      data: {
        name: "Tech Conference Hoodies",
        slug: "techconf-2024-hoodies",
        deadline: new Date("2024-08-01"),
        status: "open",
        createdById: users[1].id,
      },
    }),
  ]);
  console.log(`✓ Created ${groupOrders.length} group orders`);

  // Create Orders
  console.log("🛒 Creating orders...");
  const orders = await Promise.all([
    // Orders for Group Order 1
    prisma.order.create({
      data: {
        userId: users[0].id,
        designId: designs[0].id,
        groupOrderId: groupOrders[0].id,
        productType: "t-shirt",
        size: "M",
        quantity: 2,
        status: "pending",
        price: 4998, // $49.98 in cents
        shippingAddress: {
          name: "Sarah Johnson",
          street: "123 Main St",
          city: "Portland",
          state: "OR",
          zip: "97201",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[2].id,
        designId: designs[0].id,
        groupOrderId: groupOrders[0].id,
        productType: "t-shirt",
        size: "L",
        quantity: 1,
        status: "pending",
        price: 2499, // $24.99 in cents
        shippingAddress: {
          name: "Emily Rodriguez",
          street: "456 Oak Ave",
          city: "Portland",
          state: "OR",
          zip: "97202",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[0].id,
        designId: designs[1].id,
        groupOrderId: groupOrders[0].id,
        productType: "t-shirt",
        size: "S",
        quantity: 3,
        status: "processing",
        price: 7497, // $74.97 in cents
        stripeSessionId: "cs_test_abc123",
        shippingAddress: {
          name: "Sarah Johnson",
          street: "123 Main St",
          city: "Portland",
          state: "OR",
          zip: "97201",
          country: "US",
        },
      },
    }),

    // Orders for Group Order 2
    prisma.order.create({
      data: {
        userId: users[1].id,
        designId: designs[2].id,
        groupOrderId: groupOrders[1].id,
        productType: "hoodie",
        size: "XL",
        quantity: 1,
        status: "processing",
        price: 4999, // $49.99 in cents
        stripeSessionId: "cs_test_xyz789",
        printfulOrderId: "12345678",
        shippingAddress: {
          name: "Mike Chen",
          street: "789 Tech Blvd",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[2].id,
        designId: designs[2].id,
        groupOrderId: groupOrders[1].id,
        productType: "hoodie",
        size: "M",
        quantity: 1,
        status: "shipped",
        price: 4999, // $49.99 in cents
        stripeSessionId: "cs_test_def456",
        printfulOrderId: "12345679",
        shippingAddress: {
          name: "Emily Rodriguez",
          street: "456 Oak Ave",
          city: "Portland",
          state: "OR",
          zip: "97202",
          country: "US",
        },
      },
    }),

    // Individual Orders (not part of group orders)
    prisma.order.create({
      data: {
        userId: users[1].id,
        designId: designs[3].id,
        productType: "polo",
        size: "L",
        quantity: 5,
        status: "delivered",
        price: 24995, // $249.95 in cents
        stripeSessionId: "cs_test_ghi789",
        printfulOrderId: "12345680",
        shippingAddress: {
          name: "Mike Chen",
          street: "789 Tech Blvd",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[2].id,
        designId: designs[4].id,
        productType: "t-shirt",
        size: "M",
        quantity: 10,
        status: "pending",
        price: 24990, // $249.90 in cents
        shippingAddress: {
          name: "Emily Rodriguez",
          street: "456 Oak Ave",
          city: "Portland",
          state: "OR",
          zip: "97202",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[0].id,
        designId: designs[1].id,
        productType: "hoodie",
        size: "L",
        quantity: 2,
        status: "processing",
        price: 9998, // $99.98 in cents
        stripeSessionId: "cs_test_jkl012",
        shippingAddress: {
          name: "Sarah Johnson",
          street: "123 Main St",
          city: "Portland",
          state: "OR",
          zip: "97201",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[1].id,
        designId: designs[2].id,
        productType: "t-shirt",
        size: "XL",
        quantity: 1,
        status: "shipped",
        price: 2499, // $24.99 in cents
        stripeSessionId: "cs_test_mno345",
        printfulOrderId: "12345681",
        shippingAddress: {
          name: "Mike Chen",
          street: "789 Tech Blvd",
          city: "San Francisco",
          state: "CA",
          zip: "94105",
          country: "US",
        },
      },
    }),
    prisma.order.create({
      data: {
        userId: users[0].id,
        designId: designs[0].id,
        productType: "polo",
        size: "M",
        quantity: 3,
        status: "delivered",
        price: 14997, // $149.97 in cents
        stripeSessionId: "cs_test_pqr678",
        printfulOrderId: "12345682",
        shippingAddress: {
          name: "Sarah Johnson",
          street: "123 Main St",
          city: "Portland",
          state: "OR",
          zip: "97201",
          country: "US",
        },
      },
    }),
  ]);
  console.log(`✓ Created ${orders.length} orders`);

  // Summary
  console.log("\n✅ Database seeded successfully!");
  console.log("═══════════════════════════════════");
  console.log(`Users: ${users.length}`);
  console.log(`Organizations: ${organizations.length}`);
  console.log(`Brand Profiles: 1`);
  console.log(`Designs: ${designs.length}`);
  console.log(`Group Orders: ${groupOrders.length}`);
  console.log(`Orders: ${orders.length}`);
  console.log("═══════════════════════════════════");
  console.log("\n🎯 Test the data:");
  console.log("   npm run db:studio");
  console.log("   Open http://localhost:5555");
}

main()
  .catch((e) => {
    console.error("❌ Error seeding database:");
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
