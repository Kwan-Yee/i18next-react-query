# Introduction

[![Actions](https://github.com/i18next/i18next-http-backend/workflows/node/badge.svg)](https://github.com/i18next/i18next-http-backend/actions?query=workflow%3Anode)
[![Actions deno](https://github.com/i18next/i18next-http-backend/workflows/deno/badge.svg)](https://github.com/i18next/i18next-http-backend/actions?query=workflow%3Adeno)
[![npm version](https://img.shields.io/npm/v/i18next-http-backend.svg?style=flat-square)](https://www.npmjs.com/package/i18next-http-backend)

This is an i18next backend specifically designed for React Native applications with TanStack Query integration. It provides enhanced caching, retry logic, and React Native-specific optimizations for loading translation resources from a backend server.

Get a first idea on how it is used in [this i18next crash course video](https://youtu.be/SA_9i4TtxLQ?t=953).

It's based on the deprecated [i18next-xhr-backend](https://github.com/i18next/i18next-xhr-backend) and can mostly be used as a drop-in replacement.

_[Why i18next-xhr-backend was deprecated?](https://github.com/i18next/i18next-xhr-backend/issues/348#issuecomment-663060275)_

## Advice:

If you don't like to manage your translation files manually or are simply looking for a [better management solution](https://locize.com), take a look at [i18next-locize-backend](https://github.com/locize/i18next-locize-backend). The i18next [backed plugin](https://www.i18next.com/overview/plugins-and-utils#backends) for 🌐 [locize](https://locize.com) ☁️.

_To see [i18next-locize-backend](https://github.com/locize/i18next-locize-backend) in a working app example, check out:_

- _[this react-tutorial](https://github.com/locize/react-tutorial) starting from [Step 2](https://github.com/locize/react-tutorial#step-2---use-the-locize-cdn)_
- _[this guide](https://locize.com/blog/react-i18next/) starting from the step of [replacing i18next-http-backend with i18next-locize-backend](https://locize.com/blog/react-i18next/#how-look)_
- _[this Angular blog post](https://locize.com/blog/angular-i18next/) [introducing i18next-locize-backend](https://locize.com/blog/angular-i18next/#how-look)_
- _[the code integration part](https://www.youtube.com/watch?v=TFV_vhJs5DY&t=294s) in this [YouTube video](https://www.youtube.com/watch?v=TFV_vhJs5DY)_

## Troubleshooting

Make sure you set the `debug` option of i18next to `true`. This will maybe log more information in the developer console.

### Seeing failed http requests, like 404?

Are you using a [language detector](https://github.com/i18next/i18next-browser-languageDetector) plugin that detects region specific languages you are not providing? i.e. you provide `'en'` translations but you see a `'en-US'` request first?

This is because of the default `load` [option](https://www.i18next.com/overview/configuration-options) set to `'all'`.

Try to set the `load` [option](https://www.i18next.com/overview/configuration-options) to `'languageOnly'`

```javascript
i18next.init({
  load: 'languageOnly'
  // other options
})
```

[This article](https://www.locize.com/blog/i18next-translations-not-loaded) may also help to understand/investigate that.

### Slow i18next initialization?

The chance is high, that your http requests fails. In that case i18next retries a couple of times before finishing the initialization.
You have 2 options to address this:

_1) The correct way:_
Analyze your http requests and fix them. (Wrong path? Wrong server implementation? etc...)

_2) Configure i18next to not retry:_
Modify the `retryTimeout` and/or `maxRetries` to match your needs. (i.e. set `maxRetries: 1`)

```js
i18next.init({
  // ...
  retryTimeout: 350,
  maxRetries: 5
  // ...
})
```

# Getting started

Install the package via npm:

```bash
npm install i18next-http-backend @tanstack/react-query react react-native @react-native-netinfo/netinfo
# For TypeScript projects:
npm install @types/react @types/react-native
```

Basic setup for React Native:

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import i18next from 'i18next'
import { initReactI18next } from 'react-i18next'
import HttpBackend from 'i18next-http-backend'
import { createReactNativeQueryClient } from 'i18next-http-backend/lib/react-native-config'

// Create optimized QueryClient for React Native
const queryClient = createReactNativeQueryClient()

// Initialize i18next with TanStack Query support
i18next
  .use(HttpBackend)
  .use(initReactI18next)
  .init({
    backend: {
      loadPath: '/locales/{{lng}}/{{ns}}.json',
      queryClient: queryClient,
      tanstackQuery: {
        enabled: true
      }
    }
  })

function App() {
  return <QueryClientProvider client={queryClient}>{/* Your React Native app components */}</QueryClientProvider>
}
```

## Backend Options

```js
{
  // path where resources get loaded from, or a function
  // returning a path:
  // function(lngs, namespaces) { return customPath; }
  // the returned path will interpolate lng, ns if provided like giving a static path
  // the function might return a promise
  // returning falsy will abort the download
  //
  // If not used with i18next-multiload-backend-adapter, lngs and namespaces will have only one element each,
  // If used with i18next-multiload-backend-adapter, lngs and namespaces can have multiple elements
  //   and also your server needs to support multiloading
  //      /locales/resources.json?lng=de+en&ns=ns1+ns2
  //   Adapter is needed to enable MultiLoading https://github.com/i18next/i18next-multiload-backend-adapter
  //   Returned JSON structure in this case is
  //   {
  //    lang : {
  //     namespaceA: {},
  //     namespaceB: {},
  //     ...etc
  //    }
  //   }
  loadPath: '/locales/{{lng}}/{{ns}}.json',

  // path to post missing resources, or a function
  // function(lng, namespace) { return customPath; }
  // the returned path will interpolate lng, ns if provided like giving a static path
  //
  // note that this only works when initialized with { saveMissing: true }
  // (see https://www.i18next.com/overview/configuration-options)
  addPath: '/locales/add/{{lng}}/{{ns}}',

  // parse data after it has been fetched
  // in example use https://www.npmjs.com/package/json5 or https://www.npmjs.com/package/jsonc-parser
  // here it removes the letter a from the json (bad idea)
  parse: function(data) { return data.replace(/a/g, ''); },

  // parse data before it has been sent by addPath
  parsePayload: function(namespace, key, fallbackValue) { return { key: fallbackValue || "" } },

  // parse data before it has been sent by loadPath
  // if value returned it will send a POST request
  parseLoadPayload: function(languages, namespaces) { return undefined },

  // allow cross domain requests
  crossDomain: false,

  // allow credentials on cross domain requests
  withCredentials: false,

  // overrideMimeType sets request.overrideMimeType("application/json")
  overrideMimeType: false,

  // custom request headers sets request.setRequestHeader(key, value)
  customHeaders: {
    authorization: 'foo',
    // ...
  },
  // can also be a function, that returns the headers
  customHeaders: () => ({
    authorization: 'foo',
    // ...
  }),

  requestOptions: { // used for fetch, can also be a function (payload) => ({ method: 'GET' })
    mode: 'cors',
    credentials: 'same-origin',
    cache: 'default'
  },

  // define a custom request function
  // can be used to support XDomainRequest in IE 8 and 9
  //
  // 'options' will be this entire options object
  // 'url' will be passed the value of 'loadPath'
  // 'payload' will be a key:value object used when saving missing translations
  // 'callback' is a function that takes two parameters, 'err' and 'res'.
  //            'err' should be an error
  //            'res' should be an object with a 'status' property and a 'data' property containing a stringified object instance beeing the key:value translation pairs for the
  //            requested language and namespace, or null in case of an error.
  request: function (options, url, payload, callback) {},

  // adds parameters to resource URL. 'example.com' -> 'example.com?v=1.3.5'
  queryStringParams: { v: '1.3.5' },

  reloadInterval: false // can be used to reload resources in a specific interval (milliseconds) (useful in server environments)
}
```

Options can be passed in:

**preferred** - by setting options.backend in i18next.init:

```js
import i18next from 'i18next'
import HttpApi from 'i18next-http-backend'

i18next.use(HttpApi).init({
  backend: options
})
```

on construction:

```js
import HttpApi from 'i18next-http-backend'
const HttpApi = new HttpApi(null, options)
```

via calling init:

```js
import HttpApi from 'i18next-http-backend'
const HttpApi = new HttpApi()
HttpApi.init(null, options)
```

## TypeScript

To properly type the backend options, you can import the `HttpBackendOptions` interface and use it as a generic type parameter to the i18next's `init` method, e.g.:

```ts
import i18n from 'i18next'
import HttpBackend, { HttpBackendOptions } from 'i18next-http-backend'

i18n.use(HttpBackend).init<HttpBackendOptions>({
  backend: {
    // http backend options
  }

  // other i18next options
})
```

---

<h3 align="center">Gold Sponsors</h3>

<p align="center">
  <a href="https://locize.com/" target="_blank">
    <img src="https://raw.githubusercontent.com/i18next/i18next/master/assets/locize_sponsor_240.gif" width="240px">
  </a>
</p>

---

**From the creators of i18next: localization as a service - locize.com**

A translation management system built around the i18next ecosystem - [locize.com](https://locize.com).

![locize](https://locize.com/img/ads/github_locize.png)

With using [locize](http://locize.com/?utm_source=react_i18next_readme&utm_medium=github) you directly support the future of i18next.

---
