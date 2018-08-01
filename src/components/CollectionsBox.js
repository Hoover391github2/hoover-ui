import { Component } from 'react';
import PropTypes from 'prop-types';
import Loading from './Loading';

import { connect } from 'react-redux';
import { setCollectionsSelection, fetchCollections } from '../actions';

import { withStyles } from '@material-ui/core/styles';
import FormControl from '@material-ui/core/FormControl';
import FormControlLabel from '@material-ui/core/FormControlLabel';
import FormLabel from '@material-ui/core/FormLabel';
import FormGroup from '@material-ui/core/FormGroup';
import Checkbox from '@material-ui/core/Checkbox';
import Typography from '@material-ui/core/Typography';

const styles = theme => ({
    root: {
        display: 'flex',
        direction: 'column',
    },
    formControl: {
        margin: theme.spacing.unit * 3,
    },
});

export class CollectionsBox extends Component {
    static propTypes = {
        classes: PropTypes.object.isRequired,
        collections: PropTypes.arrayOf(
            PropTypes.shape({
                name: PropTypes.string.isRequired,
                title: PropTypes.string.isRequired,
            })
        ),
        selected: PropTypes.arrayOf(PropTypes.string).isRequired,
        counts: PropTypes.object,
    };

    componentDidMount() {
        this.props.dispatch(fetchCollections());
    }

    changeSelection(selected) {
        this.props.dispatch(setCollectionsSelection(selected));
    }

    handleChange = event => {
        const name = event.target.name;
        const checked = event.target.checked;

        var all = this.props.collections.map(c => c.name);
        var selected = this.props.selected.splice(0);

        if (checked) {
            selected = [].concat(selected, [name]);
        } else {
            selected = selected.filter(c => c != name);
        }

        this.changeSelection(selected);
    };

    renderCheckboxes() {
        const { collections, selected, counts } = this.props;

        let allCheckbox = null;

        if (collections.length > 1) {
            const allSelected = collections.every(c => selected.includes(c.name));

            allCheckbox = (
                <FormControlLabel
                    control={
                        <Checkbox
                            key={'_all_'}
                            checked={allSelected}
                            onChange={() =>
                                allSelected
                                    ? this.changeSelection([])
                                    : this.changeSelection(
                                          collections.map(c => c.name)
                                      )
                            }
                            value="_all_"
                        />
                    }
                    label="All"
                />
            );
        }

        const collectionCheckboxes = collections.map(col => (
            <FormControlLabel
                key={col.name}
                control={
                    <Checkbox
                        key={col.name}
                        name={col.name}
                        checked={selected.includes(col.name)}
                        onChange={this.handleChange}
                        value="_all_"
                    />
                }
                label={col.title + (counts ? ` (${counts[col.name] || 0})` : '')}
            />
        ));

        return (
            <div>
                {allCheckbox}
                {collectionCheckboxes}
            </div>
        );
    }

    render() {
        var result = null;
        let { selected, collections, classes } = this.props;

        if (collections) {
            if (collections.length) {
                result = this.renderCheckboxes();
            } else {
                result = <Typography>no collections available</Typography>;
            }
        } else {
            result = <Loading />;
        }

        return (
            <div className={classes.root}>
                <FormControl component="fieldset" className={classes.formControl}>
                    <FormLabel component="legend">Collections</FormLabel>
                    <FormGroup>{result}</FormGroup>
                </FormControl>
            </div>
        );
    }
}

const mapStateToProps = ({ collections: { items, selected } }) => ({
    collections: items,
    selected,
});

export default connect(mapStateToProps)(withStyles(styles)(CollectionsBox));
