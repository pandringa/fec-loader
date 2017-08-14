const _ = require('lodash'),
      models = require('../models'),
      parser = require('rss-parser'),
      queue = require('../import');


const RSS_URL = 'http://efilingapps.fec.gov/rss/generate?preDefinedFilingType=ALL',
      FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

function queueFilingsToCheck(opts) {
    console.log('checking RSS');

    parser.parseURL(RSS_URL, function(err, parsed) {
        if (!err && parsed && parsed.feed && parsed.feed.entries) {
            const newFilings = parsed.feed.entries.map(filing =>
                parseInt(
                    filing.link
                        .replace(FILING_URL,'')
                        .replace(FILING_EXT,'')
                )
            );

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
                    );
                });
        } else {
            console.error(error);

            console.log('waiting');
            setTimeout(queueFilingsToCheck.bind(this, opts), opts.interval);
        }
    });
}

module.exports = opts => {
    opts = _.defaults(opts, {
        interval: 60000
    });

    queueFilingsToCheck(opts);
};

if (require.main === module) {
    module.exports();
}
