// metrc.error.js
// (c) 2012-2023 Metrc, LLC.

// requires - metrc.js

(function () {
    // cannot use strict so we can call caller callee, but as its support from browsers is shrinking all the time maybe we should just remove that
    const bufferCount = 50,
        bufferHoldMaxMinutes = 10,
        maxStacktraceSize = 50;

    let errorBuffer = [],
        timeout = null,
        wrappedErrorCallback = window.onerror,
        saneBrowser = false;

    try {
        throw new Error('test');
    }
    catch (e) {
        saneBrowser = !!(e && e.stack);
    }

    let handleTimeout = function () {
        if (timeout) {
            window.clearTimeout(timeout);
        }

        timeout = window.setTimeout(handleRemote, bufferHoldMaxMinutes * 60000);
    };

    let enqueueError = function (error) {
        error.Timestamp = error.Timestamp || Date.now();
        error.Url = error.Url || window.location.href;
        error.Authenticated = error.Authenticated || metrc.authenticated || false;

        errorBuffer.push(error);
        if (errorBuffer.length > bufferCount) {
            handleRemote();
        }

        if (errorBuffer.length > 0) {
            handleTimeout();
        }
    };

    window.onerror = function (event, source, lineno, colno, error) {
        let stacktrace;
        if (error && error.stack) {
            stacktrace = error.stack;
        }
        else if (saneBrowser) {
            try {
                throw new Error('test');
            }
            catch (e) {
                stacktrace = e.stack;
            }
        }
        else {
            let stacktraceParts = [];
            try {
                let topStack = arguments.callee;
                do {
                    try {
                        let functionName = topStack.toString();
                        functionName = functionName.split('\n')[0];
                        stacktraceParts.push(functionName);
                        topStack = topStack.caller;
                    }
                    catch {
                        break;
                    }
                }
                while (topStack && stacktraceParts.length < maxStacktraceSize);
            }
            catch {}
            stacktrace = stacktraceParts.join('\n');
        }
        enqueueError({
            Location: source + ':' + lineno + ':' + colno,
            Stacktrace: stacktrace,
            Errored: true,
            Message: event.toString()
        });

        if (wrappedErrorCallback) {
            wrappedErrorCallback.apply(this, arguments);
        }
    };

    window.addEventListener('unhandledrejection', function (e) {
        let stacktrace;
        if (saneBrowser) {
            try {
                throw new Error('test');
            }
            catch (e) {
                stacktrace = e.stack;
            }
        }
        else {
            let stacktraceParts = [];
            let topStack;
            try {
                topStack = arguments.callee;
                do {
                    try {
                        let functionName = topStack.toString();
                        functionName = functionName.split('\n')[0];
                        stacktraceParts.push(functionName);
                        topStack = topStack.caller;
                    }
                    catch {
                        break;
                    }
                }
                while (topStack && stacktraceParts.length < maxStacktraceSize);
            }
            catch {}

            stacktrace = stacktraceParts.join('\n');
        }

        enqueueError({
            Errored: true,
            Message: e.reason ? JSON.stringify(e.reason) : null,
            Stacktrace: stacktrace,
        });
    });

    window.addEventListener('beforeunload', function () {
        while (errorBuffer.length > 0) {
            handleRemote();
        }
    });

    let handleRemote = function () {
        let data = [];
        for (let i = 0; i < bufferCount; i++) {
            if (i >= errorBuffer.length) {
                break;
            }

            data.push(errorBuffer.shift());
        }

        if (data.length === 0) {
            return;
        }

        const url = '/api/system/report-error';

        metrc.submitJson({
            url: url,
            data: data,
            error: function () {
                for (let i = 0; i < data.length; i++) {
                    let error = data.shift();
                    let errorUrl = '';

                    errorUrl += error.Url ? '&u=' + encodeURIComponent(error.Url) : '';
                    errorUrl += error.Errored ? '&e=1' : '';
                    errorUrl += error.Location ? '&l=' + encodeURIComponent(error.Location) : '';
                    errorUrl += error.Timestamp ? '&t=' + encodeURIComponent(error.Timestamp) : '';
                    errorUrl += error.Message ? '&m=' + encodeURIComponent(error.Message) : '';

                    errorUrl = url + (errorUrl ? '?' + errorUrl.substring(1) : '');

                    if (errorUrl === url) {
                        return;
                    }

                    metrc.submitData({
                        url: errorUrl,
                        method: 'GET',
                        error: function () {},
                        useSpinner: false
                    });
                }
            },
            useSpinner: false
        });
    };


    metrc.reportIssue = metrc.reportIssue || function (url, timestamp, errored, location, message, stacktrace) {
        if (stacktrace == null) {
            if (saneBrowser) {
                try {
                    throw new Error('test');
                }
                catch (e) {
                    stacktrace = e.stack;
                }
            }
            else {
                let stacktraceParts = [];
                let topStack;
                try {
                    topStack = arguments.callee;
                    do {
                        try {
                            let functionName = topStack.toString();
                            functionName = functionName.split('\n')[0];
                            stacktraceParts.push(functionName);
                            topStack = topStack.caller;
                        }
                        catch {
                            break;
                        }
                    }
                    while (topStack && stacktraceParts.length < maxStacktraceSize);
                }
                catch {}

                stacktrace = stacktraceParts.join('\n');
            }
        }

        enqueueError({
            Url: url,
            Timestamp: timestamp,
            Errored: errored || false,
            Location: location,
            Message: message,
            Stacktrace: stacktrace,
        });
    };
})();