import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Get all users with their profiles and roles
export const getAllUsers = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Get all users from auth table
    const users = await ctx.db.query("users").collect();
    
    // Get profiles and roles for each user
    const usersWithDetails = await Promise.all(
      users.map(async (user) => {
        const profile = await ctx.db
          .query("userProfiles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();
        
        const role = await ctx.db
          .query("userRoles")
          .withIndex("by_user", (q) => q.eq("userId", user._id))
          .first();

        return {
          ...user,
          profile,
          role: role?.role || "viewer",
          permissions: role?.permissions || [],
          isActive: role?.isActive ?? true,
        };
      })
    );

    return usersWithDetails;
  },
});

// Create or update current user profile automatically
export const ensureUserProfile = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!existingProfile) {
      // Create default profile
      await ctx.db.insert("userProfiles", {
        userId: currentUserId,
        isActive: true,
        createdBy: currentUserId,
      });
    }

    return { success: true };
  },
});

// Ensure user has a role
export const ensureUserRole = mutation({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    if (!existingRole) {
      const allUsers = await ctx.db.query("users").collect();
      const isFirstUser = allUsers.length <= 1;
      
      await ctx.db.insert("userRoles", {
        userId: currentUserId,
        role: isFirstUser ? "admin" : "viewer",
        permissions: isFirstUser ? ["manage_users", "manage_inventory", "manage_sales"] : ["view_reports"],
        isActive: true,
        assignedBy: currentUserId,
        assignedAt: Date.now(),
      });
    }

    return { success: true };
  },
});

// Get current user with profile and role
export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      return null;
    }

    const user = await ctx.db.get(currentUserId);
    if (!user) {
      return null;
    }

    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();
    
    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", currentUserId))
      .first();

    return {
      ...user,
      profile,
      role: role?.role || "viewer",
      permissions: role?.permissions || [],
      isActive: role?.isActive ?? true,
    };
  },
});

export const createUserProfile = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    hireDate: v.optional(v.string()),
    department: v.optional(v.string()),
    salary: v.optional(v.number()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
    notes: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if profile already exists
    const existingProfile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingProfile) {
      throw new Error("User profile already exists");
    }

    return await ctx.db.insert("userProfiles", {
      userId: args.userId,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      address: args.address,
      dateOfBirth: args.dateOfBirth,
      hireDate: args.hireDate,
      department: args.department,
      salary: args.salary,
      emergencyContact: args.emergencyContact,
      notes: args.notes,
      isActive: true,
      createdBy: currentUserId,
    });
  },
});

// Update user profile
export const updateUserProfile = mutation({
  args: {
    profileId: v.id("userProfiles"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    address: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    hireDate: v.optional(v.string()),
    department: v.optional(v.string()),
    salary: v.optional(v.number()),
    emergencyContact: v.optional(v.object({
      name: v.string(),
      phone: v.string(),
      relationship: v.string(),
    })),
    notes: v.optional(v.string()),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const { profileId, ...updates } = args;
    return await ctx.db.patch(profileId, updates);
  },
});

// Assign or update user role
export const assignUserRole = mutation({
  args: {
    userId: v.id("users"),
    role: v.union(
      v.literal("admin"),
      v.literal("manager"),
      v.literal("cashier"),
      v.literal("viewer")
    ),
    permissions: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Check if role already exists
    const existingRole = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (existingRole) {
      // Update existing role
      return await ctx.db.patch(existingRole._id, {
        role: args.role,
        permissions: args.permissions,
        assignedBy: currentUserId,
        assignedAt: Date.now(),
      });
    } else {
      // Create new role
      return await ctx.db.insert("userRoles", {
        userId: args.userId,
        role: args.role,
        permissions: args.permissions,
        isActive: true,
        assignedBy: currentUserId,
        assignedAt: Date.now(),
      });
    }
  },
});

// Toggle user active status
export const toggleUserStatus = mutation({
  args: {
    userId: v.id("users"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Update profile status
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { isActive: args.isActive });
    }

    // Update role status
    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (role) {
      await ctx.db.patch(role._id, { isActive: args.isActive });
    }

    return { success: true };
  },
});

// Delete user (soft delete by deactivating)
export const deleteUser = mutation({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    // Don't allow users to delete themselves
    if (currentUserId === args.userId) {
      throw new Error("Cannot delete your own account");
    }

    // Deactivate user profile
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (profile) {
      await ctx.db.patch(profile._id, { isActive: false });
    }

    // Deactivate user role
    const role = await ctx.db
      .query("userRoles")
      .withIndex("by_user", (q) => q.eq("userId", args.userId))
      .first();

    if (role) {
      await ctx.db.patch(role._id, { isActive: false });
    }

    return { success: true };
  },
});

// Get user statistics
export const getUserStats = query({
  args: {},
  handler: async (ctx) => {
    const currentUserId = await getAuthUserId(ctx);
    if (!currentUserId) {
      throw new Error("Not authenticated");
    }

    const allUsers = await ctx.db.query("users").collect();
    const activeProfiles = await ctx.db
      .query("userProfiles")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    const roles = await ctx.db.query("userRoles").collect();
    const roleStats = roles.reduce((acc, role) => {
      if (role.isActive) {
        acc[role.role] = (acc[role.role] || 0) + 1;
      }
      return acc;
    }, {} as Record<string, number>);

    return {
      totalUsers: allUsers.length,
      activeUsers: activeProfiles.length,
      inactiveUsers: allUsers.length - activeProfiles.length,
      roleDistribution: roleStats,
    };
  },
});
