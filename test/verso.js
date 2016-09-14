const test = require('blue-tape')
const verso = require('..')

test('setup must have at least 1 page', t => {
  try {
    verso({})
    t.fail('should throw')
  } catch (err) {
    t.equal(err.message, 'no pages defined')
    t.end()
  }
})

test('pages must be keyed by valud uris', t => {
  try {
    verso({
      'invalid': {}
    })
  } catch (err) {
    t.equal(err.message, 'invalid uri: invalid')
    t.end()
  }
})

test('run updates the dom', t => {
  return verso({
    '/test': '<div>Testing</div>'
  }).run('/test', {})
    .then(el => {
      t.equal(el.innerHTML, '<div>Testing</div>')
    })
})

test('customizations can be given as a string', t => {
  return verso({
    '/test': {
      render: '<div>Testing</div>',
      customize: 'el => {\nel.innerHTML = el.innerHTML.toUpperCase()\n}'
    }
  }).run('/test', {}).then(el => {
    t.equal(el.innerHTML, '<DIV>TESTING</DIV>')
  })
})

test('run updates the dom and calls customize on it if its defined', t => {
  return verso({
    '/test': {
      render: '<div>Testing</div>',
      customize: el => {
        el.innerHTML = el.innerHTML.toUpperCase()
      }
    }
  }).run('/test', {}).then(el => {
    t.equal(el.innerHTML, '<DIV>TESTING</DIV>')
  })
})

test('page spec may be just be a function', t => {
  return verso({
    '/test': () => 'testing'
  }).render('/test').then(html => {
    t.equal(html, 'testing')
  })
})

test('spec may just be a string', t => {
  return verso({
    '/test': 'testing'
  }).render('/test').then(html => {
    t.equal(html, 'testing')
  })
})
