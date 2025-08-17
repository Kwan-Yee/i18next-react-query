import expect from 'expect.js'
import Backend from '../lib/index.js'
import server from './fixtures/server.js'

describe('TanStack Query Integration', () => {
  before(server)

  describe('Backend with TanStack Query disabled', () => {
    it('should work normally when TanStack Query is disabled', done => {
      const backend = new Backend(
        {
          interpolator: {
            interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
          }
        },
        {
          loadPath: 'http://localhost:5001/locales/{{lng}}/{{ns}}',
          tanstackQuery: {
            enabled: false
          }
        }
      )

      backend.read('en', 'test', (err, data) => {
        expect(err).to.be(null)
        expect(data).to.eql({ key: 'passing' })
        done()
      })
    })

    it('should work normally when queryClient is not provided', done => {
      const backend = new Backend(
        {
          interpolator: {
            interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
          }
        },
        {
          loadPath: 'http://localhost:5001/locales/{{lng}}/{{ns}}',
          tanstackQuery: {
            enabled: true // enabled but no queryClient
          }
        }
      )

      backend.read('en', 'test', (err, data) => {
        expect(err).to.be(null)
        expect(data).to.eql({ key: 'passing' })
        done()
      })
    })
  })

  describe('Backend configuration', () => {
    it('should accept tanstackQuery options without breaking', () => {
      const backend = new Backend(
        {
          interpolator: {
            interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
          }
        },
        {
          loadPath: '/locales/{{lng}}/{{ns}}.json',
          tanstackQuery: {
            enabled: false,
            staleTime: 10000,
            cacheTime: 20000,
            retry: 5
          }
        }
      )

      expect(backend.options.tanstackQuery.enabled).to.be(false)
      expect(backend.options.tanstackQuery.staleTime).to.be(10000)
      expect(backend.options.tanstackQuery.retry).to.be(5)
    })

    it('should have default tanstackQuery options', () => {
      const backend = new Backend(
        {
          interpolator: {
            interpolate: (str, obj) => str.replace(/{{(\w+)}}/g, (match, key) => obj[key])
          }
        },
        {}
      )

      expect(backend.options.tanstackQuery).to.be.ok()
      expect(backend.options.tanstackQuery.enabled).to.be(false)
      expect(backend.options.tanstackQuery.staleTime).to.be(5 * 60 * 1000)
      expect(backend.options.tanstackQuery.cacheTime).to.be(10 * 60 * 1000)
    })
  })
})
