const _ = require('highland'),
    vfs = require('vinyl-fs');

module.exports = (job, done) => {
    _(
        vfs.src(job.data.dir + '/**/*.@(fec|zip)', {
            buffer: false,
            read: false
        })
    )
        .stopOnError(done)
        .toArray(result => {
            done(null, result);  // how do we communicate the filing results?
        });
};
