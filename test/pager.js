const test = require('blue-tape')
const verso = require('..')

test('setup must have at least 1 page', t => {
  try {
    verso({})
    t.fail('should throw')
  } catch(err) {
    t.equal(err.message, 'no pages defined')
    t.end()
  }
})

test('pages must be keyed by valud uris', t => {
  try {
    verso({
      'invalid': {}
    })
  } catch(err) {
    t.equal(err.message, 'invalid uri: invalid')
    t.end()
  }
})

test('render rejects when uri does not match', t => {
  let p = verso({
    '/': {}
  })

  return p.render('/missing').then(t.fail, err => {
    t.equal(err.message, 'missing page: /missing')
  })
})

test('render generates html', t => {
  let p = verso({
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
  let p = verso({
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

test('render uses context passed into verso factory', t => {
  let p = verso({
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
  let p = verso({
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
  let p = verso({
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
  let p = verso({
    '/test': () => {
      return 'testing'
    }
  })

  return p.render('/test').then(html => {
    t.equal(html, 'testing')
  })
})
