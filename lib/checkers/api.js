const axios = require('axios'),
    qs = require('querystring');

const API_URL = 'https://api.open.fec.gov/v1/efile/filings/';

module.exports = (job, done) => {
    axios
        .get(
            `${API_URL}?${qs.stringify({
                sort: '-receipt_date',
                per_page: job.data.lookBehind,
                api_key: job.data.fecKey, // is this the right way to set the key?
                page: 1,
                cache: Math.round(Math.random() * 100) // work around for bad caches, is this still needed?
            })}`
        )
        .catch(done)
        .then(response => {
            if (response.status != 200) {
                done(new Error(`got ${response.status} response code`));
                return;
            } else if (!response.data || !response.data.results) {
                done(new Error('no results returned'));
                return;
            }

            done(null, response.data.results); // how do we communicate the filing results?
        });
};
