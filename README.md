# hive-content-renderer

**CAUTION:** We don't suggest using this library in production without complete review of codes. You may compromise your website.

## Server side usage

Installation:

```bash
$ npm install --save hive-content-renderer
```

**Typescript:**

```typescript
import { DefaultRenderer } from 'hive-content-renderer'

const renderer = new DefaultRenderer({
  baseUrl: 'https://hive.blog/',
  breaks: true,
  skipSanitization: false,
  allowInsecureScriptTags: false,
  addNofollowToLinks: true,
  doNotShowImages: false,
  ipfsPrefix: '',
  assetsWidth: 640,
  assetsHeight: 480,
  imageProxyFn: (url: string) => url,
  usertagUrlFn: (account: string) => '/@' + account,
  hashtagUrlFn: (hashtag: string) => '/trending/' + hashtag,
  isLinkSafeFn: (url: string) => true
})

const safeHtmlStr = renderer.render(postContent)
```

## Browser usage:

** NOT WORKING RIGHT NOW **

```html
        <script src="https://unpkg.com/hive-content-renderer"></script>
        <script>
            const renderer = new SteemContentRenderer.DefaultRenderer({
                baseUrl: "https://hive.blog/",
                breaks: true,
                skipSanitization: false,
                allowInsecureScriptTags: false,
                addNofollowToLinks: true,
                doNotShowImages: false,
                ipfsPrefix: "",
                assetsWidth: 640,
                assetsHeight: 480,
                imageProxyFn: (url) => url,
                usertagUrlFn: (account) => "/@" + account,
                hashtagUrlFn: (hashtag) => "/trending/" + hashtag,
                isLinkSafeFn: (url) => true,
            });

            $(document).ready(() => {
                const renderMarkdownBtnElem = $("#render-button");
                const inputElem = $("#input");
                const outputElem = $("#output");
                const outputMarkupElem = $("#output-markup");

                renderMarkdownBtnElem.on("click", () => {
                    const input = inputElem.val();
                    const output = renderer.render(input);

                    console.log("Rendered", output);
                    outputElem.html(output);
                    outputMarkupElem.text(output);
                });
            });
        </script>
    </body>
</html>
```
