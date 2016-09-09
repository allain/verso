const test = require('blue-tape')
const pager = require('../lib/pager')

test('setup must have at least 1 page', t => {
  try {
    pager({})
    t.fail('should throw')
  } catch(err) {
    t.equal(err.message, 'no pages defined')
    t.end()
  }
})

test('pages must be keyed by valud uris', t => {
  try {
    pager({
      'invalid': {}
    })
  } catch(err) {
    t.equal(err.message, 'invalid uri: invalid')
    t.end()
  }
})

test('render rejects when uri does not match', t => {
  let p = pager({
    '/': {}
  })

  return p.render('/missing').then(t.fail, err => {
    t.equal(err.message, 'missing page: /missing')
  })
})

test('render generates html', t => {
  let p = pager({
    '/': {
      render: () => {
        return '<!DOCTYPE html><html><h1>Testing</h1></html>'
      }
    }
  })

  return p.render('/').then(html => {
    t.equal(html, '<!DOCTYPE html><html><h1>Testing</h1></html>')
  })
})

test('passes params to render', t => {
  let p = pager({
    '/a/:a/': {
      render: (a) => {
        return `<!DOCTYPE html><html><h1>${a}</h1></html>`
      }
    }
  })

  return p.render('/a/10').then(html => {
    t.equal(html, '<!DOCTYPE html><html><h1>10</h1></html>')
  })
})

test('render uses context passed into pager factory', t => {
  let p = pager({
    '/a': {
      render: function (b) {
        return b
      }
    }
  }, {b: 'hello'})

  return p.render('/a').then(html => {
    t.equal('hello', html)
  })
})

test('run updates the dom', t => {
  let p = pager({
    '/test': {
      render: () => {
        return '<div>Testing</div>'
      }
    }
  })

  return p.run('/test', {})
    .then((el) => {
      t.equal(el.innerHTML, '<div>Testing</div>')
    })
})

test('run updates the dom and calls customize on it if its defined', t => {
  let p = pager({
    '/test': {
      render: () => '<div>Testing</div>',
      customize: (el) => {
        console.log('here')
        el.innerHTML = el.innerHTML.toUpperCase()
      }
    }
  })

  return p.run('/test', {}).then((el) => {
    t.equal(el.innerHTML, '<DIV>TESTING</DIV>')
  })
})

test('page spec may be just be a function', t => {
  let p = pager({
    '/test': () => {
      return 'testing'
    }
  })

  return p.render('/test').then(html => {
    t.equal(html, 'testing')
  })
})
