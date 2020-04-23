import ReactGA from 'react-ga'
import axios from 'axios'

export const initGA = async () => {
    // console.log('GA init');
    let response = await axios.get('/api/fetch-ga-id');
    let { id } = response.data;
    ReactGA.initialize(id);
};

export const logPageView = () => {
    // console.log(`Logging pageview for ${window.location.pathname}`);
    ReactGA.set({ page: window.location.pathname });
    ReactGA.pageview(window.location.pathname);
};

export const logEvent = (category = '', action = '') => {
    if (category && action) {
        ReactGA.event({ category, action })
    }
};

export const logException = (description = '', fatal = false) => {
    if (description) {
        ReactGA.exception({ description, fatal })
    }
};
