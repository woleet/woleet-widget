'use strict';

(function (root) {

    /**
     * @param [hash]
     * @constructor
     */
    function Widget(hash) {

        // Check parameter
        if (hash && typeof hash !== 'string') throw new Error('Invalid parameter type');

        // Init state
        var state = {
            state: 'initial',
            hash: null
        };

        /**
         * @typedef {{
         *      target:function(),
         *      addClass: function(string[]|string):$,
         *      removeClass: function(string[]|string):$,
         *      show: function():$,
         *      hide: function():$,
         *      text: function(text: string, add?: boolean):$,
         *      link: function(link: string):$,
         *      clear: function():$,
         *      style: function(props: object),
         *      attr: function(attr: string, val: *),
         *      on: function(type: string, listener:function, capture: boolean),
         *      toDom: function()
         *      }} $
         */

        /**
         * @description "virtual" DOM element Object
         * @param {Element|string} element
         * @param {string|string[]} [classes]
         * @private
         */
        var $ = function $(element, classes) {

            if (element instanceof Element) {} else if (typeof element === 'string') {
                var _element = document.createElement(_element);
                if (classes) _element.addClass(classes);
            } else {
                throw new TypeError();
            }

            var target = element;
            /**
             * @type {$}
             */
            var self = this;
            var rts = function rts() {
                return self;
            };
            var def = function def(name, value) {
                return Object.defineProperty(self, name, { enumerable: false, value: value });
            };

            def('target', function () {
                return target;
            });
            def('attr', function (attr, val) {
                return rts(val ? target.setAttribute(attr, val) : target.removeAttribute(attr));
            });
            def('removeClass', function (e) {
                return rts(Array.isArray(e) ? e.forEach(function (e) {
                    return target.classList.remove(e);
                }) : target.classList.remove(e));
            });
            def('addClass', function (e) {
                return rts(Array.isArray(e) ? e.forEach(function (e) {
                    return target.classList.add(e);
                }) : target.classList.add(e));
            });
            def('text', function (text, add) {
                return rts(add ? target.innerText += text : target.innerText = text);
            });
            def('link', function (url) {
                return rts(self.text(url).attr('href', url));
            });
            def('clear', function () {
                return rts(self.text(''), self.attr('href', null));
            });
            def('show', function () {
                return self.removeClass('hidden');
            });
            def('hide', function () {
                return self.addClass('hidden');
            });
            def('style', function (props) {
                if (Array.isArray(props)) {
                    return props.map(function (p) {
                        return target.style[p];
                    });
                } else if (typeof props === 'string') return target.style[props];else {
                    for (var prop in props) {
                        //noinspection JSUnfilteredForInLoop
                        target.style[prop] = props[prop];
                    }
                }
            });
            def('on', function (type, listener, capture) {
                return rts(target.addEventListener(type, listener, capture));
            });
            def('toDom', function () {
                var root = self.target();
                for (var e in self) {
                    if (!self.hasOwnProperty(e)) continue;
                    if (!e instanceof $) continue;
                    try {
                        root.appendChild(self[e].toDom());
                    } catch (err) {
                        console.log(e, err);
                    }
                }
                return root;
            });
        };

        /**
         * @description "virtual" DOM element factory
         * @param {String} [e] element type
         * @param {String|Array<String>} [c] class/classes
         */
        var $touch = function $touch() {
            var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
            var c = arguments[1];

            var d = new $(document.createElement(e));
            if (c) d.addClass(c);
            return d;
        };

        // Build the "virtual" widget
        var widget = $touch('div', 'widget');
        var head = widget.head = $touch('div', 'head');
        head.logo = $touch('div', 'woleet-logo');
        head.reset = $touch('div', ['reset', 'mini-button', 'clickable']).on('click', reset);
        head.cancel = $touch('div', ['cancel', 'mini-button', 'clickable']).on('click', cancelHash);
        head.receipt = $touch('button', ['receipt-button', 'clickable']).on('click', forceReceipt).text('Drop receipt');
        var body = widget.body = $touch('div', 'body');

        var hashZone = body.hashZone = $touch('div', 'hashZone');
        hashZone.hashProgessContainer = $touch('div', 'progressBarContainer');
        hashZone.percentage = $touch('span').text('Hashing... 0%');
        var progressBar = hashZone.hashProgessContainer.progressBar = $touch('div', 'progressBar');

        var infoZone = body.infoZone = $touch('div', 'infoZone');
        infoZone.icon = $touch('div', 'infoStatus');
        infoZone.mainTextZone = $touch('div', 'text');
        infoZone.subTextZone = $touch('div', ['text', 'small']);
        infoZone.byTextZone = $touch('span', ['text', 'x-small']).text('by');
        infoZone.signTextZone = $touch('a', ['text', 'x-small']);
        infoZone.warnTextZone = $touch('div', ['text', 'x-small', 'warn']);

        var dropZone = body.dropZone = $touch('div', 'dropZoneContainer');
        dropZone.inputContainer = $touch('div');
        dropZone.inputContainer.mainTextZone = $touch('div', 'text');
        dropZone.inputContainer.subTextZone = $touch('div', ['text', 'small']);
        dropZone.inputContainer.input = $touch('input', ['dropZone', 'clickable']).attr('type', 'file').on('change', setInputFile);

        init();

        // Simulate a drop if hash is provided
        if (hash) setInputFile.call({ files: [hash] });

        function init() {
            resetText();
            dropZone.inputContainer.mainTextZone.text('Drop the file to verify');
            infoZone.removeClass(['validated', 'error']);
            infoZone.hide();
            dropZone.show();
            hashZone.hide();
            head.reset.hide();
            head.cancel.hide();
            head.receipt.hide();
        }

        function resetText() {
            dropZone.inputContainer.mainTextZone.clear();
            dropZone.inputContainer.subTextZone.clear();
            infoZone.mainTextZone.clear();
            infoZone.subTextZone.clear();
            infoZone.signTextZone.clear();
            infoZone.warnTextZone.clear();
            infoZone.byTextZone.hide();
        }

        /**
         * @param {Date} date
         */
        function formatDate(date) {
            var day = void 0,
                month = void 0,
                year = void 0,
                hour = void 0,
                minutes = void 0;

            day = date.getDate();
            month = date.getMonth();
            year = date.getFullYear();
            hour = date.getHours();
            minutes = date.getMinutes();

            return [day, month + 1, year].join('/') + ' ' + [hour, minutes].join(':');
        }

        var hasher = new woleet.file.Hasher();

        function setInputFile() {
            var file = this.files[0];
            if (!file) return;

            // Reset input
            //noinspection JSUnusedGlobalSymbols
            this.value = null;

            // Set default vue
            if (state.state === 'done') setVue('init');

            var setProgress = function setProgress(e) {
                var p = e.progress * 100;
                if (Number.isNaN(p)) p = 0;
                p = p.toFixed(0);
                progressBar.style({ width: p + '%' });
                hashZone.percentage.text('Hashing... ' + p + '%');
            };

            // We need a receipt to verify the hash|file
            if (state.state === 'needReceipt') {
                setVue('pending');
                parseReceiptFile(file).then(function (receipt) {
                    return woleet.verify.DAB(state.hash, receipt, setProgress);
                }).then(function (res) {
                    if (res.code !== 'verified') throw new Error(res.code);
                    setVue('woleet-ok', res);
                    state.state = 'done';
                }).catch(function (err) {
                    setVue('error', err);
                });
            }

            // We just entered a new hash|file to verify
            else {
                    var woleetDAB = function woleetDAB(hash) {
                        woleet.verify.WoleetDAB(hash, setProgress).then(function (result) {
                            if (result.length) {
                                state.state = 'done';
                                var res = result[0];
                                if (res.code !== 'verified') throw new Error(res.code);
                                setVue('woleet-ok', res);
                            } else throw new Error('need-receipt');
                        }).catch(function (err) {
                            // As we use cross-domain, it is difficult to know where the error come from,
                            // so we guess that the Woleet API isn't available and set state to need-receipt
                            // if the error came from network
                            console.trace(err);
                            if (err.hasOwnProperty('code') || err.message === 'need-receipt') {
                                state.state = 'needReceipt';
                                setVue('need-receipt');
                            } else {
                                setVue('error', err);
                            }
                        });
                    };

                    setVue('pending');

                    if (typeof file === 'string') {
                        state.hash = file;
                        woleetDAB(state.hash);
                    } else {
                        hasher.start(file);
                        hasher.on('progress', setProgress);
                        hasher.on('result', function (r) {
                            state.hash = r.result;
                            woleetDAB(state.hash);
                            setProgress({ progress: 0 });
                        });
                    }
                }
        }

        function forceReceipt() {
            resetText();
            state.state = 'needReceipt';
            setVue('need-receipt');
            dropZone.inputContainer.mainTextZone.text('Drop file\'s receipt');
            dropZone.inputContainer.subTextZone.clear();
        }

        function getErrorMessage(err) {
            if (err instanceof Error) {
                err = err.message;
            }
            var detail = {};
            switch (err) {
                case 'need-receipt':
                    detail.main = 'File unknown to Woleet';
                    detail.sub = 'The receipt cannot be retreived from Woleet: you must provide it to verify this file';
                    break;
                case 'target_hash_mismatch':
                    detail.main = 'The provided receipt is not meant for this file';
                    detail.sub = 'The receipt\'s target_hash attribute doesn\'t match the file hash';
                    break;
                case 'unable_to_parse_json':
                    detail.main = 'The provided receipt cannot be parsed';
                    detail.sub = 'The file you provided doesn\'t look like a receipt';
                    break;
                case 'merkle_root_mismatch':
                    detail.main = 'The provided receipt seems corrupted';
                    detail.sub = 'The receipt\'s merkle_root attribute does not match the proof result';
                    break;
                case 'non_sha256_target_proof_element':
                    detail.main = 'The provided receipt seems corrupted';
                    detail.sub = 'An attribute in the proof (parent or left or right) in not a SHA256 hash';
                    break;
                case 'invalid_parent_in_proof_element':
                    detail.main = 'The provided receipt seems corrupted';
                    detail.sub = 'A parent in the proof does not match SHA256(left+right).';
                    break;
                case 'invalid_receipt_format':
                    detail.main = 'The provided receipt seems corrupted';
                    detail.sub = 'The proof miss an attribute (parent or left or right).';
                    break;
                case 'invalid_target_proof':
                    detail.main = 'The provided receipt seems corrupted';
                    detail.sub = 'The receipt does not conform to the Chainpoint 1.x format';
                    break;
                case 'tx_not_found':
                    detail.main = 'Transaction not found';
                    detail.sub = 'The transaction targeted by the receipt cannot be found';
                    break;
                case 'invalid_receipt_signature':
                    detail.main = 'Invalid receipt signature';
                    detail.sub = 'The provided receipt is packed with a signature field witch is invalid';
                    break;
                case 'error_while_getting_transaction':
                    detail.main = 'Cannot get transaction';
                    detail.sub = 'There was an error while getting the transaction (try again)';
                    break;
                default:
                    console.trace('unexpected case', err);
                    detail.main = err;
                    detail.sub = 'unexpected case';
                    break;
            }
            return detail;
        }

        function setVue(vue, message) {
            switch (vue) {
                case 'woleet-ok':
                    resetText();
                    infoZone.removeClass(['error']);
                    infoZone.show();
                    dropZone.hide();
                    hashZone.hide();
                    head.cancel.hide();
                    var s = message.receipt.signature;
                    var i = message.identityVerificationStatus;
                    var pubKey = s ? s.pubKey : null;
                    var date = formatDate(message.timestamp).split(' ');
                    var timeZone = /.*(GMT.*\)).*/.exec(message.timestamp.toString())[1];
                    infoZone.mainTextZone.text((pubKey ? 'Signed' : 'Timestamped') + ' on ' + date[0]);
                    infoZone.subTextZone.text('at ' + date[1] + ' ' + timeZone);
                    if (s && s.identityURL && i && i.code === 'verified') {
                        infoZone.signTextZone.link(s.identityURL);
                        infoZone.byTextZone.show();
                    } else if (pubKey) {
                        infoZone.signTextZone.text('' + pubKey);
                        infoZone.byTextZone.show();
                    } else {
                        infoZone.byTextZone.hide();
                    }

                    if (i && i.code && i.code !== 'verified') {
                        infoZone.warnTextZone.text('Cannot validate identity (' + i.code + ')');
                    }
                    infoZone.addClass('validated');
                    dropZone.attr('disabled', true);
                    head.reset.show();
                    head.receipt.show();
                    break;
                case 'need-receipt':
                    resetText();
                    infoZone.hide();
                    dropZone.show();
                    hashZone.hide();
                    head.cancel.hide();
                    head.receipt.hide();
                    dropZone.inputContainer.mainTextZone.text('File unknown to Woleet');
                    dropZone.inputContainer.subTextZone.text('Drop it\'s receipt');
                    head.reset.show();
                    break;
                case 'error':
                    resetText();
                    infoZone.removeClass(['validated']);
                    infoZone.show();
                    dropZone.hide();
                    hashZone.hide();
                    head.cancel.hide();
                    if (state.state === 'needReceipt') head.receipt.show();
                    var detail = getErrorMessage(message);
                    infoZone.mainTextZone.text(detail.main);
                    infoZone.subTextZone.text(detail.sub);
                    infoZone.addClass('error');
                    head.reset.show();
                    break;
                case 'pending':
                    resetText();
                    head.cancel.show();
                    head.receipt.hide();
                    infoZone.hide();
                    dropZone.hide();
                    hashZone.show();
                    break;
                case 'init':
                default:
                    init();
                    break;
            }
        }

        function parseReceiptFile(receipt) {
            return new Promise(function (resolve, reject) {
                var reader = new FileReader();
                reader.onloadend = function (e) {
                    try {
                        //noinspection JSUnresolvedVariable
                        resolve(JSON.parse(e.target.result));
                    } catch (err) {
                        reject(new Error('unable_to_parse_json'));
                    }
                };
                reader.readAsText(receipt);
            });
        }

        function reset() {
            setVue('init');
            state.hash = null;
            state.state = 'initial';
        }

        function cancelHash() {
            hasher.cancel();
            reset();
        }

        return widget.toDom();
    }

    document.addEventListener("DOMContentLoaded", function () {
        var widgets = document.getElementsByClassName("woleet-widget");
        for (var i = 0; i < widgets.length; i++) {
            var e = widgets[i];
            var hash = e.getAttribute("data-hash");
            e.appendChild(new Widget(hash));
        }
    });

    root.Widget = Widget;
})(window);