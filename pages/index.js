import Head from 'next/head';
import React from 'react';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';

const README_PATH = '../README.md';

export default class Home extends React.Component {

    static async getInitialProps(ctx) {
        let response;

        // try https first
        try {
            response = await axios.get(`https://${ctx.req.headers.host}/README.md`);
        } catch (err){
            console.error(err);
        }

        // then try http
        try {
            response = await axios.get(`http://${ctx.req.headers.host}/README.md`);
        } catch (err){
            console.error(err);
        }

        return {readme: response ? response.data : ''};
    }

    render() {

        return (
            <div className="markdown-body">
                <Head>
                    <title>COVID-19 Hospital PPE API</title>
                    <link rel="icon" href="/favicon.ico" />
                </Head>
                <main>
                    <h1 id="title">
                        COVID-19 Hospital PPE API
                    </h1>

                    <p className="description">
                        {/*<span>Find hospitals near you that are seeking PPE donations | </span>*/}
                        <span>Location-based API to query for hospitals in need of PPE</span>
                        <br/>
                        {/*<img src="/Octicons-mark-github.svg" alt="github logo"/>*/}
                        <a target="_blank" rel="noopener noreferrer" href="https://github.com/amadrzyk/COVID19-Hospital-PPE-API">
                            Github Repository
                        </a>
                    </p>

                    {/*<div className="alertBubble">*/}
                    {/*    <span>⚠</span>*/}
                    {/*    <div>*/}
                    {/*        There have been numerous recent improvements to this API which may have affected its functionality,*/}
                    {/*        but from now on it will remain the same. Henceforth, API changes will remain behind a version tag,*/}
                    {/*        which will look like <code>/api/v2/function_name</code> rather than <code>/api/function_name</code>.*/}
                    {/*    </div>*/}
                    {/*</div>*/}

                    <div className="readmeBody">
                        <ReactMarkdown source={this.props.readme} />
                    </div>
                </main>
                <footer>
                    Made with 💙 by the COVID-19 Response Team and the&nbsp;<a target="_blank" rel="noopener noreferrer" href="https://www.facebook.com/InventionCorps/">Invention Corps</a>&nbsp;Community
                </footer>
            </div>
        )
    }
}
