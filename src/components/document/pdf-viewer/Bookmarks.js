import { useCallback, useEffect, useState } from 'react'
import { TreeItem } from '@material-ui/lab'
import { useDocument } from './DocumentProvider'

export default function Bookmarks({ onSelect }) {
    const { doc, bookmarks, setBookmarks } = useDocument()

    const createItemsTree = async items => {
        const elements = []
        if (items?.length) {
            for (let i = 0; i < items.length; i++) {
                const { title, dest, items: subItems } = items[i]
                const index = await new Promise(resolve => {
                    doc.getDestination(dest).then(dest => {
                        const ref = dest[0]
                        doc.getPageIndex(ref).then(resolve)
                    })
                })
                elements.push({ title, index, items: await createItemsTree(subItems) })
            }
        }
        return elements
    }

    useEffect(async () => {
        const outline = await new Promise(resolve => {
            doc.getOutline().then(resolve)
        })
        const tree = await createItemsTree(outline)
        setBookmarks(tree)
    }, [doc])

    const handleItemClick = index => event => {
        event.preventDefault()
        onSelect(index)
    }

    let id = 1
    const renderTree = useCallback(items => !items?.length ? null :
        items.map(({ title, index, items: subItems }) => (
            <TreeItem key={id} nodeId={title} label={title} onLabelClick={handleItemClick(index)}>
                {renderTree(subItems)}
            </TreeItem>
        )), [bookmarks])

    return (
        !bookmarks.length ? <TreeItem nodeId="0" label="No bookmarks" /> :
            renderTree(bookmarks)

    )
}
