/**
 * Prisma Query Helpers
 *
 * Common database queries for GenAI-Merch
 * Provides type-safe, reusable database operations
 */

import { prisma } from "@/lib/prisma";
import type { User, Design, Order, GroupOrder, Organization } from "@prisma/client";

// ==================== User Queries ====================

/**
 * Get user by ID
 * @param id - User ID
 * @returns User or null if not found
 */
export async function getUserById(id: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { id },
  });
}

/**
 * Get user by email
 * @param email - User email
 * @returns User or null if not found
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({
    where: { email },
  });
}

/**
 * Create or update user (used after Supabase auth)
 * @param data - User data
 * @returns Created or updated user
 */
export async function upsertUser(data: {
  id: string;
  email: string;
  name?: string;
}): Promise<User> {
  return prisma.user.upsert({
    where: { id: data.id },
    update: {
      email: data.email,
      name: data.name,
    },
    create: {
      id: data.id,
      email: data.email,
      name: data.name,
    },
  });
}

// ==================== Design Queries ====================

/**
 * Get all designs for a user
 * @param userId - User ID
 * @returns Array of designs
 */
export async function getDesignsByUserId(userId: string): Promise<Design[]> {
  return prisma.design.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get design by ID
 * @param id - Design ID
 * @returns Design or null if not found
 */
export async function getDesignById(id: string): Promise<Design | null> {
  return prisma.design.findUnique({
    where: { id },
    include: {
      user: true,
    },
  });
}

/**
 * Create a new design
 * @param data - Design data
 * @returns Created design
 */
export async function createDesign(data: {
  userId: string;
  name: string;
  imageUrl: string;
  vectorUrl?: string;
  metadata: object;
  aiPrompt?: string;
}): Promise<Design> {
  return prisma.design.create({
    data,
  });
}

/**
 * Delete design by ID
 * @param id - Design ID
 * @returns Deleted design
 */
export async function deleteDesign(id: string): Promise<Design> {
  return prisma.design.delete({
    where: { id },
  });
}

// ==================== Order Queries ====================

/**
 * Get all orders for a user
 * @param userId - User ID
 * @returns Array of orders with design details
 */
export async function getOrdersByUserId(userId: string): Promise<Order[]> {
  return prisma.order.findMany({
    where: { userId },
    include: {
      items: true,
      groupOrder: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Get order by ID
 * @param id - Order ID
 * @returns Order with all relations
 */
export async function getOrderById(id: string) {
  return prisma.order.findUnique({
    where: { id },
    include: {
      user: true,
      items: true,
      groupOrder: true,
    },
  });
}

/**
 * Create a new order
 * @param data - Order data
 * @returns Created order
 */
export async function createOrder(data: {
  userId: string;
  orderNumber: string;
  groupOrderId?: string;
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  currency?: string;
  shippingAddressId?: string;
  stripeCheckoutSessionId?: string;
  items: {
    productVariantId: string;
    productName: string;
    variantName: string;
    designId?: string;
    customizationData?: object;
    quantity: number;
    unitPrice: number;
    thumbnailUrl?: string;
  }[];
}) {
  return prisma.order.create({
    data: {
      userId: data.userId,
      orderNumber: data.orderNumber,
      groupOrderId: data.groupOrderId,
      subtotal: data.subtotal,
      shipping: data.shipping,
      tax: data.tax,
      total: data.total,
      currency: data.currency || 'USD',
      shippingAddressId: data.shippingAddressId,
      stripeCheckoutSessionId: data.stripeCheckoutSessionId,
      items: {
        create: data.items,
      },
    },
    include: {
      items: true,
    },
  });
}

/**
 * Update order status
 * @param id - Order ID
 * @param status - New status
 * @returns Updated order
 */
export async function updateOrderStatus(
  id: string,
  status: string
): Promise<Order> {
  return prisma.order.update({
    where: { id },
    data: { status },
  });
}

// ==================== Group Order Queries ====================

/**
 * Get group order by slug
 * @param slug - Group order slug
 * @returns Group order with all orders
 */
export async function getGroupOrderBySlug(slug: string) {
  return prisma.groupOrder.findUnique({
    where: { slug },
    include: {
      createdBy: true,
      orders: {
        include: {
          user: true,
          items: true,
        },
      },
    },
  });
}

/**
 * Get all group orders created by a user
 * @param userId - User ID
 * @returns Array of group orders
 */
export async function getGroupOrdersByUserId(
  userId: string
): Promise<GroupOrder[]> {
  return prisma.groupOrder.findMany({
    where: { createdById: userId },
    include: {
      orders: true,
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Create a new group order
 * @param data - Group order data
 * @returns Created group order
 */
export async function createGroupOrder(data: {
  name: string;
  slug: string;
  deadline: Date;
  createdById: string;
}) {
  return prisma.groupOrder.create({
    data,
  });
}

/**
 * Update group order status
 * @param id - Group order ID
 * @param status - New status
 * @returns Updated group order
 */
export async function updateGroupOrderStatus(
  id: string,
  status: string
): Promise<GroupOrder> {
  return prisma.groupOrder.update({
    where: { id },
    data: { status },
  });
}

// ==================== Organization Queries ====================

/**
 * Get organization by slug
 * @param slug - Organization slug
 * @returns Organization with members
 */
export async function getOrganizationBySlug(slug: string) {
  return prisma.organization.findUnique({
    where: { slug },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      brandProfile: true,
    },
  });
}

/**
 * Get all organizations for a user
 * @param userId - User ID
 * @returns Array of organizations
 */
export async function getOrganizationsByUserId(userId: string) {
  return prisma.organizationMember.findMany({
    where: { userId },
    include: {
      organization: {
        include: {
          brandProfile: true,
        },
      },
    },
  });
}

/**
 * Create a new organization
 * @param data - Organization data
 * @param ownerId - ID of the user who will be the owner
 * @returns Created organization with owner membership
 */
export async function createOrganization(
  data: {
    name: string;
    slug: string;
  },
  ownerId: string
): Promise<Organization> {
  return prisma.organization.create({
    data: {
      ...data,
      members: {
        create: {
          userId: ownerId,
          role: "owner",
        },
      },
    },
  });
}

/**
 * Add user to organization
 * @param userId - User ID
 * @param organizationId - Organization ID
 * @param role - User role (member, admin, owner)
 */
export async function addOrganizationMember(
  userId: string,
  organizationId: string,
  role: string = "member"
) {
  return prisma.organizationMember.create({
    data: {
      userId,
      organizationId,
      role,
    },
  });
}
