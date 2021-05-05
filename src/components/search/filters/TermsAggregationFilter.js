import React, { memo } from 'react'
import isEqual from 'react-fast-compare'
import { Typography } from '@material-ui/core'
import Expandable from '../../Expandable'
import AggregationFilter from './AggregationFilter'
import { formatThousands } from '../../../utils'

function TermsAggregationFilter({ title, field, open, onToggle, queryFilter, queryFacets, aggregations, loading, ...rest }) {

    const highlight = !!(queryFilter?.include?.length || queryFilter?.exclude?.length || queryFilter?.missing)

    return (
        <Expandable
            title={title}
            loading={loading}
            highlight={highlight}
            greyed={!aggregations?.values.buckets.length}
            open={open}
            onToggle={onToggle}
            resizable={false}
            summary={
                !!aggregations?.values.buckets.length && (
                    <Typography variant="caption" display="block">
                        {aggregations?.count.value > aggregations?.values.buckets.length && '> '}
                        {formatThousands(aggregations?.values.buckets.reduce((acc, { doc_count }) => acc + parseInt(doc_count), 0))} hits
                        {', '}
                        {aggregations?.count.value} buckets
                    </Typography>
                )
            }
        >
            <AggregationFilter
                field={field}
                queryFilter={queryFilter}
                queryFacets={queryFacets}
                aggregations={aggregations}
                loading={loading}
                triState
                {...rest}
            />
        </Expandable>
    )
}

export default memo(TermsAggregationFilter, isEqual)
