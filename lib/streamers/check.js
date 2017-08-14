const axios = require('axios'),
      filingQueue = require('./import'),
      fs = require('fs'),
      progress = require('progress-stream');

const temp_dir = path.resolve(`${__dirname}/../data/downloaded`);
const interval = 10000;

module.exports = (filing_id, cb) => {
    const filePath = `${temp_dir}/${filing_id}.fec`;

    fs.exists(filePath, exists => {
        if (!exists) {
            console.log(`checking ${filing_id}`);

            const str = progress({
                time: 100
            });

            axios({
                method: 'get',
                url: `http://docquery.fec.gov/dcdev/posted/${filing_id}.fec`
                responseType: 'stream'
            }).then(resp => {
                if (resp.status == 200) {
                    const length = parseInt(resp.headers['content-length']);
                    str.setLength(length);

                    str.on('progress', progress => {
                        console.log(`${progress.percentage}% transferred`);
                    });

                    resp.data
                        .on('error', function(err) {
                            console.log(err);

                            setTimeout(
                                cb.bind(this, null, false),
                                interval
                            );
                        })
                        .pipe(str)
                        .on('end', function() {
                            console.log(`downloaded ${filing_id}`);

                            if (str.progress().transferred !== length) {
                                console.warn(
                                    `expecting a file of size ${length} but downloaded file is ${str.progress()
                                        .transferred}`
                                );
                            }

                            filingQueue.push({
                                name: `${filing_id}`,
                                openStream(cb) {
                                    cb(null, fs.createReadStream(filePath));
                                }
                            });

                            setTimeout(cb.bind(this, null, true), interval);
                        })
                        .pipe(fs.createWriteStream(filePath));
                } else {
                    console.log('not found');
                    setTimeout(cb.bind(this, null, false), interval);
                }
            });
        } else {
            cb(null, false);
        }
    });
};
