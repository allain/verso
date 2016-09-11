const test = require('blue-tape')
const verso = require('../..')
const mapIn = require('map-in')
const values = require('object-values')

test('compile only renders from root', t => {
  return verso({
    '/': 'a',
    '/test': 'test'
  }).compile()
    .then(result => {
      t.deepEqual(result, {
        '/': 'a'
      })
    })
})

test('compile crawls out from root', t => {
  return verso({
    '/': '<div><a href="/a">A</a></div>',
    '/a': '<div><a href="/b">B</a><a href="/c">C</a></div>',
    '/b': 'leaf B',
    '/c': 'leaf C'
  }).compile()
    .then(result => {
      t.deepEqual(result, {
        '/': '<div><a href="/a">A</a></div>',
        '/a': '<div><a href="/b">B</a><a href="/c">C</a></div>',
        '/b': 'leaf B',
        '/c': 'leaf C'
      })
    })
})

test('compile handles loops', t => {
  return verso({
    '/': '<div><a href="/a">A</a></div>',
    '/a': '<div><a href="/b">B</a></div>',
    '/b': '<div><a href="/a">A</a></div>',
    '/c': 'leaf C'
  }).compile()
    .then(result => {
      t.deepEqual(result, {
        '/': '<div><a href="/a">A</a></div>',
        '/a': '<div><a href="/b">B</a></div>',
        '/b': '<div><a href="/a">A</a></div>'
      })
    })
})

test('compile handles dynamic pages', t => {
  return verso({
    '/': '<div><a href="/a">A</a><a href="/b">B</a></div>',
    '/:name': name => `<div>${name}</div>`
  }).compile()
    .then(result => {
      t.deepEqual(result, {
        '/': '<div><a href="/a">A</a><a href="/b">B</a></div>',
        '/a': '<div>a</div>',
        '/b': '<div>b</div>'
      })
    })
})

test('real world compile example', t => {
  return verso({
    '/': contacts => `<div>${contacts.map(contact => `<a href="/contact/${contact.id}">${contact.name}</a>`).join('')}</div>`,
    '/contact/:id': (id, contacts) => {
      var contact = contacts.find(contact => contact.id == id)
      return `<div>${contact.name}'s Page</div>`
    }
  }, {
    contacts: [
      {id: 1, name: 'Allain'},
      {id: 2, name: 'Debby'}
    ]
  }).compile()
    .then(result => {
      t.deepEqual(result, {
        '/': '<div><a href="/contact/1">Allain</a><a href="/contact/2">Debby</a></div>',
        '/contact/1': "<div>Allain's Page</div>",
        '/contact/2': "<div>Debby's Page</div>"
      })
    })
})

test('compile time is reasonable', t => {
  var testContacts = {}
  for (var i = 0; i < 10000; i++) {
    testContacts[i] = {id: i, name: 'Contact ' + i}
  }

  var v = verso({
    '/': contacts => `<div>${values(contacts).map(contact => `<a href="/contact/${contact.id}">${contact.name}</a>`).join('')}</div>`,
    '/contact/:id': (id, contacts) => {
      return `<div>${contacts[id].name}'s Page</div>`
    }
  }, {
    contacts: testContacts
  })

  var startTime = Date.now()

  return v.compile()
    .then((compiled) => {
      t.equal(Object.keys(compiled).length, 10001)
      var endTime = Date.now()
      var duration = endTime - startTime
      t.true(duration < 1000, `compile took ${duration}ms`)
    })
})
