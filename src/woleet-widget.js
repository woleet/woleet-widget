(function (root) {

    /**
     * @param [hash]
     * @constructor
     */
    function Widget(hash) {

        // Check parameter
        if (hash && typeof hash !== 'string')
            throw new Error('Invalid parameter type');

        // Init state
        const state = {
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
         *      html: function(text: string, add?: boolean):$,
         *      link: function(link: string):$,
         *      clear: function():$,
         *      style: function(props: object),
         *      attr: function(attr: string, val: *),
         *      on: function(type: string, listener:function, capture: boolean),
         *      toDom: function()
         *      }} $
         */

        const defineProperty = (target) => (name, value) => Object.defineProperty(target, name, {
            enumerable: false,
            value
        });

        /**
         * @description "virtual" DOM element Object
         * @param {Element|string} element
         * @param {string|string[]} [classes]
         * @private
         */
        const $ = function (element, classes) {

            if ((!element instanceof Element)) {
                throw new TypeError;
            }

            const target = element;
            /**
             * @type {$}
             */
            const self = this;
            const rts = () => self;
            const def = defineProperty(this);

            def('target', () => target);
            def('attr', (attr, val) => rts(val ? target.setAttribute(attr, val) : target.removeAttribute(attr)));
            def('removeClass', (e) => rts(Array.isArray(e) ? e.forEach(e => target.classList.remove(e)) : target.classList.remove(e)));
            def('addClass', (e) => rts(Array.isArray(e) ? e.forEach(e => target.classList.add(e)) : target.classList.add(e)));
            def('text', (text, add) => rts(add ? target.innerText += text : target.innerText = text));
            def('html', (text, add) => rts(add ? target.innerHTML += text : target.innerHTML = text));
            def('link', (url) => rts(self.text(url).attr('href', url)));
            def('clear', () => rts(self.text(''), self.attr('href', null)));
            def('show', () => self.removeClass('hidden'));
            def('hide', () => self.addClass('hidden'));
            def('style', (props) => {
                if (Array.isArray(props)) {
                    return props.map((p) => target.style[p])
                }
                else if (typeof props === 'string') return target.style[props];
                else {
                    for (let prop in props) {
                        //noinspection JSUnfilteredForInLoop
                        target.style[prop] = props[prop];
                    }
                }
            });
            def('on', (type, listener, capture) => rts(target.addEventListener(type, listener, capture)));
            def('toDom', () => {
                let root = self.target();
                for (let e in self) {
                    const elt = self[e];
                    try {
                        if (Array.isArray(elt))
                            elt.forEach((e) => root.appendChild(e.toDom()));
                        else
                            root.appendChild(elt.toDom())
                    } catch (err) {
                        console.warn(e, target, self[e], err);
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
        const $touch = (e = 'div', c) => {
            let d = new $(document.createElement(e));
            if (c) d.addClass(c);
            return d;
        };

        // Build the "virtual" widget
        const widget = $touch('div', 'widget');
        const head = widget.head = $touch('div', 'head');
        head.logo = $touch('div', 'woleet-logo');

        head.x = $touch('div', 'floatright');
        head.x.receipt = $touch('button', ['receipt-button', 'clickable']).on('click', forceReceipt).text('Drop proof');
        head.x.reset = $touch('div', ['reset', 'mini-button', 'clickable']).on('click', reset);
        head.x.cancel = $touch('div', ['cancel', 'mini-button', 'clickable']).on('click', cancelHash);

        const body = widget.body = $touch('div', 'body');

        const hashZone = body.hashZone = $touch('div', 'hashZone');
        hashZone.hashProgessContainer = $touch('div', 'progressBarContainer');
        hashZone.percentage = $touch('span').text('Hashing... 0%');
        const progressBar = hashZone.hashProgessContainer.progressBar = $touch('div', 'progressBar');

        const infoZone = body.infoZone = $touch('div', 'infoZone');
        infoZone.items = [];
        defineProperty(infoZone)('addItem', function () {
            const item = $touch('div', 'infoZoneItem');
            item.mainTextZone = $touch('div', ['text', 'small']);
            item.subTextZone = $touch('div', ['text', 'small']);
            item.byTextZone = $touch('span', ['text', 'x-small']).text('by ');
            item.signTextZone = $touch('a', ['link', 'x-small']);
            item.identityTextZone = $touch('div', ['text', 'x-small']);
            item.warnTextZone = $touch('div', ['text', 'x-small', 'warn']);
            item.on('click', () => selectItem(item, this.items));
            this.items.push(item);
            return item;
        });
        defineProperty(infoZone)('flush', function () {
            this.html('');
            this.items = [];
            return this;
        });

        const dropZone = body.dropZone = $touch('div', 'dropZoneContainer');
        dropZone.inputContainer = $touch('div');
        dropZone.inputContainer.mainTextZone = $touch('div', ['text', 'small']);
        dropZone.inputContainer.subTextZone = $touch('div', ['text', 'small']);
        dropZone.inputContainer.input = $touch('input', ['dropZone', 'clickable']).attr('type', 'file').on('change', setInputFile);

        const foot = widget.foot = $touch('div', 'foot');
        foot.expand = $touch('div', ['expand', 'expand-button', 'clickable']).on('click', expandList);

        init();

        // Simulate a drop if hash is provided
        if (hash) setInputFile.call({files: [hash]});

        function init() {
            resetText();
            dropZone.inputContainer.mainTextZone.text('Drop the file to verify');
            infoZone.removeClass(['validated', 'error']);
            infoZone.hide();
            dropZone.show();
            hashZone.hide();
            head.x.reset.hide();
            head.x.cancel.hide();
            head.x.receipt.hide();
            foot.hide();
        }

        function resetText() {
            dropZone.inputContainer.mainTextZone.clear();
            dropZone.inputContainer.subTextZone.clear();
            infoZone.flush();
        }

        /**
         * @param {Date} date
         */
        function formatDate(date) {
            let options = {year: 'numeric', month: 'short', day: 'numeric', hour: 'numeric', minute: 'numeric'};
            return date.toLocaleDateString('en', options)
        }

        const hasher = new woleet.file.Hasher;

        function setInputFile() {
            let file = this.files[0];
            if (!file) return;

            // Reset input
            //noinspection JSUnusedGlobalSymbols
            this.value = null;

            // Set default vue
            if (state.state === 'done') setVue('init');

            const setProgress = (e) => {
                let p = (e.progress * 100);
                if (p !== p) p = 0;
                p = p.toFixed(0);
                progressBar.style({width: p + '%'});
                hashZone.percentage.text('Hashing... ' + p + '%')
            };

            // We need a receipt to verify the hash|file
            if (state.state === 'needReceipt') {
                setVue('pending');
                return parseReceiptFile(file)
                    .then((receipt) => woleet.verify.DAB(state.hash, receipt, setProgress))
                    .then((res) => {
                        if (res.code !== 'verified') {
                            throw new Error(res.code);
                        }
                        setVue('ok', res);
                        state.state = 'done';
                    })
                    .catch((err) => {
                        setVue('error', err);
                    })
            }

            // We just entered a new hash|file to verify
            else {

                setVue('pending');

                if (typeof file === 'string') {
                    state.hash = file;
                    return woleetDAB(state.hash);
                } else {
                    return new Promise((resolve, reject) => {
                        hasher.start(file);
                        hasher.on('progress', setProgress);
                        hasher.on('error', (err) => setVue('error', err.error || err.message));
                        hasher.on('result', (r) => {
                            state.hash = r.result;
                            setProgress({progress: 0});
                            console.log('r.result', r.result);
                            resolve(woleetDAB(state.hash));
                        })
                    })
                }

                function woleetDAB(hash) {
                    return woleet.verify.WoleetDAB(hash, setProgress)
                        .then((results) => {
                            state.state = 'done';
                            addResults(results.sort((b, a) => a.timestamp > b.timestamp ? -1 : a.timestamp < b.timestamp ? 1 : 0));
                        })
                        .catch((err) => {
                            // As we use cross-domain, it is difficult to know where the error come from,
                            // so we guess that the Woleet API isn't available and set state to need-receipt
                            // if the error came from network
                            if (err.hasOwnProperty('code') || err.message === 'need-receipt') {
                                state.state = 'needReceipt';
                                setVue('need-receipt');
                            } else {
                                setVue('error', err);
                            }
                        })
                }
            }
        }

        function forceReceipt() {
            resetText();
            foot.hide();
            state.state = 'needReceipt';
            setVue('need-receipt');
            dropZone.inputContainer.mainTextZone.text('Drop the proof receipt');
            dropZone.inputContainer.subTextZone.clear();
        }

        function getErrorMessage(err) {
            if (err instanceof Error) {
                err = err.message;
            }
            const detail = {};
            switch (err) {
                case 'need-receipt':
                    detail.main = 'No public proof found at Woleet';
                    detail.sub = 'No public proof receipt found at Woleet: you must provide one to verify this file';
                    break;
                case 'file_matched_but_anchor_not_yet_processed':
                    detail.main = 'The proof is not yet verifiable';
                    detail.sub = 'A public proof receipt has been found at Woleet, but is not yet verifiable (try again later)';
                    break;
                case 'target_hash_mismatch':
                    detail.main = 'The proof mismatch the file';
                    detail.sub = 'The proof receipt\'s target hash attribute doesn\'t match the file hash';
                    break;
                case 'unable_to_parse_json':
                    detail.main = 'The proof cannot be parsed';
                    detail.sub = 'The file you provided is not a valid Chainpoint 1 or 2 proof receipt';
                    break;
                case 'merkle_root_mismatch':
                    detail.main = 'The proof is corrupted';
                    detail.sub = 'The proof receipt\'s merkle root attribute does not match the proof result';
                    break;
                case 'non_sha256_target_proof_element':
                    detail.main = 'The proof is corrupted';
                    detail.sub = 'An attribute in the proof (parent or left or right) in not a SHA256 hash';
                    break;
                case 'invalid_parent_in_proof_element':
                    detail.main = 'The proof is corrupted';
                    detail.sub = 'A parent in the proof is not the SHA256 of its children';
                    break;
                case 'invalid_receipt_format':
                    detail.main = 'The proof is corrupted';
                    detail.sub = 'The proof receipt does not conform to the Chainpoint 1 or 2 format';
                    break;
                case 'invalid_target_proof':
                    detail.main = 'The proof is corrupted';
                    detail.sub = 'The proof receipt\'s merkle proof attribute is invalid';
                    break;
                case 'op_return_mismatches_merkle_root':
                    detail.main = 'The receipt is corrupted';
                    detail.sub = 'The transaction\'s OP_RETURN mismatches the proof receipt\'s merkle root';
                    break;
                case 'http_error':
                    detail.main = 'Unexpected HTTP error';
                    detail.sub = 'An unexpected HTTP error occurred during the verification process';
                    break;
                case 'tx_not_found':
                    detail.main = 'The transaction cannot be found';
                    detail.sub = 'The proof receipt\'s transaction doesn\'t exist in the blockchain';
                    break;
                case 'invalid_receipt_signature':
                    detail.main = 'The signature is invalid';
                    detail.sub = 'The proof receipt\'s signature is not valid for signedHash and pubKey attributes';
                    break;
                case 'invalid_receipt_signature_format':
                    detail.main = 'The signature is corrupted';
                    detail.sub = 'The proof receipt does not conform to the Chainpoint 1 or 2 format with signature extension';
                    break;
                case 'file_too_big_to_be_hashed_without_worker':
                    detail.main = 'Cannot hash without worker';
                    detail.sub = 'The file is too big to be hashed without worker';
                    break;
                default:
                    console.trace('unexpected case', err);
                    detail.main = err;
                    detail.sub = 'unexpected case';
                    break;
            }
            return detail;
        }

        function addResults(results) {
            resetText();
            if (results.length) {

                if (results.length > 1) {
                    foot.expand.text(results.length + '+');
                    foot.expand.removeClass('up-arrow');
                    foot.show();
                }

                results.forEach((res, i) => {
                    if (res.code === 'verified') {
                        addVue('ok', res, i);
                    }
                    else {
                        addVue('error', res.code, i);
                    }
                });
                infoZone.toDom();
            }
            else {
                state.state = 'needReceipt';
                setVue('need-receipt');
            }
        }

        function addVue(vue, message, index) {
            infoZone.show();
            const item = infoZone.addItem();
            item.addClass(index ? 'reduced' : 'expanded');
            dropZone.hide();
            hashZone.hide();
            head.x.cancel.hide();
            switch (vue) {
                case 'ok':
                    const sig = message.receipt.signature;
                    const idStatus = message.identityVerificationStatus;
                    const identity = idStatus ? idStatus.identity : null;
                    const pubKey = sig ? sig.pubKey : null;

                    // Confirmations may be undefined if tx is sent but not yet included in a block
                    if (!message.confirmations) {
                        item.mainTextZone.text(pubKey ? 'Signed' : 'Timestamped');
                        item.subTextZone.text('Yet to be included in a block.');
                    } else {
                        const date = formatDate(message.timestamp);
                        item.mainTextZone.text(`${pubKey ? 'Signed' : 'Timestamped'} on ${date}`);
                    }

                    if (sig && sig.identityURL && idStatus && idStatus.code === 'verified') {
                        item.byTextZone.addClass('link');
                        item.signTextZone.link(`${sig.identityURL}?pubKey=${pubKey}&leftData=foobar`);
                        if (identity && identity.commonName) {
                            item.signTextZone.text(`${identity.commonName}`);
                            item.identityTextZone.html(`${identity.organization} - ${identity.organizationalUnit}<br>${identity.locality} - ${identity.country}`);
                        } else {
                            item.signTextZone.text(`${sig.identityURL}`);
                        }
                        item.byTextZone.show();
                    } else if (pubKey) {
                        item.signTextZone.text(`${pubKey}`);
                        item.byTextZone.show();
                    } else {
                        item.byTextZone.hide();
                    }

                    if (idStatus && idStatus.code && idStatus.code !== 'verified') {
                        item.warnTextZone.text(`Cannot verify identity (${idStatus.code})`)
                    }

                    item.addClass('validated');
                    dropZone.attr('disabled', true);
                    head.x.receipt.show();
                    break;
                case 'error':
                    if (state.state === 'needReceipt') head.x.receipt.show();
                    let detail = getErrorMessage(message);
                    item.mainTextZone.text(detail.main);
                    item.subTextZone.text(detail.sub);
                    item.byTextZone.hide();
                    item.warnTextZone.hide();
                    item.addClass('error');
                    break;
            }
            head.x.reset.show();
        }

        function setVue(vue, message) {
            switch (vue) {
                case 'ok':
                    resetText();
                    addVue('ok', message, 0);
                    infoZone.toDom();
                    break;
                case 'need-receipt':
                    resetText();
                    infoZone.hide();
                    dropZone.show();
                    hashZone.hide();
                    head.x.cancel.hide();
                    head.x.receipt.hide();
                    dropZone.inputContainer.mainTextZone.text('No public proof found at Woleet');
                    dropZone.inputContainer.subTextZone.text('Please provide a proof receipt');
                    head.x.reset.show();
                    break;
                case 'error':
                    resetText();
                    addVue('error', message, 0);
                    infoZone.toDom();
                    break;
                case 'pending':
                    resetText();
                    head.x.cancel.show();
                    head.x.receipt.hide();
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
            return new Promise((resolve, reject) => {
                let reader = new FileReader();
                reader.onloadend = (e) => {
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

        let expanded = false;
        let selected = null;

        function selectItem(item, items) {
            if (!expanded) return;

            if (selected === item) {
                // Clicked on item for the second time
                return expandList();
            }

            selected = item;

            items.forEach((item) => {
                item.removeClass('expanded');
                item.addClass('reduced');
            });

            item.addClass('expanded');
            item.removeClass('reduced');
        }

        function expandList() {
            const items = infoZone.items;
            if (expanded) {
                body.removeClass('expanded');
                items.forEach((item) => item.removeClass('clickable'));
                foot.expand.text(items.length + "+");
                foot.expand.removeClass("up-arrow");
                expanded = false;
            } else {
                body.addClass('expanded');
                items.forEach((item) => item.addClass('clickable'));
                foot.expand.text('');
                foot.expand.addClass('up-arrow');
                expanded = true;
            }
        }

        function reset() {
            setVue('init');
            hasher.cancel();
            state.hash = null;
            state.state = 'initial'
        }

        function cancelHash() {
            reset();
        }

        this.setInputFile = (file) => {
            if (state.state === 'needReceipt')
                throw new Error('Current state is needReceipt');
            const ctx = {files: [file]};
            return setInputFile.call(ctx);
        };

        this.setReceipt = (file) => {
            forceReceipt();
            if (state.state !== 'needReceipt')
                throw new Error('Current state must be needReceipt');
            const ctx = {files: [file]};
            return setInputFile.call(ctx);
        };

        this.reset = reset;

        this.cancelHash = cancelHash;

        this.toDom = () => widget.toDom();
    }

    document.addEventListener("DOMContentLoaded", () => {
        let widgets = document.getElementsByClassName("woleet-widget");
        for (let i = 0; i < widgets.length; i++) {
            let e = widgets[i];
            let hash = e.getAttribute("data-hash");
            const widget = new Widget(hash);
            e.appendChild(widget.toDom());
        }
    });

    root.Widget = Widget;

}(window));