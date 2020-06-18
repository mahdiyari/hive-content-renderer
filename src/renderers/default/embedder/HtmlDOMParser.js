/**
 * Based on: https://github.com/steemit/condenser/raw/master/src/shared/HtmlReady.js
 */
// tslint:disable max-classes-per-file
const xmldom = require('xmldom')

const LinkSanitizer = require('../../../security/LinkSanitizer')

const AccountNameValidator = require('./utils/AccountNameValidator')
const linksRe = require('./utils/Links')
const VideoEmbedders = require('./videoembedders/VideoEmbedders')
const YoutubeEmbedder = require('./videoembedders/YoutubeEmbedder')

class HtmlDOMParser {
  constructor (options, localization) {
    this.options = options
    this.localization = localization
    this.linkSanitizer = new LinkSanitizer({
      baseUrl: this.options.baseUrl
    })

    this.state = {
      hashtags: new Set(),
      usertags: new Set(),
      htmltags: new Set(),
      images: new Set(),
      links: new Set()
    }
    this.domParser = new xmldom.DOMParser({
      errorHandler: {
        warning: () => {
          /* */
        },
        error: () => {
          /* */
        }
      }
    })
    this.xmlSerializer = new xmldom.XMLSerializer()
    this.mutate = true
  }

  setMutateEnabled (mutate) {
    this.mutate = mutate
    return this
  }

  parse (html) {
    try {
      const doc = this.domParser.parseFromString(html, 'text/html')
      this.traverseDOMNode(doc)
      if (this.mutate) this.postprocessDOM(doc)
      this.parsedDocument = doc
    } catch (error) {
      throw new Error('Parsing error' + error)
    }

    return this
  }

  getState () {
    if (!this.parsedDocument) {
      throw new Error('Html has not been parsed yet')
    }
    return this.state
  }

  getParsedDocument () {
    if (!this.parsedDocument) {
      throw new Error('Html has not been parsed yet')
    }
    return this.parsedDocument
  }

  getParsedDocumentAsString () {
    return this.xmlSerializer.serializeToString(this.getParsedDocument())
  }

  traverseDOMNode (node, depth = 0) {
    if (!node || !node.childNodes) {
      return
    }

    Array.from(node.childNodes).forEach((child) => {
      const tag = child.tagName ? child.tagName.toLowerCase() : null
      if (tag) {
        this.state.htmltags.add(tag)
      }

      if (tag === 'img') {
        this.processImgTag(child)
      } else if (tag === 'iframe') {
        this.processIframeTag(child)
      } else if (tag === 'a') {
        this.processLinkTag(child)
      } else if (child.nodeName === '#text') {
        this.processTextNode(child)
      }

      this.traverseDOMNode(child, depth + 1)
    })
  }

  processLinkTag (child) {
    const url = child.getAttribute('href')
    if (url) {
      this.state.links.add(url)
      if (this.mutate) {
        // Unlink potential phishing attempts
        const urlTitle = child.textContent + ''
        const sanitizedLink = this.linkSanitizer.sanitizeLink(url, urlTitle)
        if (sanitizedLink === false) {
          const phishyDiv = child.ownerDocument.createElement('div')
          phishyDiv.textContent = `${child.textContent} / ${url}`
          phishyDiv.setAttribute('title', this.localization.phishingWarning)
          phishyDiv.setAttribute('class', 'phishy')
          child.parentNode.replaceChild(phishyDiv, child)
        } else {
          child.setAttribute('href', sanitizedLink)
        }
      }
    }
  }

  // wrap iframes in div.videoWrapper to control size/aspect ratio
  processIframeTag (child) {
    const url = child.getAttribute('src')
    if (url) this.reportIframeLink(url)

    if (!this.mutate) {
      return
    }

    const tag = child.parentNode.tagName
      ? child.parentNode.tagName.toLowerCase()
      : child.parentNode.tagName
    if (
      tag === 'div' &&
      child.parentNode.getAttribute('class') === 'videoWrapper'
    ) {
      return
    }
    const html = this.xmlSerializer.serializeToString(child)
    child.parentNode.replaceChild(
      this.domParser.parseFromString(`<div class="videoWrapper">${html}</div>`),
      child
    )
  }

  reportIframeLink (url) {
    const yt = YoutubeEmbedder.getYoutubeMetadataFromLink(url)
    if (yt) {
      this.state.links.add(yt.url)
      this.state.images.add('https://img.youtube.com/vi/' + yt.id + '/0.jpg')
    }
  }

  processImgTag (child) {
    const url = child.getAttribute('src')
    if (url) {
      this.state.images.add(url)
      if (this.mutate) {
        let url2 = this.normalizeUrl(url)
        if (/^\/\//.test(url2)) {
          // Change relative protocol imgs to https
          url2 = 'https:' + url2
        }
        if (url2 !== url) {
          child.setAttribute('src', url2)
        }
      }
    }
  }

  processTextNode (child) {
    try {
      const tag = child.parentNode.tagName
        ? child.parentNode.tagName.toLowerCase()
        : child.parentNode.tagName
      if (tag === 'code') {
        return
      }
      if (tag === 'a') {
        return
      }

      if (!child.data) {
        return
      }

      const embedResp = VideoEmbedders.processTextNodeAndInsertEmbeds(child)
      embedResp.images.forEach((img) => this.state.images.add(img))
      embedResp.links.forEach((link) => this.state.links.add(link))

      const data = this.xmlSerializer.serializeToString(child)
      const content = this.linkify(data)
      if (this.mutate && content !== data) {
        const newChild = this.domParser.parseFromString(
          `<span>${content}</span>`
        )
        child.parentNode.replaceChild(newChild, child)
        return newChild
      }
    } catch (error) {
      console.error(error)
    }
  }

  linkify (content) {
    // plaintext links
    content = content.replace(linksRe.linksAny('gi'), (ln) => {
      if (linksRe.image.test(ln)) {
        this.state.images.add(ln)
        return `<img src="${this.normalizeUrl(ln)}" />`
      }

      // do not linkify .exe or .zip urls
      if (/\.(zip|exe)$/i.test(ln)) {
        return ln
      }

      // do not linkify phishy links
      const sanitizedLink = this.linkSanitizer.sanitizeLink(ln, ln)
      if (sanitizedLink === false) {
        return `<div title='${this.localization.phishingWarning}' class='phishy'>${ln}</div>`
      }

      this.state.links.add(sanitizedLink)
      const out = `<a href="${this.normalizeUrl(ln)}">${sanitizedLink}</a>`
      return out
    })

    // hashtag
    content = content.replace(/(^|\s)(#[-a-z\d]+)/gi, (tag) => {
      if (/#[\d]+$/.test(tag)) {
        return tag
      } // Don't allow numbers to be tags
      const space = /^\s/.test(tag) ? tag[0] : ''
      const tag2 = tag.trim().substring(1)
      const tagLower = tag2.toLowerCase()
      this.state.hashtags.add(tagLower)
      if (!this.mutate) {
        return tag
      }
      const tagUrl = this.options.hashtagUrlFn(tagLower)
      return space + `<a href="${tagUrl}">${tag.trim()}</a>`
    })

    // usertag (mention)
    // Cribbed from https://github.com/twitter/twitter-text/blob/v1.14.7/js/twitter-text.js#L90
    content = content.replace(
      /(^|[^a-zA-Z0-9_!#$%&*@＠/]|(^|[^a-zA-Z0-9_+~.-/#]))[@＠]([a-z][-.a-z\d]+[a-z\d])/gi,
      (match, preceeding1, preceeding2, user) => {
        const userLower = user.toLowerCase()
        const valid = AccountNameValidator(userLower) == null

        if (valid && this.state.usertags) {
          this.state.usertags.add(userLower)
        }

        // include the preceeding matches if they exist
        const preceedings = (preceeding1 || '') + (preceeding2 || '')

        if (!this.mutate) {
          return `${preceedings}${user}`
        }

        const userTagUrl = this.options.usertagUrlFn(userLower)
        return valid
          ? `${preceedings}<a href="${userTagUrl}">@${user}</a>`
          : `${preceedings}@${user}`
      }
    )
    return content
  }

  postprocessDOM (doc) {
    this.hideImagesIfNeeded(doc)
    this.proxifyImagesIfNeeded(doc)
  }

  hideImagesIfNeeded (doc) {
    if (this.mutate && this.options.hideImages) {
      for (const image of Array.from(doc.getElementsByTagName('img'))) {
        const pre = doc.createElement('pre')
        pre.setAttribute('class', 'image-url-only')
        pre.appendChild(doc.createTextNode(image.getAttribute('src') || ''))
        if (image.parentNode) {
          image.parentNode.replaceChild(pre, image)
        }
      }
    }
  }

  proxifyImagesIfNeeded (doc) {
    if (this.mutate && !this.options.hideImages) {
      this.proxifyImages(doc)
    }
  }

  // For all img elements with non-local URLs, prepend the proxy URL (e.g. `https://img0.steemit.com/0x0/`)
  proxifyImages (doc) {
    if (!doc) {
      return
    }
    Array.from(doc.getElementsByTagName('img')).forEach((node) => {
      const url = node.getAttribute('src') || ''
      if (!linksRe.local.test(url)) {
        node.setAttribute('src', this.options.imageProxyFn(url))
      }
    })
  }

  normalizeUrl (url) {
    if (this.options.ipfsPrefix) {
      // Convert //ipfs/xxx  or /ipfs/xxx  into  https://steemit.com/ipfs/xxxxx
      if (/^\/?\/ipfs\//.test(url)) {
        const slash = url.charAt(1) === '/' ? 1 : 0
        url = url.substring(slash + '/ipfs/'.length) // start with only 1 /
        return this.options.ipfsPrefix + '/' + url
      }
    }
    return url
  }
}

module.exports = HtmlDOMParser
