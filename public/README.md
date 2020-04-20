# 📓 Description

This repository hosts an API endpoint (and associated code) that fetches live data from hospitals that are currently in 
need of personal protective equipment (PPE) around the United States and are seeking help.


The data is sourced from https://findthemasks.com, a US-based website where hospitals can submit requests for PPE during the COVID-19 pandemic. Their list is updated every
5 minutes, has over 3000 different hospitals requesting PPE, and is currently in use by https://resource19.org and
https://getusppe.org, two of the largest PPE matching websites (traffic-wise) created by a dedicated group of volunteers and change-makers alike.

If you'd like to help out with our efforts, please feel free to reach out! My email is on my [Github profile](https://github.com/amadrzyk). 

# 🏹 API Querying

### Query Parameters
- `radius_mi`
    - REQUIRED: no
    - TYPE: number 
    - DEFAULT: 15 miles
- `zip_code`
    - REQUIRED: yes
    - TYPE: number
    - DEFAULT: none
- `resource_types`
    - REQUIRED: yes
    - TYPE: array, at least one of the following options must be selected
        - `'all', 'mask', 'respirator', 'shield', 'gown', 'disinfectant', 'gloves', 'footwear', 'eyewear', 'accessories'`
    - DEFAULT: none
    
### Sample API Call
``` 
http://localhost:3000/api/fetch-hospitals?zip_code=33160&radius_mi=15&resource_types=[%22all%22,%22gloves%22]
```

# 💻 Development

### Getting Started

First, run the development server:

```bash
$ yarn dev
```

Open [http://localhost:3000/api/test](http://localhost:3000/api/test) with your browser to see the result.

### Deployment on ZEIT
Simply install and run `now` on your local machine to deploy your code to their servers. It's really that simple.
``` 
$ yarn global add now && now
```

# 💰 Sponsors
Huge thank you to [ZEIT](https://zeit.co/) for sponsoring this project and our related COVID-19 efforts, without them 
this wouldn't be possible. ZEIT is one of the easiest ways to deploy code to the cloud – this project leverages the 
[ZEIT Platform](https://zeit.co/import?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) 
and [Next.js](https://nextjs.org/docs/deployment). Check out the links for more details!
