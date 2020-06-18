class SecurityChecker {
  static checkSecurity (text, props) {
    if (!props.allowScriptTag && this.containsScriptTag(text)) {
      throw new Error(
        'Renderer rejected the input because of insecure content: text contains script tag'
      )
    }
  }

  static containsScriptTag (text) {
    return /<\s*script/gi.test(text)
  }
}

module.exports = SecurityChecker
