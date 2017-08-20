const parser = require('rss-parser');

const RSS_URL = 'http://efilingapps.fec.gov/rss/generate?preDefinedFilingType=ALL',
      FILING_URL = 'http://docquery.fec.gov/dcdev/posted/',
      FILING_EXT = '.fec';

module.exports = (job,done) => {
    parser.parseURL(RSS_URL, (err, parsed) => {
        if (err) {
            done(err);
            return;
        }
        else if (!parsed || !parsed.feed || !parsed.feed.entries) {
            done(new Error('no results'));
            return;
        }

        done(null,parsed.feed.entries);  // how do we communicate the filing results?
    });
}
