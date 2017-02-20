'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

(function (root) {
    /**
     * @param [hash]
     * @param [params]
     * @constructor
     */
    function Widget(hash, params) {

        // Parsing parameters
        if (!params && hash && (typeof hash === 'undefined' ? 'undefined' : _typeof(hash)) == 'object') {
            params = hash;
            hash = null;
        } else if (hash && typeof hash != 'string') throw new Error('Invalid parameter type');
        //

        // state relative variables
        var state = {
            state: 'initial',
            hash: null,
            retry: false
        };
        //

        /**
         * @description "virtual" DOM element Object
         * @param domElement
         */
        var $ = function $(domElement) {
            var _this = this;

            var _target = domElement;
            this.target = function () {
                return _target;
            };

            this.removeClass = function (e) {
                Array.isArray(e) ? e.forEach(function (e) {
                    return _target.classList.remove(e);
                }) : _target.classList.remove(e);
                return _this;
            };

            this.addClass = function (e) {
                Array.isArray(e) ? e.forEach(function (e) {
                    return _target.classList.add(e);
                }) : _target.classList.add(e);
                return _this;
            };

            this.text = function (text, add) {
                add ? _target.innerText += text : _target.innerText = text;
                return _this;
            };

            this.show = function () {
                return _this.removeClass('hidden');
            };

            this.hide = function () {
                return _this.addClass('hidden');
            };

            this.style = function (props) {
                if (Array.isArray(props)) {
                    return props.map(function (p) {
                        return _target.style[p];
                    });
                } else if (typeof props == 'string') return _target.style[props];else {
                    for (var propName in props) {
                        //noinspection JSUnfilteredForInLoop
                        _target.style[propName] = props[propName];
                    }
                }
            };

            this.attr = function (attr, val) {
                val ? _target.setAttribute(attr, val) : _target.removeAttribute(attr);
                return _this;
            };

            this.on = function (type, listener, capture) {
                _target.addEventListener(type, listener, capture);
                return _this;
            };

            this.toDom = function () {
                var iniProps = ['target', 'text', 'show', 'hide', 'toDom', 'addClass', 'removeClass', 'attr', 'on', 'style'];
                var root = _this.target();
                for (var e in _this) {
                    if (!_this.hasOwnProperty(e)) continue;
                    if (iniProps.indexOf(e) != -1) continue;
                    if (!e instanceof $) continue;
                    try {
                        root.appendChild(_this[e].toDom());
                    } catch (err) {
                        console.log(e, err);
                    }
                }
                return root;
            };
        };

        /**
         * @description "virtual" DOM element factory
         * @param {String} [e] element type
         * @param {String|Array<String>} [c] class/classes
         * @returns $
         */
        var $touch = function $touch() {
            var e = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 'div';
            var c = arguments[1];

            var d = new $(document.createElement(e));
            if (c) d.addClass(c);
            return d;
        };

        // Building the "virtual" widget
        var widget = $touch('div', 'widget');
        var head = widget.head = $touch('div', 'head');
        head.logo = $touch('div', 'woleet-logo');
        head.reset = $touch('div', ['reset-button', 'clickable']).on('click', reset);
        widget.body = $touch();
        var content = widget.body.content = $touch();
        content.icon = $touch('div', 'infoStatus');
        content.info = $touch('div', 'infoBox');
        content.info.message = $touch('div', 'messageBox');
        content.info.message.buttonBox = $touch('div', 'buttonBox');
        content.info.message.buttonBox.button = $touch('div', ['info', 'tooltip', 'clickable']);
        content.info.message.buttonBox.button.tooltip = $touch('span', ['tooltiptext']);
        content.info.message.textZone = $touch('div', 'text');
        content.dropZone = $touch('div', 'dropZoneContainer');
        content.dropZone.mainTextZone = $touch('div', 'text');
        content.dropZone.subTextZone = $touch('div', ['text', 'little']);
        content.dropZone.inputContainer = $touch('div', 'subContainer');
        content.dropZone.inputContainer.progressBarContainer = $touch('div').hide();
        var progressBar = content.dropZone.inputContainer.progressBarContainer.progressBar = $touch('div', 'progressBar');
        content.dropZone.inputContainer.input = $touch('input', ['dropZone', 'clickable']).attr('type', 'file').on('change', setInputFile);

        init();

        //Calling setInputFile with {files: ...} as this
        if (hash) setInputFile.call({ files: [hash] });

        //CTRL

        function init() {
            content.dropZone.mainTextZone.text('Drop the file to verify');
            content.dropZone.subTextZone.text('');
            content.info.message.buttonBox.button.tooltip.text('');
            content.dropZone.addClass('expanded').show();
            content.info.removeClass(['reduced', 'expanded']).hide();
            content.icon.removeClass(['validated', 'error']).hide();
            content.dropZone.inputContainer.progressBarContainer.hide();
            head.reset.hide();
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

        function setInputFile() {
            var file = this.files[0];
            if (!file) return;
            //noinspection JSUnusedGlobalSymbols
            this.value = null; // Reset input
            if (state.state == 'done') setVue();
            // if we already checked a hash|file but need a receipt to verify it
            if (state.state == 'needReceipt') {
                setVue('pending');
                parseReceiptFile(file).then(function (receipt) {
                    return woleet.verify.DAB(state.hash, receipt, function (e) {
                        progressBar.style({ width: e.progress * 100 + '%' });
                    });
                }).then(function (res) {
                    setVue('woleet-ok', formatDate(res.confirmedOn));
                    state.state = 'done';
                }).catch(function (err) {
                    // as we use cross-domain, it is difficult ot know where the error come from,
                    // so we try once with an other provider
                    if (err.message == 'error_while_getting_transaction' && state.retry == false) {
                        state.retry = true;
                        woleet.transaction.setDefaultProvider("blockcypher.com");
                        setInputFile.call({ files: [file] }); // self-calling, binding with current receipt file
                    } else {
                        console.trace(err);
                        setVue('error', err);
                    }
                });
            }
            // we just entered a new hash|file to verify
            else {
                    state.hash = file;
                    setVue('pending');
                    woleet.verify.WoleetDAB(file, function (e) {
                        progressBar.style({ width: e.progress * 100 + '%' });
                    }).then(function (res) {
                        if (res.length) {
                            state.state = 'done';
                            setVue('woleet-ok', formatDate(res[0].confirmedOn));
                        } else throw new Error('need-receipt');
                    }).catch(function (err) {
                        // as we use cross-domain, it is difficult to know where the error come from,
                        // so we guess that the woleet api isn't available and set state to need-receipt
                        // if the error came from network
                        if (err.hasOwnProperty('code') || err.message == 'need-receipt') {
                            state.state = 'needReceipt';
                            setVue('need-receipt', 'Drop its receipt');
                        } else {
                            setVue('error', err);
                        }
                    });
                }
        }

        function setTooltip(vue) {
            var tip = content.info.message.buttonBox.button.tooltip;
            var info = content.info.message.textZone;
            switch (vue) {
                case 'need-receipt':
                    info.text('File unknown to Woleet');
                    tip.text('The receipt cannot be retreived from Woleet: you must provide it to verify this file');
                    break;
                case 'target_hash_mismatch':
                    info.text('The provided receipt is not meant for this file');
                    tip.text('The receipt\'s target_hash attribute doesn\'t match the file hash');
                    break;
                case 'unable_to_parse_json':
                    info.text('The provided receipt cannot be parsed');
                    tip.text('The file you provided doesn\'t look like a receipt');
                    break;
                case 'merkle_root_mismatch':
                    info.text('The provided receipt seems corrupted');
                    tip.text('The receipt\'s merkle_root attribute does not match the proof result');
                    break;
                case 'non_sha256_target_proof_element':
                    info.text('The provided receipt seems corrupted');
                    tip.text('An attribute in the proof (parent or left or right) in not a SHA256 hash');
                    break;
                case 'invalid_parent_in_proof_element':
                    info.text('The provided receipt seems corrupted');
                    tip.text('A parent in the proof does not match SHA256(left+right).');
                    break;
                case 'invalid_receipt_format':
                    info.text('The provided receipt seems corrupted');
                    tip.text('The proof miss an attribute (parent or left or right).');
                    break;
                case 'invalid_target_proof':
                    info.text('The provided receipt seems corrupted');
                    tip.text('The receipt does not conform to the Chainpoint 1.x format');
                    break;
                case 'tx_not_found':
                    info.text('Transaction not found');
                    tip.text('The transaction targeted by the receipt cannot be found');
                    break;
                case 'error_while_getting_transaction':
                    info.text('Cannot get transaction');
                    tip.text('There was an error while getting the transaction (try again)');
                    break;
                default:
                    info.text(vue);
                    tip.text('unexpected case');
                    break;
            }
        }

        // same role as setVue, but error-specific
        function parseError(error) {
            console.error(error.message);
            var message = error.message || "Something bad happened";
            content.info.removeClass('reduced').addClass('expanded').show();
            content.dropZone.inputContainer.progressBarContainer.hide();
            content.icon.addClass('error').show();
            content.dropZone.removeClass('expanded').hide();
            head.reset.show();
            setTooltip(message);
        }

        function setVue(vue, message) {
            switch (vue) {
                case 'woleet-ok':
                case 'receipt-ok':
                    content.icon.show();
                    var date = message.split(' ');
                    content.dropZone.mainTextZone.text(date[0]);
                    content.dropZone.subTextZone.text(date[1]);
                    content.dropZone.removeClass('expanded');
                    content.icon.addClass('validated');
                    content.info.removeClass('reduced').hide();
                    content.dropZone.inputContainer.progressBarContainer.hide();
                    content.dropZone.attr('disabled', true);
                    setTooltip('');
                    break;
                case 'need-receipt':
                    content.dropZone.mainTextZone.text(message);
                    content.dropZone.removeClass('expanded');
                    content.info.message.textZone.text('need receipt');
                    content.info.addClass('reduced').show();
                    content.dropZone.inputContainer.progressBarContainer.hide();
                    head.reset.show();
                    setTooltip('need-receipt');
                    break;
                case 'receipt-ko':
                case 'error':
                    parseError(message);
                    break;
                case 'pending':
                    content.info.hide();
                    content.icon.hide();
                    content.dropZone.mainTextZone.text('Hashing...');
                    content.dropZone.inputContainer.progressBarContainer.show();
                    setTooltip('');
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
            state.retry = false;
            state.hash = null;
            state.state = 'initial';
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