/*! Bergson 1.0.0, Copyright 2015 Colin Clark | github.com/colinbdclark/bergson */

/*
 * Bergson Clocks
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    /**
     * Clock is the base grade for all Clocks.
     */
    fluid.defaults("berg.clock", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        rate: 1, // Ticks per second.

        members: {
            time: 0,
            rate: "{that}.options.rate"
        },

        invokers: {
            tick: "fluid.identity()"
        },

        events: {
            onTick: null
        }
    });


    /**
     * Offline Clock
     *
     * An Offline Clock tracks time relatively
     * (i.e. without reference to a "real" source of time
     * such as the system clock).
     *
     * This clock can be driven manually
     * (perhaps by an offline frame or audio sample renderer)
     * by invoking its tick() method.
     */
    fluid.defaults("berg.clock.offline", {
        gradeNames: ["berg.clock", "autoInit"],

        members: {
            tickDuration: {
                expander: {
                    funcName: "berg.clock.offline.calcTickDuration",
                    args: "{that}.options.rate"
                }
            }
        },

        invokers: {
            tick: {
                funcName: "berg.clock.offline.tick",
                args: ["{that}"]
            }
        }
    });

    berg.clock.offline.calcTickDuration = function (rate) {
        return 1.0 / rate;
    };

    berg.clock.offline.tick = function (that) {
        that.time += that.tickDuration;
        that.events.onTick.fire(that.time, that.rate);
    };


    /**
     * A Realtime Clock tracks time based on actual system time
     * (i.e. performance.now)
     */
    fluid.defaults("berg.clock.realtime", {
        gradeNames: ["berg.clock", "autoInit"],

        members: {
            time: {
                expander: {
                    "this": performance,
                    method: "now"
                }
            }
        },

        invokers: {
            tick: {
                funcName: "berg.clock.realtime.tick",
                args: ["{that}", "{arguments}.0"]
            }
        }
    });

    berg.clock.realtime.tick = function (that) {
        that.time = performance.now();
        that.events.onTick.fire(that.time, that.rate);
    };

}());
;/* Bergson Priority Queue
 *
 * Based on Marijn Haverbeke's Binary Heap,
 * published in the 1st edition of Eloquent JavaScript
 * http://eloquentjavascript.net/1st_edition/appendix2.html
 *
 * License: Creative Commons Attribution 3.0 Unported
 * Copyright 2013 Marijn Haverbeke
 * Copyright 2015 Colin Clark
 */
(function() {
    "use strict";

    fluid.registerNamespace("berg");

    /**
     * Priority Queue
     *
     * Stores elements sorted by their order of priority.
     * This implementation uses a binary heap algorithm in order to
     * efficiently keep items sorted.
     *
     * @return the new queue instance
     */
    berg.priorityQueue = function () {
        var that = {
            items: []
        };

        /**
         * Adds a new item to the queue.
         *
         * @param the item to add
         */
        that.push = function (item) {
            if (!item) {
                return;
            }

            if (item.priority === undefined) {
                throw new Error("An item without a priority cannot be added to the queue.");
            }

            // Add the new element to the end of the array.
            that.items.push(item);
            // Allow it to bubble up.
            that.bubbleUp(that.items.length - 1);
        };

        /**
         * Returns the highest-priority element from the queue.
         * This method will not remove the item from the queue.
         *
         * @return the highest-priority element
         */
        that.peek = function () {
            return that.items[0];
        };

        /**
         * Removes the highest-priority element from the queue and returns it.
         *
         * @return the highest-priority element in the queue
         */
        that.pop = function () {
            // Store the first element so we can return it later.
            var result = that.items[0],
                end = that.items.pop();

            // If there are any elements left, put the end element at the
            // start, and let it sink down.
            if (that.items.length > 0) {
                that.items[0] = end;
                that.sinkDown(0);
            }

            return result;
        };

        /**
         * Removes the specified item from the queue.
         *
         * @param item the item to remove
         */
        that.remove = function (item) {
            var len = that.items.length;
            // To remove a value, we must search through the array to find it.
            for (var i = 0; i < len; i++) {
                if (that.items[i] != item) continue;
                // When it is found, the process seen in 'pop' is repeated
                // to fill up the hole.
                var end = that.items.pop();
                // If the element we popped was the one we needed to remove,
                // we're done.
                if (i === len - 1) break;
                // Otherwise, we replace the removed element with the popped
                // one, and allow it to float up or sink down as appropriate.
                that.items[i] = end;
                that.bubbleUp(i);
                that.sinkDown(i);

                break;
            }
        };

        /**
         * Returns the number of items in the queue.
         *
         * @return the number of items
         */
        that.size = function () {
            return that.items.length;
        };

        /**
         * Clears all items from the queue.
         */
        that.clear = function () {
            that.items.length = 0;
        };

        // Unsupported, non-API method.
        that.bubbleUp = function (n) {
            // Fetch the element that has to be moved.
            var item = that.items[n];

            // When at 0, an element can not go up any further.
            while (n > 0) {
                // Compute the parent element's index, and fetch it.
                var parentN = (n - 1) >> 1,
                    parent = that.items[parentN];
                // If the parent has a lesser score, things are in order and we
                // are done.
                if (parent.priority <= item.priority){
                    break;
                }

                // Otherwise, swap the parent with the current element and
                // continue.
                that.items[parentN] = item;
                that.items[n] = parent;
                n = parentN;
            }
        };

        // Unsupported, non-API method.
        that.sinkDown = function (n) {
            // Look up the target element and its score.
            var length = that.items.length,
                item = that.items[n],
                child1;

            while (true) {
                // Compute the indices of the child elements.
                var child2N = (n + 1) * 2,
                    child1N = child2N - 1,
                    swap = null; // The new position of the item, if any.

                // If the first child exists (is inside the array)...
                if (child1N < length) {
                    // Look it up and compute its score.
                    child1 = that.items[child1N];

                    // If the score is less than our element's, we need to swap.
                    if (child1.priority < item.priority){
                        swap = child1N;
                    }
                }

                // Do the same checks for the other child.
                if (child2N < length) {
                    var child2 = that.items[child2N],
                        right = swap === null ? item : child1;

                    if (child2.priority < right.priority){
                        swap = child2N;
                    }
                }

                // No need to swap further, we are done.
                if (swap === null) {
                    break;
                }

                // Otherwise, swap and continue.
                that.items[n] = that.items[swap];
                that.items[swap] = item;
                n = swap;
            }
        };

        return that;
    };

}());
;/*
 * Bergson Scheduler
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    fluid.defaults("berg.scheduler", {
        gradeNames: ["fluid.standardRelayComponent", "autoInit"],

        members: {
            queue: "@expand:berg.priorityQueue()"
        },

        components: {
            clock: {
                type: "berg.clock.offline" // Should be supplied by the user.
            }
        },

        invokers: {
            /**
             * Causes the scheduler to evaluate its
             * queue of scheduled callback and fire those that
             * are appropriate for the current clock time.
             *
             * @param {Number} time - the current clock time
             */
            tick: "berg.scheduler.tick({arguments}.0, {arguments}.1, {that}.queue)",

            /**
             * Schedules one or more score specifications.
             *
             * @param {Object||Array} scoreSpecs - the score specifications to schedule
             */
            schedule: "berg.scheduler.schedule({arguments}.0, {that}.clock)",

            /**
             * Schedules a callback to be fired once at the specified time.
             *
             * @param {Number} time - the time from now, in seconds, to schedule the callback
             * @param {Function} callback - the callback to schedule
             */
            once: "berg.scheduler.once({arguments}.0, {arguments}.1, {that})",

            /**
             * Schedules a callback to be fired repeatedly at the specified interval.
             *
             * @param {Number} interval - the interval to repeat at
             * @param {Function} callback - the callback to schedule
             */
            repeat: "berg.scheduler.repeat({arguments}.0, {arguments}.1, {that})",

            /**
             * Clears a scheduled event,
             * causing it not to be evaluated by this scheduler
             * if it hasn't already fired or is repeating.
             *
             * @param {Object} eventSpec - the event spec
             */
            clear: "{that}.queue.remove({arguments}.0)",


            /**
             * Clears all scheduled events.
             */
            clearAll: "{that}.queue.clear()"
        }
    });

    // Unsupported, non-API function.
    berg.scheduler.expandRepeatingEventSpec = function (now, eventSpec) {
        if (typeof eventSpec.time !== "number") {
            eventSpec.time = 0;
        }

        eventSpec.endTime = typeof eventSpec.endTime !== "number" ?
            Infinity : eventSpec.endTime + now;
    };

    // Unsupported, non-API function.
    berg.scheduler.scheduleEvent = function (eventSpec, that) {
        var now = that.clock.time;

        if (eventSpec.type === "repeat") {
            berg.scheduler.expandRepeatingEventSpec(now, eventSpec);
        }

        eventSpec.priority = now + eventSpec.time;
        that.queue.push(eventSpec);

        return eventSpec;
    };

    // Unsupported, non-API function.
    berg.scheduler.scheduleEvents = function (eventSpecs, that) {
        eventSpecs.forEach(function (eventSpec) {
            berg.scheduler.scheduleEvent(eventSpec, that);
        });

        return eventSpecs;
    };

    berg.scheduler.schedule = function (eventSpec, that) {
        if (fluid.isArrayable(eventSpec)) {
            berg.scheduler.scheduleEvents(eventSpec, that);
        }

        return berg.scheduler.scheduleEvent(eventSpec, that);
    };

    berg.scheduler.once = function (time, callback, that) {
        var eventSpec = {
            type: "once",
            time: time,
            callback: callback
        };

        return berg.scheduler.scheduleEvent(eventSpec, that);
    };

    berg.scheduler.repeat = function (interval, callback, that) {
        var eventSpec = {
            type: "repeat",
            freq: interval,
            time: 0,
            endTime: Infinity,
            callback: callback
        };

        return berg.scheduler.scheduleEvent(eventSpec, that);
    };

    berg.scheduler.tick = function (time, interval, queue) {
        var next = queue.peek(),
            maxTime = time + interval;

        // Check to see if this event fits within the current tick
        // (or if it's from an earlier tick in the case of a delay).
        while (next && next.priority <= maxTime) {
            // Take it out of the queue and invoke its callback.
            queue.pop();
            next.callback(time);

            // If it's a repeating event, queue it back up.
            if (next.type === "repeat" && next.endTime > time) {
                next.priority = time + next.freq;
                queue.push(next);
            }

            next = queue.peek();
        }
    };

}());
;/*
 * Bergson requestAnimationFrame Clock
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    /**
     * The RAF Clock is a realtime clock driven by
     * window.requestAnimationFrame()
     */
    fluid.defaults("berg.clock.raf", {
        gradeNames: ["berg.clock.realtime", "autoInit"],

        rate: 60, // This should be overridden by the user
                  // to match the refresh rate of their display.

        members: {
            requestID: null
        },

        invokers: {
            start: {
                funcName: "berg.clock.raf.requestNextTick",
                args: ["{that}"]
            },

            tick: {
                funcName: "berg.clock.raf.tick",
                args: ["{that}"]
            },

            stop: {
                funcName: "berg.clock.raf.stop",
                args: ["{that}"]
            }
        }
    });

    berg.clock.raf.requestNextTick = function (that) {
        that.requestID = requestAnimationFrame(that.tick);
    };

    berg.clock.raf.tick = function (that) {
        berg.clock.raf.requestNextTick(that);

        var now = performance.now();
        that.time = now;
        that.events.onTick.fire(now, that.rate);
    };

    berg.clock.raf.stop = function (that) {
        cancelAnimationFrame(that.requestID);
    };

}());
;/*
 * Bergson setInterval Clock
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    fluid.defaults("berg.clock.setInterval", {
        gradeNames: ["berg.clock.realtime", "autoInit"],

        members: {
            intervalID: null
        },

        invokers: {
            start: {
                funcName: "berg.clock.setInterval.start",
                args: ["{that}"]
            },

            stop: {
                funcName: "berg.clock.setInterval.stop",
                args: ["{that}"]
            }
        }
    });

    berg.clock.setInterval.start = function (that) {
        that.intervalID = setInterval(that.tick, 1000 / that.options.rate);
    };

    berg.clock.setInterval.stop = function (that) {
        clearInterval(that.intervalID);
    };
}());
;/*
 * Bergson Web Worker-based setInterval Clock
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    // TODO: Cut and pasted from the Flocking Scheduler.
    berg.worker = function (code) {
        var type = typeof code,
            url,
            blob;

        if (type === "function") {
            code = "(" + code.toString() + ")();";
        } else if (type !== "string") {
            throw new Error("A berg.worker must be initialized with a String or a Function.");
        }

        if (window.Blob) {
            blob = new Blob([code], {
                type: "text/javascript"
            });
            url = (window.URL || window.webkitURL).createObjectURL(blob);
        } else {
            url = "data:text/javascript;base64," + window.btoa(code);
        }
        return new Worker(url);
    };

    fluid.defaults("berg.clock.workerSetInterval", {
        gradeNames: ["berg.clock.realtime", "autoInit"],

        members: {
            worker: '@expand:berg.clock.workerSetInterval.initWorker()'
        },

        invokers: {
            start: {
                funcName: "berg.clock.workerSetInterval.post",
                args: [
                    "{that}.worker",
                    {
                        msg: "start",
                        value: {
                            rate: "{that}.options.rate"
                        }
                    }
                ]
            },

            stop: "berg.clock.workerSetInterval.stop({that})"
        },

        listeners: {
            onCreate: [
                "berg.clock.workerSetInterval.listen({that})"
            ]
        }
    });

    berg.clock.workerSetInterval.initWorker = function () {
        return berg.worker(berg.clock.workerSetInterval.workerImpl);
    };

    berg.clock.workerSetInterval.listen = function (that) {
        that.worker.addEventListener("message", function (e) {
            if (e.data.msg === "tick") {
                that.tick(performance.now());
            }
        }, false);
    };

    berg.clock.workerSetInterval.post = function (worker, msg) {
        worker.postMessage(msg);
    };

    berg.clock.workerSetInterval.stop = function (that) {
        berg.clock.workerSetInterval.post(that.worker, {
            msg: "stop"
        });

        that.worker.terminate();
    };

    // Note: This function is intended to be invoked as
    // an berg.worker only.
    // TODO: This is pretty well copied from the Flocking
    // Scheduler.
    berg.clock.workerSetInterval.workerImpl = function () {
        "use strict"; // jshint ignore:line

        var berg = {};

        berg.workerClock = function (options) {
            var that = {
                options: options || {},
                intervalID: null
            };

            that.start = function () {
                that.intervalID = setInterval(that.tick, 1000 / that.options.rate);
            };

            that.tick = function () {
                self.postMessage({
                    msg: "tick"
                });
            };

            that.stop = function () {
                clearInterval(that.intervalID);
            };

            return that;
        };

        self.addEventListener("message", function (e) {
            if (e.data.msg === "start") {
                berg.clock = berg.workerClock({
                    rate: e.data.value
                });
                berg.clock.start();
            } else if (e.data.msg === "stop") {
                if (berg.clock) {
                    berg.clock.stop();
                }
                self.close();
            }
        }, false);
    };
}());
;/*
 * Bergson Clock Logger
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    /**
     * Interval Logger logs the interval between ticks over time
     * into a typed array that can be used to analyse the realtime
     * performance of a clock instance (e.g. to determine definitively
     * if the clock is dropping frames).
     */
    fluid.defaults("berg.clock.logger", {
        gradeNames: ["fluid.eventedComponent", "autoInit"],

        numTicksToLog: 60 * 60 * 20, // Twenty minutes at 60 fps by default.

        members: {
            tickCounter: 0,
            lastTickTime: null,
            interval: 0,
            intervalLog: "@expand:berg.clock.logger.initLog({that}.options.numTicksToLog)"
        },

        invokers: {
            log: "berg.clock.logger.log({that})"
        },

        listeners: {
            "{clock}.events.onTick": [
                "{that}.log()"
            ]
        }
    });

    berg.clock.logger.initLog = function (numTicksToLog) {
        return new Float32Array(numTicksToLog);
    };

    // TODO: This would be much better expressed as a
    // set of separate model listeners.
    berg.clock.logger.log = function (that) {
        if (that.lastTickTime === null) {
            that.lastTickTime = that.time;
            return;
        }

        that.tickCounter++;
        that.interval = that.time - that.lastTickTime;

        if (that.tickCounter < that.options.numTicksToLog) {
            that.intervalLog[that.tickCounter] = that.interval;
        }
    };
}());