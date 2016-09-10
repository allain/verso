var Canister = require('canister')
var mapIn = require('map-in')
var firstMapped = require('first-mapped')
var parseUri = require('./parse-uri')

function Verso (pages, context) {
  if (!(this instanceof Verso))
    return new Verso(pages, context)

  checkOptions(pages)
  this.context = context
  this.pages = expandPages(pages)
}

Verso.prototype = {
  render: render,
  run: run
}

function render (uri) {
  var self = this
  return requireMatch(uri, this.pages)
    .then(function (match) {
      return new Canister([self.context || {}, match.params]).run(match.page.render)
    })
}

function requireMatch (uri, pages) {
  return new Promise(function (resolve, reject) {
    var match = matchPage(uri, pages)
    return match
      ? resolve(match)
      : reject(new Error('missing page: ' + uri))
  })
}

function run (uri, el) {
  var self = this

  return requireMatch(uri, this.pages)
    .then(function (match) {
      var render = match.page.render
      var customize = match.page.customize

      return new Canister([
        self.context || {},
        match.params
      ]).run(render)
        .then(function (html) {
          el.innerHTML = html
          if (customize) {
            return new Canister([
              self.context || {},
              match.params,
              {el: el}
            ]).run(customize)
          }
        }).then(function () { return el })
    })
}

function matchPage (uri, pages) {
  return firstMapped(pages, function (page, pattern) {
    var params = parseUri(pattern, uri)
    if (params) {
      return { params: params, uri: uri, page: page}
    }
  })
}

function checkOptions (options) {
  if (!hasKeys(options))
    throw new Error('no pages defined')

  var invalidUri = Object.keys(options).find(function (k) {
    return !k.match(/^(\/:?[a-z0-9-]+)*\/?$/)
  })

  if (invalidUri)
    throw new Error('invalid uri: ' + invalidUri)
}

function expandPages (pages) {
  return mapIn(pages, function (spec) {
    if (typeof spec === 'function')
      return {render: spec}

    if (typeof spec === 'string') {
      var html = spec
      return {
        render: function () {
          return html
        }
      }
    }

    if (typeof spec.render === 'string') {
      var html = spec.render
      spec.render = function () { return html }
    }

    return spec
  })
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

module.exports = Verso
