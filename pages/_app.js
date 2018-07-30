import App, { Container } from 'next/app';
import React from 'react';

import { MuiThemeProvider } from '@material-ui/core/styles';
import CssBaseline from '@material-ui/core/CssBaseline';
import JssProvider from 'react-jss/lib/JssProvider';
import getPageContext from '../src/get-page-context';
import withReduxStore from '../src/with-redux-store';
import { Provider } from 'react-redux';

import Layout from '../src/components/Layout';

import '../styles/main.scss';

class HooverApp extends App {
    pageContext = getPageContext();

    componentDidMount() {
        // Remove the server-side injected CSS.
        const jssStyles = document.querySelector('#jss-server-side');
        if (jssStyles && jssStyles.parentNode) {
            jssStyles.parentNode.removeChild(jssStyles);
        }
    }

    render() {
        const { Component, pageProps, reduxStore } = this.props;

        return (
            <Container>
                <JssProvider
                    registry={this.pageContext.sheetsRegistry}
                    generateClassName={this.pageContext.generateClassName}>
                    <MuiThemeProvider
                        theme={this.pageContext.theme}
                        sheetsManager={this.pageContext.sheetsManager}>
                        <CssBaseline />
                        <Provider store={reduxStore}>
                            <Layout>
                                <Component
                                    pageContext={this.pageContext}
                                    {...pageProps}
                                />
                            </Layout>
                        </Provider>
                    </MuiThemeProvider>
                </JssProvider>
            </Container>
        );
    }
}

export default withReduxStore(HooverApp);
