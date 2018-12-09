import { Component } from 'react';
import { connect } from 'react-redux';
import { withStyles } from '@material-ui/core/styles';

import { fetchDoc, fetchServerDoc } from '../src/actions';

import Document, { Meta } from '../src/components/Document';
import Locations from '../src/components/Locations';
import Finder from '../src/components/Finder';
import SplitPaneLayout from '../src/components/SplitPaneLayout';
import { parseLocation } from '../src/utils';

const styles = theme => ({
    container: theme.mixins.toolbar,
});

class Doc extends Component {
    state = { finder: false };

    componentDidMount() {
        const { query } = parseLocation();

        if (query.path) {
            this.props.dispatch(fetchDoc(query.path));
        } else {
            this.props.dispatch(fetchServerDoc());
        }

        if (query.finder) {
            this.setState({ finder: true });
        }
    }

    render() {
        const { data, url, collection, classes } = this.props;
        const { finder } = this.state;

        if (!url) {
            return null;
        }

        let left,
            right,
            center,
            size = {};

        const doc = <Document fullPage />;
        const meta = data && <Meta doc={data} collection={collection} />;

        if (finder) {
            size = { left: '50%', middle: '50%' };

            left = (
                <div>
                    {data && <Finder data={data} url={url} />}
                    {meta}
                </div>
            );

            center = doc;
            right = null;
        } else {
            size = { left: '25%', middle: '70%' };
            left = data && <Locations data={data} url={url} />;
            center = meta;
            right = doc;
        }

        return (
            <div>
                <SplitPaneLayout
                    left={left}
                    right={right}
                    defaultSizeLeft={size.left}
                    defaultSizeMiddle={size.middle}>
                    {center}
                </SplitPaneLayout>
            </div>
        );
    }
}

export default connect(({ doc: { data, url, collection } }) => ({
    data,
    url,
    collection,
}))(withStyles(styles)(Doc));
