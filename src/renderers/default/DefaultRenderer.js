const Remarkable = require('remarkable').Remarkable
const SecurityChecker = require('../../security/SecurityChecker')
const AssetEmbedder = require('./embedder/AssetEmbedder')
const PreliminarySanitizer = require('./sanitization/PreliminarySanitizer')
const TagTransformingSanitizer = require('./sanitization/TagTransformingSanitizer')

class DefaultRenderer {
  constructor (options, localization) {
    this.options = options

    this.tagTransformingSanitizer = new TagTransformingSanitizer(
      {
        iframeWidth: this.options.assetsWidth,
        iframeHeight: this.options.assetsHeight,
        addNofollowToLinks: this.options.addNofollowToLinks,
        noImage: this.options.doNotShowImages,
        isLinkSafeFn: this.options.isLinkSafeFn
      },
      localization
    )

    this.embedder = new AssetEmbedder(
      {
        ipfsPrefix: this.options.ipfsPrefix,
        width: this.options.assetsWidth,
        height: this.options.assetsHeight,
        hideImages: this.options.doNotShowImages,
        imageProxyFn: this.options.imageProxyFn,
        hashtagUrlFn: this.options.hashtagUrlFn,
        usertagUrlFn: this.options.usertagUrlFn,
        baseUrl: this.options.baseUrl
      },
      localization
    )
  }

  render (input) {
    if (input && typeof input === 'string' && input !== '') {
      return this.doRender(input)
    }
  }

  doRender (text) {
    text = PreliminarySanitizer.preliminarySanitize(text)

    const isHtml = this.isHtml(text)
    text = isHtml ? text : this.renderMarkdown(text)

    text = this.wrapRenderedTextWithHtmlIfNeeded(text)
    text = this.embedder.markAssets(text)
    text = this.sanitize(text)
    SecurityChecker.checkSecurity(text, {
      allowScriptTag: this.options.allowInsecureScriptTags
    })
    text = this.embedder.insertAssets(text)

    return text
  }

  renderMarkdown (text) {
    const renderer = new Remarkable({
      html: true, // remarkable renders first then sanitize runs...
      breaks: this.options.breaks,
      typographer: false, // https://github.com/jonschlinkert/remarkable/issues/142#issuecomment-221546793
      quotes: '“”‘’'
    })
    return renderer.render(text)
  }

  wrapRenderedTextWithHtmlIfNeeded (renderedText) {
    // If content isn't wrapped with an html element at this point, add it.
    if (renderedText.indexOf('<html>') !== 0) {
      renderedText = '<html>' + renderedText + '</html>'
    }
    return renderedText
  }

  isHtml (text) {
    let html = false
    // See also ReplyEditor isHtmlTest
    const m = text.match(/^<html>([\S\s]*)<\/html>$/)
    if (m && m.length === 2) {
      html = true
      text = m[1]
    } else {
      // See also ReplyEditor isHtmlTest
      html = /^<p>[\S\s]*<\/p>/.test(text)
    }
    return html
  }

  sanitize (text) {
    if (this.options.skipSanitization) {
      return text
    }

    return this.tagTransformingSanitizer.sanitize(text)
  }
}

module.exports = DefaultRenderer
