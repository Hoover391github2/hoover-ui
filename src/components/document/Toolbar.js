import React, { useEffect, useRef } from 'react'
import {
    Badge,
    Box,
    Divider,
    Grow,
    IconButton,
    Paper,
    Popper,
    TextField,
    Toolbar as MuiToolbar,
    Tooltip
} from '@material-ui/core'
import {
    CloudDownload,
    Close,
    ExpandLess,
    ExpandMore,
    Launch,
    NavigateBefore,
    NavigateNext,
    Print,
    Search,
    TextFields,
    Translate
} from '@material-ui/icons'
import { makeStyles } from '@material-ui/core/styles'
import { useUser } from '../UserProvider'
import { useDocument } from './DocumentProvider'
import { useTags } from './TagsProvider'
import { useTextSearch } from './TextSearchProvider'
import { specialTags } from '../../constants/specialTags'
import { createOcrUrl } from '../../backend/api'

const useStyles = makeStyles(theme => ({
    toolbar: {
        backgroundColor: theme.palette.grey[100],
        borderBottomColor: theme.palette.grey[400],
        borderBottomWidth: 1,
        borderBottomStyle: 'solid',
        justifyContent: 'space-between',
    },
    toolbarIcon: {
        marginRight: theme.spacing(1),

        '&:last-child': {
            marginRight: 0,
        }
    },
    searchPopper: {
        '&:after': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 25,
            width: 0,
            height: 0,
            border: '10px solid transparent',
            borderBottomColor: theme.palette.background.paper,
            borderTop: 0,
            marginLeft: -10,
            marginTop: -10,
        }
    },
    searchToolbar: {
        paddingTop: theme.spacing(1),
        paddingBottom: theme.spacing(1),
        paddingLeft: theme.spacing(2),
        paddingRight: theme.spacing(2),
    },
    searchToolbarIcon: {
        marginLeft: theme.spacing(1),
    },
    matchCase: {
        color: theme.palette.grey.A400,
    },
    ignoreCase: {
        color: theme.palette.grey.A100,
    }
}))

export default function Toolbar({ onPrev, onNext }) {
    const classes = useStyles()
    const whoAmI = useUser()

    const { data, pathname, fullPage, digestUrl, docRawUrl } = useDocument()
    const { tags, tagsLocked, handleSpecialTagClick } = useTags()

    const searchAnchorRef = useRef()
    const searchInputRef = useRef()
    const {
        searchOpen, setSearchOpen,
        searchMatchCase, setSearchMatchCase,
        onKeyDown, onChange
    } = useTextSearch()

    const toggleSearch = () => setSearchOpen(prev => !prev)
    const toggleMatchCase = () => setSearchMatchCase(prev => !prev)

    useEffect(() => {
        if (searchOpen && searchInputRef.current) {
            searchInputRef.current.focus()
            searchInputRef.current.select()
        }
    }, [searchOpen])

    const headerLinks = {
        actions: [],
        navigation: [],
        tags: [],
    }

    if (!fullPage) {
        headerLinks.actions.push({
            href: pathname,
            tooltip: 'Open in new tab',
            icon: <Launch />,
            target: '_blank',
        })
    }

    const ocrData = Object.keys(data.content.ocrtext || {}).map((tag, index) => {
        return {tag: tag, text: data.content.ocrtext[tag]}
    })

    headerLinks.actions.push(
        {
            tooltip: 'Search in document',
            icon: <Search />,
            ref: searchAnchorRef,
            onClick: toggleSearch,
        },
        {
            tooltip: 'Print metadata and content',
            icon: <Print />,
            href: `${pathname}?print=true`,
            target: '_blank',
        },
        {
            tooltip: 'Download original file',
            icon: <CloudDownload />,
            href: docRawUrl,
            target: fullPage ? null : '_blank',
        },
        ...ocrData.map(({tag}) => ({
            tooltip: `OCR ${tag}`,
            icon: <Translate />,
            href: createOcrUrl(digestUrl, tag),
            target: fullPage ? null : '_blank',
        }))
    )

    if (onPrev) {
        headerLinks.navigation.push({
            icon: <NavigateBefore />,
            tooltip: 'Previous result',
            onClick: onPrev,
        })
    }

    if (onNext) {
        headerLinks.navigation.push({
            icon: <NavigateNext />,
            tooltip: 'Next result',
            onClick: onNext,
        })
    }

    specialTags.forEach(s => {
        const present = tags.find(tag => tag.tag === s.tag && tag.user === whoAmI.username)
        const count = tags.filter(tag => tag.tag === s.tag && tag.user !== whoAmI.username)?.length || null
        headerLinks.tags.push({
            icon: present ? s.present.icon : s.absent.icon,
            label: present ? s.present.label : s.absent.label,
            style: { color: present ? s.present.color : s.absent.color },
            tooltip: s.tooltip,
            disabled: tagsLocked,
            onClick: handleSpecialTagClick(present, s.tag),
            count: present && count ? count + 1: count,
        })
    })

    const searchButtons = [
        {
            tooltip: 'Previous',
            icon: <ExpandLess />,
        },
        {
            tooltip: 'Next',
            icon: <ExpandMore />,
        },
        {
            tooltip: 'Match case',
            icon: <TextFields />,
            onClick: toggleMatchCase,
            className: searchMatchCase ? classes.matchCase : classes.ignoreCase,
        },
        {
            tooltip: 'Close',
            icon: <Close />,
            onClick: () => setSearchOpen(false)
        }
    ]

    return (
        <>
            <MuiToolbar variant="dense" classes={{root: classes.toolbar}}>
                {Object.entries(headerLinks).map(([group, links]) => (
                    <Box key={group}>
                        {links.map(({tooltip, icon, count, ...props}, index) => (
                            <Tooltip title={tooltip} key={index}>
                                <IconButton
                                    size="small"
                                    component="a"
                                    className={classes.toolbarIcon}
                                    {...props}>
                                    <Badge badgeContent={count} color="secondary">
                                        {icon}
                                    </Badge>
                                </IconButton>
                            </Tooltip>
                        ))}
                    </Box>
                ))}
            </MuiToolbar>

            <Popper
                transition
                keepMounted
                open={searchOpen}
                anchorEl={searchAnchorRef.current}
                placement="bottom-start"
                modifiers={{
                    offset: {
                        offset: '-10,20',
                    },
                }}
            >
                {({ TransitionProps }) => (
                    <Grow {...TransitionProps} timeout={200} onExited={() => { /* fix for style clear */ }}>
                        <Paper elevation={5} className={classes.searchPopper}>
                            <MuiToolbar
                                disableGutters
                                variant="dense"
                                className={classes.searchToolbar}
                            >
                                <TextField
                                    autoFocus
                                    size="small"
                                    onKeyDown={onKeyDown}
                                    onChange={onChange}
                                    inputRef={searchInputRef}
                                    InputProps={{
                                        disableUnderline: true
                                    }}
                                    inputProps={{
                                        style: {
                                            paddingBottom: 3
                                        },
                                    }}
                                />

                                <Divider flexItem orientation="vertical" />

                                {searchButtons.map(({tooltip, icon, ...props}, index) =>
                                    <Tooltip title={tooltip} key={index}>
                                        <IconButton
                                            size="small"
                                            component="a"
                                            className={classes.searchToolbarIcon}
                                            {...props}
                                        >
                                            {icon}
                                        </IconButton>
                                    </Tooltip>
                                )}
                            </MuiToolbar>
                        </Paper>
                    </Grow>
                )}
            </Popper>
        </>
    )
}
