const _ = require('lodash'),
      async = require('async'),
      queue = require('../import'),
      models = require('../models'),
      request = require('request');

const API_URL = 'https://api.open.fec.gov/v1/efile/filings/',
      FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

function queueFilingsToCheck(opts) {
    console.log('checking API');

    request.get(
        {
            url: API_URL,
            qs: {
                sort: '-receipt_date',
                per_page: opts.lookBehind,
                api_key: opts.fecKey,
                page: 1,
                cache: Math.round(Math.random() * 100)
            },
            json: true
        },
        function(error, response, data) {
            if (error || response.statusCode != 200 || !data || !data.results) {
                if (error) {
                    console.error(error);
                }
                else if (response.statusCode != 200) {
                    console.error(`got ${response.statusCode} response code`);
                }
                else {
                    console.error('no results');
                }

                console.log('waiting');
                setTimeout(
                    queueFilingsToCheck.bind(this, opts),
                    opts.interval
                );

                return;
            }

            let newFilings = data.results.map(filing => filing.file_number);

            models.fec_filing
                .findAll({
                    attributes: ['filing_id'],
                    where: {
                        filing_id: {
                            $in: newFilings
                        }
                    }
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
                    )}
                });
            }
        }
    );
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
