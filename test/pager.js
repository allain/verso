const test = require('blue-tape')

test('setup must have at least 1 page', t => {
  const pager = require('..')
  try {
    pager({})
    t.fail('should throw')
  } catch(err) {
    t.equal(err.message, 'no pages defined')
    t.end()
  }
})

test('pages must be keyed by valud uris', t => {
  const pager = require('..')

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
  const pager = require('..')
  let p = pager({
    '/': {}
  })

  return p.render('/missing').then(t.fail, err => {
    t.equal(err.message, 'missing page: /missing')
  })
})

test('render generates html', t => {
  const pager = require('..')
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
  const pager = require('..')
  let p = pager({
    '/a/:a/': {
			render: (params) => {
        return `<!DOCTYPE html><html><h1>${params.a}</h1></html>`
			}
		}
  })

	return p.render('/a/10').then(html => {
		t.equal(html, '<!DOCTYPE html><html><h1>10</h1></html>')
	})
})

