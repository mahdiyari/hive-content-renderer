const HtmlDOMParser = require('./HtmlDOMParser')
const VideoEmbedders = require('./videoembedders/VideoEmbedders')

class AssetEmbedder {
  constructor (options, localization) {
    this.options = options
    this.localization = localization
  }

  markAssets (input) {
    const parser = new HtmlDOMParser(this.options, this.localization)
    return parser.parse(input).getParsedDocumentAsString()
  }

  insertAssets (input) {
    const size = {
      width: this.options.width,
      height: this.options.height
    }
    return VideoEmbedders.insertMarkedEmbedsToRenderedOutput(input, size)
  }
}

module.exports = AssetEmbedder
