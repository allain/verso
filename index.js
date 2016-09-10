var Canister = require('canister')
var mapIn = require('map-in')
var firstMapped = require('first-mapped')
var parseUri = require('./lib/parse-uri')

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

function render (uri) {
  var self = this
  return requireMatch(this.pages, uri)
    .then(function (match) {
      return new Canister([self.context || {}, match.params]).run(match.page.render)
    })
}

function run (uri, el) {
  var self = this

  return requireMatch(this.pages, uri)
    .then(function (match) {
      var render = match.page.render
      var customize = match.page.customize

      var result = new Canister([
        self.context || {},
        match.params
      ]).run(render)
        .then(function (html) {
          el.innerHTML = html
        })

      if (customize) {
        result = result.then(function () {
          return new Canister([
            self.context || {},
            match.params,
            {el: el}
          ]).run(customize)
        })
      }

      return result.then(function () { return el })
    })
}

function requireMatch (pages, uri) {
  return new Promise(function (resolve, reject) {
    var match = matchPage(uri, pages)
    return match
      ? resolve(match)
      : reject(new Error('missing page: ' + uri))
  })
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
      render: function () {
        return html
      }
    }
  }

  if (typeof spec.render === 'string') {
    html = spec.render
    spec.render = function () { return html }
  }

  return spec
}

function hasKeys (options) {
  return Object.keys(options || {}).length > 0
}

function compile() {
  var self = this
  var result = {}
  return crawl('/', result).then(function() {
    return result
  })

  function crawl(uri, result) {
    if (result[uri]) return

    return self.render(uri).then(function (html) {
      result[uri] = html

      return Promise.all(extractReferences(html).map(function(uri) {
        return crawl(uri, result)
      }))
    })
  }
}



function extractReferences (html) {
  var result = []
  var re = /href="([^"]+)"/g;

  var m;

  do {
    m = re.exec(html);
    if (m) {
      result.push(m[1])
    }
  } while (m);

  return result
}

module.exports = Verso
