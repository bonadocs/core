const jsonSubstitutionCode = 'bonadocs-json-substitution'
function jsonReplacer(_: string, v: unknown) {
  switch (typeof v) {
    case 'bigint':
      return {
        ctx: jsonSubstitutionCode,
        type: 'bigint',
        value: '0x' + v.toString(16),
      }
    default:
      return v
  }
}

function jsonDisplayReplacer(_: string, v: unknown) {
  switch (typeof v) {
    case 'bigint':
      return '0x' + v.toString(16)
    default:
      return v
  }
}

function jsonReviver(_: string, v: unknown) {
  if (!v) {
    return v
  }

  if (
    typeof v !== 'object' ||
    !('ctx' in v) ||
    !('value' in v) ||
    !('type' in v) ||
    v.ctx !== jsonSubstitutionCode ||
    typeof v.value !== 'string'
  ) {
    return v
  }

  switch (v.type) {
    case 'bigint':
      return BigInt(v.value)
    default:
      return v
  }
}

export const jsonUtils = {
  replacer: jsonReplacer,
  displayReplacer: jsonDisplayReplacer,
  reviver: jsonReviver,
}
