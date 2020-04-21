import React from 'react';
import AnalyticsTracker from "./components/AnalyticsTracker";
import './css/github-markdown.css'
import './css/index.css';

function MyApp({ Component, pageProps }) {
    return <AnalyticsTracker>
        <Component {...pageProps} />
    </AnalyticsTracker>
}

export default MyApp;