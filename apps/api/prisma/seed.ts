async function main(): Promise<void> {
  // Seed data intentionally left empty for now.
  // Add deterministic fixtures here when API modules are implemented.
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error: unknown) => {
    console.error('Seed failed:', error);
    process.exit(1);
  });

