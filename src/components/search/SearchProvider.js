import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/router'
import qs from 'qs'
import { Button, IconButton, Snackbar } from '@material-ui/core'
import { makeStyles } from '@material-ui/core/styles'
import fixLegacyQuery from '../../fixLegacyQuery'
import { getPreviewParams } from '../../utils'
import { useHashState } from '../HashStateProvider'
import { buildSearchQuerystring, rollupParams, unwindParams } from '../../queryUtils'
import { aggregationFields } from '../../constants/aggregationFields'
import { search as searchAPI } from '../../api'
import { tags as tagsAPI, asyncSearch as asyncSearchAPI } from '../../backend/api'
import { ASYNC_SEARCH_POLL_INTERVAL, TAGS_REFRESH_DELAYS } from '../../constants/general'
import { reactIcons } from '../../constants/icons'
import { availableColumns } from '../../constants/availableColumns'

const useStyles = makeStyles((theme) => ({
    close: {
        padding: theme.spacing(0.5),
    },
}))

const SearchContext = createContext({})

const maxAggregationsBatchSize = Math.ceil(Object.entries(aggregationFields).length / process.env.AGGREGATIONS_SPLIT)

export function SearchProvider({ children, serverQuery }) {
    const classes = useStyles()
    const router = useRouter()
    const { pathname } = router

    const { hashState, setHashState } = useHashState()

    const queryString = typeof window === 'undefined' ? serverQuery : window.location.href.split('?')[1]?.split('#')[0]
    const query = useMemo(() => {
        const memoQuery = unwindParams(qs.parse(queryString, { arrayLimit: 100 }))
        fixLegacyQuery(memoQuery)
        return memoQuery
    }, [queryString])

    const [searchText, setSearchText] = useState(query.q || '')
    useEffect(() => {
        setSearchText(query.q)
    }, [query])

    const search = useCallback(params => {
        const newQuery = buildSearchQuerystring({ ...query, q: searchText, ...params })
        router.push(
            { pathname, search: newQuery, hash: window.location.hash.substring(1) },
            undefined,
            { shallow: true },
        )
    }, [query, hashState, searchText])

    const [previewOnLoad, setPreviewOnLoad] = useState()
    const [selectedDocData, setSelectedDocData] = useState()
    useEffect(() => {
        if (hashState?.preview) {
            setSelectedDocData(hashState.preview)
        }
    }, [JSON.stringify(hashState?.preview)])

    const [collectionsCount, setCollectionsCount] = useState([])

    const [error, setError] = useState()
    const [results, setResults] = useState()
    const [resultsTask, setResultsTask] = useState(null)
    const [resultsLoading, setResultsLoading] = useState(!!query.q)
    const handleResultsAbortError = error => {
        if (error.name !== 'AbortError') {
            setResults(null)
            setError(error.message)
            setResultsLoading(false)
        }
    }

    useEffect(async () => {
        if (query.q) {
            setError(null)
            setResultsTask(null)
            setResultsLoading(true)

            try {
                const taskData = await searchAPI({
                    ...query,
                    type: 'results',
                    fieldList: '*',
                    async: true,
                })

                setResultsTask(taskData)

            } catch(error) {
                handleResultsAbortError(error)
            }

        } else {
            setResults(null)
        }
    }, [JSON.stringify({
        ...query,
        facets: null,
        filters: {
            ...query.filters || {},
            date: {
                from: query.filters?.date?.from,
                to: query.filters?.date?.to,
                intervals: query.filters?.date?.intervals,
            },
            ['date-created']: {
                from: query.filters?.['date-created']?.from,
                to: query.filters?.['date-created']?.to,
                intervals: query.filters?.['date-created']?.intervals,
            },
        }
    })])

    useEffect(async () => {
        if (resultsTask) {
            if (resultsTask.status === 'done') {
                const results = resultsTask.result
                setResults(results)
                setResultsLoading(false)
                setCollectionsCount(results.count_by_index)

                if (previewOnLoad === 'first') {
                    setPreviewOnLoad(null)
                    setHashState({
                        ...getPreviewParams(results.hits.hits[0]),
                        tab: undefined, subTab: undefined, previewPage: undefined
                    })
                } else if (previewOnLoad === 'last') {
                    setPreviewOnLoad(null)
                    setHashState({
                        ...getPreviewParams(results.hits.hits[results.hits.hits.length - 1]),
                        tab: undefined, subTab: undefined, previewPage: undefined
                    })
                }
            } else if (!resultsTask.retrieving) {
                resultsTask.retrieving = true
                try {
                    const resultsTaskData = await asyncSearchAPI(resultsTask.task_id, resultsTask.eta.total_sec < ASYNC_SEARCH_POLL_INTERVAL ? true : '')
                    const update = () => setResultsTask(resultsTaskData)

                    if (resultsTaskData.status === 'done') {
                        update()
                    } else {
                        setTimeout(update, ASYNC_SEARCH_POLL_INTERVAL * 1000)
                    }
                } catch (error) {
                    handleResultsAbortError(error)
                }
            }
        }
    }, [resultsTask])

    const [resultsViewType, setResultsViewType] = useState('list')
    const [resultsColumns, setResultsColumns] = useState(
        Object.entries(availableColumns).filter(([,{ hidden }]) => !hidden)
    )

    const aggregationGroups = Object.entries(aggregationFields)
        .reduce((acc, [key]) => {
            if (acc?.[acc.length - 1]?.fieldList?.length < maxAggregationsBatchSize) {
                acc[acc.length - 1].fieldList.push(key)
            } else {
                acc.push({ fieldList: [key] })
            }
            return acc
        }, [])

    const [forcedRefresh, forceRefresh] = useState({})
    const [prevForcedRefresh, setPrevForcedRefresh] = useState({})
    const [aggregations, setAggregations] = useState()
    const [aggregationsError, setAggregationsError] = useState()
    const [aggregationsTasks, setAggregationsTasks] = useState({})
    const [aggregationsLoading, setAggregationsLoading] = useState(
        Object.entries(aggregationFields).reduce((acc, [field]) => {
            acc[field] = !!query.collections?.length
            return acc
        }, {})
    )
    const handleAggregationsAbortError = error => {
        if (error.name !== 'AbortError') {
            setAggregations(null)
            setAggregationsError(error.message)
            setAggregationsTasks({})
            setAggregationsLoading(
                Object.entries(aggregationFields).reduce((acc, [field]) => {
                    acc[field] = false
                    return acc
                }, {})
            )
        }
    }

    useEffect(() => {
        if (query.collections?.length) {
            setPrevForcedRefresh(forcedRefresh)
            setAggregationsError(null)
            setMissingAggregations(null)
            setAggregationsTasks({})
            setAggregationsLoading(
                Object.entries(aggregationFields).reduce((acc, [field]) => {
                    acc[field] = true
                    return acc
                }, {})
            )

            aggregationGroups.map(async (aggregationGroup, i) => {
                try {
                    const taskData = await searchAPI({
                        ...query,
                        q: query.q || '*',
                        type: 'aggregations',
                        fieldList: aggregationGroup.fieldList,
                        refresh: prevForcedRefresh !== forcedRefresh,
                        async: true,
                    })

                    setAggregationsTasks(tasks => ({
                        ...tasks,
                        [aggregationGroup.fieldList.join()]: taskData,
                    }))

                } catch (error) {
                    handleAggregationsAbortError(error)
                }
            })

        } else {
            setAggregations(null)
            setMissingAggregations(null)
        }
    }, [JSON.stringify({
        ...query,
        facets: null,
        page: null,
        size: null,
        order: null,
    }), forcedRefresh])

    useEffect(() => {
        setAggregationsTasks(prevTasksData => {
            Object.entries(prevTasksData).forEach(([fields, taskData]) => {
                if (taskData.status === 'done') {
                    setAggregations(aggregations => ({ ...(aggregations || {}), ...taskData.result.aggregations }))
                    setCollectionsCount(taskData.result.count_by_index)
                    setAggregationsLoading(loading => ({
                        ...loading,
                        ...fields.split(',').reduce((acc, field) => {
                            acc[field] = false
                            return acc
                        }, {}),
                    }))
                } else if (!taskData.retrieving) {
                    taskData.retrieving = true
                    asyncSearchAPI(taskData.task_id, taskData.eta.total_sec < ASYNC_SEARCH_POLL_INTERVAL ? true : '')
                        .then(taskResultData => {
                            const update = () => setAggregationsTasks({
                                ...prevTasksData,
                                [fields]: { ...taskResultData, retrieving: false }
                            })

                            if (taskResultData.status === 'done') {
                                update()
                            } else {
                                setTimeout(update, ASYNC_SEARCH_POLL_INTERVAL * 1000)
                            }
                        })
                        .catch(error => {
                            handleAggregationsAbortError(error)
                        })
                }
            })
            return prevTasksData
        })
    }, [aggregationsTasks])

    const [missingLoading, setMissingLoading] = useState(!!query.collections?.length)
    const [missingAggregations, setMissingAggregations] = useState()
    const loadMissing = useCallback(field => {
        if (query.collections?.length) {
            setMissingLoading(true)

            searchAPI({
                ...query,
                q: query.q || '*',
                type: 'aggregations',
                fieldList: [field],
                missing: true,
            }).then(results => {
                setMissingLoading(false)
                setMissingAggregations(aggregations => ({...(aggregations || {}), ...results.aggregations}))
            }).catch(() => {
                setMissingLoading(false)
                setMissingAggregations(aggregations => ({...(aggregations || {}), [field]: undefined}))
            })
        } else {
            setMissingAggregations(null)
        }
    }, [query])

    const prevFacetsQueryRef = useRef()
    useEffect(() => {
        const { facets, page, size, order, ...queryRest } = query
        const { facets: prevFacets, page: prevPage, size: prevSize, order: prevOrder, ...prevQueryRest } = prevFacetsQueryRef.current || {}

        if (JSON.stringify(queryRest) === JSON.stringify(prevQueryRest) && JSON.stringify(facets) !== JSON.stringify(prevFacets)) {
            const loading = state => Object.entries({
                ...(facets || {}),
                ...(prevFacets || {}),
            }).reduce((acc, [field]) => {
                if (JSON.stringify(facets?.[field]) !== JSON.stringify(prevFacets?.[field])) {
                    acc[field] = state
                }
                return acc
            }, {})

            setAggregationsError(null)
            setAggregationsLoading(loading(true))

            searchAPI({
                ...query,
                q: query.q || '*',
                type: 'aggregations',
                fieldList: Object.entries(loading(true)).map(([key]) => key),
            }).then(results => {
                setAggregations(aggregations => ({...(aggregations || {}), ...results.aggregations}))
                setAggregationsLoading(loading(false))
            }).catch(error => {
                if (error.name !== 'AbortError') {
                    setAggregations(null)
                    setAggregationsError(error.message)
                    setAggregationsLoading(loading(false))
                }
            })
        }
        prevFacetsQueryRef.current = query
    }, [JSON.stringify({
        ...query,
        page: null,
        size: null,
        order: null,
    })])

    const clearResults = () => {
        setResults(null)
        setAggregations(null)
        setCollectionsCount(null)
        setSelectedDocData(null)
    }

    const currentIndex = results?.hits.hits.findIndex(
        hit => hit._collection === hashState.preview?.c && hit._id === hashState.preview?.i
    )

    const previewNextDoc = useCallback(() => {
        if (!resultsLoading && results?.hits.hits
            && (parseInt(query.page) - 1) * parseInt(query.size) + currentIndex < results.hits.total - 1) {
            if (currentIndex === results.hits.hits.length - 1) {
                setPreviewOnLoad('first')
                search({ page: parseInt(query.page) + 1 })
            } else {
                setHashState({ ...getPreviewParams(results.hits.hits[currentIndex + 1]),
                    tab: undefined, subTab: undefined, previewPage: undefined })
            }
        }
    }, [query, hashState, results, resultsLoading])

    const previewPreviousDoc = useCallback(() => {
        if (!resultsLoading && results?.hits.hits && parseInt(query.page) > 1 || currentIndex >= 1) {
            if (currentIndex === 0 && parseInt(query.page) > 1) {
                setPreviewOnLoad('last')
                search({ page: parseInt(query.page) - 1 })
            } else {
                setHashState({ ...getPreviewParams(results.hits.hits[currentIndex - 1]),
                    tab: undefined, subTab: undefined, previewPage: undefined })
            }
        }
    }, [query, hashState, results, resultsLoading])


    const periodicallyCheckIndexedTime = (digestUrl) => {
        let timeout, delayIndex = 0

        const promise = new Promise((resolve, reject) => {
            const runDelayedQuery = delay => {
                timeout = setTimeout(() => {
                    tagsAPI(digestUrl).then(data => {
                        if (data.every(tag => !!tag.date_indexed)) {
                            resolve()
                        } else if (delayIndex < TAGS_REFRESH_DELAYS.length) {
                            runDelayedQuery(TAGS_REFRESH_DELAYS[delayIndex++])
                        } else {
                            reject()
                        }
                    })
                }, delay)
            }
            runDelayedQuery(TAGS_REFRESH_DELAYS[delayIndex++])
        })

        const cancel = () => clearTimeout(timeout)

        return { cancel, promise }
    }

    const [tagsRefreshQueue, setTagsRefreshQueue] = useState(null)
    const addTagToRefreshQueue = digestUrl => {
        if (tagsRefreshQueue) {
            tagsRefreshQueue.cancel()
        }
        setTagsRefreshQueue(periodicallyCheckIndexedTime(digestUrl))
    }

    const [snackbarMessage, setSnackbarMessage] = useState(null)
    const handleSnackbarClose = () => setSnackbarMessage(null)
    useEffect(() => {
        if (tagsRefreshQueue) {
            tagsRefreshQueue.promise.then(() => {
                setTagsRefreshQueue(null)
                setSnackbarMessage(
                    <Button color="inherit" startIcon={reactIcons.refresh} onClick={() => {
                        handleSnackbarClose()
                        forceRefresh({})
                    }}>
                        Refresh for new tags
                    </Button>
                )
            }).catch(() => {
                setTagsRefreshQueue(null)
            })
        }

        return () => {
            if (tagsRefreshQueue) {
                tagsRefreshQueue.cancel()
            }
        }
    }, [tagsRefreshQueue])

    return (
        <SearchContext.Provider value={{
            query, error, search, searchText, setSearchText,
            results, aggregations, aggregationsError,
            collectionsCount, resultsLoading, aggregationsLoading,
            missingAggregations, loadMissing, missingLoading,
            previewNextDoc, previewPreviousDoc, selectedDocData,
            clearResults, addTagToRefreshQueue,
            resultsViewType, setResultsViewType,
            resultsColumns, setResultsColumns
        }}>
            {children}
            <Snackbar
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left',
                }}
                open={Boolean(snackbarMessage)}
                autoHideDuration={30000}
                onClose={handleSnackbarClose}
                message={snackbarMessage}
                ClickAwayListenerProps={{
                    mouseEvent: false,
                    touchEvent: false,
                }}
                action={
                    <IconButton
                        aria-label="close"
                        color="inherit"
                        className={classes.close}
                        onClick={handleSnackbarClose}
                    >
                        {reactIcons.close}
                    </IconButton>
                }
            />
        </SearchContext.Provider>
    )
}

export const useSearch = () => useContext(SearchContext)
