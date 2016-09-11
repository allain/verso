const test = require('blue-tape')

const verso = require('../..')

test('render rejects when uri does not match', t => {
  return verso({
    '/': {}
  }).render('/missing').then(t.fail, err => {
    t.equal(err.code, 404)
    t.equal(err.message, 'page not found: /missing')
  })
})

test('render generates html', t => {
  return verso({
    '/': {
      render: () => {
        return '<!DOCTYPE html><html><h1>Testing</h1></html>'
      }
    }
  }).render('/').then(html => {
    t.equal(html, '<!DOCTYPE html><html><h1>Testing</h1></html>')
  })
})

test('passes params to render', t => {
  return verso({
    '/a/:a/': {
      render: a => {
        return '<!DOCTYPE html><html><h1>' + a + '</h1></html>'
      }
    }
  }).render('/a/10').then(html => {
    t.equal(html, '<!DOCTYPE html><html><h1>10</h1></html>')
  })
})

test('render uses context passed into verso factory', t => {
  return verso({
    '/a': {
      render: b => b
    }
  }, {b: 'hello'}).render('/a').then(html => {
    t.equal('hello', html)
  })
})
