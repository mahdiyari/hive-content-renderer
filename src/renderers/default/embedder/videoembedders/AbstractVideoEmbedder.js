// tslint:disable member-ordering

class AbstractVideoEmbedder {
  static getEmbedMarker (id, type) {
    return `~~~ embed:${id} ${type} ~~~`
  }

  static insertAllEmbeds (embedders, input, size) {
    // In addition to inserting the youtube component, this allows
    // react to compare separately preventing excessive re-rendering.
    let idx = 0
    const sections = []

    // HtmlReady inserts ~~~ embed:${id} type ~~~
    for (let section of input.split('~~~ embed:')) {
      const match = section.match(/^([A-Za-z0-9?=_-]+) ([^ ]*) ~~~/)
      if (match && match.length >= 3) {
        const id = match[1]
        const type = match[2]
        for (const embedder of embedders) {
          const resp = embedder.processEmbedIfRelevant(
            type,
            id,
            size,
            idx++ + ''
          )
          if (resp) {
            sections.push(resp)
            break
          }
        }
        section = section.substring(`${id} ${type} ~~~`.length)
        // section = section.substring(`${id} ${type} ~~~`.length);
        if (section === '') {
          continue
        }
      }
      sections.push(section)
    }
    return sections.join('')
  }
}

module.exports = AbstractVideoEmbedder
