const async = require('async'),
    Queue = require('bull');

function FilingQueue(fn) {
    let q = async.queue(fn, 1);

    if (process.env.REDIS_SERVER) {
        q = new Queue('filing');

        q.process(fn);
    }

    this.push = function (task,cb) {
        if ('add' in q) {
            return q.add(task,cb);
        }
        else {
            return q.push(task,cb);
        }
    };
}

module.exports = FilingQueue;
