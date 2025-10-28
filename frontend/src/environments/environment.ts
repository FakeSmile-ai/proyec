const detectedOrigin = typeof window !== 'undefined' && window.location?.origin
  ? window.location.origin
  : '';

const withOrigin = (path: string) =>
  detectedOrigin ? `${detectedOrigin}${path}` : path;

export const environment = {
  production: false,
  apiBaseUrl: withOrigin('/api'),
  authApiUrl: withOrigin('/api/auth'),
  teamsApiUrl: withOrigin('/api/teams'),
  matchesApiUrl: withOrigin('/api/matches'),
  playersApiUrl: withOrigin('/api/players'),
  reportsApiUrl: withOrigin('/api/reports'),
  tournamentsApiUrl: withOrigin('/api/tournaments'),
  matchesHubUrl: withOrigin('/hub/score'),
  oauthRedirect: detectedOrigin
    ? `${detectedOrigin}/oauth/callback`
    : 'http://localhost/oauth/callback'
};
