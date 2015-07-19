/*
 * Bergson Scheduler Tests
 * http://github.com/colinbdclark/bergson
 *
 * Copyright 2015, Colin Clark
 * Dual licensed under the MIT and GPL Version 2 licenses.
 */
(function () {
    "use strict";

    fluid.registerNamespace("berg.test.scheduler");

    berg.test.scheduler.runTest = function (testSequencerType, testSpec) {
        var testSequencer = fluid.invokeGlobalFunction(testSequencerType, [testSpec]);
    };

    berg.test.scheduler.runTests = function (testSequencerType, testSpecs) {
        fluid.each(testSpecs, function (testSpec) {
            berg.test.scheduler.runTest(testSequencerType, testSpec);
        });
    };


    QUnit.test("Instantiation", function () {
        var s = berg.scheduler();
        berg.test.scheduler.testInitial(s);
    });

    berg.test.scheduler.onceTestSpecs = [
        {
            name: "scheduled precisely on the tick interval",

            numTicks: 5,

            scoreEventSpecs: {
                only: {
                    type: "once",
                    time: 20,     // As specified in the call to once()
                    priority: 30 // Normalized to clock's "now" position
                }
            },

            // Tick count to register at : [specification names]
            registrationSequence: {
                1: ["only"]
            },

            expectedSequence: [
                {
                    name: "only",
                    time: 30,
                    queueSize: 0
                }
            ]
        },
        {
            name: "scheduled midway between the clock's tick interval",

            numTicks: 5,

            scoreEventSpecs: {
                only: {
                    type: "once",
                    time: 15,
                    priority: 25
                }
            },

            registrationSequence: {
                1: ["only"]
            },

            expectedSequence: [
                {
                    name: "only",
                    time: 30,
                    queueSize: 0
                }
            ]
        },
        {
            name: "multiple scheduled; only one should fire",

            numTicks: 5,

            scoreEventSpecs: {
                first: {
                    type: "once",
                    time: 20,
                    priority: 30
                },

                later: {
                    type: "once",
                    time: 400,
                    priority: 410
                }
            },

            registrationSequence: {
                1: ["first", "later"]
            },

            expectedSequence: [
                {
                    name: "first",
                    time: 30,
                    queueSize: 1
                }
            ]
        },
        {
            name: "multiple scheduled non-consecutively; all should fire",

            numTicks: 5,

            scoreEventSpecs: {
                first: {
                    type: "once",
                    time: 10,
                    priority: 10
                },

                scheduledSecondRunsLast: {
                    type: "once",
                    time: 20,
                    priority: 20
                },

                scheduledLastRunsSecond: {
                    type: "once",
                    time: 31,
                    priority: 41
                }
            },

            registrationSequence: {
                0: ["first", "scheduledSecondRunsLast"],
                1: ["scheduledLastRunsSecond"]
            },

            expectedSequence: [
                {
                    name: "first",
                    time: 10,
                    queueSize: 1
                },
                {
                    name: "scheduledSecondRunsLast",
                    time: 20,
                    queueSize: 1
                },
                {
                    name: "scheduledLastRunsSecond",
                    time: 50,
                    queueSize: 0
                }
            ]
        },
        {
            name: "scheduled immediately event before clock starts ticking",

            numTicks: 2,

            scoreEventSpecs: {
                immediately: {
                    type: "once",
                    time: 0,
                    priority: 0
                }
            },

            registrationSequence: {
                0: ["immediately"]
            },

            expectedSequence: [
                {
                    name: "immediately",
                    time: 0,
                    queueSize: 0
                }
            ]
        },
        {
            name: "scheduled immediately, after ticking for a bit",

            numTicks: 5,

            scoreEventSpecs: {
                immediately: {
                    type: "once",
                    time: 0,
                    priority: 20
                }
            },

            registrationSequence: {
                2: ["immediately"]
            },

            expectedSequence: [
                {
                    name: "immediately",
                    time: 20,
                    queueSize: 0
                }
            ]
        }
    ];

    QUnit.module("One-time events scheduled with once()");
    berg.test.scheduler.runTests("berg.test.scheduler.onceTestSequencer",
        berg.test.scheduler.onceTestSpecs);

    QUnit.module("One-time events scheduled with schedule()");
    berg.test.scheduler.runTests("berg.test.scheduler.offlineTestSequencer",
        berg.test.scheduler.onceTestSpecs);


    berg.test.scheduler.repeatTestSpecs = [
        {
            name: "scheduled immediately, repeats infinitely every other tick",

            numTicks: 10,

            scoreEventSpecs: {
                immediately: {
                    type: "repeat",
                    time: 0,
                    freq: 1/20,
                    interval: 20,
                    end: Infinity
                }
            },

            registrationSequence: {
                1: ["immediately"]
            },

            expectedSequence: [
                {
                    name: "immediately",
                    time: 10,
                    queueSize: 0
                },
                {
                    name: "immediately",
                    time: 30,
                    queueSize: 0
                },
                {
                    name: "immediately",
                    time: 50,
                    queueSize: 0
                },
                {
                    name: "immediately",
                    time: 70,
                    queueSize: 0
                },
                {
                    name: "immediately",
                    time: 90,
                    queueSize: 0
                }
            ]
        },
        {
            name: "repeats three times",

            numTicks: 5,

            scoreEventSpecs: {
                repeatsThrice: {
                    type: "repeat",
                    time: 0,
                    freq: 1/10,
                    interval: 10,
                    end: 20
                }
            },

            registrationSequence: {
                0: ["repeatsThrice"]
            },

            expectedSequence: [
                {
                    name: "repeatsThrice",
                    time: 0,
                    queueSize: 0
                },
                {
                    name: "repeatsThrice",
                    time: 10,
                    queueSize: 0
                },
                {
                    name: "repeatsThrice",
                    time: 20,
                    queueSize: 0
                }
            ]
        }
    ];

    QUnit.module("Repeating events scheduled with repeat()");
    berg.test.scheduler.runTests("berg.test.scheduler.repeatTestSequencer",
        berg.test.scheduler.repeatTestSpecs);

    QUnit.module("Repeating events scheduled with schedule()");
    berg.test.scheduler.runTests("berg.test.scheduler.offlineTestSequencer",
        berg.test.scheduler.repeatTestSpecs);

    berg.test.scheduler.mixedTestSpecs = [
        {
            name: "drum beat",
            schedulerOptions: {
                components: {
                    clock: {
                        options: {
                            rate: 10
                        }
                    }
                }
            },

            numTicks: 30,

            // 60 bpm
            // Quarter note is 1 second - snare and kick
            // Eigth note, half a second - hihat
            scoreEventSpecs: {
                hihat: {
                    id: "hihat",
                    type: "repeat",
                    time: 0,
                    freq: 2,
                    interval: 0.5,
                    end: Infinity
                },

                kick: {
                    id: "kick",
                    type: "repeat",
                    time: 0,
                    freq: 1/2,
                    interval: 2,
                    end: Infinity
                },

                snare: {
                    id: "snare",
                    type: "repeat",
                    time: 1,
                    freq: 1/2,
                    interval: 2,
                    end: Infinity
                },

                splash: {
                    id: "splash",
                    type: "once",
                    time: 2.25
                }
            },

            registrationSequence: {
                0: ["kick", "snare", "hihat", "splash"]
            },

            // Note: Given the nature of a binary heap priority queue,
            // it's just completely impossible to assert the order of
            // simultaneous events; this test is thus highly implementation-specific.
            expectedSequence: [
                {
                    name: "kick",
                    time: 0,
                    queueSize: 0 // Evaluated immediately, before the others have been scheduled.
                },
                {
                    name: "hihat",
                    time: 0,
                    queueSize: 2
                },
                {
                    name: "hihat",
                    time: 0.5,
                    queueSize: 3
                },
                {
                    name: "snare",
                    time: 1,
                    queueSize: 3
                },
                {
                    name: "hihat",
                    time: 1,
                    queueSize: 3
                },
                {
                    name: "hihat",
                    time: 1.5,
                    queueSize: 3
                },
                {
                    name: "kick",
                    time: 2,
                    queueSize: 3
                },
                {
                    name: "hihat",
                    time: 2,
                    queueSize: 3
                },
                {
                    name: "splash",
                    time: 2.3,
                    queueSize: 3
                },
                {
                    name: "hihat",
                    time: 2.5,
                    queueSize: 2
                },
                {
                    name: "snare",
                    time: 3,
                    queueSize: 2
                },
                {
                    name: "hihat",
                    time: 3,
                    queueSize: 2
                }
            ]

        }
    ];

    QUnit.module("Mixed events with schedule()");
    berg.test.scheduler.runTests("berg.test.scheduler.offlineTestSequencer",
        berg.test.scheduler.mixedTestSpecs);

}());
