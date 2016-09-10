var test = require('blue-tape')

var verso = require('..')

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
  return verso({
    '/': {}
  }).render('/missing').then(t.fail, function (err) {
    t.equal(err.message, 'missing page: /missing')
  })
})

test('render generates html', function (t) {
  return verso({
    '/': {
      render: function () {
        return '<!DOCTYPE html><html><h1>Testing</h1></html>'
      }
    }
  }).render('/').then(function (html) {
    t.equal(html, '<!DOCTYPE html><html><h1>Testing</h1></html>')
  })
})

test('passes params to render', function (t) {
  return verso({
    '/a/:a/': {
      render: function (a) {
        return '<!DOCTYPE html><html><h1>' + a + '</h1></html>'
      }
    }
  }).render('/a/10').then(function (html) {
    t.equal(html, '<!DOCTYPE html><html><h1>10</h1></html>')
  })
})

test('render uses context passed into verso factory', function (t) {
  return verso({
    '/a': {
      render: function (b) {
        return b
      }
    }
  }, {b: 'hello'}).render('/a').then(function (html) {
    t.equal('hello', html)
  })
})

test('run updates the dom', function (t) {
  return verso({
    '/test': {
      render: function () {
        return '<div>Testing</div>'
      }
    }
  }).run('/test', {})
    .then(function (el) {
      t.equal(el.innerHTML, '<div>Testing</div>')
    })
})

test('run updates the dom and calls customize on it if its defined', function (t) {
  return verso({
    '/test': {
      render: function () { return '<div>Testing</div>' },
      customize: function (el) {
        el.innerHTML = el.innerHTML.toUpperCase()
      }
    }
  }).run('/test', {}).then(function (el) {
    t.equal(el.innerHTML, '<DIV>TESTING</DIV>')
  })
})

test('page spec may be just be a function', function (t) {
  return verso({
    '/test': function () {
      return 'testing'
    }
  }).render('/test').then(function (html) {
    t.equal(html, 'testing')
  })
})

test('spec may just be a string', function (t) {
  return verso({
    '/test': 'testing'
  }).render('/test').then(function (html) {
    t.equal(html, 'testing')
  })
})

test('render may just be a string', function (t) {
  return verso({
    '/test': {
      render: 'testing',
      customize: function (el) {
        el.innerHTML = el.innerHTML.toUpperCase()
      }
    }
  }).run('/test', {}).then(function (el) {
    t.equal(el.innerHTML, 'TESTING')
  })
})
