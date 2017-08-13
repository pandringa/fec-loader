const _ = require('lodash'),
      queue = require('../import'),
      models = require('../models'),
      request = require('request');

const FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

function queueFilingsToCheck(opts) {
    models.fec_filing
        .findAll({
            attributes: ['filing_id'],
            limit: opts.lookBehind,
            order: [['filing_id', 'DESC']]
        })
        .then(filings => {
            filings = filings.map(filing => filing.filing_id);

            const tasks = [];

            for (
                let i = filings[0] - opts.lookBehind;
                i <= filings[0] + opts.variableLookAhead;
                i++
            ) {
                tasks.push(i);
            }

            tasks
                .filter((filingId) => !filings.includes(filingId))
                .forEach((filingId) => {
                    queue.push({
                        name: `${filingId}${FILING_EXT}`,
                        id: filingId,
                        location: `${FILING_URL}${filingId}${FILING_EXT}`
                    });
                });

            setTimeout(queueFilingsToCheck.bind(this, opts), opts.interval);
        });
}

module.exports = opts => {
    opts = _.defaults(opts, {
        lookAhead: 10,
        lookBehind: 1000,
        interval: 60000
    });

    opts.variableLookAhead = opts.lookAhead;

    queueFilingsToCheck(opts);
};

if (require.main === module) {
    module.exports();
}
