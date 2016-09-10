const test = require('blue-tape')
const verso = require('..')

test('setup must have at least 1 page', function (t) {
  try {
    verso({})
    t.fail('should throw')
  } catch(err) {
    t.equal(err.message, 'no pages defined')
    t.end()
  }
})

test('pages must be keyed by valud uris', function (t) {
  try {
    verso({
      'invalid': {}
    })
  } catch(err) {
    t.equal(err.message, 'invalid uri: invalid')
    t.end()
  }
})

test('render rejects when uri does not match', function (t) {
  var p = verso({
    '/': {}
  })

  return p.render('/missing').then(t.fail, function (err) {
    t.equal(err.message, 'missing page: /missing')
  })
})

test('render generates html', function (t) {
  var p = verso({
    '/': {
      render: function () {
        return '<!DOCTYPE html><html><h1>Testing</h1></html>'
      }
    }
  })

  return p.render('/').then(function (html) {
    t.equal(html, '<!DOCTYPE html><html><h1>Testing</h1></html>')
  })
})

test('passes params to render', function (t) {
  var p = verso({
    '/a/:a/': {
      render: function (a) {
        return '<!DOCTYPE html><html><h1>' + a + '</h1></html>'
      }
    }
  })

  return p.render('/a/10').then(function (html) {
    t.equal(html, '<!DOCTYPE html><html><h1>10</h1></html>')
  })
})

test('render uses context passed into verso factory', function (t) {
  var p = verso({
    '/a': {
      render: function (b) {
        return b
      }
    }
  }, {b: 'hello'})

  return p.render('/a').then(function (html) {
    t.equal('hello', html)
  })
})

test('run updates the dom', function (t) {
  var p = verso({
    '/test': {
      render: function () {
        return '<div>Testing</div>'
      }
    }
  })

  return p.run('/test', {})
    .then(function (el) {
      t.equal(el.innerHTML, '<div>Testing</div>')
    })
})

test('run updates the dom and calls customize on it if its defined', function (t) {
  var p = verso({
    '/test': {
      render: function () { return '<div>Testing</div>' },
      customize: function (el) {
        el.innerHTML = el.innerHTML.toUpperCase()
      }
    }
  })

  return p.run('/test', {}).then(function (el) {
    t.equal(el.innerHTML, '<DIV>TESTING</DIV>')
  })
})

test('page spec may be just be a function', function (t) {
  var p = verso({
    '/test': function () {
      return 'testing'
    }
  })

  return p.render('/test').then(function (html) {
    t.equal(html, 'testing')
  })
})
