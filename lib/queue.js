const async = require('async'),
    Bull = require('bull'),
    EventEmitter = require('events'),
    schedule = require('node-schedule');

class Queue extends EventEmitter {
    constructor(name) {
        super();

        let self = this;

        self.schedules = [];
        self.workers = {};

        self.q = async.queue(self._asyncWorker.bind(self), 1);

        if (process.env.REDIS_SERVER) {
            self.q = new Bull(name, process.env.REDIS_SERVER);
        }
    }

    _asyncWorker(job,cb) {
        this.workers[job.name](job,cb);
    }

    _asyncPush(data) {
        let self = this;

        let job = {
            name: '__default__',
            progress() {
                // no-op
            },
            timestamp: new Date(),
            data: data
        };

        self.q.push(job, () => {
            self.emit('completed', job);
        });
    }

    getJobCounts() {
        if ('getJobCounts' in this.q) {
            return this.q.getJobCounts();
        }

        return Promise.resolve({
            wait: this.q.length(),
            active: this.q.running()
        });
    }

    process(fn) {
        if ('add' in this.q) {
            this.process(fn);
        }
        else {
            this.workers['__default__'] = fn;
        }
    }

    add(data, opts) {
        let self = this;

        opts = opts || null;

        if ('add' in self.q) {
            return self.q.add(data, opts);
        }
        else if ('push' in self.q) {
            return new Promise((accept, reject) => {
                if (opts && opts.repeat && opts.repeat.cron) {
                    this.schedules.push(
                        schedule.scheduleJob(
                            {
                                end: opts.repeat.endDate,
                                rule: opts.repeat.cron
                            },
                            self._asyncPush.bind(self, data)
                        )
                    );
                }
                else {
                    self._asyncPush(data);
                }

                accept();
            });
        }
    }

    close() {
        let self = this;

        if ('close' in this.q) {
            return self.q.close();
        }
        else if ('kill' in self.q) {
            return new Promise((accept, reject) => {
                self.q.kill();

                self.schedules.forEach(schedule => {
                    schedule.cancel();
                });

                accept();
            });
        }
    }
}

module.exports = Queue;
