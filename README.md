# Verso
A framework for writing very dumb single page apps.

Some single page apps are almost all static content.
For those apps, a small client library that just swaps
out the innerHTML of a dom node when navitation occurs, might be all that's needed.

The idea is that the page content can be generated in any number of fancy ways,
but when it's time to deploy the app, it gets rendered down to a dumb app that's mostly just string pushing.

##API
API is still a work in progress and will likely change greatly until v1.0 is published.
 
###Verso(pages, context): Verso
Creates a verso instance that's can serve the pages defined in the pages map.

The context is used to resolve params referenced in the page's function.

### Verso.run(uri, el): Promise
Runs the page for the given uri, and places the result inside the element passed in.

Resolves to the element that was updated, or rejects if no page matches the uri.

### Verso.render(uri): Promise
Resolves to the html for the generated page, or rejects if an no page matches the uri.


### Verso.compile(): Promise
Crawls the app starting from the root "/" and resolves to a hash with all of the reachable pages rendered and indexed by their uris.

## Example Usage

```JavaScript

// Pages this app can display, normally I'd break each page out into 
// its own module to keep things cleaner.
let pages = { 
    '/' : {            
      render: (contacts) => {
          return `<div>Welcome <span id="user-name"></span><div>
            ${contacts.map(contact => {
              let {id,name} = contact
              return `<a href="/contact/${id}">${name}</a>`
            }).join('')}
          </div></div>`
      },
      
      // Executes when the page is run
      customize: (el, user) => {
        el.querySelector('#user-name').innerHTML = user.name
      }
    },
    
    // Implicitly defines the page spec with a render function
    '/contact/:id': (id, contacts) => {
      let contact = contacts.find(c => c.id == id)
      return `<h1>${contact.name}'s Page</h1>`
    },
    
    // Simple String as page content
    '/about': 'About Page Here'
}
            
let context = {
  contacts: [
    {id: 1, name: 'Allain'},
    {id: 2, name: 'Debby'}
  ],
  user: {
    name: 'Guest'
  }
}
            
let v = Verso(pages, context)

v.run('/', document.getElementById('app')) // Renders the contact list into the DOM

v.compile().then(compiled => {
  console.log(compiled); 
})
```
The compiled output above would contain the keys 
`/, /contact/1, /contact/2` but would not contain `/about` 
because it cannot be accessed by crawling from the root of the app (`/`).