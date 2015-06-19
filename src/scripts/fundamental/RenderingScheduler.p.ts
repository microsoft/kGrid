enum RenderingSchedulerState {
    Ready,
    Active,
    Suspending,
    Suspended,
    Stopped,
}

export class RenderingScheduler {
    private static InitialWorkerThreshold = 400;
    private static CalculatePeriod = 500;
    private static FPSUpperBound = 30;
    private static FPSLowerBound = 10;
    private static ThresholdUpperBound = 400;
    private static ThresholdLowerBound = 5;
    private static StartTimePeriod = 3000;
    private static Factor = 0.5;

    public disposer;
    private _workers;
    private _state: RenderingSchedulerState;
    private _handlerSet;
    private _workerThreshold;
    private _creationTime;
    private _recentInvokeTime;

    constructor() {
        this._workers = [];
        this._state = RenderingSchedulerState.Ready;
        this._handlerSet = 0;
        this._workerThreshold = RenderingScheduler.InitialWorkerThreshold;
        this._recentInvokeTime = []
        this._creationTime = Fundamental.BrowserDetector.now();
        this.disposer = new Fundamental.Disposer(() => {
            this._state = RenderingSchedulerState.Stopped;
            this._workers = null;
        });
    }

    public dispose() {
        this.disposer.dispose();
    }

    public addWorker(worker, context = null, priority = 1000) {
        this._workers.push({ priority: priority, worker: worker, context: context, });
        this._workers.sort((left, right) => left.priority == right.priority ? 0 : left.priority < right.priority ? -1 : 1);
    }

    public suspend(tillNoAction: boolean) {
        if (this._state == RenderingSchedulerState.Ready || this._state == RenderingSchedulerState.Stopped) {
            throw Fundamental.createError(0, 'RenderingScheduler', 'cannot suspend since it is not started or stopped already');
        }

        if (tillNoAction) {
            this._state = RenderingSchedulerState.Suspending;
        } else {
            this._state = RenderingSchedulerState.Suspended;
        }
    }

    public resume() {
        if (this._state == RenderingSchedulerState.Ready || this._state == RenderingSchedulerState.Stopped) {
            throw Fundamental.createError(0, 'RenderingScheduler', 'cannot resume since it is not started or stopped already');
        }

        this._state = RenderingSchedulerState.Active;
        this._schedule();
    }

    public start(run: boolean) {
        if (this._state != RenderingSchedulerState.Ready) {
            throw Fundamental.createError(0, 'RenderingScheduler', 'cannot start from non-ready state');
        }

        if (run) {
            this._state = RenderingSchedulerState.Active;
            this._schedule();
        } else {
            this._state = RenderingSchedulerState.Suspended;
        }
    }

    private _doWork() {
        if (this._state == RenderingSchedulerState.Suspended
            || this._state == RenderingSchedulerState.Suspending
            || this._state == RenderingSchedulerState.Stopped) {
            return;
        }

        var startTime = Fundamental.BrowserDetector.now(), endTime;

        this._recentInvokeTime.push(startTime);

        while (this._recentInvokeTime[0] < startTime - RenderingScheduler.CalculatePeriod) {
            this._recentInvokeTime.splice(0, 1);
        }

        var fps = this._recentInvokeTime.length + 1000 / RenderingScheduler.CalculatePeriod;

        if (fps < RenderingScheduler.FPSLowerBound) {
            this._workerThreshold *= RenderingScheduler.Factor;
        } else {
            this._workerThreshold /= RenderingScheduler.Factor;
        }

        if (this._workerThreshold > RenderingScheduler.ThresholdUpperBound) {
            this._workerThreshold = RenderingScheduler.ThresholdUpperBound;
        } else if (this._workerThreshold < RenderingScheduler.ThresholdLowerBound) {
            this._workerThreshold = RenderingScheduler.ThresholdLowerBound;
        }

        if (this._creationTime > startTime - RenderingScheduler.StartTimePeriod) {
            this._workerThreshold = RenderingScheduler.ThresholdUpperBound;
        }

        var count = 0;
        var workerIndex = 0;

        while (workerIndex < this._workers.length) {
            var result = this._workers[workerIndex].worker(this._workers[workerIndex].context);

            if (typeof(result) == 'undefined' || !result) {
                workerIndex++;
            }

            count++;

            if (this._state == RenderingSchedulerState.Suspended || this._state == RenderingSchedulerState.Stopped) {
                return;
            }

            endTime = Fundamental.BrowserDetector.now();

            if (endTime - startTime > this._workerThreshold) {
                break;
            }
        }

        // console.log('fps: ' + fps + ', threshold: ' + this._workerThreshold + 'ms, start: ' + startTime + '; end: ' + endTime + '; count: ' + count);

        if (this._state == RenderingSchedulerState.Suspending) {
            this._state = RenderingSchedulerState.Suspended;
            this._recentInvokeTime = [];
            this._workerThreshold = RenderingScheduler.InitialWorkerThreshold;
            return;
        }

        this._schedule();
    }

    private _schedule() {
        if (this._handlerSet == 0) {
            Fundamental.BrowserDetector.requestAnimationFrame(() => {
                this._handlerSet--;
                this._doWork();
            });

            this._handlerSet++;
        }
    }
}

