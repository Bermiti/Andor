import 'server-only';

/**
 * User Preferences & Consent-Based Personalization Engine (Sprint 6).
 */

export function buildUserProfile({ userId, explicitConsent = true, preferences = {} }) {
  if (!explicitConsent) {
    return {
      userId,
      explicitConsent: false,
      interests: [],
      pace: 'moderate',
      dietary: [],
      mobility: 'standard',
    };
  }

  return {
    userId,
    explicitConsent: true,
    interests: Array.isArray(preferences.interests) ? preferences.interests : ['culture', 'sightseeing'],
    pace: preferences.pace || 'balanced',
    dietary: Array.isArray(preferences.dietary) ? preferences.dietary : [],
    mobility: preferences.mobility || 'standard',
    maxDailyBudget: preferences.maxDailyBudget || 300,
    updatedAt: new Date().toISOString(),
  };
}

export function rankItemsByUserPreferences(candidates = [], userProfile = {}) {
  if (!userProfile.explicitConsent || !Array.isArray(candidates)) return candidates;

  const userInterests = (userProfile.interests || []).map((i) => i.toLowerCase());

  return candidates.map((item) => {
    let scoreBoost = 0;
    const categories = (item.categories || []).map((c) => c.toLowerCase());

    userInterests.forEach((interest) => {
      if (categories.some((cat) => cat.includes(interest))) {
        scoreBoost += 0.25;
      }
    });

    return {
      ...item,
      personalizationScore: Math.min(1.0, (item.score || 0.5) + scoreBoost),
      personalizationReason: scoreBoost > 0 ? `Corresponde ao interesse de ${userProfile.interests.join(', ')}` : null,
    };
  }).sort((a, b) => (b.personalizationScore || 0) - (a.personalizationScore || 0));
}
