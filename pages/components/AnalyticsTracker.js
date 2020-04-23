import React from 'react'
import { initGA, logPageView } from '../../analytics/frontend'

export default class AnalyticsTracker extends React.Component {
    async componentDidMount () {
        if (!window.GA_INITIALIZED) {
            await initGA();
            window.GA_INITIALIZED = true
        }
        logPageView()
    }

    render () {
        return (
            <div>
                {this.props.children}
            </div>
        )
    }
}
