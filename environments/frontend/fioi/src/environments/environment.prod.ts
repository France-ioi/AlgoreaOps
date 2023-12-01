import { Environment, PartialDeep } from 'src/app/utils/config';;

export const environment: Environment = {
  production: true,
  apiUrl: '/api',
  oauthServerUrl: 'https://login.france-ioi.org',
  oauthClientId: '56',
  searchApiUrl: 'https://74w4cx6w62uon4dtqinf6quqeu0qvunw.lambda-url.eu-west-3.on.aws',
  forumServerUrl: 'wss://0j8i1y8ca2.execute-api.eu-west-3.amazonaws.com/fioi',

  sentryDsn: 'https://6295834d69104f54b55cc0ebe4ada310@o1167067.ingest.sentry.io/6257761',

  defaultActivityId: '4702',
  allUsersGroupId: '3',

  languages: [
    { tag: 'fr', path: '/fr/' },
    { tag: 'en', path: '/en/' },
  ],
  defaultTitle: 'Algorea Platform',
  languageSpecificTitles: { fr: 'Plateforme Algoréa' },

  allowForcedToken: true,
  authType: 'cookies',

  itemPlatformId: 'algorea_backend',

  theme: 'default',
  featureFlags: {
    hideTaskTabs: [],
    skillsDisabled: false
  }
};

type Preset = 'telecomParis';
export const presets: Record<Preset, PartialDeep<Environment>> = {
  telecomParis: {
    theme: 'coursera-pt',
    defaultTitle: 'Activities by Telecom Paris and Dartmouth college',
  },
};

export function getPresetNameByOrigin(origin: string): Preset | null {
  switch (origin) {
    case 'https://telecom-paris.france-ioi.org': return 'telecomParis';
    default: return null;
  }
}

