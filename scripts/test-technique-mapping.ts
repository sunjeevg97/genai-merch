/**
 * Technique Mapping Test Script
 *
 * Tests the technique mapping logic to ensure all product types
 * are correctly assigned their printing techniques.
 *
 * Run with: npx ts-node scripts/test-technique-mapping.ts
 * Or with bun: bun scripts/test-technique-mapping.ts
 */

import {
  inferTechniqueFromProductAndPlacement,
  getProductTypeFromName,
  getDefaultTechniqueForProduct,
  getValidTechniquesForProduct,
  PRODUCT_TECHNIQUE_MAPPING,
} from '../src/lib/printful/technique-mapping';

import {
  validateTechniqueForProduct,
  generateValidationReport,
} from '../src/lib/printful/technique-validator';

// Test cases covering various product names and expected techniques
const TEST_CASES = [
  // Stickers - should ALWAYS be digital
  { name: 'Kiss-Cut Stickers', expectedTechnique: 'digital', placements: ['default', 'front'] },
  { name: 'Die-Cut Stickers', expectedTechnique: 'digital', placements: ['default', 'front'] },
  { name: 'Sticker Sheet', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Holographic Stickers', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Vinyl Sticker', expectedTechnique: 'digital', placements: ['default', 'front'] },

  // Magnets - should be digital
  { name: 'Fridge Magnet', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Custom Magnet', expectedTechnique: 'digital', placements: ['default', 'front'] },

  // Mugs - should be digital (sublimation)
  { name: 'White Glossy Mug', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Ceramic Mug', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Coffee Mug', expectedTechnique: 'digital', placements: ['default', 'front'] },
  { name: '11oz Mug', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Travel Mug', expectedTechnique: 'digital', placements: ['default'] },

  // Cups/Tumblers - should be digital
  { name: 'Stainless Steel Tumbler', expectedTechnique: 'digital', placements: ['default'] },
  { name: 'Paper Cup', expectedTechnique: 'digital', placements: ['default'] },

  // Hats - should be dtfilm (default) or embroidery
  { name: 'Dad Hat', expectedTechnique: 'dtfilm', placements: ['front', 'back'] },
  { name: 'Trucker Hat', expectedTechnique: 'dtfilm', placements: ['front', 'front_dtf_hat'] },
  { name: 'Snapback Hat', expectedTechnique: 'dtfilm', placements: ['front'] },
  { name: 'Baseball Cap', expectedTechnique: 'dtfilm', placements: ['front', 'back'] },
  { name: 'Beanie', expectedTechnique: 'embroidery', placements: ['front', 'embroidery_front'] },

  // Hat embroidery placements - should derive embroidery from placement
  { name: 'Dad Hat', expectedTechnique: 'embroidery', placements: ['embroidery_front'] },
  { name: 'Trucker Hat', expectedTechnique: 'embroidery', placements: ['embroidery_front_large'] },

  // T-shirts - should be dtg
  { name: 'Unisex Classic T-Shirt', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Bella + Canvas 3001 Tee', expectedTechnique: 'dtg', placements: ['front', 'back', 'sleeve_left', 'sleeve_right'] },
  { name: "Women's Fitted T-Shirt", expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Youth T-Shirt', expectedTechnique: 'dtg', placements: ['front', 'back'] },

  // Hoodies - should be dtg
  { name: 'Unisex Hoodie', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Pullover Hoodie', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Zip-Up Hoodie', expectedTechnique: 'dtg', placements: ['front', 'back', 'sleeve_left'] },

  // Sweatshirts - should be dtg
  { name: 'Crewneck Sweatshirt', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Classic Sweatshirt', expectedTechnique: 'dtg', placements: ['front', 'back'] },

  // Polos - should be dtg (but can have embroidery)
  { name: 'Polo Shirt', expectedTechnique: 'dtg', placements: ['front', 'back'] },

  // Tank tops - should be dtg
  { name: 'Tank Top', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: "Women's Racerback Tank", expectedTechnique: 'dtg', placements: ['front', 'back'] },

  // Long sleeves - should be dtg
  { name: 'Long Sleeve Tee', expectedTechnique: 'dtg', placements: ['front', 'back', 'sleeve_left', 'sleeve_right'] },
  { name: 'Classic Long Sleeve', expectedTechnique: 'dtg', placements: ['front', 'back'] },

  // Tote bags - should be dtg
  { name: 'Canvas Tote Bag', expectedTechnique: 'dtg', placements: ['front', 'back'] },
  { name: 'Large Tote', expectedTechnique: 'dtg', placements: ['front', 'back'] },
];

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: keyof typeof colors = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

/**
 * Test product type detection
 */
function testProductTypeDetection() {
  log('\n=== Testing Product Type Detection ===\n', 'cyan');

  let passed = 0;
  let failed = 0;

  const productTypeTests = [
    { name: 'Kiss-Cut Stickers', expected: 'kiss-cut' },
    { name: 'Die-Cut Stickers', expected: 'die-cut' },
    { name: 'Vinyl Sticker', expected: 'sticker' },
    { name: 'White Glossy Mug', expected: 'mug' },
    { name: 'Ceramic Coffee Mug', expected: 'mug' },
    { name: 'Dad Hat', expected: 'hat' },
    { name: 'Trucker Hat', expected: 'trucker' },
    { name: 'Beanie', expected: 'beanie' },
    { name: 'Unisex Classic T-Shirt', expected: 't-shirt' },
    { name: 'Bella + Canvas 3001 Tee', expected: 't-shirt' },
    { name: 'Unisex Hoodie', expected: 'hoodie' },
    { name: 'Crewneck Sweatshirt', expected: 'sweatshirt' },
    { name: 'Tank Top', expected: 'tank-top' },
    { name: 'Long Sleeve Tee', expected: 'long-sleeve' },
    { name: 'Canvas Tote Bag', expected: 'tote-bag' },
  ];

  for (const test of productTypeTests) {
    const result = getProductTypeFromName(test.name);
    if (result === test.expected) {
      log(`  ✓ "${test.name}" → "${result}"`, 'green');
      passed++;
    } else {
      log(`  ✗ "${test.name}" → Expected "${test.expected}", got "${result}"`, 'red');
      failed++;
    }
  }

  log(`\n  Product Type Detection: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  return { passed, failed };
}

/**
 * Test technique inference
 */
function testTechniqueInference() {
  log('\n=== Testing Technique Inference ===\n', 'cyan');

  let passed = 0;
  let failed = 0;

  for (const test of TEST_CASES) {
    for (const placement of test.placements) {
      const result = inferTechniqueFromProductAndPlacement(test.name, placement);

      // For embroidery placements, expect embroidery technique regardless of product default
      const expectedTechnique = placement.includes('embroidery')
        ? 'embroidery'
        : test.expectedTechnique;

      if (result.technique === expectedTechnique) {
        log(`  ✓ "${test.name}" + "${placement}" → ${result.technique}`, 'green');
        passed++;
      } else {
        log(`  ✗ "${test.name}" + "${placement}" → Expected ${expectedTechnique}, got ${result.technique}`, 'red');
        failed++;
      }
    }
  }

  log(`\n  Technique Inference: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  return { passed, failed };
}

/**
 * Test validation layer
 */
function testValidation() {
  log('\n=== Testing Validation Layer ===\n', 'cyan');

  let passed = 0;
  let failed = 0;

  const validationTests = [
    // Invalid combinations that should be caught
    { name: 'Kiss-Cut Stickers', technique: 'dtg', shouldBeValid: false, suggestedTechnique: 'digital' },
    { name: 'White Glossy Mug', technique: 'dtg', shouldBeValid: false, suggestedTechnique: 'digital' },
    { name: 'Unisex T-Shirt', technique: 'digital', shouldBeValid: false, suggestedTechnique: 'dtg' },
    { name: 'Dad Hat', technique: 'dtg', shouldBeValid: false, suggestedTechnique: 'dtfilm' },

    // Valid combinations that should pass
    { name: 'Kiss-Cut Stickers', technique: 'digital', shouldBeValid: true },
    { name: 'White Glossy Mug', technique: 'digital', shouldBeValid: true },
    { name: 'Unisex T-Shirt', technique: 'dtg', shouldBeValid: true },
    { name: 'Dad Hat', technique: 'dtfilm', shouldBeValid: true },
    { name: 'Dad Hat', technique: 'embroidery', shouldBeValid: true },
    { name: 'Beanie', technique: 'embroidery', shouldBeValid: true },
    { name: 'Beanie', technique: 'dtfilm', shouldBeValid: true },
  ];

  for (const test of validationTests) {
    const result = validateTechniqueForProduct(test.name, test.technique);

    if (result.valid === test.shouldBeValid) {
      if (!test.shouldBeValid && test.suggestedTechnique) {
        if (result.suggestedTechnique === test.suggestedTechnique) {
          log(`  ✓ "${test.name}" + "${test.technique}" → invalid, suggested: ${result.suggestedTechnique}`, 'green');
          passed++;
        } else {
          log(`  ✗ "${test.name}" + "${test.technique}" → Expected suggested: ${test.suggestedTechnique}, got: ${result.suggestedTechnique}`, 'red');
          failed++;
        }
      } else {
        log(`  ✓ "${test.name}" + "${test.technique}" → ${result.valid ? 'valid' : 'invalid'}`, 'green');
        passed++;
      }
    } else {
      log(`  ✗ "${test.name}" + "${test.technique}" → Expected ${test.shouldBeValid ? 'valid' : 'invalid'}, got ${result.valid ? 'valid' : 'invalid'}`, 'red');
      failed++;
    }
  }

  log(`\n  Validation: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  return { passed, failed };
}

/**
 * Test batch validation report
 */
function testBatchValidation() {
  log('\n=== Testing Batch Validation Report ===\n', 'cyan');

  const testItems = [
    { productName: 'Kiss-Cut Stickers', technique: 'dtg' },  // Invalid
    { productName: 'Kiss-Cut Stickers', technique: 'digital' },  // Valid
    { productName: 'White Glossy Mug', technique: 'dtg' },  // Invalid
    { productName: 'Unisex T-Shirt', technique: 'dtg' },  // Valid
    { productName: 'Dad Hat', technique: 'dtfilm' },  // Valid
  ];

  const report = generateValidationReport(testItems);

  log(`  Total: ${report.total}`, 'blue');
  log(`  Valid: ${report.valid}`, 'green');
  log(`  Invalid: ${report.invalid}`, 'yellow');

  log('\n  Details:', 'cyan');
  for (const detail of report.details) {
    const status = detail.valid ? '✓' : '✗';
    const color = detail.valid ? 'green' : 'yellow';
    const suggestion = detail.suggestedTechnique ? ` → suggested: ${detail.suggestedTechnique}` : '';
    log(`    ${status} ${detail.productName} + ${detail.technique}${suggestion}`, color);
  }

  // Validate expected results
  const expectedInvalid = 2;  // Stickers+DTG and Mug+DTG
  const passed = report.invalid === expectedInvalid;

  log(`\n  Batch Validation: ${passed ? '1 passed' : '1 failed'}`, passed ? 'green' : 'red');
  return { passed: passed ? 1 : 0, failed: passed ? 0 : 1 };
}

/**
 * Test all products in the mapping have valid configurations
 */
function testMappingCompleteness() {
  log('\n=== Testing Mapping Completeness ===\n', 'cyan');

  let passed = 0;
  let failed = 0;

  for (const [productType, config] of Object.entries(PRODUCT_TECHNIQUE_MAPPING)) {
    // Check that default is in techniques array
    if (!config.techniques.includes(config.default)) {
      log(`  ✗ ${productType}: default "${config.default}" not in techniques [${config.techniques.join(', ')}]`, 'red');
      failed++;
    } else {
      log(`  ✓ ${productType}: default="${config.default}", techniques=[${config.techniques.join(', ')}]`, 'green');
      passed++;
    }
  }

  log(`\n  Mapping Completeness: ${passed} passed, ${failed} failed`, failed > 0 ? 'red' : 'green');
  return { passed, failed };
}

/**
 * Run all tests
 */
function runAllTests() {
  log('\n╔══════════════════════════════════════════════╗', 'blue');
  log('║   Technique Mapping Test Suite               ║', 'blue');
  log('╚══════════════════════════════════════════════╝', 'blue');

  const results = {
    productType: testProductTypeDetection(),
    techniqueInference: testTechniqueInference(),
    validation: testValidation(),
    batchValidation: testBatchValidation(),
    mappingCompleteness: testMappingCompleteness(),
  };

  // Summary
  const totalPassed = Object.values(results).reduce((sum, r) => sum + r.passed, 0);
  const totalFailed = Object.values(results).reduce((sum, r) => sum + r.failed, 0);

  log('\n╔══════════════════════════════════════════════╗', 'blue');
  log('║   Test Summary                               ║', 'blue');
  log('╚══════════════════════════════════════════════╝', 'blue');

  log(`\n  Total Tests: ${totalPassed + totalFailed}`, 'cyan');
  log(`  Passed: ${totalPassed}`, 'green');
  log(`  Failed: ${totalFailed}`, totalFailed > 0 ? 'red' : 'green');

  if (totalFailed === 0) {
    log('\n  ✓ All tests passed!', 'green');
  } else {
    log(`\n  ✗ ${totalFailed} tests failed`, 'red');
    process.exit(1);
  }
}

// Run tests
runAllTests();
