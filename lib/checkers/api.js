const _ = require('lodash'),
      async = require('async'),
      queue = require('../import'),
      models = require('../models'),
      axios = require('axios'),
      qs = require('querystring');

const API_URL = 'https://api.open.fec.gov/v1/efile/filings/',
      FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

function queueFilingsToCheck(opts) {
    console.log('checking API');

    axios.get(`${API_URL}?${qs.stringify({
            sort: '-receipt_date',
            per_page: opts.lookBehind,
            api_key: opts.fecKey,
            page: 1,
            cache: Math.round(Math.random() * 100)
        })}`)
        .catch(error => {
            console.error(error);

            setTimeout(
                queueFilingsToCheck.bind(this, opts),
                opts.interval
            );
        });
        .then(response => {
            if (response.status != 200 || !response.data || !response.data.results) {
                console.error(`got ${response.status} response code`);

                console.log('waiting');
                setTimeout(
                    queueFilingsToCheck.bind(this, opts),
                    opts.interval
                );

                return;
            }

            let newFilings = response.data.results.map(filing => filing.file_number);

            return models.fec_filing
                .findAll({
                    attributes: ['filing_id'],
                    where: {
                        filing_id: {
                            $in: newFilings
                        }
                    }
                });
        })
        .then(filings => {
            filings = filings.map(filing => filing.filing_id);

            newFilings
                .filter((filingId) => !filings.includes(filingId))
                .forEach((filingId) => {
                    queue.push({
                        name: `${filingId}${FILING_EXT}`,
                        id: filingId,
                        location: `${FILING_URL}${filingId}${FILING_EXT}`
                    });
                });

            console.log('waiting');
            setTimeout(
                queueFilingsToCheck.bind(this, opts),
                opts.interval
            );
        });
}

module.exports = function init(opts) {
    opts = _.defaults(opts, {
        lookBehind: 100,
        interval: 60000,
        fecKey: process.env.FEC_KEY
    });

    queueFilingsToCheck(opts);
};

if (require.main === module) {
    module.exports();
}
