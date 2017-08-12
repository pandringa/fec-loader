const async = require('async'),
    Queue = require('bull');

function FilingQueue(fn) {
    let q = new Queue('filing');

    q.process(fn);

    q.once('error',() => {
        q = async.queue(fn, 1);
    });

    this.push = function (task,cb) {
        if ('add' in q) {
            return q.add(task,cb);
        }
        else {
            return q.push(task,cb);
        }
    };

    this.add = this.push;
}

module.exports = FilingQueue;
