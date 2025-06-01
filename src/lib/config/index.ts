export const config = {
  defaultAPIUrl: '',
  pinataApiKey: '',
  wsApiUrl: '',
}

export function configure(configOverrides: Partial<typeof config>) {
  Object.assign(config, configOverrides)
}

export function validateConfig() {
  if (!config.defaultAPIUrl) {
    throw new Error('defaultAPIUrl is not configured')
  }

  if (!config.pinataApiKey) {
    throw new Error('pinataApiKey is not configured')
  }

  if (!config.wsApiUrl) {
    throw new Error('wsApiUrl is not configured')
  }
}
