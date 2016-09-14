var async = require('neo-async')

module.exports = crawl 

function crawl (verso, cb) {
  var crawled = {}

  crawlHelper('/', function (err) {
    return err ? cb(err) : cb(null, crawled)
  })

  function crawlHelper (uri, cb) {
    if (crawled[uri]) return cb()

		verso.render(uri, function (err, html) {
			if (err) return cb(err)

      crawled[uri] = html

      var uncrawledRefs = extractReferences(html).filter(uri => !crawled[uri])

      async.each(uncrawledRefs, function (uri, cb) {
        crawlHelper(uri, cb)
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
