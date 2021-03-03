import React, { memo, useRef, useState } from 'react'
import cn from 'classnames'
import { Grid, IconButton, Menu, MenuItem, TextField, Toolbar as MuiToolbar, Tooltip } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import {
    ArrowDownward,
    ArrowDropDown,
    ArrowUpward,
    Fullscreen,
    FullscreenExit,
    ZoomIn,
    ZoomOut
} from '@material-ui/icons'
import { zoomIn, zoomOut } from './zooming'

const useStyles = makeStyles(theme => ({
    toolbar: {
        backgroundColor: theme.palette.grey[100],
        borderColor: theme.palette.grey[400],
        borderWidth: 1,
        borderTopStyle: 'solid',
        borderBottomStyle: 'solid',
        justifyContent: 'space-between',
    },
    toolbarIcon: {
        marginRight: theme.spacing(1),
    },
    pageInfo: {
        display: 'inline-flex',
        alignItems: 'center',
        '& span': {
            marginLeft: theme.spacing(0.5)
        }
    },
    pageNumber: {
        width: 60,
        backgroundColor: theme.palette.background.default,
        '& .MuiOutlinedInput-inputMarginDense': {
            textAlign: 'right',
            padding: '5px 8px',
        }
    },
    scaleSelect: {
        width: 120,
        paddingRight: 4,
        cursor: 'pointer',
        border: '1px solid rgba(0, 0, 0, 0.23)',
        backgroundColor: theme.palette.background.default,
        '&:hover': {
            border: '1px solid rgba(0, 0, 0, 0.87)',
        },
        '& .MuiOutlinedInput-input': {
            width: 80,
            textAlign: 'right',
            display: 'inline-block',
            padding: '5px 0 5px 8px',
        },
    },
}))

function Toolbar({ viewerRef, containerRef, pagesRefs, initialPageIndex, numPages,
                    firstPageData, pageMargin, scale, setScale, fullscreenClass, fullscreenExitClass}) {
    const classes = useStyles()
    const pageInputRef = useRef()

    const [anchorEl, setAnchorEl] = useState(null)
    const handleScaleMenuClick = event => setAnchorEl(event.currentTarget)
    const handleScaleMenuClose = () => setAnchorEl(null)
    const handleScaleSet = scale => () => {
        handleScaleMenuClose()
        const containerWidth = containerRef.current.clientWidth - pageMargin
        const containerHeight = containerRef.current.clientHeight - pageMargin
        if (scale === 'page') {
            setScale(Math.min(containerWidth / firstPageData.width, containerHeight / firstPageData.height))
        } else if (scale === 'width') {
            setScale(containerWidth / firstPageData.width)
        } else {
            setScale(scale)
        }
    }

    const scrollToPage = index => containerRef.current.scrollTop = pagesRefs[index].current.offsetTop

    const onPrevPage = () => scrollToPage(initialPageIndex - 1)
    const onNextPage = () => scrollToPage(initialPageIndex + 1)
    const onPageFocus = () => pageInputRef.current.select()
    const onPageChange = event => {
        const page = parseInt(event.target.value)
        if (!isNaN(page) && page > 0 && page <= numPages) {
            scrollToPage(page - 1)
        }
    }

    const onZoomOut = () => setScale(zoomOut(scale))
    const onZoomIn = () => setScale(zoomIn(scale))

    const onFullScreen = () => viewerRef.current.requestFullscreen()
    const onFullScreenExit = () => document.exitFullscreen()

    const popperProps = {
        container: viewerRef.current
    }

    return (
        <>
            <MuiToolbar variant="dense" classes={{root: classes.toolbar}}>
                <Grid container justify="space-between">
                    <Grid item>
                        <Tooltip title="Previous page" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={onPrevPage}
                                    disabled={!firstPageData || initialPageIndex === 0}
                                    className={classes.toolbarIcon}
                                >
                                    <ArrowUpward />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Next page" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={onNextPage}
                                    disabled={!firstPageData || initialPageIndex === numPages - 1}
                                    className={classes.toolbarIcon}
                                >
                                    <ArrowDownward />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <div className={classes.pageInfo}>
                            <Tooltip title="Page" PopperProps={popperProps}>
                                <span>
                                    <TextField
                                        size="small"
                                        variant="outlined"
                                        inputRef={pageInputRef}
                                        value={initialPageIndex + 1}
                                        className={classes.pageNumber}
                                        onFocus={onPageFocus}
                                        onChange={onPageChange}
                                        disabled={!firstPageData}
                                    />
                                </span>
                            </Tooltip>
                            <span>
                                of
                            </span>
                            <span>
                                {numPages}
                            </span>
                        </div>
                    </Grid>
                    <Grid item>
                        <Tooltip title="Zoom out" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={onZoomOut}
                                    className={classes.toolbarIcon}
                                    disabled={!firstPageData}
                                >
                                    <ZoomOut />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Zoom in" PopperProps={popperProps}>
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={onZoomIn}
                                    className={classes.toolbarIcon}
                                    disabled={!firstPageData}
                                >
                                    <ZoomIn />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Tooltip title="Scale" PopperProps={popperProps}>
                            <div className={cn(
                                    'MuiInputBase-root',
                                    'MuiOutlinedInput-root',
                                    'MuiInputBase-formControl',
                                    classes.scaleSelect,
                                    {
                                        'Mui-disabled': !firstPageData
                                    }
                                )}
                                onClick={!!firstPageData ? handleScaleMenuClick : null}
                            >
                                <span className={cn(
                                    'MuiInputBase-input',
                                    'MuiOutlinedInput-input',
                                )}>
                                    {Math.round(scale * 100) + '%'}
                                </span>
                                <ArrowDropDown className={cn(
                                    'MuiSelect-icon',
                                    'MuiSelect-iconOutlined'
                                )}/>
                            </div>
                        </Tooltip>
                    </Grid>
                    <Grid item>
                        <Tooltip title="Full screen" PopperProps={popperProps}>
                            <IconButton
                                size="small"
                                onClick={onFullScreen}
                                className={fullscreenClass}
                            >
                                <Fullscreen />
                            </IconButton>
                        </Tooltip>
                        <Tooltip title="Exit full screen" PopperProps={popperProps}>
                            <IconButton
                                size="small"
                                onClick={onFullScreenExit}
                                className={fullscreenExitClass}
                            >
                                <FullscreenExit />
                            </IconButton>
                        </Tooltip>
                    </Grid>
                </Grid>
            </MuiToolbar>

            <Menu
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleScaleMenuClose}
                disableScrollLock={true}
                {...popperProps}
            >
                <MenuItem onClick={handleScaleSet(1)}>Original</MenuItem>
                <MenuItem onClick={handleScaleSet('page')}>Page fit</MenuItem>
                <MenuItem onClick={handleScaleSet('width')}>Page width</MenuItem>
                <MenuItem onClick={handleScaleSet(0.5)}>50%</MenuItem>
                <MenuItem onClick={handleScaleSet(0.75)}>75%</MenuItem>
                <MenuItem onClick={handleScaleSet(1)}>100%</MenuItem>
                <MenuItem onClick={handleScaleSet(1.25)}>125%</MenuItem>
                <MenuItem onClick={handleScaleSet(1.5)}>150%</MenuItem>
                <MenuItem onClick={handleScaleSet(2)}>200%</MenuItem>
                <MenuItem onClick={handleScaleSet(3)}>300%</MenuItem>
                <MenuItem onClick={handleScaleSet(4)}>400%</MenuItem>
            </Menu>
        </>
    )
}

export default memo(Toolbar)
