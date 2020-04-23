import { NowRequest, NowResponse } from '@now/node';

// import environment variables in dev
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

export default async (req: NowRequest, res: NowResponse) => {
    return res.json({
        id: process.env.GA_TRACKING_ID
    })
}