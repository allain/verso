var Canister = require('canister')
var mapIn = require('map-in')
var firstMapped = require('first-mapped')
var async = require('neo-async')

var parseUri = require('./lib/parse-uri')
var crawl = require('./lib/crawl')

function Verso (pages, context) {
  if (!(this instanceof Verso))
    return new Verso(pages, context)

  checkPages(pages)

  this.context = context

	this.dynamicPages = mapIn(pages, function(spec, uri) {
    if (uri.indexOf(':') !== -1) {
      return expandSpec(spec)
		}
	}, true)

	this.staticPages = mapIn(pages, function(spec, uri) {
		if (uri.indexOf(':') === -1) {
      return expandSpec(spec)
		}
	}, true)
}

Verso.prototype = {
  render: render,
  run: run,
  compile: compile,
	match: matchPages
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

  requireMatch(this, uri, function (err, matches) {
    if (err) return cb(err)

    performRender(self, matches, cb)
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

  requireMatch(this, uri, function (err, matches) {
    if (err) return cb(err)

    performRender(self, matches, function (err, html) {
      if (err) return cb(err)

      domUpdater(html) // async

      performCustomize(el, matches[0], cb)
    })
  }, cb)

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

function requireMatch (verso, uri, cb) {
  var matches = matchPages(verso, uri)
  if (matches)
    return cb(null, matches)

  let err = new Error('page not found: ' + uri)
  err.code = 404
  cb(err)
}

function matchPages (verso, uri) {
  var matches = []

	var page
	if (page = verso.staticPages[uri]) {
    matches.push({
			pattern: uri,
			uri: uri,
			params: {},
			page: page
		})
	}

  var dynamicPage = firstMapped(verso.dynamicPages, function (page, pattern) {
    var params = parseUri(pattern, uri)
    if (params) {
      return {
        pattern: pattern,
        uri: uri,
        params: params,
        page: page
      }
    }
  })

  if (dynamicPage) {
    matches.push(dynamicPage)
  }

  return matches.length ? matches : null
}

function checkPages(pages) {
  if (!hasKeys(pages))
    throw new Error('no pages defined')

  var invalidUri = Object.keys(pages).find(function (k) {
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

	if (typeof spec.customize === 'string') {
    spec.customize = eval(spec.customize)
	}

  return spec
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

function compile (cb) {
  var verso = this

  var compiled = {}

  var result
  if (!cb) {
    result = new Promise(function (resolve, reject) {
      cb = function (err, val) {
        return err ? reject(err) : resolve(val)
      }
    })
  }

  crawl(verso, function(err, compiled) {
    if (err) return cb(err)
	
	  each(verso.staticPages, function(page, uri) {
		  if (!compiled[uri] || !page.customize) return

			compiled[uri] = {
				render: compiled[uri],
				customize: page.customize.toString().replace(/\s*\n\s*/g, '\n')
			}
		})

		each(verso.dynamicPages, function(page, uri) {
			if (page.customize) {
        compiled[uri] = { customize: page.customize.toString().replace(/\s*\n\s*/g, '\n') }
			}
		})

	  cb(null, compiled)	
	})

	return result
}

function each(obj, iter) {
  Object.keys(obj).forEach(function (key) {
   iter(obj[key], key) 
	})
}

function performRender(verso, matches, cb) {
  async.reduce(matches, null, function(render, match, cb) {
    if (render) return cb(null, render)

    var renderer = match.page.render
    if (typeof renderer === 'string')
      return cb(null, renderer)

    return new Canister([verso.context || {}, match.params]).run(renderer, cb)
  }, cb)
}

module.exports = Verso
