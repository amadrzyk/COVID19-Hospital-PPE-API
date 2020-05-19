import {NowRequest, NowResponse} from '@now/node';
import axios from 'axios';
import Cors from 'cors';
import * as turf from '@turf/turf';
import Analytics from 'analytics'
import googleAnalytics from '@analytics/google-analytics'

// import environment variables in dev
if (process.env.NODE_ENV !== 'production') {
    require('dotenv').config();
}

// initializing the cors middleware
const cors = Cors({
    methods: ['GET', 'HEAD'],
});

// helper method to wait for a middleware to execute before continuing and to throw an error when an error happens in a middleware
function runMiddleware(req, res, fn) {
    return new Promise((resolve, reject) => {
        fn(req, res, result => {
            if (result instanceof Error) {
                return reject(result)
            }

            return resolve(result)
        })
    })
}

// constants
const API_ENDPOINT = 'https://findthemasks.com/data.json',
      GOOGLE_GEOCODING_ENDPOINT = 'https://maps.googleapis.com/maps/api/geocode/json',
      DEFAULT_RADIUS = '15',
      ORG_ALL = 'all',
      ORG_TYPES = {
          HOSPITAL: 'hospital',
          NURSING_HOME: 'nursing_home',
          CLINIC: 'clinic',
          HOME_CARE: 'home_care',
          HEALTH_CENTER: 'health_center',
          MENTAL_HEALTH: 'mental_health',
          ASSISTED_LIVING: 'assisted_living',
          REHAB: 'rehab',
          HOSPICE: 'hospice',
          DENTIST: 'dentist',
          FIRE_DEPT: 'fire_dept',
          HOMELESS_SHELTER: 'homeless_shelter',
          LAB: 'lab',
          PHARMACY: 'pharmacy',
          FOOD_BANK: 'food_bank',
          LAW_ENFORCEMENT: 'law_enforcement',
          OTHER: 'other'
      },
      ORG_KEYWORDS = {
          [ORG_TYPES.HOSPITAL]: ['hospital', 'emergency medical', 'urgent', 'medical', 'ambulatory', 'travel nurse'],
          [ORG_TYPES.NURSING_HOME]: ['nursing'],
          [ORG_TYPES.CLINIC]: ['clinic', 'doctor', 'office', 'testing location'],
          [ORG_TYPES.HOME_CARE]: ['home care'],
          [ORG_TYPES.HEALTH_CENTER]: ['community health', 'public health', 'dialysis'],
          [ORG_TYPES.MENTAL_HEALTH]: ['mental'],
          [ORG_TYPES.ASSISTED_LIVING]: ['assisted'],
          [ORG_TYPES.REHAB]: ['rehab', 'addiction'],
          [ORG_TYPES.HOSPICE]: ['hospice'],
          [ORG_TYPES.DENTIST]: ['dentist'],
          [ORG_TYPES.FIRE_DEPT]: ['fire'],
          [ORG_TYPES.HOMELESS_SHELTER]: ['homeless'],
          [ORG_TYPES.LAB]: ['lab'],
          [ORG_TYPES.PHARMACY]: ['pharmacy'],
          [ORG_TYPES.FOOD_BANK]: ['food'],
          [ORG_TYPES.LAW_ENFORCEMENT]: ['detention', 'law'],
          [ORG_TYPES.OTHER]: ['', 'other', 'non-medical', 'union'],
      },
      RESOURCE_ALL = 'all',
      RESOURCE_TYPES = {
          MASK: 'mask',
          RESPIRATOR: 'respirator',
          SHIELD: 'shield',
          GOWN: 'gown',
          DISINFECTANT: 'disinfectant',
          SANITIZER: 'sanitizer',
          GLOVES: 'gloves',
          FOOTWEAR: 'footwear',
          EYEWEAR: 'eyewear',
          ACCESSORIES: 'accessories'
      },
      // keywords to search for
      RESOURCE_KEYWORDS = {
          [RESOURCE_TYPES.MASK]: ['n95', 'p95', 'r95', 'n99', 'r99', 'p100', 'r100', 'face', 'mask', 'surgical', 'level', 'cotton'],
          [RESOURCE_TYPES.RESPIRATOR]: ['respirator', 'BIPAP', 'CPAP', 'PAPR'],
          [RESOURCE_TYPES.SHIELD]: ['shield', 'maxair', 'CAPR', 'halyard'],
          [RESOURCE_TYPES.GOWN]: ['gown', 'lab coat', 'scrub', 'poncho', 'coverall', 'overall'],
          [RESOURCE_TYPES.DISINFECTANT]: ['disinfectant', 'spray', 'lysol', 'bleach', 'clorox', 'wipe', 'sanitiz', 'cleaning', 'alcohol', 'antibacterial'],
          [RESOURCE_TYPES.SANITIZER]: ['sanitiz'],
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
    // apply cors to request
    await runMiddleware(req, res, cors);

    try {
        // fetch query args
        let app_name = req.query.app_name as string,
            zip_code = req.query.zip_code as string,
            radius_mi = (req.query.radius_mi || DEFAULT_RADIUS) as string,
            org_types = JSON.parse((req.query.org_types || '[]') as string),
            resource_types = JSON.parse((req.query.resource_types || '[]') as string);

        console.log(org_types);

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
        if (!org_types)
            throw 'org_types is undefined';
        if (!Array.isArray(org_types))
            throw 'org_types was not formatted properly. please use JSON.stringify() on your array for proper formatting';
        if (org_types.every(type => Object.values(ORG_TYPES).indexOf(type) == -1 && type !== ORG_ALL))
            throw `org_types contains invalid types. please select only from the following: [${Object.values(ORG_TYPES).concat(ORG_ALL)}]`;
        if (!resource_types)
            throw 'resource_types is undefined';
        if (!Array.isArray(resource_types))
            throw 'resource_types was not formatted properly. please use JSON.stringify() on your array for proper formatting';
        if (resource_types.every(type => Object.values(RESOURCE_TYPES).indexOf(type) == -1 && type !== RESOURCE_ALL))
            throw `resource_types contains invalid types. please select only from the following: [${Object.values(RESOURCE_TYPES).concat(RESOURCE_ALL)}]`;
        if (!process.env.GCP_KEY)
            throw 'GCP_KEY (api key) not found';

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

        // filter for locations that contain org_type keywords
        locations = locations.filter(location => {
            let orgTypeText = location.org_type;

            // ensure orgTypeText is filtered according to each org type
            return org_types.some(type => {
                if (type === ORG_ALL)
                    return true;

                // must contain at least one of the keywords
                return ORG_KEYWORDS[type].some(
                    keyword =>  orgTypeText.toLowerCase().includes(keyword.toLowerCase())
                );
            })
        });

        // filter for locations that contain resources keywords
        locations = locations.filter(location => {
            let acceptedResourcesText = location.accepting;

            // ensure acceptedResourcesText is filtered according to each resource type
            return resource_types.some(type => {
                if (type === RESOURCE_ALL)
                    return true;

                // must contain at least one of the keywords
                return RESOURCE_KEYWORDS[type].some(
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
        res.setHeader('Cache-Control', 's-maxage=1, stale-while-revalidate');
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
