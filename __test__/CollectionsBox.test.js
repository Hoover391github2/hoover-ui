import React from 'react';
import renderer from 'react-test-renderer';
import { CollectionsBox } from '../src/components/CollectionsBox';

it('renders the collections box with a collection', () => {
    const tree = renderer
        .create(
            <CollectionsBox
                classes={{}}
                selected={['testcollection']}
                collections={[{ name: 'testcollection', title: 'Test Collection' }]}
            />
        )
        .toJSON();

    expect(tree).toMatchSnapshot();
});

it('renders a loading collections box', () => {
    const tree = renderer
        .create(<CollectionsBox classes={{}} selected={[]} />)
        .toJSON();

    expect(tree).toMatchSnapshot();
});
