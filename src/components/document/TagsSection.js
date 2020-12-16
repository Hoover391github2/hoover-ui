import React, { memo, useEffect, useState } from 'react'
import { blue } from '@material-ui/core/colors'
import ChipInput from 'material-ui-chip-input'
import { Chip } from '@material-ui/core'
import Section from './Section'
import Loading from '../Loading'
import { createTag, deleteTag, tags as tagsAPI, updateTag } from '../../backend/api'

function TagsSection({ docUrl }) {
    const [tags, setTags] = useState([])
    const [loading, setLoading] = useState(!!docUrl)
    useEffect(() => {
        if (docUrl) {
            setLoading(true)
            tagsAPI(docUrl).then(data => {
                setTags(data)
                setLoading(false)
            })
        }
    }, [docUrl])

    const [mutating, setMutating] = useState(false)
    const handleTagAdd = tag => {
        setMutating(true)
        createTag(docUrl, { tag, public: false }).then(() => {
            tagsAPI(docUrl).then(setTags)
            setMutating(false)
        }).catch(() => {
            setMutating(false)
        })
    }

    const handleTagDelete = tag => {
        tag.isMutating = true
        setTags([...tags])
        deleteTag(docUrl, tag.id).then(() => {
            tagsAPI(docUrl).then(setTags)
        }).catch(() => {
            tag.isMutating = false
            setTags([...tags])
        })
    }

    const handleClick = tag => () => {
        tag.isMutating = true
        setTags([...tags])
        updateTag(docUrl, tag.id, { public: !tag.public }).then(() => {
            tagsAPI(docUrl).then(setTags)
        }).catch(() => {
            tag.isMutating = false
            setTags([...tags])
        })
    }

    const renderChip = ({ value, text, chip, isDisabled, isReadOnly, handleDelete, className }, key) => (
        <Chip
            key={key}
            disabled={chip.isMutating}
            className={className}
            style={{
                pointerEvents: isDisabled || isReadOnly ? 'none' : undefined,
                backgroundColor: chip.public ? blue[300] : undefined
            }}
            onClick={handleClick(chip)}
            onDelete={handleDelete}
            label={chip.tag}
        />
    )

    return (
        <Section title="Tags">
            {loading ? <Loading /> :
                <ChipInput
                    value={tags}
                    onAdd={handleTagAdd}
                    onDelete={handleTagDelete}
                    disabled={mutating}
                    chipRenderer={renderChip}
                    placeholder="no tags, start typing to add"
                    fullWidth
                />
            }
        </Section>
    )
}

export default memo(TagsSection)
