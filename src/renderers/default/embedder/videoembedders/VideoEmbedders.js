const AbstractVideoEmbedder = require('./AbstractVideoEmbedder')
const TwitchEmbedder = require('./TwitchEmbedder')
const VimeoEmbedder = require('./VimeoEmbedder')
const YoutubeEmbedder = require('./YoutubeEmbedder')

const LIST = [new YoutubeEmbedder(), new VimeoEmbedder(), new TwitchEmbedder()]

class VideoEmbedders {
  static processTextNodeAndInsertEmbeds (node) {
    const out = { links: [], images: [] }
    for (const embedder of LIST) {
      const markResult = embedder.markEmbedIfFound(node)
      if (markResult) {
        if (markResult.image) out.images.push(markResult.image)
        if (markResult.link) out.links.push(markResult.link)
      }
    }
    return out
  }

  static insertMarkedEmbedsToRenderedOutput (input, size) {
    return AbstractVideoEmbedder.insertAllEmbeds(LIST, input, size)
  }
}

module.exports = VideoEmbedders
