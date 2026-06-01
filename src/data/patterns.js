var SlopFilter = (typeof globalThis !== "undefined" && globalThis.SlopFilter) || {};
if (typeof globalThis !== "undefined") globalThis.SlopFilter = SlopFilter;

/**
 * Detection pattern data used by classifiers.
 * Separated from classification logic so patterns can be updated
 * independently (Open/Closed principle).
 */
SlopFilter.Patterns = Object.freeze({

  MIN_TEXT_LENGTH: 100,

  FILLER_PHRASES: [
    { pattern: /\bit(?:'|'|`)?s\s+(?:important|worth|crucial)\s+(?:to\s+note|noting|mentioning|highlighting)/i, weight: 3 },
    { pattern: /\bdelve(?:s|d)?\s+(?:into|deeper|in)\b/i, weight: 4 },
    { pattern: /\bin\s+today(?:'|'|`)?s\s+(?:fast[- ]paced|digital|modern|ever[- ](?:changing|evolving))\s+(?:world|landscape|era|environment)/i, weight: 5 },
    { pattern: /\bgame[- ]?changer\b/i, weight: 3 },
    { pattern: /\blet(?:'|'|`)?s\s+(?:dive|delve|explore|unpack)\b/i, weight: 3 },
    { pattern: /\bunlock(?:ing)?\s+(?:the\s+)?(?:full\s+)?potential\b/i, weight: 3 },
    { pattern: /\bnavigate\s+(?:the\s+)?(?:complex(?:ities)?|landscape|world|challenges)\b/i, weight: 4 },
    { pattern: /\bembark\s+on\s+(?:a|this|your)\s+journey\b/i, weight: 4 },
    { pattern: /\bfoster(?:ing)?\s+(?:innovation|growth|collaboration|engagement)\b/i, weight: 3 },
    { pattern: /\bharness(?:ing)?\s+the\s+power\b/i, weight: 4 },
    { pattern: /\bseamless(?:ly)?\b/i, weight: 2 },
    { pattern: /\bgroundbreaking\b/i, weight: 2 },
    { pattern: /\bparadigm\s+shift\b/i, weight: 4 },
    { pattern: /\bsynerg(?:y|ies|ize|istic)\b/i, weight: 3 },
    { pattern: /\bholistic\s+approach\b/i, weight: 4 },
    { pattern: /\bdive\s+deep(?:er)?\b/i, weight: 2 },
    { pattern: /\bunpack(?:ing)?\s+(?:this|the|that)\b/i, weight: 3 },
    { pattern: /\bmultifaceted\b/i, weight: 3 },
    { pattern: /\btapestry\b/i, weight: 4 },
    { pattern: /\bcutting[- ]?edge\b/i, weight: 2 },
    { pattern: /\brevolutioniz(?:e|ing)\b/i, weight: 2 },
    { pattern: /\bcomprehensive\s+guide\b/i, weight: 3 },
    { pattern: /\bin\s+(?:this\s+)?(?:comprehensive|detailed|ultimate)\s+(?:guide|article|overview|post)\b/i, weight: 3 },
    { pattern: /\btake(?:s)?\s+.*?\bto\s+the\s+next\s+level\b/i, weight: 3 },
    { pattern: /\bstay\s+ahead\s+of\s+the\s+(?:curve|competition|game)\b/i, weight: 3 },
    { pattern: /\bwithout\s+(?:further\s+ado|a\s+doubt)\b/i, weight: 3 },
    { pattern: /\bin\s+(?:conclusion|summary|closing)\s*,/i, weight: 2 },
    { pattern: /\boverall\s*,/i, weight: 2 },
    { pattern: /\bthere(?:'|'|`)?s\s+no\s+(?:one[- ]size[- ]fits[- ]all|denying|doubt)\b/i, weight: 2 },
    { pattern: /\b(?:stands?\s+out|distinguishes?\s+itself)\s+(?:as|from|by)\b/i, weight: 2 },
    { pattern: /\bworth\s+(?:noting|mentioning|considering|emphasizing)\b/i, weight: 2 },
    { pattern: /\bimportant\s+to\s+(?:remember|consider|understand|recognize)\b/i, weight: 2 },
    { pattern: /\bpivotal\s+(?:role|moment|point|factor)\b/i, weight: 3 },
    { pattern: /\bnuanced\s+(?:understanding|approach|perspective|view)\b/i, weight: 3 },
    { pattern: /\bever[- ]evolving\b/i, weight: 3 },
    { pattern: /\blandscape\s+of\b/i, weight: 2 },
    { pattern: /\brealm\s+of\b/i, weight: 2 },
  ],

  TRANSITION_STARTERS: [
    'furthermore', 'moreover', 'additionally', 'consequently',
    'nevertheless', 'nonetheless', 'conversely', 'subsequently',
    'accordingly', 'importantly', 'notably', 'significantly',
    'interestingly', 'ultimately', 'essentially', 'fundamentally',
  ],

  EM_DASH_REGEX: /[—–]/g,

  BULLET_REGEX: /^[\s]*[•\-\*]\s+/gm,

  NUMBERED_LIST_REGEX: /^[\s]*\d+[\.\)]\s+/gm,
});
