// Loads the sample salon and clinic into Supabase.
// Run: npm run seed   (needs SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local)
import { demoBrains } from "../src/lib/brain/demo";
import { upsertDemo } from "../src/lib/server/store";

async function main() {
  for (const b of demoBrains) {
    await upsertDemo(b);
    console.log(`Seeded ${b.brain.name} (${b.slug})`);
  }
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
