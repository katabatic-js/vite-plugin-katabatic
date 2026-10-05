/** @import {Plugin} from 'vite' */

import path from 'path'
import { compile } from '@katabatic/compiler'

/**
 * @returns {Plugin}
 */
export function katabatic() {
    return {
        name: 'vite-plugin-katabatic',
        transform(src, id) {
            if (id.endsWith('.ktb')) {
                const name = path.basename(id, '.ktb')
                const moduleHash = hash(id)

                return withHMR(
                    compile(src, {
                        customElementName: `${name}-${moduleHash}`,
                        customElementClassName: camelCase(name),
                        hash: moduleHash,
                        hot: true
                    })
                )
            }
        }
    }
}

function withHMR({ code, ...rest }) {
    code = code.replace(
        /customElements\.define\('([^']+)', ([^)]+)\)/,
        `
if (import.meta.hot) {
    let HotElement = customElements.get('$1')

    if (!HotElement) {
        HotElement = class extends HTMLElement {
            constructor() {
                super()
                this.$hot()
            }
            connectedCallback() {
                super.connectedCallback()
            }
            disconnectedCallback() {
                super.disconnectedCallback()
            }
        }

        $2.prototype.$hot = $hot
        Object.setPrototypeOf(HotElement.prototype, $2.prototype)

        customElements.define('$1', HotElement)
    }

    import.meta.hot.accept((newModule) => {
        if (newModule) {
            if (newModule.$name !== '$1') {
                return
            }
            if (newModule.$shadowRootMode !== $shadowRootMode) {
                newModule.$class.prototype.$hot = newModule.$hot
                Object.setPrototypeOf(HotElement.prototype, newModule.$class.prototype)

                import.meta.hot.invalidate()
                return
            }
        
            document.querySelectorAll('$1').forEach((node) => {
                node.$hot(true)
                node.disconnectedCallback()
            })

            queueMicrotask(() => {
                newModule.$class.prototype.$hot = newModule.$hot
                Object.setPrototypeOf(HotElement.prototype, newModule.$class.prototype)

                document.querySelectorAll('$1').forEach((node) => {
                    node.$hot()
                    node.connectedCallback()
                })
            })
        }
    })
} else {
    customElements.define('$1', $2)
}`
    )

    return { code, ...rest }
}

function hash(str) {
    let hash = 5381
    let i = str.length

    while (i--) hash = ((hash << 5) - hash) ^ str.charCodeAt(i)
    return (hash >>> 0).toString(36)
}

function camelCase(str) {
    const result =  str.replace(/-([a-zA-Z0-9])/g, g => g[1].toUpperCase())
    return result.charAt(0).toUpperCase() + result.slice(1)
}