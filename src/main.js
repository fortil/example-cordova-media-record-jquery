'use strict';
var websql_1 = require("./websql");
function MakeId() {
    var text = "";
    var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    for (var i = 0; i < 15; i++)
        text += possible.charAt(Math.floor(Math.random() * possible.length));
    return text;
}
Array.prototype.equals = function (array) {
    if (!array)
        return false;
    if (this.length != array.length)
        return false;
    for (var i = 0, l = this.length; i < l; i++) {
        if (this[i] instanceof Array && array[i] instanceof Array) {
            if (!this[i].equals(array[i]))
                return false;
        }
        else if (this[i] != array[i]) {
            return false;
        }
    }
    return true;
};
Object.defineProperty(Array.prototype, "equals", { enumerable: false });
Element.prototype.remove = function () {
    this.parentElement.removeChild(this);
};
NodeList.prototype.remove = HTMLCollection.prototype.remove = function () {
    for (var i = this.length - 1; i >= 0; i--) {
        if (this[i] && this[i].parentElement) {
            this[i].parentElement.removeChild(this[i]);
        }
    }
};
var RecordMedia = (function () {
    function RecordMedia(_a) {
        var idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max, nameServer = _a.nameServer, selector = _a.selector, cordovaDir = _a.cordovaDir;
        this.arguments = {
            selector: selector,
            idRegistro: (idRegistro || MakeId()),
            idPregunta: (idPregunta || MakeId()),
            max: (max || 10000),
            nameServer: (nameServer || undefined),
        };
        this.audio = {};
        this.DB;
        this.cordovaDir = cordovaDir || cordova.file.externalDataDirectory;
        // Default Icons
        this.icons = {
            playIcon: this.getIcon('play_arrow'),
            stopIcon: this.getIcon('pause'),
            deleteIcon: this.getIcon('clear')
        };
        // Default strings
        this.strings = {
            recording: 'Detener grabación',
            stoprecord: 'Grabar audio',
            mjsrecord: 'Grabando audio....',
            alertmaxrecord: ' Llegó al máximo de grabaciones posibles ',
            dialogconfirm: 'Está seguro de eliminar el archivo ',
            fields: 'id,name,path,idRegistro,idPregunta,type,duration,date',
            tablename: 'RECORDS',
        };
        this.record = { recording: false };
    }
    RecordMedia.prototype.getIcon = function (icon) {
        return "<i class=\"material-icons md-18\">" + icon + "</i>";
    };
    RecordMedia.prototype.init = function (_a) {
        var _this = this;
        var success = _a.success, error = _a.error;
        var rec = this.recordAudio.bind(this);
        var agrs = this.arguments;
        var btn = document.querySelector(this.arguments.selector);
        // let btn = $(''+this.arguments.selector);
        btn.addEventListener('click', function (evt) {
            evt.preventDefault();
            rec(agrs);
        }, false);
        // Otiene los strings a mostrar, sino hay deja los default
        this.strings = {
            recording: (btn.dataset.recording || this.strings.recording),
            stoprecord: (btn.dataset.stoprecord || this.strings.stoprecord),
            mjsrecord: (btn.dataset.mjsrecord || this.strings.mjsrecord),
            alertmaxrecord: (btn.dataset.alertmaxrecord || this.strings.alertmaxrecord),
            dialogconfirm: (btn.dataset.dialogconfirm || this.strings.dialogconfirm),
            fields: (btn.dataset.fields || this.strings.fields),
            tablename: (btn.dataset.tablename || this.strings.tablename),
        };
        this.icons = {
            playIcon: (btn.dataset.playicon || this.icons.playIcon),
            stopIcon: (btn.dataset.stopicon || this.icons.stopIcon),
            deleteIcon: (btn.dataset.deleteicon || this.icons.deleteIcon)
        };
        this.functions = { success: success, error: error };
        this.DB = websql_1.SQL({ name: 'RecordMedia', description: 'Save records media', size: 64 * 1024 });
        this.DB.createTable({ tableName: this.strings.tablename, fields: this.strings.fields.split(',') }, function (args) {
            _this.DB = args;
        }, error);
        //   table: {name: this.strings.tablename, fields: this.strings.fields.split(',') },
        //   app: this.arguments,
        // });
        var divMsj = document.createElement('div');
        divMsj.className = "mensaje alignAbsoluteCenter " + this.arguments.idRegistro + " " + this.arguments.idPregunta;
        divMsj.innerHTML = divMsj.innerHTML + this.strings.mjsrecord;
        btn.parentNode.insertBefore(divMsj, btn);
        // btn.after(this.strings.mjsdivrecord);
        this.initView.bind(this)();
    };
    RecordMedia.prototype.initView = function () {
        var _this = this;
        // JS form
        var medias = document.querySelector('#content-' + this.arguments.idRegistro + '_' + this.arguments.idPregunta);
        if (medias != undefined)
            medias.innerHTML = '';
        var idRegistro = this.arguments.idRegistro;
        var idPregunta = this.arguments.idPregunta;
        this.DB.getVal({ idPregunta: idPregunta, idRegistro: idRegistro }, function (tx, songs) {
            if (songs.length > 0) {
                for (var i = 0; i < songs.length; i++) {
                    songs[i].selector = _this.arguments.selector;
                    songs[i].max = _this.arguments.max;
                    _this.addAudioView(songs[i]);
                }
            }
        }, this.functions.error);
    };
    RecordMedia.prototype.changeIconView = function (id, icon) {
        document.getElementsByClassName('play ' + id)[0].innerHTML = icon;
        // jQuery Form
        // $('.play.'+id).html(icon);
    };
    RecordMedia.prototype.playPauseAudio = function (_a) {
        var _this = this;
        var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
        var playIcon = this.icons.playIcon;
        var stopIcon = this.icons.stopIcon;
        var element = document.getElementsByClassName('range ex1-' + id)[0];
        var dur = 100;
        var mediaTimer = function () { };
        var playStateFunc = function () {
            _this.audio.id = id;
            _this.audio.estado = 'play';
            _this.audio.media.play();
            _this.changeIconView(id, stopIcon);
            // element.value = 0;
            mediaTimer = setInterval(function () {
                dur = _this.audio.media.getDuration() * 100;
                dur = dur <= 0 ? (-1 * dur) : dur;
                element.max = dur;
                _this.audio.media.getCurrentPosition(function (position) {
                    _this.audio.pos = position * 100;
                    if (_this.audio.pos <= 0) {
                        stopStateFunc(0);
                    }
                    else if (_this.audio.estado == 'pause') {
                        stopStateFunc(_this.audio.pos);
                    }
                    else {
                        element.value = _this.audio.pos;
                    }
                }, _this.functions.error);
                if (dur == 0 || _this.audio.estado == 'pause') {
                    stopStateFunc(0); //{audio: this.audio, element })
                }
            }, 500);
        };
        var stopStateFunc = function (pos) {
            _this.audio.estado = 'pause';
            _this.audio.media.pause();
            clearInterval(mediaTimer);
            element.value = (typeof pos == 'number' ? pos : _this.audio.pos);
            _this.changeIconView(id, playIcon);
        };
        if (this.audio && this.audio.id == id && this.audio.estado != 'pause') {
            stopStateFunc(0);
        }
        else if (this.audio && this.audio.id == id && this.audio.estado == 'pause') {
            playStateFunc();
        }
        else {
            this.audio = {};
            this.audio.media = new Media(path, function (e) { console.log('Success ', e); _this.changeIconView(id, stopIcon); }, function (err) { console.log('err ', err); _this.changeIconView(id, playIcon); }, function (e) {
                if (e == 3) {
                    stopStateFunc(_this.audio.media._position * 100);
                }
                else if (e == 4) {
                    _this.DB.update({ id: id }, { duration: _this.audio.media._duration });
                    stopStateFunc(0);
                }
            });
            playStateFunc();
        }
    };
    RecordMedia.prototype.removeAudio = function (_a) {
        var _this = this;
        var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
        if (confirm(this.strings.dialogconfirm + ' ' + name)) {
            resolveLocalFileSystemURL(this.cordovaDir, function (dir) {
                dir.getFile(name, { create: true }, function (file) {
                    file.remove(function (files) {
                        _this.DB.deleted({ id: id }, function (tx, res) {
                            if (res.rowsAffected > 0) {
                                document.getElementsByClassName("MediaRecord-media " + id)[0].remove();
                                // document.querySelector('#content-'+idRegistro+'_'+idPregunta).remove()
                                // jQuery Form
                                // $('#content-'+idRegistro+'_'+idPregunta).remove();
                                // this.initView();
                                _this.functions.success(res);
                            }
                        });
                    }, _this.functions.error);
                });
            });
        }
    };
    RecordMedia.prototype.recordAudio = function (_a) {
        var _this = this;
        var selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
        var store = this.cordovaDir; //externalApplicationStorageDirectory; // window.externalApplicationStorageDirectory || window.PERSISTENT || window.TEMPORARY;
        var id = Date.now();
        var name = idRegistro + '_' + idPregunta + '__' + id + '.amr';
        var path = store + name;
        this.DB.getVal(null, function (tx, songs) {
            var lengthSongs = songs.length || (typeof songs == 'object' ? Object.keys(songs).length : 0);
            if (lengthSongs >= max) {
                _this.functions.error(_this.strings.alertmaxrecord);
            }
            else {
                if (_this.record.recording == true) {
                    _this.record.media.stopRecord();
                    _this.record.recording = false;
                    _this.stopRecordView.bind(_this)(selector);
                }
                else {
                    _this.record.recording = true;
                    _this.record.media = new Media(path, function (e) {
                        _this.functions.error("Success ", e);
                        _this.addAudio({ id: id, path: path, name: name, selector: selector, idRegistro: idRegistro, idPregunta: idPregunta, max: max });
                    }, _this.functions.error);
                    _this.record.media.startRecord();
                    _this.startRecordView.bind(_this)(selector);
                }
            }
        });
    };
    RecordMedia.prototype.addAudio = function (_a) {
        var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
        // ['id', 'name', 'path', 'idRegistro', 'idPregunta', 'type', 'duration', 'date']
        var date = new Date().getTime();
        this.DB.insert({ id: id, name: name, path: path, idRegistro: idRegistro, idPregunta: idPregunta, 'type': 'audio', 'duration': '4.0', date: date });
        this.addAudioView.bind(this)({ id: id, path: path, name: name, selector: selector, idRegistro: idRegistro, idPregunta: idPregunta, max: max, date: date });
    };
    RecordMedia.prototype.startRecordView = function (selector) {
        document.querySelector(selector + '').innerHTML = this.strings.recording;
        var doc = document.getElementsByClassName('mensaje ' + this.arguments.idRegistro + ' ' + this.arguments.idPregunta)[0];
        doc.style.visibility = 'visible';
    };
    RecordMedia.prototype.stopRecordView = function (selector) {
        document.querySelector(selector + '').innerHTML = this.strings.stoprecord;
        var doc = document.getElementsByClassName('mensaje ' + this.arguments.idRegistro + ' ' + this.arguments.idPregunta)[0];
        doc.style.visibility = 'hidden';
    };
    RecordMedia.prototype.addAudioView = function (audio) {
        var playPauseAudio = this.playPauseAudio.bind(this);
        var removeAudio = this.removeAudio.bind(this);
        var template = this.templateAudio.bind(this)(audio);
        // JS Form
        var reg = document.querySelector('#content-' + audio.idRegistro + '_' + audio.idPregunta);
        if (reg == undefined) {
            var btnAudio = document.querySelector('' + audio.selector);
            var father = btnAudio.parentElement;
            var playList = document.createElement('div');
            playList.id = "content-" + audio.idRegistro + "_" + audio.idPregunta;
            father.insertBefore(playList, btnAudio);
        }
        document.querySelector('#content-' + audio.idRegistro + '_' + audio.idPregunta)
            .insertAdjacentHTML('beforeend', template);
        document.getElementsByClassName('play ' + audio.id)[0]
            .addEventListener('click', function () { return playPauseAudio(audio); }, false);
        document.getElementsByClassName('remove ' + audio.id)[0]
            .addEventListener('click', function () { return removeAudio(audio); }, false);
    };
    RecordMedia.prototype.templateAudio = function (audio) {
        var date = (new Date(audio.date).toISOString()).split('T');
        var time = date[1].split('.')[0];
        var dateStr = date[0] + " " + time;
        return "<div class=\"MediaRecord-media " + audio.id + " " + audio.idRegistro + " " + audio.idPregunta + "\">\n      <div class=\"MediaRecord-buttons-media\">\n        <button data-url=\"" + audio.path + "\" data-name=\"" + audio.name + "\" class=\"play " + audio.id + "\">" + this.icons.playIcon + "</button>\n        <input class=\"range ex1-" + audio.id + "\" type=\"range\" value=\"0\" min=\"0\" max=\"100\"/>\n        <button class=\"remove " + audio.id + "\" >" + this.icons.deleteIcon + "</button>\n      </div>\n      <div class=\"MediaRecord-date\">" + dateStr + "</div>\n    </div>";
    };
    return RecordMedia;
}());
window.RecordMedia = RecordMedia || {};
if (jQuery) {
    (function ($) {
        $.fn.recordMedia = function (_a) {
            var idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, nameServer = _a.nameServer, max = _a.max, cordovaDir = _a.cordovaDir, _b = _a.success, success = _b === void 0 ? function (str) { return console.log(str); } : _b, _c = _a.error, error = _c === void 0 ? function (str) { return console.log(str); } : _c;
            var selector = this.selector;
            var app = new RecordMedia({ idRegistro: idRegistro, idPregunta: idPregunta, max: max, nameServer: nameServer, selector: selector, cordovaDir: cordovaDir });
            // let init = app.init.bind(app);
            app.init({ success: success, error: error });
            // document.addEventListener('deviceready', init , false);
            return { element: this, app: app };
        };
    })(jQuery);
}
