import { Component } from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { DateTime } from 'luxon';

import { updateSearchQuery } from '../actions';

import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';

import Filter from './Filter';
import AggregationFilter from './AggregationFilter';
import DateRangeFilter from './DateRangeFilter';

import langs from 'langs';

const formatYear = bucket => DateTime.fromISO(bucket.key_as_string).year.toString();
const formatLang = bucket => langs.where('1', bucket.key).name;
const timeBucketSorter = (a, b) => b.key - a.key;

class Filters extends Component {
    static propTypes = {
        query: PropTypes.object.isRequired,
        aggregations: PropTypes.object,
    };

    filter = key => value =>
        this.props.dispatch(updateSearchQuery({ [key]: value }));

    render() {
        const { query, aggregations } = this.props;

        if (!aggregations) {
            return null;
        }

        return (
            <List>
                <Filter title="File type" defaultOpen={!!query.fileType.length}>
                    <AggregationFilter
                        title=""
                        selected={query.fileType}
                        aggregation={aggregations.count_by_filetype.filetype}
                        onChange={this.filter('fileType')}
                    />
                </Filter>

                <Filter
                    title="Date range"
                    defaultOpen={!!(query.dateRange.from || query.dateRange.to)}>
                    <DateRangeFilter
                        onChange={this.filter('dateRange')}
                        defaultFrom={query.dateRange.from}
                        defaultTo={query.dateRange.to}
                    />
                </Filter>

                <Filter
                    title="Years"
                    defaultOpen={
                        !!(query.dateYears.length || query.dateCreatedYears.length)
                    }>
                    <AggregationFilter
                        aggregation={aggregations.count_by_date_years.date_years}
                        selected={query.dateYears}
                        title="Year"
                        onChange={this.filter('dateYears')}
                        sortBuckets={timeBucketSorter}
                        bucketLabel={formatYear}
                        bucketValue={formatYear}
                    />

                    <AggregationFilter
                        aggregation={
                            aggregations.count_by_date_created_years
                                .date_created_years
                        }
                        selected={query.dateCreatedYears}
                        title="Year created"
                        onChange={this.filter('dateCreatedYears')}
                        sortBuckets={timeBucketSorter}
                        bucketLabel={formatYear}
                        bucketValue={formatYear}
                    />
                </Filter>

                <Filter title="Language" defaultOpen={!!query.language.length}>
                    <AggregationFilter
                        aggregation={aggregations.count_by_lang.lang}
                        selected={query.language}
                        onChange={this.filter('language')}
                        bucketLabel={formatLang}
                    />
                </Filter>

                <Filter
                    title="Email domain"
                    defaultOpen={!!query.emailDomains.length}>
                    <AggregationFilter
                        aggregation={
                            aggregations.count_by_email_domains.email_domains
                        }
                        selected={query.emailDomains}
                        onChange={this.filter('emailDomains')}
                    />
                </Filter>
            </List>
        );
    }
}

const mapStateToProps = ({
    search: {
        query,
        results: { aggregations },
    },
}) => ({ query, aggregations });

export default connect(mapStateToProps)(Filters);
