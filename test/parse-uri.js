const test = require('blue-tape')
const parse = require('../lib/parse-uri')

test('parse simple uri works', t => {
  let parsed = parse('/a', '/a')
  t.deepEqual(parsed, {})
  t.end()
})
