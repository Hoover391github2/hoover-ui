import React, { cloneElement, useEffect, useMemo, useState } from 'react'
import cn from 'classnames'
import { Transition } from 'react-transition-group'
import { makeStyles, duration } from '@material-ui/core/styles'
import {
    ClickAwayListener,
    Grid,
    LinearProgress,
    ListItem,
    Portal,
    Slide,
    Typography
} from '@material-ui/core'
import { reactIcons } from '../../../constants/icons'

const useStyles = makeStyles(theme => ({
    root: {
        width: '100%',
        overflow: 'hidden',
        position: 'absolute',
        height: 'calc(100vh - 56px)',

        '@media (min-width: 0px) and (orientation: landscape)': {
            height: 'calc(100vh - 48px)',
        },

        '@media (min-width: 600px)': {
            height: 'calc(100vh - 64px)',
        }
    },
    inner: {
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.palette.background.paper,
    },
    unpinned: {
        borderRight: '1px solid rgba(0, 0, 0, 0.2)',
    },
    title: {
        minHeight: 32,
        textTransform: 'uppercase',
        paddingTop: 6,
        paddingBottom: 6,
    },
    bold: {
        fontWeight: 'bold',
    },
    icon: {
        display: 'flex',
        alignSelf: 'center',
        marginRight: theme.spacing(2),
    },
    label: {
        marginRight: 'auto',
    },
    open: {
        display: 'flex',
        alignSelf: 'center',
        marginLeft: theme.spacing(1),
        [theme.breakpoints.up('sm')]: {
            marginRight: -8,
        },
    },
    openCollapsed: {
        borderRight: `3px solid ${theme.palette.grey[700]}`,
    },
    progress: {
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
    },
    progressRoot: {
        backgroundImage: `linear-gradient(
            -45deg,
            rgba(255, 255, 255, .5) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, .5) 50%,
            rgba(255, 255, 255, .5) 75%,
            transparent 75%,
            transparent
        )`,
        backgroundSize: '10px 10px',
        animation: '$move 1s linear infinite',
    },
    '@keyframes move': {
        '0%': {
            backgroundPosition: '0 0',
        },
        '100%': {
            backgroundPosition: '10px 10px',
        }
    }
}))

const hasDisabledClickAway = element => {
    if (element.dataset?.disableClickAway) {
        return true
    }
    return element.parentNode && hasDisabledClickAway(element.parentNode)
}

export default function CategoryDrawer({ category, title, icon, children, wideFilters, portalRef, width, pinned, toolbar,
                                           loading, loadingProgress, open, onOpen, greyed = false, highlight = true }) {
    const classes = useStyles()
    const [position, setPosition] = useState({ top: 0, left: 0, width: 0 })

    const updatePosition = () => {
        const position = portalRef.current.getBoundingClientRect()

        setPosition({
            top: position.top + portalRef.current.parentElement.scrollTop + 'px',
            left: position.left + 'px',
            width,
        })
    }

    useEffect(() => {
        if (portalRef.current) {
            updatePosition()
        }
    }, [portalRef.current, width, wideFilters, pinned])

    const titleBar = useMemo(() => (
        <ListItem
            dense
            button
            data-disable-click-away
            onClick={() => onOpen(category)}
            className={cn({ [classes.openCollapsed]: !wideFilters && open })}
        >
            {loading && (
                <LinearProgress
                    className={classes.progress}
                    variant={loadingProgress ? 'determinate' : 'indeterminate'}
                    value={loadingProgress}
                    classes={{ root: classes.progressRoot }}
                />
            )}

            <Grid
                container
                alignItems="baseline"
                justify="space-between"
                wrap="nowrap"
            >
                <Grid item className={classes.icon}>
                    {cloneElement(reactIcons[icon], { color: highlight ? 'secondary' : 'inherit'})}
                </Grid>

                <Grid item className={classes.label}>
                    <Typography
                        noWrap
                        variant="body2"
                        component="div"
                        className={cn(classes.title, { [classes.bold]: open })}
                        color={greyed ? 'textSecondary' : highlight ? 'secondary' : 'initial'}
                    >
                        {title}
                    </Typography>
                </Grid>

                {open && (
                    <Grid item className={classes.open} >
                        {cloneElement(reactIcons.chevronRight, { color: highlight ? 'secondary' : 'action'})}
                    </Grid>
                )}
            </Grid>
        </ListItem>
    ), [category, title, greyed, highlight, wideFilters, open, onOpen, loading, loadingProgress])

    return (
        <>
            {titleBar}

            {(!pinned || (pinned && portalRef.current)) && (
                <Portal container={typeof document !== 'undefined' && pinned ? portalRef.current : undefined}>
                    <Transition
                        in={open}
                        timeout={{
                            enter: duration.enteringScreen,
                            exit: duration.leavingScreen,
                        }}
                        mountOnEnter
                        unmountOnExit
                        onEntering={updatePosition}
                        onExiting={updatePosition}
                    >
                        <ClickAwayListener onClickAway={event => {
                            !pinned && !hasDisabledClickAway(event.target) && onOpen(null)
                        }} disableReactTree>
                            <div style={!pinned ? position : undefined} className={classes.root}>
                                <Slide direction="right" in={open}>
                                    <div className={cn(classes.inner, { [classes.unpinned]: !pinned })} data-test="filters">
                                        {toolbar}
                                        {children}
                                    </div>
                                </Slide>
                            </div>
                        </ClickAwayListener>
                    </Transition>
                </Portal>
            )}
        </>
    )
}
