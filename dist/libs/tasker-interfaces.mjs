export class Controller {
    _interrupted = false;
    _interruptConfirm = undefined;
    _signalled = false;
    _signaller = undefined;
    async waitSignal() {
        if (this._signalled || this._interrupted) {
            this._signalled = false;
            return;
        }
        if (this._signaller)
            throw Error("Already waiting for a signal");
        const promise = new Promise((resolve) => { this._signaller = resolve; });
        await promise;
        this._signalled = false;
    }
    signal() {
        if (this._signaller)
            this._signaller();
        this._signalled = true;
        this._signaller = undefined;
    }
    get interrupted() {
        return this._interrupted;
    }
    async interrupt() {
        if (this._signaller)
            this._signaller();
        this._interrupted = true;
        this._signalled = true;
        this._signaller = undefined;
        const promise = new Promise((resolve) => { this._interruptConfirm = resolve; });
        await promise;
    }
    confirmInterrupt() {
        this._interruptConfirm();
        this._interruptConfirm = undefined;
    }
}
