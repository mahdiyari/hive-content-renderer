const URL = require('url-parse')

const Phishing = require('./Phishing')

class LinkSanitizer {
  constructor (options) {
    this.options = options
    this.baseUrl = new URL(this.options.baseUrl)
    this.topLevelsBaseDomain = this.getTopLevelBaseDomainFromBaseUrl(
      this.baseUrl
    )
  }

  sanitizeLink (url, urlTitle) {
    url = this.prependUnknownProtocolLink(url)

    if (Phishing(url)) {
      return false
    }

    if (this.isPseudoLocalUrl(url, urlTitle)) {
      return false
    }
    return url
  }

  getTopLevelBaseDomainFromBaseUrl (url) {
    const regex = /([^\s/$.?#]+\.[^\s/$.?#]+)$/g
    const m = regex.exec(url.hostname)
    if (m && m[0]) return m[0]
    else {
      throw new Error(
        `LinkSanitizer: could not determine top level base domain from baseUrl hostname: ${url.hostname}`
      )
    }
  }

  prependUnknownProtocolLink (url) {
    // If this link is not relative, http, https, or steem -- add https.
    if (!/^((#)|(\/(?!\/))|(((steem|https?):)?\/\/))/.test(url)) {
      url = 'https://' + url
    }
    return url
  }

  isPseudoLocalUrl (url, urlTitle) {
    if (url.indexOf('#') === 0) return false
    url = url.toLowerCase()
    urlTitle = urlTitle.toLowerCase()

    try {
      const urlTitleContainsBaseDomain =
        urlTitle.indexOf(this.topLevelsBaseDomain) !== -1
      const urlContainsBaseDomain = url.indexOf(this.topLevelsBaseDomain) !== -1
      if (urlTitleContainsBaseDomain && !urlContainsBaseDomain) {
        return true
      }
    } catch (error) {
      if (error instanceof TypeError) {
        return false // if url is invalid it is ok
      } else throw error
    }
    return false
  }
}

module.exports = LinkSanitizer
