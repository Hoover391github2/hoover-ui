import React from 'react'
import url from 'url'
import copy from 'copy-text-to-clipboard'
import langs from 'langs'

import file from '../icons/file-line.svg'
import folder from '../icons/folder-line.svg'
import archive from '../icons/file-zip-line.svg'
import email from '../icons/mail-line.svg'
import pdf from '../icons/file-pdf-line.svg'
import doc from '../icons/file-word-line.svg'
import xls from '../icons/file-excel-line.svg'

export const getIconImageElement = fileType => {
    const srcMap = {
        folder,
        archive,
        email,
        pdf,
        doc,
        xls,
        'email-archive': archive,
        default: file
    }
    const img = document.createElement('img');
    img.src = (srcMap[fileType] || srcMap.default);
    return img
}

export const getLanguageName = key => {
    const found = langs.where('1', key);
    return found ? found.name : key
}

export const getBasePath = docUrl => url.parse(url.resolve(docUrl, './')).pathname

export const makeUnsearchable = text => {
    let inMark = false;

    const chars = text.split('');

    return chars
        .map((c, i) => {
            if (c === '<') {
                const slice = text.slice(i);
                inMark =
                    slice.indexOf('<mark>') === 0 || slice.indexOf('</mark>') === 0;
            }

            if (c === '>') {
                const prefix = text.slice(i - 5, i);
                inMark = !(
                    prefix.indexOf('<mark') === 0 || prefix.indexOf('</mark')
                );
            }

            if (inMark || c === ' ' || c === '\n') {
                return c;
            } else {
                return `${c}<span class="no-find">S</span>`;
            }
        })
        .join('')
}

export const truncatePath = str => {
    if (str.length < 100) {
        return str;
    }
    const parts = str.split('/');

    return [
        ...parts.slice(0, parts.length / 3),
        '…',
        ...parts.slice(-(parts.length / 3)),
    ].join('/')
}

export const formatThousands = n =>
    String(n).replace(/(?<!\..*)(\d)(?=(?:\d{3})+(?:\.|$))/g, '$1,')

export const parseLocation = () =>  url.parse(window.location.href, true)

export const isPrintMode = () => {
    const { query } = parseLocation()
    return query.print && query.print !== 'false'
}

export const copyMetadata = doc => {
    const string = [doc.content.md5, doc.content.path].join('\n');

    return copy(string)
        ? `Copied MD5 and path to clipboard`
        : `Could not copy meta metadata – unsupported browser?`
};

export const documentViewUrl = item => ['/doc', item._collection, item._id].join('/');

export const removeCommentsAndSpacing = (str = '') =>
    str.replace(/\/\*.*\*\//g, ' ').replace(/\s+/g, ' ');

export const humanFileSize = (bytes, si=false, dp=1) => {
    const thresh = si ? 1000 : 1024

    if (Math.abs(bytes) < thresh) {
        return bytes + ' B'
    }

    const units = si
        ? ['kB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB']
        : ['KiB', 'MiB', 'GiB', 'TiB', 'PiB', 'EiB', 'ZiB', 'YiB']
    let u = -1
    const r = 10**dp

    do {
        bytes /= thresh
        ++u
    } while (Math.round(Math.abs(bytes) * r) / r >= thresh && u < units.length - 1)


    return bytes.toFixed(dp) + ' ' + units[u]
}
