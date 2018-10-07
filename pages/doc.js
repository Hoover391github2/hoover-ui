import { Component } from 'react';
import { connect } from 'react-redux';
import { fetchDoc, fetchServerDoc } from '../src/actions';
import Document, { Meta } from '../src/components/Document';
import Locations from '../src/components/Locations';
import Finder from '../src/components/Finder';
import SplitPaneLayout from '../src/components/SplitPaneLayout';
import { parseLocation } from '../src/utils';

class Doc extends Component {
    componentDidMount() {
        const { query } = parseLocation();

        if (query.path) {
            this.props.dispatch(fetchDoc(query.path));
        } else {
            this.props.dispatch(fetchServerDoc());
        }
    }

    render() {
        if (!this.props.url) {
            return null;
        }

        const { data, url, collection } = this.props;

        // const left = data && <Locations data={data} url={url} />;
        const left = data && <Finder data={data} url={url} />;
        const right = data && <Meta doc={data} collection={collection} />;

        return (
            <SplitPaneLayout
                left={left}
                right={right}
                defaultSizeLeft="33%"
                defaultSizeMiddle="66%">
                <Document fullPage />
            </SplitPaneLayout>
        );
    }
}

export default connect(({ doc: { data, url, collection } }) => ({
    data,
    url,
    collection,
}))(Doc);
