const linksRe = require('../utils/Links')
const AbstractVideoEmbedder = require('./AbstractVideoEmbedder')
const TYPE = 'twitch'

class TwitchEmbedder extends AbstractVideoEmbedder {
  markEmbedIfFound (child) {
    try {
      const data = child.data
      const twitch = this.twitchId(data)
      if (!twitch) {
        return undefined
      }

      const embedMarker = AbstractVideoEmbedder.getEmbedMarker(twitch.id, TYPE)
      child.data = data.replace(twitch.url, embedMarker)

      return { link: twitch.canonical }
    } catch (error) {
      console.error(error)
    }
    return undefined
  }

  processEmbedIfRelevant (embedType, id, size, htmlElementKey) {
    if (embedType !== TYPE) return undefined
    const url = `https://player.twitch.tv/${id}`
    return `<div className="videoWrapper">
                <iframe
                    key=${htmlElementKey}
                    src=${url}
                    width=${size.width}
                    height=${size.height}
                    rameBorder="0"
                    allowFullScreen
                />
            </div>`
  }

  twitchId (data) {
    if (!data) {
      return null
    }
    const m = data.match(linksRe.twitch)
    if (!m || m.length < 3) {
      return null
    }

    return {
      id: m[1] === 'videos' ? `?video=${m[2]}` : `?channel=${m[2]}`,
      url: m[0],
      canonical:
        m[1] === 'videos'
          ? `https://player.twitch.tv/?video=${m[2]}`
          : `https://player.twitch.tv/?channel=${m[2]}`
    }
  }
}

module.exports = TwitchEmbedder
