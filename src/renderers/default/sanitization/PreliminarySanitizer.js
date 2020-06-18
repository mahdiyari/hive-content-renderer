class PreliminarySanitizer {
  static preliminarySanitize (text) {
    return PreliminarySanitizer.stripHtmlComments(text)
  }

  static stripHtmlComments (text) {
    return text.replace(/<!--([\s\S]+?)(-->|$)/g, '(html comment removed: $1)')
  }
}

module.exports = PreliminarySanitizer
