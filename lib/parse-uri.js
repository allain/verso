module.exports = function(pattern, uri) {
  let patternParts = toParts(pattern)
	let uriParts = toParts(uri)

	if (patternParts.length !== uriParts.length) return null

	let params = {}
	for (let i = 0; i < patternParts.length; i++) {
    let patternPart = patternParts[i]
		let uriPart = uriParts[i]

		if (patternPart[0] === ':') {
      params[patternPart.substr(1)] = uriPart
		} else if (uriPart !== patternPart) {
      return null
	 	}
	}
	
	return params
}

function toParts(str) {
  return str.replace(/(^\/|\/$)/g, '').split('/')
}
