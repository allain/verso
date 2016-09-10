'use strict'

module.exports = parseUri

function parseUri (pattern, uri) {
  var patternParts = toParts(pattern)
  var uriParts = toParts(uri)

  if (patternParts.length !== uriParts.length) return null

  return patternParts.reduce(function (params, patternPart, i) {
    if (params === null) return null

    var uriPart = uriParts[i]
    if (isParam(patternPart)) {
      params[patternPart.substr(1)] = uriPart
      return params
    }

    return (patternPart === uriPart) ? params : null
  }, {})
}

function isParam (patternPart) {
  return patternPart[0] === ':'
}

function toParts (str) {
  return str.replace(/(^\/|\/$)/g, '').split('/')
}
