const async = require('async'),
      Bull = require('bull');

function Queue(name,fn) {
    let q = async.queue(fn, 1);

    if (process.env.REDIS_SERVER) {
        q = new Bull(name,process.env.REDIS_SERVER);

        q.process(fn);
    }

    this.push = function(task) {
        if ('add' in q) {
            return q.add(task);
        } else {
            return q.push(task);
        }
    };
}

module.exports = Queue;
