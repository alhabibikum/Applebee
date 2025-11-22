import { mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

// Migrate existing products to have "used" condition
export const migrateExistingProducts = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    // Get all products that don't have a condition field
    const products = await ctx.db.query("products").collect();
    
    let updatedCount = 0;
    
    for (const product of products) {
      // If product doesn't have condition field, set it to "used"
      if (!product.condition) {
        await ctx.db.patch(product._id, {
          condition: "used"
        });
        updatedCount++;
      }
    }
    
    return { 
      success: true,
      message: `Updated ${updatedCount} products to 'used' condition`,
      updatedCount 
    };
  },
});
