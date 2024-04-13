// metrc.js
// (c) 2012-2021 Metrc, LLC.

// requires - jQuery.js, jQuery.validationEngine.js, Spin.js

(function () {
    'use strict';


    let root = window,
        metrc = root.metrc = root.metrc || {};
    metrc.$ = metrc.$ || root.jQuery;


    // ==================================================
    // readCookie : reads the specified cookie from the document
    // ==================================================

    metrc.readCookie = metrc.readCookie || function (name, useCache) {
        if (typeof useCache === 'undefined' || useCache === null) useCache = true;
        if (metrc.cookies && useCache) return metrc.cookies[name];

        metrc.cookies = {};
        let docCookies = document.cookie.split('; ');

        for (let i = docCookies.length - 1; i >= 0; i--) {
            let cookieData = docCookies[i].split('=');
            metrc.cookies[cookieData[0]] = cookieData[1];
        }

        return metrc.cookies[name];
    };


    // ==================================================
    // replaceClass : TODO Description
    // --------------------------------------------------
    //  - oldClass: "Old" selector that will be used to find elements
    //  - newClass: Selector that will replace the newSelector
    // ==================================================

    metrc.replaceClass = metrc.replaceClass || function (oldClass, newClass) {
        return metrc.$('.' + oldClass)
            .removeClass(oldClass)
            .addClass(newClass);
    };


    // ==================================================
    // singleSelectCheckboxes : Ensures that only one checkbox can be selected among siblings
    // --------------------------------------------------
    //  - levelsUp: How many parent levels to backtrack to group siblings
    // ==================================================

    metrc.singleSelectCheckboxes = metrc.singleSelectCheckboxes || function (levelsUp, checkboxSelector) {
        if (typeof levelsUp !== 'number' || levelsUp === null) levelsUp = 1;
        if (!checkboxSelector) checkboxSelector = '.js-singleselect-checkbox';

        metrc.$(checkboxSelector + ':not(.js-singleselect-checkbox-active)').each(function () {
            let $this = metrc.$(this),
                $searchTarget = $this.parent();
            // start at "1" because we always start checking one level up
            for (let i = 1; i < levelsUp; i++) {
                let $newTarget = $searchTarget.parent();
                if ($newTarget.length !== 0) {
                    $searchTarget = $newTarget;
                }
            }

            let $targetCheckboxes;
            if (this.classList.contains('js-multiselectgroup-checkbox')) {
                $targetCheckboxes = $searchTarget.find(checkboxSelector + ':not(.js-multiselectgroup-checkbox)');
            } else {
                $targetCheckboxes = $searchTarget.find(checkboxSelector);
            }

            $this
                .addClass('js-singleselect-checkbox-active')
                .change(function () {
                    if (!this.checked) return;
                    $targetCheckboxes.not(this).filter(':checked').prop('checked', false);
                });
        });
    };


    // ==================================================
    // getRecursiveProperty : Recursively finds a property's value
    // ==================================================

    metrc.getRecursiveProperty = metrc.getRecursiveProperty || function (obj, properties) {
        let props = properties.split('.'),
            prop,
            result = null;

        for (let i = 0, icnt = props.length; i < icnt; i++) {
            prop = props[i];
            if (typeof obj[prop] !== 'undefined') {
                result = obj = obj[prop];
            } else {
                break;
            }
        }

        return result;
    };


    // ==================================================
    // setRecursiveProperty : Recursively finds a property and sets its value (or calls the specified function)
    // --------------------------------------------------
    // Description:
    //     If one of the properties specified is an array, the array will be traversed and its elements'
    //     properties will be recursively set (or the function called).
    // ==================================================

    metrc.setRecursiveProperty = metrc.setRecursiveProperty || function (obj, properties, valueOrFn) {
        let props = properties.split('.'),
            prop;

        for (let i = 0, icnt = props.length - 1; i <= icnt; i++) {
            prop = props[i];
            if (i === icnt) {
                if (typeof valueOrFn === 'function') {
                    let currentValue = obj[prop];
                    obj[prop] = valueOrFn(currentValue);
                } else {
                    obj[prop] = valueOrFn;
                }
            } else {
                obj = obj[prop];
                if (typeof obj === 'undefined') break;

                if (obj instanceof Array) {
                    let remainingProperties = props.slice(i + 1).join('.');
                    for (let x = 0, xcnt = obj.length; x < xcnt; x++) {
                        metrc.setRecursiveProperty(obj[x], remainingProperties, valueOrFn);
                    }
                    break;
                }
            }
        }
    };


    // ==================================================
    // setAttributeField : Look for objects with specify attr and sets a new attr + value
    // --------------------------------------------------
    // - find: Attribute name to look objects for.
    // - attributeName: New attribute to be inserted.
    // - attributeValue: New attribute value to be inserted.
    // ==================================================

    metrc.setAttributeField = metrc.setAttribute || function (find, attributeName, attributeValue) {
        let objects = $(`[${find}]`);
        if (objects.length != 0) {
            objects.each(function () {
                let object = $(this);
                if (!object.attr(attributeName)) {
                    object.attr(attributeName, attributeValue);
                }
            });
        }
    }


    // ==================================================
    // makeLookup : Generates a lookup object from an array, with the idField (parameter) as the lookup key
    // ==================================================

    metrc.makeLookup = metrc.makeLookup || function (entities, idField) {
        if (!entities || !entities.length) return {};

        let result = {},
            entity;

        for (let i = 0, icnt = entities.length; i < icnt; i++) {
            entity = entities[i];
            result[entity[idField]] = entity;
        }

        return result;
    };


    // ==================================================
    // startSpinner : Shows a "loading" spinner
    // ==================================================

    metrc.startSpinner = metrc.startSpinner || function () {
        let $body = metrc.$(document.body);

        // try/catch in case there is a browser that doesn't support blur(). Remove try/catch after 2018-01-01.
        // JN: Commented out try/catch on 2018-08-21. Restore if problems found.
        //try {
        document.activeElement.blur();
        //} catch (e) { }

        if ($body.children('#spinnerBackground').length === 0) {
            const spinnerHtmlBlock = `<div id="spinnerBackground">
                    <div class="loader">
                        <div class="loadingBall"></div>
                        <div class="loadingBall"></div>
                        <div class="loadingBall"></div>
                        <div class="loadingBall"></div>
                        <div class="loadingBall"></div>
                    </div>
                </div>`;
            metrc.$(spinnerHtmlBlock)
                .css({
                    backgroundColor: '#000',
                    position: 'fixed',
                    top: 0,
                    bottom: 0,
                    left: 0,
                    right: 0,
                    opacity: 0.6,
                    zIndex: 20000,
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                })
                .appendTo($body);
            return true;
        } else {
            return false;
        }
    };


    // ==================================================
    // stopSpinner : Stops the spinner
    // ==================================================

    metrc.stopSpinner = metrc.stopSpinner || function () {
        let $body = metrc.$(document.body),
            $spinnerBackground = $body.children('#spinnerBackground');

        if ($spinnerBackground.length !== 0) {
            $spinnerBackground.remove();
        }
    };


    // ==================================================
    // stopLoadingMask : Stops the grids loading mask
    // ==================================================

    metrc.stopLoadingMask = metrc.stopLoadingMask || function () {
        let loadingMask = metrc.$('div.k-loading-mask');

        if (loadingMask.length !== 0) {
            loadingMask.remove();
        }
    };


    // ==================================================
    // validationEngine: Sets up the Form Validation Engine with some default values
    // ==================================================

    metrc.validationEngine = metrc.validationEngine || function ($form) {
        if (!metrc.$.validationEngineLanguage.allRules.notPoBox) {
            metrc.$.validationEngineLanguage.allRules.notPoBox = {
                func: function (field) {
                    // RegEx exists in code-behind, please update that one if changing this one
                    let pattern = new RegExp(/\b[p]*(ost)*\.*\s*[o|0]*(ffice)*\.*\s*b[o|0]x[\b\s\d_]+/i);
                    let match = pattern.exec(field.val());
                    return match === null;
                },
                alertText: '* P.O. Box addresses are not permitted'
            };
        }

        metrc.$.validationEngineLanguage.allRules.future.alertText = "* Date must be after "

        $form.validationEngine({
            autoHidePrompt: true,
            autoHideDelay: 3000,
            promptPosition: "topLeft"
        });
    };


    // ==================================================
    // serverErrors : Opens an error alert with useful error information
    // ==================================================

    metrc.serverErrors = metrc.serverErrors || function (errorResponse) {
        let alertTemplate =
                '<div class="alert alert-error">' +
                    '<a class="close" data-dismiss="alert">×</a>' +
                    '<p>{{message}} {{exceptionTypeTemplate}}</p>' +
                    '{{exceptionMessageTemplate}}' +
                    '{{stackTraceTemplate}}' +
                '</div>',
            exceptionTypeTemplate =
                '({{exceptionType}})',
            exceptionMessageTemplate =
                '<p>{{exceptionMessage}}</p>',
            stackTraceTemplate =
                '<ul class="js-panelbar-new">' +
                    '<li>' +
                        '<span class="muted"><small>(view details)</small></span>' +
                        '<div><pre style="max-height: 400px; overflow-y: scroll;">{{stackTrace}}</pre></div>' +
                    '</li>' +
                '</ul>',

            message = typeof errorResponse === 'string' ? errorResponse : errorResponse.Message || errorResponse.responseText,
            exceptionType = errorResponse.ExceptionType || errorResponse.ClassName || null,
            exceptionMessage = errorResponse.ExceptionMessage || null,
            stackTrace = errorResponse.StackTrace || errorResponse.RemoteStackTraceString || errorResponse.StackTraceString || null,

            result = alertTemplate
                .replace('{{message}}', message || 'An error has occurred (' + (new Date()).toString() + ')')
                .replace('{{exceptionTypeTemplate}}', exceptionType ? exceptionTypeTemplate.replace('{{exceptionType}}', exceptionType) : '')
                .replace('{{exceptionMessageTemplate}}', exceptionMessage ? exceptionMessageTemplate.replace('{{exceptionMessage}}', exceptionMessage) : '')
                .replace('{{stackTraceTemplate}}', stackTrace ? stackTraceTemplate.replace('{{stackTrace}}', stackTrace) : '');

        metrc.$('#user-alerts').append(result);
        metrc.$('.js-panelbar-new')
            .removeClass('js-panelbar-new')
            .addClass('js-panelbar')
            .kendoPanelBar();
    };


    // ==================================================
    // messageAlerts : Opens an alert with a message, and optionally, a type of alert
    // ==================================================

    metrc.messageAlerts = metrc.messageAlerts || function (message, type) {
        if (!type) type = 'info';

        let template =
            '<div class="alert alert-{{type}}">' +
                '<a class="close" data-dismiss="alert">×</a>' +
                '<p>{{message}}</p>' +
            '</div>';

        let result = template
            .replace('{{type}}', type)
            .replace('{{message}}', message);

        metrc.$('#user-alerts').append(result);
    };


    // ==================================================
    // setNotificationIcon : Sets a default browser notification icon
    // ==================================================

    metrc.setNotificationIcon = metrc.setNotificationIcon || function (uri) {
        metrc.notification = metrc.notification || {};
        metrc.notification.iconUri = uri;
    };


    // ==================================================
    // notificationAlert : Opens a browser notification with a title and a message
    // --------------------------------------------------
    // Options:
    //  - onclick: callback function called when the user clicks on the notification
    //  - messageAlertsAsFallback: indicates whether to use built-in a;ert banners as fallback (default: false)
    // ==================================================

    metrc.notificationAlert = metrc.notificationAlert || function (title, message, options) {
        options = options || {};
        if (typeof options.messageAlertsAsFallback === 'undefined') options.messageAlertsAsFallback = false;

        let displayNotification = function (useBrowserNotification) {
            if (useBrowserNotification) {
                let notification = new Notification(title, {
                    icon: metrc.notification.iconUri,
                    body: message
                });
                if (typeof options.onclick === 'function') {
                    notification.onclick = options.onclick;
                }
            } else if (options.messageAlertsAsFallback) {
                metrc.messageAlerts(message);
            }
        };

        if (!("Notification" in window)) {
            displayNotification(false);
        } else if (Notification.permission === "granted") {
            displayNotification(true);
        } else if (Notification.permission !== "denied") {
            Notification.requestPermission(function (permission) {
                if (permission === "granted") {
                    displayNotification(true);
                }
            });
        } else {
            displayNotification(false);
        }
    };


    // ==================================================
    // monitorUserSession : Continuously monitors the current user's session and alerts when it is about to expire
    // ==================================================

    metrc.monitorUserSession = metrc.monitorUserSession || function (timeoutCookieName, sessionDuration, noopUrl, logOutUrl) {
        let $sessionTimeoutAlert = metrc.$('#session_timeout_alert'),
            $sessionTimeleft = metrc.$('#session_timeleft'),
            $extendSession = metrc.$('#extend_session'),
            $logoutSession = metrc.$('#logout_session'),
            $sessionTimeoutBar = metrc.$('#session_timeout_bar'),
            extendingSession = false,
            performingLogOut = false,

            hideSessionTimeoutAlert = function () { $sessionTimeoutAlert.hide(300); },
            extendSession = function () {
                metrc.submitData({
                    url: noopUrl,
                    success: function () { extendingSession = false; },
                    error: function (response) { extendingSession = false; metrc.errorResponseHandler(response); },
                    useSpinner: false
                });
                extendingSession = true;
            },
            performLogOut = function () {
                if (performingLogOut) return;
                metrc.startSpinner();
                window.location.href = logOutUrl;
                performingLogOut = true;
            };

        $extendSession.click(function () {
            extendSession();
            hideSessionTimeoutAlert();
        });

        $logoutSession.click(function () {
            performLogOut();
            hideSessionTimeoutAlert();
        });

        setInterval(function () {
            let utcNow = moment.utc(),
                utcSessionTimeout = moment.utc(metrc.readCookie(timeoutCookieName, false)),
                timeLeftMs = utcSessionTimeout.diff(utcNow),
                sessionPercent = 100 - Math.max(timeLeftMs * 100 / sessionDuration, 0),
                sessionTimedOut = sessionPercent > 99;

            // User has timed out - log off
            if (sessionTimedOut) performLogOut();

            if (performingLogOut || sessionTimedOut) {
                if ($sessionTimeoutAlert.data('dismissed')) $sessionTimeoutAlert.removeData('dismissed');
                if ($sessionTimeoutAlert.is(':visible')) hideSessionTimeoutAlert();
                return; // return, we don't care about updating the UI anymore
            } else if (extendingSession) {
                if ($sessionTimeoutAlert.is(':visible')) hideSessionTimeoutAlert();
            } else if (timeLeftMs < 180000 && !$sessionTimeoutAlert.data('dismissed')) {
                // Less than three minutes left
                $sessionTimeleft.text(utcSessionTimeout.fromNow(true));
                if (!$sessionTimeoutAlert.is(':visible')) {
                    $sessionTimeoutAlert.show(500);
                }
            }

            if (!window.lastSessionPercent) window.lastSessionPercent = 0;
            if (window.lastSessionPercent < 100) {
                window.lastSessionPercent = sessionPercent;
                $sessionTimeoutBar
                    .css('background-color',
                        sessionPercent < 50 ? '#0E0' :
                            sessionPercent < 75 ? '#E90' :
                                '#E00')
                    .width(sessionPercent.toString() + '%');
            }
        }, 2000);
    };


    // ==================================================
    // updateableTimers : Sets off a timer that updates all elements with a data-datetime attribute
    // ==================================================

    metrc.updateableTimers = metrc.updateableTimers || function () {
        metrc.$('.js-updateable-timestamp').each(function () {
            let $this = metrc.$(this),
                datetime = $this.data('datetime');
            if (datetime) {
                $this.text(metrc.formatTimeFromNow(datetime));
            }
        });

        if (window.updateableTimersTimeout) {
            clearTimeout(window.updateableTimersTimeout);
        }
        window.updateableTimersTimeout = setTimeout(metrc.updateableTimers, 10000);
    };


    // ==================================================
    // initializeDoNotShow : handles "do not show" dialogs
    // ==================================================

    metrc.initializeDoNotShow = metrc.initializeDoNotShow || function (username, facility) {
        let usernameAndFacility = (username + ':' + facility).toLowerCase();

        metrc.$('[data-donotshow-cookiename]').each(function () {
            let $this = metrc.$(this),
                cookieName = $this.data('donotshowCookiename');
            $this.click(function () {
                let cookieValue = metrc.readCookie(cookieName, false) || '';
                if (cookieValue.indexOf(usernameAndFacility) === -1) {
                    if (cookieValue) cookieValue = cookieValue + '|' + usernameAndFacility;
                    else cookieValue = usernameAndFacility;
                    document.cookie = cookieName + '=' + cookieValue + ';path=/;max-age=86400';
                }
            });
        });
    };


    // ==================================================
    // errorResponseHandler : TODO Description
    // ==================================================

    metrc.errorResponseHandler = metrc.errorResponseHandler || function (response) {
        let errorResponse = response.responseJSON || response;

        window.log(errorResponse);
        switch (response.status) {
            case 0:
                // If the error is 0, ignore it...
                break;
            case 400:
            case 500:
                metrc.serverErrors(errorResponse);
                break;
            case 401:
                // If the session has expired, reload the window and the user will be redirected to the log-in page
                location.reload();
                break;
            case 503:
                metrc.serverErrors(errorResponse);
                metrc.stopLoadingMask();
                break;
            default:
                metrc.messageAlerts(response.statusText, 'error');
        }
    };


    // ==================================================
    // submitData : Helper for submitting data to the server
    // --------------------------------------------------
    // Options:
    //  - url: the URL
    //  - method: HTTP method to use (default: 'POST')
    //  - data: data to pass on along with the request
    //  - dataType: data type name
    //  - contentType: content type name of data going across
    //  - success: event handler to call on success
    //  - error: event handler to call on error
    //  - always: event handler to always call, whether successful or not
    //  - useSpinner: boolean whether to use the UI spinner (default: true)
    // ==================================================

    metrc.submitData = metrc.submitData || function (options) {
        options = metrc.$.extend(true, {
            url: '',
            method: 'POST',
            success: function () { },
            error: metrc.errorResponseHandler,
            useSpinner: true
        }, options || {});


        let usingSpinner = options.useSpinner ? metrc.startSpinner() : false;
        let longRunDetectors = [];
        if (usingSpinner) {
            longRunDetectors.push(window.setTimeout(function () {
                metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 5 minutes');
            }, 300000));
            longRunDetectors.push(window.setTimeout(function () {
                metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 3 minutes');
            }, 180000));
            longRunDetectors.push(window.setTimeout(function () {
                metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 1 minute');
            }, 60000));
        }
        return metrc.$.ajax({
            contentType: options.contentType,
            data: options.data,
            dataType: options.dataType,
            url: options.url,
            type: options.method
        })
        .done(options.success)
        .fail(options.error)
        .always(function () {
            for (let i = 0; i < longRunDetectors.length; i++) {
                window.clearTimeout(longRunDetectors[i]);
            }
            if (typeof options.always === 'function') {
                try {
                    options.always();
                }
                catch (e) {
                    metrc.log('SubmitData always callback failed: ' + e);
                }
            }
            if (usingSpinner) {
                metrc.stopSpinner();
            }
        });
    };


    // ==================================================
    // submitJson : Helper for submitting JSON to the server
    // --------------------------------------------------
    // Options: same options as submitData, except the following:
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - dataType: set to "json"
    //  - contentType: set to "application/json"
    // ==================================================

    metrc.submitJson = metrc.submitJson || function (options) {
        options = metrc.$.extend(true, options || {}, {
            contentType: 'application/json',
            dataType: 'json'
        });
        if (typeof options.data !== 'undefined' && options.data !== null && typeof options.data !== 'string') {
            options.data = JSON.stringify(options.data);
        }

        metrc.submitData(options);
    };


    // ==================================================
    // requestPackagesForLookup : Helper for requesting packages to populate lookups
    // --------------------------------------------------
    // Options:
    //  - url: endpoint to retrieve the packages
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - $scope: angularjs scope
    //  - cssClass: class of components to update
    // ==================================================

    metrc.requestPackagesForLookup = metrc.requestPackagesForLookup || function (options) {
        metrc.submitData({
            url: options.url,
            data: options.data,
            success: function (data) {
                options.$scope.preload.repeaterData.Packages = data;
                options.$scope.preload.repeaterData.PackagesLookup = metrc.makeLookup(options.$scope.preload.repeaterData.Packages, 'Id');
                options.$scope.preload.packagesFinishedLoading = true;

                options.cssClass.forEach(function (className) {
                    $('.js-' + className)
                        .removeClass('js-' + className)
                        .addClass('js-' + className + '-new');
                });

                options.$scope.$digest();
                options.$scope.preload.methods.createNewControls();
            },
            useSpinner: true
        });
    };


    // ==================================================
    // requestPackagesForLookupServer : Helper for requesting packages from the server to populate lookups
    // --------------------------------------------------
    // Options:
    //  - url: endpoint to retrieve the packages
    //  - alwaysLookupServer: set true to not use "preload.repeaterData.Packages" as cache
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - $scope: angularjs scope
    //  - cssClass: class of components to update
    // ==================================================

    metrc.requestPackagesForLookupServer = metrc.requestPackagesForLookupServer || function (options) {
        let filterIndex,
            value = options.data.request.Filter.Filters.find((filter, index) => {
                if (filter.Field == 'Label') {
                    filterIndex = index;
                    return filter.Value;
                }
            }).Value.toUpperCase(),
            take = options.data.request.Take ?? 10,
            standardLength = 24,
            pattern = new RegExp(`^[0-9A-F]{1,${standardLength}}$`, 'g'),
            overrideOperator,
            result = [];

        if (!pattern.test(value)) {
            return new Promise((resolve) => {
                return resolve(result);
            });
        }

        if (value.startsWith('1A4')) {
            overrideOperator = 'startswith';
        }

        if (value.length == standardLength) {
            overrideOperator = 'eq';
        }

        if (overrideOperator) {
            options.data.request.Filter.Filters[filterIndex].Operator = overrideOperator
        }

        if (!options.alwaysLookupServer
            && options.$scope.preload.repeaterData.Packages.length >= take
            && options.$scope.preload.repeaterData.Packages.some(e => e.Label.includes(value))) {

            result = options.$scope.preload.repeaterData.Packages.filter(e => e.Label.includes(value)).slice(0, take);
            return new Promise((resolve) => {
                return resolve(result);
            });
        }
        else {
            return metrc.submitData({
                url: options.url,
                data: options.data,
                success: function (data) {
                    options.$scope.preload.repeaterData.Packages = metrc.updateObjectsArray(options.$scope.preload.repeaterData.Packages, data.Data ?? data, 'Id');
                    options.$scope.preload.repeaterData.PackagesLookup = metrc.makeLookup(options.$scope.preload.repeaterData.Packages, 'Id');

                    if (options.cssClass && options.cssClass.length != 0) {
                        options.cssClass.forEach(function (className) {
                            $('.js-' + className)
                                .removeClass('js-' + className)
                                .addClass('js-' + className + '-new');
                        });
                    }

                    options.$scope.$digest();
                },
                useSpinner: false
            }).then((result) => {
                return result.Data ?? result;
            });
        }
    };


    // ==================================================
    // requestPackagesForQuickEntryMode : Helper for requesting packages from the server to populate lookups via an scan or quick entry
    // --------------------------------------------------
    // Options:
    //  - url: endpoint to retrieve the packages
    //  - alwaysLookupServer: set true to not use "preload.repeaterData.Packages" as cache
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - $scope: angularjs scope
    //  - cssClass: class of components to update
    //  - input: input from where the function it is coming.
    //  - childObject: model object that holds the value scanned and array to work with
    //  - childArray: array to work with
    //  - keepEmptyPackageCount: Amount of empty packages lines to keep when toggles ON/OFF
    //  - idField: array of id fields format [idField, lineField]. Ex.: ['Id', 'PackageId']
    // ==================================================

    metrc.requestPackagesForQuickEntryMode = metrc.requestPackagesForQuickEntryMode || function (options) {
        let childObject = options.input[options.childObject],
            childArray = childObject[options.childArray],
            value = options.data.request.Filter.Filters.find(v => v.Field == 'Label').Value.toUpperCase(),
            keepEmptyPackageCount = options.keepEmptyPackageCount ?? 1,
            idField = options.idField instanceof Array ? options.idField[0] : 'Id',
            lineField = options.idField instanceof Array ? options.idField[1] : idField,
            errorMessage = {
                Message: 'Package Failed',
                ExceptionMessage: `Package: <b>${value}</b> has been already entered.`,
            };

        childObject.packageQuickEntryValue = '';
        options.$scope.$digest();

        if (childArray.find(e => e[lineField] && e.Label === value)) {
            metrc.serverErrors(errorMessage);
        }
        else {
            options.$scope.quickEntryRequestCount++;
            childObject.quickEntryPendingRequest.push(value);
            return metrc.requestPackagesForLookupServer(options).then((results) => {
                if (results.length == 0) {
                    errorMessage.ExceptionMessage = `Package: <b>${value}</b> could not be found.`;
                    metrc.serverErrors(errorMessage);
                }
                else if (childArray.find(e => e[lineField] && e.Label === value)) {
                    metrc.serverErrors(errorMessage);
                }
                else {
                    if (childArray.length === keepEmptyPackageCount && childArray.every(p => !p[idField])) {
                        childArray.length = 0;
                    }
                    let data = {};
                    data[lineField] = results[0][idField];
                    data['Label'] = results[0].Label;
                    childArray.push(data);
                }

                options.$scope.quickEntryRequestCount--;
                childObject.quickEntryPendingRequest.splice(childObject.quickEntryPendingRequest.indexOf(value), 1)
            });
        }
    };


    // ==================================================
    // updateObjectsArray : Helper to return an updated array from another, matched byField parameter
    // --------------------------------------------------
    // Options:
    //  - originArray: Original array
    //  - updatedArray: Array that might contains updated objects
    //  - byField: Field used to update existing objects
    // ==================================================

    metrc.updateObjectsArray = metrc.updateObjectsArray || function (originArray, updatedArray, byField) {
        if (!(originArray instanceof Array) || !(updatedArray instanceof Array) || typeof byField !== 'string') {
            return;
        }
        else {
            return Array.from([...originArray, ...updatedArray]
                .reduce((m, o) => m.set(o[byField], o), new Map)
                .values());
        }
    }


    // ==================================================
    // requestFacilitiesForLookup : Helper for requesting facilities to populate lookups
    // --------------------------------------------------
    // Options:
    //  - url: endpoint to retrieve the facilities
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - $scope: angularjs scope
    //  - cssClass: class of components to update
    // ==================================================

    metrc.requestFacilitiesForLookup = metrc.requestFacilitiesForLookup || function (options, runDigest = true) {
        metrc.submitData({
            url: options.url,
            success: function (data) {
                if (options.cssClass && Array.isArray(options.cssClass)) {
                    options.cssClass.forEach(function (className) {
                        $('.js-' + className)
                            .removeClass('js-' + className)
                            .addClass('js-' + className + '-new');
                    });
                }
                if (options.assignDataCallback && typeof options.assignDataCallback === 'function') {
                    options.assignDataCallback(data);
                }
                if (runDigest) {
                    options.$scope.$digest();
                    options.$scope.preload.methods.createNewControls();
                }
            },
            useSpinner: false
        });
    };


    // ==================================================
    // requestDataForLookupServer : Helper for requesting data from the server to populate lookups
    // --------------------------------------------------
    // Options:
    //  - url: endpoint to retrieve the data from
    //  - alwaysLookupServer: set true to not use "options.cacheObject" as cache
    //  - data: anything in "data" will be stringified (JSON.stringify)
    //  - $scope: angularjs scope
    //  - cssClass: class of components to update
    //  - cacheObject: Javascript object that will have all data cached
    //  - idField: Id field to work with
    //  - applyPackageLabelLogic: true | false to apply pre-defined package label rules
    //  - lookupObject: object that will be converted using metrc.makeLookup function
    // ==================================================

    metrc.requestDataForLookupServer = metrc.requestDataForLookupServer || function (options) {
        if (!!options.allowsTagScanner && isTagValueRepeated(options)) {
            return;
        }

        let cacheObject = metrc.getRecursiveProperty(options.$scope, options.cacheObject),
            idField = options.idField || 'Id',
            resultFromCache = [],
            take = options.data.request.Take ?? 10;

        if (options.applyPackageLabelLogic) {
            let filterIndex,
                value = options.data.request.Filter.Filters.find((filter, index) => {
                    if (filter.Field == 'Label') {
                        filterIndex = index;
                        return filter.Value;
                    }
                }).Value.toUpperCase(),
                packageStandardLength = 24,
                packagePattern = new RegExp(`^[0-9A-F]{1,${packageStandardLength}}$`, 'g'),
                overrideOperator;

            if (!packagePattern.test(value)) {
                return new Promise((resolve) => {
                    return resolve(resultFromCache);
                });
            }

            if (value.startsWith('1A4')) {
                overrideOperator = 'startswith';
            }

            if (value.length == packageStandardLength) {
                overrideOperator = 'eq';
            }

            if (overrideOperator) {
                options.data.request.Filter.Filters[filterIndex].Operator = overrideOperator
            }
        }

        if (!options.alwaysLookupServer && cacheObject.length != 0) {
            options.data.request.Filter.Filters.forEach(f => {
                let value = cacheObject.filter(object => metrc.getRecursiveProperty(object, f.Field).toLowerCase().includes(f.Value.toLowerCase()));
                if (value && value.length > 0) {
                    resultFromCache = metrc.updateObjectsArray(resultFromCache, value, idField);
                }
            });
        }

        if (cacheObject.length >= take && resultFromCache.length >= take) {
            return new Promise((resolve) => {
                return resolve(resultFromCache.slice(0, take));
            });
        }
        else {
            return metrc.submitData({
                url: options.url,
                data: options.data,
                success: function (data) {
                    metrc.setRecursiveProperty(options.$scope, options.cacheObject,
                        metrc.updateObjectsArray(cacheObject, data.Data, idField));

                    if (options.lookupObject) {
                        metrc.setRecursiveProperty(
                            options.$scope,
                            options.lookupObject,
                            metrc.makeLookup(metrc.getRecursiveProperty(options.$scope, options.cacheObject), idField),
                            idField);
                    }

                    if (options.cssClass && Array.isArray(options.cssClass)) {
                        options.cssClass.forEach(function (className) {
                            $('.js-' + className)
                                .removeClass('js-' + className)
                                .addClass('js-' + className + '-new');
                        });
                    }

                    if (!!options.allowsTagScanner) {
                        insertTagIntoScope(options, data);
                    }

                    options.$scope.$digest();
                },
                useSpinner: false
            }).then((result) => {
                return result.Data ?? result;
            });
        }
    }

    function isTagValueRepeated(options) {
        if (options.allowsTagScanner?.line !== null) {
            const { request: { Filter: { Filters } } } = options.data;
            const index = options.$scope.repeaterLines.findIndex(line => line.Label === Filters[0]?.Value);
            if (index >= 0) {
                alert(`${Filters[0]?.Value} is already selected on line # ${index + 1}`);
                return true;
            }
        }
        return false;
    }

    function insertTagIntoScope(options, data) {
        const { line, ngModel } = options.allowsTagScanner;
        const { request: { Filter: { Filters } } } = options.data
        if (Array.isArray(Filters) && Filters[0]?.Value?.length === 24 && data?.Data?.length > 0) {
            if (line !== null) {
                options.$scope.repeaterLines[line][ngModel] = data.Data[0].Id;
                options.$scope.repeaterLines[line].Label = data.Data[0].Label;
            } else {
                options.$scope.template[ngModel] = data.Data[0].Id;
                options.$scope.template["Label"] = data.Data[0].Label;
            }
        }
    }
    metrc.applyTemplateTagSequentially = metrc.applyTemplateTagSequentially || function (options) {
        const { ngModel,
            IncludeAllTagsInSequence,
            IsPackage,
            $scope,
            url,
            TagTypeId,
            SubmitForTesting,
            cacheObject
        } = options;

        if ($scope.template[ngModel] != null) {
            metrc.submitData({
                url,
                data: {
                    StartingTagId: $scope.template[ngModel],
                    Count: $scope.repeaterLines.length,
                    TagTypeId: TagTypeId ?? null,
                    IncludeAllTagsInSequence,
                    IsPackage,
                    SubmitForTesting,
                },
                success: function (data) {
                    if (data.TagAmountDifference > 0) {
                        //add this tags to the preload repeater data Tags is not exist
                        data.Tags.forEach(tag => {
                            if (!window.preload.repeaterData[cacheObject].find(winTag => winTag.Id === tag.Id)) {
                                window.preload.repeaterData[cacheObject].push(tag);
                            }
                        });
                        //provide values for corresponding input tag
                        for (let i = 0; i < $scope.repeaterLines.length; i++) {
                            if (!!$scope.repeaterLines[i] && !!data.Tags[i]) {
                                $scope.repeaterLines[i][ngModel] = data.Tags[i].Id;
                                $scope.repeaterLines[i].Label = data.Tags[i].Label;
                            }
                        }
                    } else {
                        //clean the input tags
                        for (let i = 0; i < $scope.repeaterLines.length; i++) {
                                $scope.repeaterLines[i][ngModel] = null;
                                $scope.repeaterLines[i].Label = null;
                        }
                    }
                    $scope.$digest();
                },
                useSpinner: false
            })
        }
    };
    // ==================================================
    // log : Used for debugging messages for developers
    //       If metrc.allowLogging is truthy treat like console.log else nop
    // ==================================================

    metrc.log = metrc.log || function (message) {
        try {
            metrc.reportIssue(null, null, true, 'metrc.log', message);
        }
        catch {}

        if (metrc.allowLogging && message != null) {
            console.log(message);
        }
    };


    // ==================================================
    // $.metrcActivateForm : Sets up validation for a form
    // ==================================================

    metrc.$.fn.metrcActivateForm = metrc.$.fn.metrcActivateForm || function () {
        this.each(function () {
            let $this = metrc.$(this);
            metrc.validationEngine($this);
            $this.submit(function () {
                let validationResult = $this.validationEngine('validate');
                if (!validationResult) {
                    return false;
                }
                // this method causes a full page reload, so we don't worry about stopping the spinner.
                metrc.startSpinner();
                return true;
            });
        });
        return this;
    };


    // ==================================================
    // $.metrcActivateAjaxForm : Sets up validation and AJAX-style submission for a form
    // --------------------------------------------------
    // Options : Options hash passed to $.ajax
    // ==================================================

    metrc.$.fn.metrcActivateAjaxForm = metrc.$.fn.metrcActivateAjaxForm || function (options) {
        // Fail if nothing is selected.
        if (!this.length) {
            window.log('metrcActivateAjaxForm: No element selected.');
            return this;
        }

        let ajaxOptions = metrc.$.extend(true, {
            error: metrc.errorResponseHandler
        }, options);

        this.each(function () {
            let $this = metrc.$(this);
            metrc.validationEngine($this);
            $this.submit(function () {
                // apply any custom options set in the modal.
                if (window.preload &&
                    window.preload.methods &&
                    window.preload.methods.formSubmitOptions) {
                    window.preload.methods.formSubmitOptions(ajaxOptions);
                }

                let validationResult = $this.validationEngine('validate');
                if (validationResult) {
                    $this.metrcAjaxSubmit(ajaxOptions);
                }
                return false;
            });
        });

        return this;
    };


    // ==================================================
    // $.metrcAjaxSubmit : Submits a form via AJAX
    // --------------------------------------------------
    // Options: same options as submitJson, except the following:
    //  - url: if not specified, will be taken from the form's action attribute
    //  - method: if not specified, will be taken from the form's method attribute
    // ==================================================

    metrc.$.fn.metrcAjaxSubmit = metrc.$.fn.metrcAjaxSubmit || function (options) {
        // Fail if nothing is selected.
        if (!this.length) {
            window.log('metrcAjaxSubmit: No element selected.');
            return this;
        }

        let $form = this,

            // Grab the URL from the form element.
            action = $form.attr('action'),
            url = options.url || (typeof action === 'string'
                ? metrc.$.trim(action)
                : window.location.href) || '',
            method = options.method || $form.attr('method') || 'POST',

            // Serialize the form values
            data = $form.serializeObject().model;

        if (options.formDataProcessor) {
            options.formDataProcessor(data);
        }

        let $scope = metrc.ng.getControllerScope($form);
        if (metrc.enableSingleSubmit && (options.enableSingleSubmit == null || !!options.enableSingleSubmit) && data != null &&
            data.length != null && data.length > 1 && $scope != null && $scope.repeaterLines != null && Array.isArray($scope.repeaterLines)) {
            let useToast = metrc.submitToast || false;
            let outgoingRequests = {
                completedCount: 0,
                errorCount: 0,
                inFlight: 0,
                flightPause: false,
            };
            let useSpinner = options.useSpinner == null || options.useSpinner === true;
            let longRunDetectors = [];
            if (useSpinner) {
                useSpinner = metrc.startSpinner();
                if (useSpinner) {
                    longRunDetectors.push(window.setTimeout(function () {
                        metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 5 minutes');
                    }, 300000));
                    longRunDetectors.push(window.setTimeout(function () {
                        metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 3 minutes');
                    }, 180000));
                    longRunDetectors.push(window.setTimeout(function () {
                        metrc.reportIssue(options.url, null, false, 'metrc.submitData', 'Long running spinner detected 1 minute');
                    }, 60000));
                }
            }

            let errorArguments = [];
            let successArguments = [];
            let complete = function (success, id) {
                let args = [...arguments];
                args.shift();
                args.shift();

                let argStore;
                outgoingRequests.completedCount++;
                outgoingRequests.inFlight--;

                if (outgoingRequests.flightPause && submitObjects.length > 0) {
                    outgoingRequests.flightPause = false;
                    doLoop();
                }

                let repeaterIndex = $scope.repeaterLines.findIndex((row) => row.$$hashKey === id);

                if (success) {
                    argStore = successArguments;
                    if (useToast) {
                        metrc.kendo.showNotification('Submitted Row #' + outgoingRequests[id] + ' of ' + (data.length - outgoingRequests.completedCount) + ' Row(s) left.', 'ok');
                    }
                    if (repeaterIndex !== -1) {
                        $scope.removeLine(repeaterIndex, $scope.repeaterLines, false, null, false);
                        $scope.$digest();
                    }
                }
                else {
                    argStore = errorArguments;
                    outgoingRequests.errorCount++;
                    if (options.error === metrc.errorResponseHandler) {
                        options.error(...args);
                    }

                    if (useToast) {
                        metrc.kendo.showNotification('Failed to submit Row #' + outgoingRequests[id] + ' of ' + (data.length - outgoingRequests.completedCount) + ' Row(s) left.', 'fail');
                    }
                }

                for (let i = 0; i < args.length; i++) {
                    let existing = argStore[i],
                        newArg = args[i];
                    if (existing == null) {
                        argStore[i] = newArg;
                    }
                    else if (Array.isArray(existing)) {
                        argStore[i] = existing.concat(newArg);
                    }
                    else if (success && i === 0 && newArg != null && typeof newArg == 'object') {
                        let recurseCount = 0;
                        let mergeRecursive = function (first, second) {
                            let output;
                            if (first == null) {
                                output = second;
                            }
                            else if (Array.isArray(second)) {
                                output = [...second];
                                if (Array.isArray(first)) {
                                    output = [...first, ...output];
                                }
                            }
                            else {
                                let firstType = typeof first;
                                let secondType = typeof second;
                                if (firstType == secondType) {
                                    switch (firstType) {
                                        case 'undefined':
                                        case 'boolean':
                                        case 'number':
                                        case 'bigint':
                                        case 'string':
                                        case 'symbol':
                                        case 'function':
                                            output = second || first;
                                            break;

                                        case 'object':
                                            if (first != null) {
                                                output = {};
                                                let duplicateKeys = new Set([...Object.keys(first), ...Object.keys(second)].filter((val, index, array) => array.indexOf(val) === index && array.lastIndexOf(val) !== index));
                                                for (let key in first) {
                                                    if (!duplicateKeys.has(key)) {
                                                        output[key] = first[key];
                                                    }
                                                    else {
                                                        recurseCount++;
                                                        if (recurseCount < 100) {
                                                            output[key] = mergeRecursive(first[key], second[key]);
                                                        }
                                                        recurseCount--;
                                                    }
                                                }
                                                for (let key in second) {
                                                    if (!duplicateKeys.has(key)) {
                                                        output[key] = second[key];
                                                    }
                                                }
                                            }
                                            else {
                                                output = second;
                                            }
                                            break;
                                    }
                                }
                                else {
                                    output = second;
                                }
                            }

                            return output;
                        }
                        argStore[i] = mergeRecursive(existing, newArg)
                    }
                    else {
                        argStore[i] = metrc.$.extend(true, args[i], existing);
                    }
                }

                if (outgoingRequests.completedCount === data.length) {
                    for (let i = 0; i < longRunDetectors.length; i++) {
                        window.clearTimeout(longRunDetectors[i]);
                    }

                    if (typeof options.always == 'function') {
                        try {
                            options.always();
                        }
                        catch (e) {
                            metrc.log('metrcAjaxSubmit always callback failed: ' + e);
                        }
                    }

                    if (typeof options.success == 'function' && outgoingRequests.errorCount === 0) {
                        try {
                            options.success(...successArguments);
                        }
                        catch (e) {
                            metrc.log('metrcAjaxSubmit success callback failed: ' + e);
                        }
                    }

                    if (typeof options.error == 'function' && outgoingRequests.errorCount > 0 && options.error !== metrc.errorResponseHandler) {
                        try {
                            options.error(...errorArguments);
                        }
                        catch (e) {
                            metrc.log('metrcAjaxSubmit error callback failed: ' + e);
                        }
                    }

                    if (typeof options.refreshDataSources == 'function' && outgoingRequests.errorCount !== outgoingRequests.completedCount &&
                        outgoingRequests.errorCount !== 0) {
                        try {
                            options.refreshDataSources();
                        }
                        catch (e) {
                            metrc.log('metrcAjaxSubmit refresh data sources failed: ' + e);
                        }
                    }

                    if (useSpinner) {
                        metrc.stopSpinner();
                    }
                }
            };

            let submitObjects = [];
            for (let i = 0; i < data.length; i++) {
                let id = $scope.repeaterLines[i].$$hashKey;
                outgoingRequests[id] = i + 1;

                let ajaxOptions = {
                    url: url,
                    type: method,
                    data: [data[i]],
                    useSpinner: false,
                    success: function () {
                        complete(true, id, ...arguments);
                    },
                    error: function () {
                        complete(false, id, ...arguments);
                    },
                };

                submitObjects.push(ajaxOptions);
            }

            let doLoop = () => {
                window.setTimeout(function () {
                    let ajaxOptions = submitObjects.shift();

                    outgoingRequests.inFlight++;
                    metrc.submitJson(ajaxOptions);

                    if (submitObjects.length > 0) {
                        if (outgoingRequests.inFlight < ((metrc.submitMaxParallelism || 10) | 0)) {
                            doLoop();
                        }
                        else {
                            outgoingRequests.flightPause = true;
                        }
                    }
                }, submitObjects.length === data.length ? 0 : (metrc.submitDelay || 10) | 0);
            };
            doLoop();
        }
        else {
            // Build the final options hash.
            let ajaxOptions = metrc.$.extend(true, {
                url: url,
                type: method,
                data: data
            }, options);

            // Finally, submit the data.
            metrc.submitJson(ajaxOptions);
        }
    };
})();