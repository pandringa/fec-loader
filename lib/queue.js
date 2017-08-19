const async = require('async'),
    Bull = require('bull'),
    EventEmitter = require('events'),
    schedule = require('node-schedule');

class Queue extends EventEmitter {
    constructor(name, fn) {
        super();

        let self = this;

        self.schedules = [];

        self.q = async.queue(fn, 1);

        if (process.env.REDIS_SERVER) {
            self.q = new Bull(name, process.env.REDIS_SERVER);

            self.q.process(fn);
        }
    }

    _asyncPush(data) {
        let self = this;

        let job = {
            timestamp: new Date(),
            data: data
        };

        self.q.push(job, () => {
            self.emit('completed', job);
        });
    }

    push(data, opts) {
        let self = this;

        opts = opts || null;

        if ('add' in self.q) {
            return self.q.add(data, opts);
        }
        else if ('push' in self.q) {
            return new Promise((accept, reject) => {
                self._asyncPush(data);

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
