// backend/seeder.js
// Replaces ALL products with the sample data in data/products.js.
//
//   npm run seed                 -> asks you to type the database name to confirm
//   npm run seed -- --yes        -> no prompt (for scripts/CI)
//   npm run seed -- --fresh      -> ALSO deletes all users and carts (local dev only)
//
// Safety:
//   - Refuses to run when NODE_ENV=production unless ALLOW_PRODUCTION_SEED=true.
//   - Keeps existing users by default. If an admin already exists, it's reused.
//   - Only creates an admin when none exists, using SEED_ADMIN_EMAIL / SEED_ADMIN_PASSWORD
//     from .env, or a random password printed ONCE. Never "123456".
const path = require("path");
const crypto = require("crypto");
const readline = require("readline");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const mongoose = require("mongoose");
const Product = require("./models/Product");
const User = require("./models/User");
const Cart = require("./models/Cart");
const products = require("./data/products");

const args = process.argv.slice(2);
const FRESH = args.includes("--fresh");
const YES = args.includes("--yes");

const fail = (message) => {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
};

// "mongodb+srv://user:pass@cluster0.abc.mongodb.net/grayscale?x=y" -> host + db, no password
const describeTarget = (uri) => {
  try {
    const url = new URL(uri);
    const dbName = url.pathname.replace(/^\//, "") || "test";
    return { host: url.host, dbName };
  } catch {
    return { host: "(unparseable URI)", dbName: "" };
  }
};

const ask = (question) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });

const confirm = async ({ host, dbName }) => {
  console.log("\n⚠️  GrayScale seeder");
  console.log(`   Target:  ${host} / ${dbName}`);
  console.log("   Will:    DELETE all products and insert sample products");
  if (FRESH) console.log("            DELETE ALL USERS AND CARTS (--fresh)");
  else console.log("            keep users and carts");

  if (YES) return;
  if (!process.stdin.isTTY) {
    fail("Not an interactive terminal. Re-run with --yes to confirm.");
  }
  const answer = await ask(`\nType the database name (${dbName}) to continue: `);
  if (answer !== dbName) fail("Confirmation did not match. Nothing was changed.");
};

// Reuse an existing admin, or create one with safe credentials
const getAdmin = async () => {
  const existing = await User.findOne({ role: "admin" }).sort({ createdAt: 1 });
  if (existing) {
    console.log(`→ Using existing admin: ${existing.email}`);
    return existing;
  }

  const email = (process.env.SEED_ADMIN_EMAIL || "admin@example.com").trim().toLowerCase();
  let password = process.env.SEED_ADMIN_PASSWORD;
  let generated = false;

  if (!password) {
    password = crypto.randomBytes(12).toString("base64url"); // 16 chars
    generated = true;
  }

  if (await User.findOne({ email })) {
    fail(`${email} already exists but isn't an admin. Set SEED_ADMIN_EMAIL to another address.`);
  }

  const admin = await User.create({ name: "Admin User", email, password, role: "admin", provider: "local" });

  console.log(`→ Created admin: ${email}`);
  if (generated) {
    console.log(`  Password (shown ONCE — save it now): ${password}`);
    console.log("  Tip: set SEED_ADMIN_PASSWORD in .env to choose it yourself.");
  }
  return admin;
};

const run = async () => {
  if (!process.env.MONGO_URI) fail("MONGO_URI is not set in backend/.env");

  if (process.env.NODE_ENV === "production" && process.env.ALLOW_PRODUCTION_SEED !== "true") {
    fail(
      "NODE_ENV is production. The seeder deletes every product.\n" +
        "  If you REALLY mean it, set ALLOW_PRODUCTION_SEED=true for this one run."
    );
  }

  // Validate everything BEFORE touching the database (--fresh deletes users first)
  const seedPassword = process.env.SEED_ADMIN_PASSWORD;
  if (seedPassword && seedPassword.length < 10) {
    fail("SEED_ADMIN_PASSWORD must be at least 10 characters.");
  }

  const target = describeTarget(process.env.MONGO_URI);
  await confirm(target);

  await mongoose.connect(process.env.MONGO_URI);

  if (FRESH) {
    const [u, c] = await Promise.all([User.deleteMany({}), Cart.deleteMany({})]);
    console.log(`→ Deleted ${u.deletedCount} users and ${c.deletedCount} carts`);
  }

  const admin = await getAdmin();

  const removed = await Product.deleteMany({});
  // Seed products are live in the store (isPublished defaults to false = draft)
  const sampleProducts = products.map((product) => ({
    isPublished: true,
    ...product,
    user: admin._id,
  }));
  await Product.insertMany(sampleProducts);

  console.log(`→ Replaced ${removed.deletedCount} products with ${sampleProducts.length} sample products`);
  console.log("\n✔ Product data seeded successfully!\n");
};

run()
  .then(() => mongoose.disconnect())
  .then(() => process.exit(0))
  .catch(async (error) => {
    console.error("Error seeding the data:", error);
    await mongoose.disconnect().catch(() => {});
    process.exit(1);
  });
