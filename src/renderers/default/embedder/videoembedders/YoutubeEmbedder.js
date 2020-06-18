const linksRe = require('../utils/Links')
const AbstractVideoEmbedder = require('./AbstractVideoEmbedder')
const TYPE = 'youtube'

class YoutubeEmbedder extends AbstractVideoEmbedder {
  static getYoutubeMetadataFromLink (data) {
    if (!data) {
      return null
    }

    const m1 = data.match(linksRe.youTube)
    const url = m1 ? m1[0] : null
    if (!url) {
      return null
    }

    const m2 = url.match(linksRe.youTubeId)
    const id = m2 && m2.length >= 2 ? m2[1] : null
    if (!id) {
      return null
    }

    return {
      id,
      url,
      thumbnail: 'https://img.youtube.com/vi/' + id + '/0.jpg'
    }
  }

  markEmbedIfFound (child) {
    try {
      const data = child.data
      const yt = YoutubeEmbedder.getYoutubeMetadataFromLink(data)
      if (!yt) {
        return undefined
      }

      const embedMarker = AbstractVideoEmbedder.getEmbedMarker(yt.id, TYPE)
      child.data = data.replace(yt.url, embedMarker)

      return { image: yt.thumbnail, link: yt.url }
    } catch (error) {
      console.error(error)
    }
    return undefined
  }

  processEmbedIfRelevant (embedType, id, size, htmlElementKey) {
    if (embedType !== TYPE) return undefined

    const ytUrl = `https://www.youtube.com/embed/${id}`
    return `<div class="videoWrapper"><iframe
                    width="${size.width}"
                    height="${size.height}"
                    src="${ytUrl}"
                    allowfullscreen="allowfullscreen"
                    webkitallowfullscreen="webkitallowfullscreen"
                    mozallowfullscreen="mozallowfullscreen"
                    frameborder="0"
                ></iframe></div>`
  }
}

module.exports = YoutubeEmbedder
