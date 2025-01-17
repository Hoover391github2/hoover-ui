import React, { memo, useEffect, useState } from 'react'
import { List, ListItem, ListItemIcon, ListItemText } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import { useDocument } from './DocumentProvider'
import { reactIcons } from '../../../constants/icons'
import { downloadFile } from '../../../utils'

const useStyles = makeStyles(theme => ({
    container: {
        backgroundColor: theme.palette.grey[100],
    }
}))

function AttachmentsView() {
    const classes = useStyles()
    const { doc } = useDocument()
    const [attachments, setAttachments] = useState([])

    useEffect(async () => {
        const files = await new Promise(resolve => {
            doc.getAttachments().then(response => {
                resolve(!response ? [] :
                    Object.keys(response).map(file => ({
                        data: response[file].content,
                        fileName: response[file].filename,
                    }))
                )
            })
        })
        setAttachments(files)
    }, [doc])

    const handleFileDownload = (fileName, data) => () => downloadFile(fileName, data)

    return (
        <div className={classes.container}>
            <List dense>
                {attachments.length ? attachments.map(({ fileName, data })  => (
                    <ListItem button onClick={handleFileDownload(fileName, data)}>
                        <ListItemText primary={fileName} />
                        <ListItemIcon>{reactIcons.download}</ListItemIcon>
                    </ListItem>
                )) : (
                    <ListItem>
                        <ListItemText primary="No attachments" />
                    </ListItem>
                )}
            </List>
        </div>
    )
}

export default memo(AttachmentsView)
