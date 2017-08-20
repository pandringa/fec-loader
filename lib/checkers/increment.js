const models = require('../models');

const FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

module.exports = (job,done) => {
    models.fec_filing
        .findAll({
            attributes: ['filing_id'],
            limit: job.data.lookBehind,
            order: [['filing_id', 'DESC']]
        })
        .catch(done)
        .then(filings => {
            filings = filings.map(filing => filing.filing_id);

            const tasks = [];

            for (
                let i = filings[0] - job.data.lookBehind;
                i <= filings[0] + job.data.lookAhead;
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

            done();   // how do we communicate the filing results?
        });
}