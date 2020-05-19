# 📓 Description

This repository hosts an API endpoint (and associated code) that fetches live data from hospitals that are currently in 
need of personal protective equipment (PPE) around the United States and are seeking help.


The data is sourced from https://findthemasks.com, a US-based website where hospitals can submit requests for PPE during the COVID-19 pandemic. Their list is updated every
5 minutes, has over 3000 different hospitals requesting PPE, and is currently in use by https://resource19.org and
https://getusppe.org, two of the largest PPE matching websites (traffic-wise) created by a dedicated group of volunteers and change-makers alike.

If you'd like to help out with our efforts, please feel free to reach out! My email is on my [Github profile](https://github.com/amadrzyk). 

# 🏹 API Querying

### Query Parameters
**Note:** Please make sure to use `JSON.stringify()` when using arrays for proper parsing
- `radius_mi`
    - DESCRIPTION: radius around zip code in which to search for hospitals, in miles
    - REQUIRED: no
    - TYPE: number 
    - DEFAULT: 15 miles
- `app_name`
    - DESCRIPTION: the name of your application
    - REQUIRED: yes
    - TYPE: string, at least 5 characters
    - DEFAULT: none
- `zip_code`
    - DESCRIPTION: 5-digit US zip code
    - REQUIRED: yes
    - TYPE: number
    - DEFAULT: none
- `org_types`
    - DESCRIPTION: filter for which organization types to display, i.e. mental health and dentist facilities
    - REQUIRED: yes
    - TYPE: array, at least one of the following options must be selected
        - `['all', 'hospital', 'nursing_home', 'clinic', 'home_care', 'health_center', 'mental_health', 'assisted_living', 
        'rehab', 'hospice', 'dentist', 'fire_dept', 'homeless_shelter', 'lab', 'pharmacy', 'food_bank', 'law_enforcement', 'other']`
    - DEFAULT: none
- `resource_types`
    - DESCRIPTION: filter for which hospitals display, i.e. those that are looking for only `mask` and `gown` donations
    - REQUIRED: yes
    - TYPE: array, at least one of the following options must be selected
        - `['all', 'mask', 'respirator', 'shield', 'gown', 'disinfectant', 'sanitizer', 'gloves', 'footwear', 'eyewear', 'accessories']`
    - DEFAULT: none
    
### Sample API Call
``` 
http://localhost:3000/api/fetch-hospitals?app_name=testing&zip_code=33160&radius_mi=15&resource_types=[%22gloves%22]&org_types=[%22all%22]
```

### Sample Response Format

All locations will be ordered from closest to farthest from the zip code:
```
{
    "num_locations": 10,
    "radius_mi": "15",
    "locations": [
        {
            "timestamp": "3/23/2020 21:02:43",
            "name": "Mount Sinai Medical Center",
            "address": "4300 Alton Rd\nMiami Beach, FL 33140",
            "orig_address": "4300 Alton Rd\nMiami Beach, FL 33140",
            "city": "Miami Beach",
            "state": "FL",
            "instructions": "Emergency Room",
            "accepting": "N95s, Surgical masks, Face shields, Disposable booties, Safety goggles, Gloves, Gowns",
            "open_box": "Yes",
            "request_type": "",
            "encrypted_email": "",
            "org_type": "Hospital",
            "lat": "25.8131425",
            "lng": "-80.1414482",
            "distance_from_zipcode": "8.405431572665718"
        },
        ...
    ]
}
```

# 💻 Development

### Getting Started

First, clone the Github repository onto your local machine.
```
$ git clone https://github.com/amadrzyk/COVID19-Hospital-PPE-API.git
```

Then, get a GCP Geocoding API key [here](https://developers.google.com/maps/documentation/geocoding/get-api-key), and a Google
Analytics ID [here](https://support.google.com/analytics/answer/1008080?hl=en). Create a `.env` file in your root folder to store this key, and add the following:

``` 
GCP_KEY=<your key here>
GA_TRACKING_ID=<your id here>
```

Lastly, run the development server:

```bash
$ yarn dev
```

Open [http://localhost:3000/api/test](http://localhost:3000/api/test) with your browser to see the result.

### Deployment on ZEIT
Simply install and run `now` on your local machine to deploy your code to their servers. It's really that simple.
``` 
$ yarn global add now
$ now --prod
```

**Note:** if you're getting an error, you may need to add your `GCP_KEY` and `GA_TRACKING_ID` in ZEIT's settings dashboard for production and development: [zeit.co/{TEAM}/{PROJECT}/settings](https://zeit.co).

# 💰 Sponsors
Huge thank you to [ZEIT](https://zeit.co/) for sponsoring this project and our related COVID-19 efforts, without them 
this wouldn't be possible. ZEIT is one of the easiest ways to deploy code to the cloud – this project leverages the 
[ZEIT Platform](https://zeit.co/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) 
and [Next.js](https://nextjs.org/docs/deployment). Check out the links for more details!
