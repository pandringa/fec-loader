const chai = require('chai'),
    sinon = require('sinon'),
    Queue = require('../lib/queue');

// https://github.com/OptimalBits/bull/blob/master/test/test_repeat.js
const ONE_SECOND = 1000;
      ONE_MINUTE = 60 * ONE_SECOND;
      ONE_HOUR = 60 * ONE_MINUTE;
      ONE_DAY = 24 * ONE_HOUR;
      ONE_MONTH = 31 * ONE_DAY;

let should = chai.should();

describe('lib/queue.js', () => {
    it('should repeat every 2 seconds', function(done) {
        this.clock = sinon.useFakeTimers();

        let queue = new Queue('repeat');

        queue.process((task, done) => {
            done();
        });

        let self = this;

        let date = new Date('2017-02-07 9:24:00');
        self.clock.tick(date.getTime());
        let nextTick = 2 * ONE_SECOND + 500;

        queue
            .add({ foo: 'bar' }, { repeat: { cron: '*/2 * * * * *' } })
            .then(() => {
                self.clock.tick(nextTick);
            });

        let prev;
        let counter = 0;
        queue.on('completed', function(job) {
            self.clock.tick(nextTick);
            if (prev) {
                prev.timestamp.should.be.lt(job.timestamp);
                (job.timestamp - prev.timestamp).should.be.gte(2000);
            }
            prev = job;
            counter++;
            if (counter == 20) {
                queue.close().then(() => {
                    self.clock.restore();

                    done();
                });
            }
        });
    });

    it('should repeat once a day for 5 days', function(done) {
        this.clock = sinon.useFakeTimers();

        let queue = new Queue('repeat');

        var self = this;
        //this.timeout(50000);
        var date = new Date('2017-05-05 13:12:00');
        this.clock.tick(date.getTime());
        var nextTick = ONE_DAY;

        queue
            .add(
                { foo: 'bar' },
                {
                    repeat: {
                        cron: '0 1 * * *',
                        endDate: new Date('2017-05-10 13:12:00')
                    }
                }
            )
            .then(function() {
                self.clock.tick(nextTick);
            });

        queue.process((task, done) => {
            done();
        });

        var prev;
        var counter = 0;
        queue.on('completed', function(job) {
            self.clock.tick(nextTick);
            if (prev) {
                prev.timestamp.should.be.lt(job.timestamp);
                (job.timestamp - prev.timestamp).should.be.gte(ONE_DAY);
            }
            prev = job;

            counter++;
            if (counter == 5) {
                queue.getJobCounts().then(function(counts) {
                    counts.wait.should.be.eql(0);
                    queue.close().then(() => {
                        self.clock.restore();

                        done();
                    });
                });
            }
        });
    });
});
