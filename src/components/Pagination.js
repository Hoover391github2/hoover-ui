import { Component } from 'react';
import PropTypes from 'prop-types';
import Grid from '@material-ui/core/Grid';
import Typography from '@material-ui/core/Typography';
import IconButton from '@material-ui/core/IconButton';
import IconPrevious from '@material-ui/icons/NavigateBefore';
import IconNext from '@material-ui/icons/NavigateNext';

import { connect } from 'react-redux';
import { loadNextSearchPage, loadPreviousSearchPage } from '../actions';

import { formatThousands } from '../utils';

export class Pagination extends Component {
    static propTypes = {
        results: PropTypes.object.isRequired,
        query: PropTypes.object.isRequired,
        searchAfterByPage: PropTypes.object.isRequired,
    };

    handleNext = e => {
        e.preventDefault();

        const { dispatch } = this.props;
        dispatch(loadNextSearchPage());
    };

    handlePrev = e => {
        e.preventDefault();

        const { dispatch } = this.props;
        dispatch(loadPreviousSearchPage());
    };

    render() {
        const {
            results,
            query: { page, size },
        } = this.props;

        const total = results.hits.total;
        const pageCount = Math.ceil(total / size);

        const from = total === 0 ? 0 : page * size - (size - 1);
        const to = Math.min(total, page * size);

        const hasNext = page < pageCount;
        const hasPrev = page > 1;

        return (
            <div style={{ marginTop: '1rem' }}>
                <Grid container alignItems="center" justify="space-between">
                    <Grid item>
                        <Typography variant="caption">
                            Showing {from} - {to} of {formatThousands(total)} hits.
                            Page {total === 0 ? 0 : page}
                             of
                            {' '}
                            {formatThousands(pageCount)} pages.
                        </Typography>
                    </Grid>

                    <Grid item>
                        <Grid container justify="flex-end">
                            <IconButton
                                tabIndex="-1"
                                onClick={this.handlePrev}
                                disabled={!hasPrev}>
                                <IconPrevious />
                            </IconButton>

                            <IconButton
                                onClick={this.handleNext}
                                disabled={!hasNext}>
                                <IconNext />
                            </IconButton>
                        </Grid>
                    </Grid>
                </Grid>
            </div>
        );
    }
}

const mapStateToProps = ({ search: { results, query, searchAfterByPage } }) => ({
    results,
    query,
    searchAfterByPage,
});

export default connect(mapStateToProps)(Pagination);
