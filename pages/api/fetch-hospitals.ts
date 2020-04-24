import {NowRequest, NowResponse} from '@now/node';
import axios from 'axios';
import * as turf from '@turf/turf';
import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

// import environment variables in dev
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// constants
const API_ENDPOINT = 'https://findthemasks.com/data.json',
      GOOGLE_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json',
      DEFAULT_RADIUS = '15',
      RESOURCE_ALL = 'all',
      RESOURCE_TYPES = {
          MASK: 'mask',
          RESPIRATOR: 'respirator',
          SHIELD: 'shield',
          GOWN: 'gown',
          DISINFECTANT: 'disinfectant',
          GLOVES: 'gloves',
          FOOTWEAR: 'footwear',
          EYEWEAR: 'eyewear',
          ACCESSORIES: 'accessories'
      },
      // keywords to search for
      KEYWORDS = {
          [RESOURCE_TYPES.MASK]: ['n95', 'p95', 'r95', 'n99', 'r99', 'p100', 'r100', 'face', 'mask', 'surgical', 'level', 'cotton'],
          [RESOURCE_TYPES.RESPIRATOR]: ['respirator', 'BIPAP', 'CPAP', 'PAPR'],
          [RESOURCE_TYPES.SHIELD]: ['shield', 'maxair', 'CAPR', 'halyard'],
          [RESOURCE_TYPES.GOWN]: ['gown', 'lab coat', 'scrub', 'poncho', 'coverall', 'overall'],
          [RESOURCE_TYPES.DISINFECTANT]: ['disinfectant', 'spray', 'lysol', 'bleach', 'clorox', 'wipe', 'sanitiz', 'cleaning', 'alcohol', 'antibacterial'],
          [RESOURCE_TYPES.GLOVES]: ['glove', 'nitrile'],
          [RESOURCE_TYPES.FOOTWEAR]: ['booties', 'shoe', 'shoe cover'],
          [RESOURCE_TYPES.EYEWEAR]: ['eye', 'goggle'],
          [RESOURCE_TYPES.ACCESSORIES]: ['thermometer']
      },
      ANALYTICS = Analytics({
          app: 'covid19-hospital-ppe-api',
          plugins: [
              googleAnalytics({
                  trackingId: process.env.GA_TRACKING_ID
              })
          ]
      });

// api handler
export default async (req: NowRequest, res: NowResponse) => {
    try {
        // fetch query args
        let app_name = req.query.app_name as string,
            zip_code = req.query.zip_code as string,
            radius_mi = (req.query.radius_mi || DEFAULT_RADIUS) as string,
            resource_types = JSON.parse((req.query.resource_types || "[]") as string);

        // validate input
        if (!app_name)
            throw 'app_name is undefined';
        if (app_name.length < 5)
            throw `app_name ${app_name} is shorter than 5 characters`;
        if (!zip_code)
            throw 'zip_code is undefined';
        if (zip_code.length !== 5)
            throw 'zip_code is either missing or has incorrect formatting';
        if (!/^\d+$/.test(radius_mi))
            throw 'radius_mi does not contain a valid value';
        if (!resource_types)
            throw 'resource_types is undefined';
        if (!Array.isArray(resource_types))
            throw 'resource_types either doesnt exist or is not an array';
        if (!process.env.GCP_KEY)
            throw 'GCP_KEY (api key) not found';
        if (resource_types.every(type => Object.values(RESOURCE_TYPES).indexOf(type) == -1 && type !== RESOURCE_ALL))
            throw `resource_types contains invalid types. please select only from the following: ${Object.values(RESOURCE_TYPES).concat(RESOURCE_ALL)}`;

        // fetch data
        const response_hospitals = await axios.get(API_ENDPOINT);
        const headers = response_hospitals.data.values[1];
        const locations_csv = response_hospitals.data.values.splice(2);

        // convert csv data array (with separate headers array) to simple object array with inline properties
        let locations = [];
        locations_csv.forEach(location => {
            let newObj = {};
            headers.forEach((header, index) => {
                newObj[header] = location[index];
            });
            locations.push(newObj);
        });

        // filter for approved locations
        locations = locations.filter(location => {
            return location.approved == 'x'
        });

        // filter for locations that contain keywords
        locations = locations.filter(location => {
            let acceptedResourcesText = location.accepting;

            // ensure acceptedResourcesText is filtered according to each resource type
            return resource_types.every(type => {
                if (type === RESOURCE_ALL)
                    return true;

                // must contain at least one of the keywords
                return KEYWORDS[type].some(
                    keyword => acceptedResourcesText.toLowerCase().includes(keyword.toLowerCase())
                );
            });
        });

        // convert zip code to lat + lng
        const response_geocode = await axios.get(`${GOOGLE_GEOCODING_ENDPOINT}?address=${zip_code}&key=${process.env.GCP_KEY}`);
        if (response_geocode.data.status !== "OK")
            throw 'Unable to convert zip_code to latitude/longitude';
        let zipCodeCoords = response_geocode.data.results[0].geometry.location;
        zipCodeCoords = {
            lat: parseFloat(zipCodeCoords.lat),
            lng: parseFloat(zipCodeCoords.lng)
        };

        // add distance from zip code to each location
        locations = locations.map(location => {
            location.distance_from_zipcode = -1;

            if (location.lat && location.lng && location.lat != 'N/A' && location.lng != 'N/A'){
                // convert to float
                const locationCoords = {
                    lat: parseFloat(location.lat),
                    lng: parseFloat(location.lng)
                };

                location.distance_from_zipcode = turf.distance(
                    turf.point([locationCoords.lng, locationCoords.lat]),
                    turf.point([zipCodeCoords.lng, zipCodeCoords.lat]),
                    {units: 'miles'}
                );
            }

            return location;
        });

        // filter for locations that are within the lat lng radius
        locations = locations.filter(location => {
            return 0 <= location.distance_from_zipcode && location.distance_from_zipcode <= parseFloat(radius_mi);
        });

        // order locations by distance from zip
        locations = locations.sort((a, b) => a.distance_from_zipcode > b.distance_from_zipcode ? 1 : -1);

        // clean up location objects
        locations = locations.map(location => {

            // convert distance from float to string
            location.distance_from_zipcode = location.distance_from_zipcode.toString();

            // delete irrelevant keys
            delete location.approved;
            delete location.reason;
            delete location.mod_status;
            delete location.source;
            delete location['source-row'];
            delete location.row;

            return location;
        });

        // track information for analytics
        await ANALYTICS.track('searched_hospitals', {
            category: 'app_name',
            label: app_name,
            value: 1
        });
        await ANALYTICS.track('searched_hospitals', {
            category: 'zip_code',
            label: parseInt(zip_code),
            value: 1
        });

        // return filtered locations
        res.json({
            num_locations: locations.length,
            radius_mi,
            locations: locations
        })
    } catch (err) {
        console.log(err);
        res.json({
            err
        })
    }
}
