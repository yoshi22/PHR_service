// Simple test script to verify badge gallery components
const { BADGE_DEFINITIONS } = require('./src/constants/badgeDefinitions.ts');

console.log('Testing Badge Definitions...');
console.log(`Total badges defined: ${BADGE_DEFINITIONS?.length || 0}`);

if (BADGE_DEFINITIONS && BADGE_DEFINITIONS.length > 0) {
  console.log('Badge categories:');
  const categories = [...new Set(BADGE_DEFINITIONS.map(badge => badge.category))];
  categories.forEach(category => {
    const count = BADGE_DEFINITIONS.filter(badge => badge.category === category).length;
    console.log(`  ${category}: ${count} badges`);
  });
  
  console.log('\nBadge rarities:');
  const rarities = [...new Set(BADGE_DEFINITIONS.map(badge => badge.rarity))];
  rarities.forEach(rarity => {
    const count = BADGE_DEFINITIONS.filter(badge => badge.rarity === rarity).length;
    console.log(`  ${rarity}: ${count} badges`);
  });
  
  console.log('\nSample badges:');
  BADGE_DEFINITIONS.slice(0, 3).forEach(badge => {
    console.log(`  ${badge.id}: ${badge.name} (${badge.category}/${badge.rarity})`);
  });
  
  console.log('\n✅ Badge system appears to be correctly configured!');
} else {
  console.log('❌ Badge definitions not found or empty');
}
