const Canister = require('canister')
const mapIn = require('map-in')
const firstMapped = require('first-mapped')
const parseUri = require('./parse-uri')

class Verso {
  constructor (pages, context) {
    checkOptions(pages)
    pages = expandPages(pages)
    this.context = context
    this.pages = pages
    this.patterns = Object.keys(pages)
  }

  render (uri) {
    return this.requireMatch(uri)
      .then(match => {
        return new Canister([this.context || {}, match.params]).run(match.page.render)
      })
  }

  requireMatch (uri) {
    return new Promise((resolve, reject) => {
      let match = this.matchPage(uri)
      return match
        ? resolve(match)
        : reject(new Error(`missing page: ${uri}`))
    })
  }

  run (uri, el) {
    return this.requireMatch(uri)
      .then(match => {
        let {render, customize} = match.page

        return new Canister([this.context || {}, match.params]).run(render)
          .then(html => {
            el.innerHTML = html
            if (customize) {
              return new Canister([
                this.context || {}, match.params, {el}
              ]).run(customize)
            }
          }).then(() => el)
      })
  }

  matchPage (uri) {
    return firstMapped(this.pages, (page, pattern) => {
      let params = parseUri(pattern, uri)
      if (params) {
        return { params, uri, page}
      }
    })
  }
}

function checkOptions (options) {
  if (!hasKeys(options))
    throw new Error('no pages defined')

  let invalidUri = Object.keys(options).find(k => !k.match(/^(\/:?[a-z0-9-]+)*\/?$/))
  if (invalidUri)
    throw new Error(`invalid uri: ${invalidUri}`)
}

function expandPages (pages) {
  return mapIn(pages, (spec, key) => {
    return (typeof spec === 'function') ? {
      render: spec
    } : spec
  })
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

module.exports = function (pages, context) {
  return new Verso(pages, context)
}
