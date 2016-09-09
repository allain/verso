module.exports = parseUri

function parseUri (pattern, uri) {
  let patternParts = toParts(pattern)
  let uriParts = toParts(uri)

  if (patternParts.length !== uriParts.length) return null

  let params = {}

  for (let i = 0; i < patternParts.length; i++) {
    let patternPart = patternParts[i]
    let uriPart = uriParts[i]

    if (isParam(patternPart)) {
      params[patternPart.substr(1)] = uriPart
    } else if (uriPart !== patternPart) {
      return null
    }
  }

  return params
}

function isParam (patternPart) {
  return patternPart[0] === ':'
}

function toParts (str) {
  return str.replace(/(^\/|\/$)/g, '').split('/')
}
