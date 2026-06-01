/**
 * Quick smoke test for HeuristicClassifier.
 * Run: node test/classifier.test.js
 */

// Make namespace global so require'd files can share it
globalThis.SlopFilter = {};

// Load sources in dependency order
require('../src/data/patterns.js');
require('../src/classifiers/BaseClassifier.js');
require('../src/classifiers/HeuristicClassifier.js');

const classifier = new SlopFilter.HeuristicClassifier(60);

const TESTS = [
  {
    name: 'Obvious AI slop — high score expected',
    text: `It's important to note that in today's fast-paced world, we must delve into the multifaceted landscape of modern technology. Furthermore, harnessing the power of cutting-edge innovation is a game-changer that can revolutionize how we navigate the complexities of digital transformation. Moreover, this holistic approach fosters innovation and unlocks the potential for groundbreaking paradigm shifts. Additionally, it's worth noting that staying ahead of the curve requires a nuanced understanding of the ever-evolving tapestry of our digital ecosystem. Ultimately, this comprehensive guide aims to embark on a journey through the seamless integration of these pivotal concepts.`,
    expectAI: true,
    minScore: 70,
  },
  {
    name: 'Genuine human Reddit comment — low score expected',
    text: `lol yeah I had the same issue. Ended up just reinstalling everything from scratch and it worked. No idea what was wrong tbh. The error message was completely useless, something about a missing dependency that was clearly there. Anyway hope that helps, let me know if you're still stuck.`,
    expectAI: false,
    maxScore: 30,
  },
  {
    name: 'Mixed content — moderate score',
    text: `The new update is actually pretty good. It's worth noting that the performance improvements are significant — I noticed about 30% faster load times on my machine. The UI changes are a bit controversial but I think they made the right call. Furthermore, the API changes break backward compatibility which is annoying. Additionally, some of the documentation is outdated. Overall, I'd recommend updating but make sure to test your plugins first.`,
    expectAI: false,
    maxScore: 59,
  },
  {
    name: 'Too short — should return score 0',
    text: `great post, thanks!`,
    expectAI: false,
    maxScore: 0,
  },
  {
    name: 'Structured AI with bullets and transitions',
    text: `Here are the key benefits of adopting this holistic approach:
• Seamlessly integrate cutting-edge solutions into your workflow
• Harness the power of AI to revolutionize productivity
• Navigate the complex landscape of modern technology
• Foster innovation through collaborative synergy
• Unlock the full potential of your digital ecosystem
Furthermore, it's important to note that this paradigm shift represents a game-changer for organizations. Moreover, delving into these multifaceted concepts reveals a tapestry of interconnected benefits. Ultimately, staying ahead of the curve requires embracing this comprehensive approach.`,
    expectAI: true,
    minScore: 65,
  },
];

let passed = 0;
let failed = 0;

for (const test of TESTS) {
  const result = classifier.classify(test.text);
  let ok = true;
  const issues = [];

  if (test.expectAI !== undefined && result.isAI !== test.expectAI) {
    ok = false;
    issues.push(`expected isAI=${test.expectAI}, got ${result.isAI}`);
  }
  if (test.minScore !== undefined && result.score < test.minScore) {
    ok = false;
    issues.push(`expected score >= ${test.minScore}, got ${result.score}`);
  }
  if (test.maxScore !== undefined && result.score > test.maxScore) {
    ok = false;
    issues.push(`expected score <= ${test.maxScore}, got ${result.score}`);
  }

  if (ok) {
    console.log(`  ✅ ${test.name} (score: ${result.score})`);
    passed++;
  } else {
    console.log(`  ❌ ${test.name} (score: ${result.score}) — ${issues.join('; ')}`);
    result.signals.forEach(s => {
      if (s.score > 0) console.log(`     ↳ ${s.name}: ${s.score}/${s.maxScore}`);
    });
    failed++;
  }
}

console.log(`\n${passed} passed, ${failed} failed out of ${TESTS.length} tests`);
process.exit(failed > 0 ? 1 : 0);
