let parseUri = require('./lib/parse-uri')

class Pager {
  constructor (pages) {
    checkOptions(pages)
		this.pages = pages
		this.patterns = Object.keys(pages)
  }

  render(uri) {
    let match = this.matchPage(uri)
		if (!match) return Promise.reject(new Error(`missing page: ${uri}`))

		return Promise.resolve(match.page.render(match.params))
	}

	matchPage(uri) {
		let params = null
		let pattern;

    for (let i=0, n = this.patterns.length; i<n; i++) {
			pattern = this.patterns[i]
      params = parseUri(pattern, uri)
		  if (params) {
				break;
			}
		}

		if (!params) return null

		return {
      params,
			uri,
			page: this.pages[pattern]
		}
	}
}

function checkOptions (options) {
  if (!hasKeys(options))
    throw new Error('no pages defined')

  let invalidUri = Object.keys(options).find(k => !k.match(/^(\/:?[a-z0-9-]+)*\/$/))
  if (invalidUri)
    throw new Error(`invalid uri: ${invalidUri}`)
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

module.exports = function (pages) {
  return new Pager(pages)
}
