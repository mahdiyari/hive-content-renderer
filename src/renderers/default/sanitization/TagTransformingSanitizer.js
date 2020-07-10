/**
 * This file is based on https://github.com/steemit/condenser/blob/master/src/app/utils/SanitizeConfig.js
 */
const sanitize = require('sanitize-html-2')
const StaticConfig = require('../StaticConfig')

class TagTransformingSanitizer {
  constructor (options, localization) {
    this.localization = localization
    this.options = options
  }

  sanitize (text) {
    return sanitize(text, this.generateSanitizeConfig())
  }

  getErrors () {
    return this.sanitizationErrors
  }

  generateSanitizeConfig () {
    return {
      allowedTags: StaticConfig.sanitization.allowedTags,

      // SEE https://www.owasp.org/index.php/XSS_Filter_Evasion_Cheat_Sheet
      allowedAttributes: {
        // "src" MUST pass a whitelist (below)
        iframe: [
          'src',
          'width',
          'height',
          'frameborder',
          'allowfullscreen',
          'webkitallowfullscreen',
          'mozallowfullscreen'
        ],

        // class attribute is strictly whitelisted (below)
        // and title is only set in the case of a phishing warning
        div: ['class', 'title'],

        // style is subject to attack, filtering more below
        td: ['style'],
        img: ['src', 'alt'],

        // title is only set in the case of an external link warning
        a: ['href', 'rel', 'title']
      },
      allowedSchemes: ['http', 'https', 'steem'],
      transformTags: {
        iframe: (tagName, attribs) => {
          const srcAtty = attribs.src
          for (const item of StaticConfig.sanitization.iframeWhitelist) {
            if (item.re.test(srcAtty)) {
              const src =
                typeof item.fn === 'function' ? item.fn(srcAtty) : srcAtty
              if (!src) {
                break
              }
              const iframeToBeReturned = {
                tagName: 'iframe',
                attribs: {
                  frameborder: '0',
                  allowfullscreen: 'allowfullscreen',

                  // deprecated but required for vimeo : https://vimeo.com/forums/help/topic:278181
                  webkitallowfullscreen: 'webkitallowfullscreen',

                  mozallowfullscreen: 'mozallowfullscreen', // deprecated but required for vimeo
                  src,
                  width: this.options.iframeWidth + '',
                  height: this.options.iframeHeight + ''
                }
              }
              return iframeToBeReturned
            }
          }
          console.warn(
            'Blocked, did not match iframe "src" white list urls:',
            tagName,
            attribs
          )
          this.sanitizationErrors.push('Invalid iframe URL: ' + srcAtty)

          const retTag = {
            tagName: 'div',
            text: `(Unsupported ${srcAtty})`,
            attribs: {}
          }
          return retTag
        },
        img: (tagName, attribs) => {
          if (this.options.noImage) {
            const retTagOnImagesNotAllowed = {
              tagName: 'div',
              text: this.localization.noImage,
              attribs: {}
            }
            return retTagOnImagesNotAllowed
          }
          // See https://github.com/punkave/sanitize-html/issues/117
          const { src, alt } = attribs
          if (!/^(https?:)?\/\//i.test(src)) {
            console.warn(
              'Blocked, image tag src does not appear to be a url',
              tagName,
              attribs
            )
            this.sanitizationErrors.push(
              'An image in this post did not save properly.'
            )
            const retTagOnNoUrl = {
              tagName: 'img',
              attribs: { src: 'brokenimg.jpg' }
            }
            return retTagOnNoUrl
          }

          const atts = {}
          atts.src = src.replace(/^http:\/\//i, '//') // replace http:// with // to force https when needed
          if (alt && alt !== '') {
            atts.alt = alt
          }
          const retTag = { tagName, attribs: atts }
          return retTag
        },
        div: (tagName, attribs) => {
          const attys = {}
          const classWhitelist = [
            'pull-right',
            'pull-left',
            'text-justify',
            'text-rtl',
            'text-center',
            'text-right',
            'videoWrapper',
            'phishy'
          ]
          const validClass = classWhitelist.find((e) => attribs.class === e)
          if (validClass) {
            attys.class = validClass
          }
          if (
            validClass === 'phishy' &&
            attribs.title === this.localization.phishingWarning
          ) {
            attys.title = attribs.title
          }
          const retTag = {
            tagName,
            attribs: attys
          }
          return retTag
        },
        td: (tagName, attribs) => {
          const attys = {}
          if (attribs.style === 'text-align:right') {
            attys.style = 'text-align:right'
          }
          const retTag = {
            tagName,
            attribs: attys
          }
          return retTag
        },
        a: (tagName, attribs) => {
          let { href } = attribs
          if (!href) {
            href = '#'
          }
          href = href.trim()
          const attys = { href }
          // If it's not a (relative or absolute) steemit URL...
          if (!this.options.isLinkSafeFn(href)) {
            // attys.target = '_blank' // pending iframe impl https://mathiasbynens.github.io/rel-noopener/
            attys.rel = this.options.addNofollowToLinks
              ? 'nofollow noopener'
              : 'noopener'
            attys.title = this.localization.phishingWarning
          }
          const retTag = {
            tagName,
            attribs: attys
          }
          return retTag
        }
      }
    }
  }
}

module.exports = TagTransformingSanitizer
