var Canister = require('canister')
var mapIn = require('map-in')
var firstMapped = require('first-mapped')
var parseUri = require('./lib/parse-uri')
var async = require('neo-async')

function Verso (pages, context) {
  if (!(this instanceof Verso))
    return new Verso(pages, context)

  checkOptions(pages)
  this.context = context
  this.pages = mapIn(pages, expandSpec)
}

Verso.prototype = {
  render: render,
  run: run,
  compile: compile
}

function render (uri, cb) {
  var self = this
  var result

  if (!cb) {
    result = new Promise(function (resolve, reject) {
      cb = function (err, val) {
        return err ? reject(err) : resolve(val)
      }
    })
  }

  requireMatch(this.pages, uri, function (err, match) {
    if (err) return cb(err)

    var render = match.page.render
    if (typeof render === 'string')
      return cb(null, render)

    return new Canister([self.context || {}, match.params]).run(render, cb)
  })

  return result
}

function run (uri, el, cb) {
  var self = this

  var result
  if (!cb) {
    result = new Promise(function (resolve, reject) {
      cb = function (err, val) {
        return err ? reject(err) : resolve(val)
      }
    })
  }

  var domUpdater = buildDefaultDomUpdater(el)

  requireMatch(this.pages, uri, function (err, match) {
    if (err) return cb(err)

    var render = match.page.render
    var customize = match.page.customize

    performRender(match, function (err, html) {
      if (err) return cb(err)

      domUpdater(html) // async

      performCustomize(el, match, cb)
    })
  }, cb)

  function performRender (match, cb) {
    var render = match.page.render
    if (typeof render === 'string')
      return cb(null, render)

    new Canister([self.context || {}, match.params]).run(render, cb)
  }

  function performCustomize (el, match, cb) {
    if (!match.page.customize)
      return cb(null, el)

    new Canister([self.context || {}, match.params, {el: el}]).run(match.page.customize, function (err) {
      return err ? cb(err) : cb(null, el)
    })
  }

  return result
}

function buildDefaultDomUpdater (el) {
  return (typeof el === 'function') ? el : function (html) {
    el.innerHTML = html
    return el
  }
}

function requireMatch (pages, uri, cb) {
  var match = matchPage(uri, pages)
  if (match)
    return cb(null, match)

  let err = new Error('page not found: ' + uri)
  err.code = 404
  cb(err)
}

function matchPage (uri, pages) {
  return firstMapped(pages, function (page, pattern) {
    var params = parseUri(pattern, uri)
    if (params) {
      return {
        params: params,
        uri: uri,
        page: page
      }
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

function expandSpec (spec) {
  if (typeof spec === 'function')
    return {render: spec}

  var html
  if (typeof spec === 'string') {
    html = spec
    return {
      render: html
    }
  }

  return spec
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

function compile (cb) {
  var self = this

  var compiled = {}

  var result
  if (!cb) {
    result = new Promise(function (resolve, reject) {
      cb = function (err, val) {
        return err ? reject(err) : resolve(val)
      }
    })
  }

  crawl('/', function (err) {
    return err ? cb(err) : cb(null, compiled)
  })

  return result

  function crawl (uri, cb) {
    if (compiled[uri]) return cb()

    self.render(uri, function (err, html) {
      compiled[uri] = html

      var uncrawledRefs = extractReferences(html).filter(uri => !compiled[uri])

      async.each(uncrawledRefs, function (uri, cb) {
        crawl(uri, cb)
      }, cb)
    })
  }
}

var re = /href="([^"]+)"/g

function extractReferences (html) {
  var result = []

  var m
  do {
    if (m = re.exec(html))
      result.push(m[1])
  } while (m)

  return result
}

module.exports = Verso
