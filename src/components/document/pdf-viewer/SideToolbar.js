import React from 'react'
import { Grid, IconButton, Toolbar as MuiToolbar, Tooltip } from '@material-ui/core'
import { reactIcons } from '../../../constants/icons'
import { makeStyles } from '@material-ui/core/styles'

const useStyles = makeStyles(theme => ({
    toolbar: {
        borderColor: theme.palette.grey[400],
        borderBottomStyle: 'solid',
        borderWidth: 1,
    },
    toolbarIcon: {
        marginRight: theme.spacing(2.3),
    },
}))

export default function SideToolbar({ viewerRef, currentTab, onTabSwitch }) {
    const classes = useStyles()

    const openTab = tab => () => {
        onTabSwitch(tab)
    }

    const popperProps = {
        container: viewerRef.current
    }

    return (
        <MuiToolbar variant="dense" className={classes.toolbar}>
            <Grid container justify="flex-start">
                <Grid item>
                    <Tooltip title="Thumbnails" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    className={classes.toolbarIcon}
                                    onClick={openTab('thumbnails')}
                                >
                                    {reactIcons.thumbnails}
                                </IconButton>
                            </span>
                    </Tooltip>
                </Grid>
                <Grid item>
                    <Tooltip title="Bookmarks" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    className={classes.toolbarIcon}
                                    onClick={openTab('bookmarks')}
                                >
                                    {reactIcons.contentTab}
                                </IconButton>
                            </span>
                    </Tooltip>
                </Grid>
                <Grid item>
                    <Tooltip title="Attachments" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    className={classes.toolbarIcon}
                                    onClick={openTab('attachments')}
                                >
                                    {reactIcons.attachment}
                                </IconButton>
                            </span>
                    </Tooltip>
                </Grid>
            </Grid>
        </MuiToolbar>
    )
}
