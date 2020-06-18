const linksRe = require('../utils/Links')
const AbstractVideoEmbedder = require('./AbstractVideoEmbedder')
const TYPE = 'vimeo'

class VimeoEmbedder extends AbstractVideoEmbedder {
  markEmbedIfFound (child) {
    try {
      const data = child.data
      const vimeo = this.vimeoId(data)
      if (!vimeo) {
        return undefined
      }
      const embedMarker = AbstractVideoEmbedder.getEmbedMarker(vimeo.id, TYPE)

      child.data = data.replace(vimeo.url, embedMarker)

      return { link: vimeo.canonical }
    } catch (error) {
      console.error(error)
    }
    return undefined
  }

  processEmbedIfRelevant (embedType, id, size, htmlElementKey) {
    if (embedType !== TYPE) return undefined
    const url = `https://player.vimeo.com/video/${id}`
    return `<div className="videoWrapper">
            <iframe
                key=${htmlElementKey}
                src=${url}
                width=${size.width}
                height=${size.height}
                frameBorder="0"
                webkitallowfullscreen
                mozallowfullscreen
                allowFullScreen
            />
        </div>`
  }

  vimeoId (data) {
    if (!data) {
      return null
    }
    const m = data.match(linksRe.vimeo)
    if (!m || m.length < 2) {
      return null
    }

    return {
      id: m[1],
      url: m[0],
      canonical: `https://player.vimeo.com/video/${m[1]}`
      // thumbnail: requires a callback - http://stackoverflow.com/questions/1361149/get-img-thumbnails-from-vimeo
    }
  }
}

module.exports = VimeoEmbedder
