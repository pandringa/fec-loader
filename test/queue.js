const chai = require('chai'),
    sinon = require('sinon'),
    Queue = require('../lib/queue');

// https://github.com/OptimalBits/bull/blob/master/test/test_repeat.js
const ONE_SECOND = 1000;

let should = chai.should();

describe('lib/queue.js', () => {

    it('should repeat every 2 seconds', function(done) {
        this.clock = sinon.useFakeTimers();

        let queue = new Queue('test');

        queue.process((task,done) => {
            done();
        });

        let self = this;

        let date = new Date('2017-02-07 9:24:00');
        self.clock.tick(date.getTime());
        let nextTick = 2 * ONE_SECOND + 500;

        queue
            .add(
                { foo: 'bar' },
                { repeat: { cron: '*/2 * * * * *' } }
            )
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
                queue.close()
                    .then(() => {
                        self.clock.restore();
                    });
            }
        });
    });
});
