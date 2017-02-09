(function (root) {
    function Widget(hash, params) {

        if (hash && typeof hash == 'object') {
            params = hash;
            hash = null;
        }
        else if (hash && typeof hash != 'string') throw new Error('Invalid parameter type');

        const $ = function (domElement) {
            let _target = domElement;
            this.target = () => _target;

            this.removeClass = (e) => {
                Array.isArray(e) ? e.forEach(e => _target.classList.remove(e)) : _target.classList.remove(e);
                return this;
            };

            this.addClass = (e) => {
                Array.isArray(e) ? e.forEach(e => _target.classList.add(e)) : _target.classList.add(e);
                return this;
            };

            this.text = (text, add) => {
                add ? _target.innerText += text : _target.innerText = text;
                return this;
            };

            this.show = () => this.removeClass('hidden');

            this.hide = () => this.addClass('hidden');

            this.style = (props) => {
                if (Array.isArray(props)) {
                    return props.map((p) => _target.style[p])
                }
                else if (typeof props == 'string') return _target.style[props];
                else {
                    for (let propName in props) {
                        //noinspection JSUnfilteredForInLoop
                        _target.style[propName] = props[propName];
                    }
                }
            };

            this.attr = (attr, val) => {
                val ? _target.setAttribute(attr, val) : _target.removeAttribute(attr);
                return this;
            };

            this.on = (type, listener, capture) => {
                _target.addEventListener(type, listener, capture);
                return this;
            };

            this.toDom = () => {
                const iniProps = ['target', 'text', 'show', 'hide', 'toDom', 'addClass', 'removeClass', 'attr', 'on', 'style'];
                let root = this.target();
                for (let e in this) {
                    if (!this.hasOwnProperty(e)) continue;
                    if (iniProps.indexOf(e) != -1) continue;
                    if (!e instanceof $) continue;
                    try {
                        root.appendChild(this[e].toDom())
                    } catch (err) {
                        console.log(e, err);
                    }
                }
                return root;
            }
        };

        const $touch = ((e = 'div', c) => {
            let d = new $(document.createElement(e));
            if (c) d.addClass(c);
            return d;
        });

        const widget = $touch('div', 'widget');
        const head = widget.head = $touch('div', 'head');
        head.logo = $touch('div', 'woleet-logo');
        head.reset = $touch('div', ['reset-button', 'clickable']).on('click', reset);
        widget.body = $touch();
        const content = widget.body.content = $touch();
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
        const progressBar = content.dropZone.inputContainer.progressBarContainer.progressBar = $touch('div', 'progressBar');
        content.dropZone.inputContainer.input = $touch('input', ['dropZone', 'clickable']).attr('type', 'file').on('change', setInputFile);

        init();

        if (hash) setInputFile({target: {files: [hash]}});

        //CTRL

        let state = 'initial';
        let _file;

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
            let day, month, year, hour, minutes;

            day = date.getDate();
            month = date.getMonth();
            year = date.getFullYear();
            hour = date.getHours();
            minutes = date.getMinutes();

            return [day, month + 1, year].join('/') + ' ' + [hour, minutes].join(':');
        }

        function setInputFile() {
            let file = this.files[0];
            if (!file) return;
            this.value = null; // Reset input
            if (state == 'done') setVue();
            if (state == 'needReceipt') {
                setVue('pending');
                parseReceiptFile(file).then(function (receipt) {
                    woleet.verify.DAB(_file, receipt, (e) => {
                        progressBar.style({width: e.progress * 100 + '%'});
                    }).then(function (res) {
                        setVue('woleet-ok', formatDate(res.confirmedOn));
                        state = 'done';
                    }, function (err) {
                        setVue('error', err);
                    })
                }, function (err) {
                    setVue('error', err);
                });
            }
            else {
                _file = file;
                setVue('pending');
                woleet.verify.WoleetDAB(file, (e) => {
                    progressBar.style({width: e.progress * 100 + '%'});
                }).then(function (res) {
                    state = 'done';
                    if (res.length) setVue('woleet-ok', formatDate(res[0].confirmedOn));
                    else setVue('need-receipt', 'Drop its receipt');
                }, function (err) {
                    console.error(err);
                    setVue('error', err);
                })
            }
        }

        function setTooltip(vue) {
            let tip = content.info.message.buttonBox.button.tooltip;
            let info = content.info.message.textZone;
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
                    tip.text('Nothing to say');
                    break;
            }
        }

        function setVue(vue, message) {
            switch (vue) {
                case 'woleet-ok':
                case 'receipt-ok':
                    content.icon.show();
                    let date = message.split(' ');
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
                    state = 'needReceipt';
                    break;
                case 'receipt-ko':
                case 'error':
                    console.error(message);
                    content.info.removeClass('reduced').addClass('expanded').show();
                    content.dropZone.inputContainer.progressBarContainer.hide();
                    content.icon.addClass('error').show();
                    content.dropZone.removeClass('expanded').hide();
                    head.reset.show();
                    setTooltip(message.message);
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
                let reader = new FileReader();
                reader.onloadend = function (e) {
                    try {
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
            _file = null;
            state = 'initial'
        }

        return widget.toDom()
    }

    document.addEventListener("DOMContentLoaded", () => {
        let widgets = document.getElementsByClassName("woleet-widget");
        for (let i = 0; i < widgets.length; i++) {
            let e = widgets[i];
            let hash = e.getAttribute("data-hash");
            e.appendChild(Widget(hash));
        }
    });

    root.Widget = Widget;
}(window));