/**
 * Seed Products to Convex
 * 
 * Run with: node scripts/seed-products.mjs
 * 
 * This script reads products from src/assets/products.json
 * and inserts them into the Convex "products" table.
 * It is idempotent — safe to run multiple times.
 */

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));

// Load products from JSON
const jsonPath = resolve(__dirname, "../src/assets/products.json");
const raw = JSON.parse(readFileSync(jsonPath, "utf-8"));
const products = raw.products;

// Read Convex URL from .env.local
const envPath = resolve(__dirname, "../.env.local");
const envContent = readFileSync(envPath, "utf-8");
const convexUrl = envContent
    .split("\n")
    .find(line => line.startsWith("VITE_CONVEX_URL="))
    ?.split("=")[1]
    ?.trim();

if (!convexUrl) {
    console.error("❌ Could not find VITE_CONVEX_URL in .env.local");
    process.exit(1);
}

console.log(`🔗 Connecting to Convex: ${convexUrl}`);
console.log(`📦 Found ${products.length} products to seed`);

const client = new ConvexHttpClient(convexUrl);

// Map products to match the seed mutation schema
const seedData = products.map((p) => ({
    id: p.id,
    slug: p.slug,
    name: p.name,
    description: p.description || undefined,
    shortDescription: p.shortDescription || undefined,
    price: p.price,
    comparePrice: p.comparePrice || undefined,
    category: p.category || undefined,
    subcategory: p.subcategory || undefined,
    images: p.images || undefined,
    stock: typeof p.stock === "number" ? p.stock : 100,
    isActive: p.isActive !== undefined ? p.isActive : true,
    tags: p.tags || undefined,
    benefits: p.benefits || undefined,
    ingredients: p.ingredients || undefined,
    usage: p.usage || undefined,
    weight: p.weight || undefined,
    metaTitle: p.metaTitle || undefined,
    metaDescription: p.metaDescription || undefined,
}));

try {
    const result = await client.mutation(api.mutations.seedProducts, {
        products: seedData,
    });
    console.log(`✅ Seed complete!`);
    console.log(`   Created: ${result.created}`);
    console.log(`   Skipped: ${result.skipped} (already existed)`);
    console.log(`   Total: ${result.total}`);
} catch (err) {
    console.error("❌ Seed failed:", err);
    process.exit(1);
}
