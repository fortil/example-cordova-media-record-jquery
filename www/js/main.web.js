(function(modules) {
    var installedModules = {};
    function __webpack_require__(moduleId) {
        if (installedModules[moduleId]) return installedModules[moduleId].exports;
        var module = installedModules[moduleId] = {
            exports: {},
            id: moduleId,
            loaded: false
        };
        modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
        module.loaded = true;
        return module.exports;
    }
    __webpack_require__.m = modules;
    __webpack_require__.c = installedModules;
    __webpack_require__.p = "";
    return __webpack_require__(0);
})([ function(module, exports, __webpack_require__) {
    "use strict";
    var websql_1 = __webpack_require__(1);
    function MakeId() {
        var text = "";
        var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (var i = 0; i < 15; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
        return text;
    }
    Array.prototype.equals = function(array) {
        if (!array) return false;
        if (this.length != array.length) return false;
        for (var i = 0, l = this.length; i < l; i++) {
            if (this[i] instanceof Array && array[i] instanceof Array) {
                if (!this[i].equals(array[i])) return false;
            } else if (this[i] != array[i]) {
                return false;
            }
        }
        return true;
    };
    Object.defineProperty(Array.prototype, "equals", {
        enumerable: false
    });
    Element.prototype.remove = function() {
        this.parentElement.removeChild(this);
    };
    NodeList.prototype.remove = HTMLCollection.prototype.remove = function() {
        for (var i = this.length - 1; i >= 0; i--) {
            if (this[i] && this[i].parentElement) {
                this[i].parentElement.removeChild(this[i]);
            }
        }
    };
    var RecordMedia = function() {
        function RecordMedia(_a) {
            var idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max, nameServer = _a.nameServer, selector = _a.selector, cordovaDir = _a.cordovaDir;
            this.arguments = {
                selector: selector,
                idRegistro: idRegistro || MakeId(),
                idPregunta: idPregunta || MakeId(),
                max: max || 1e4,
                nameServer: nameServer || undefined
            };
            this.audio = {};
            this.DB;
            this.cordovaDir = cordovaDir || cordova.file.externalDataDirectory;
            this.icons = {
                playIcon: this.getIcon("play_arrow"),
                stopIcon: this.getIcon("pause"),
                deleteIcon: this.getIcon("clear")
            };
            this.strings = {
                recording: "Detener grabación",
                stoprecord: "Grabar audio",
                mjsrecord: "Grabando audio....",
                alertmaxrecord: " Llegó al máximo de grabaciones posibles ",
                dialogconfirm: "Está seguro de eliminar el archivo ",
                fields: "id,name,path,idRegistro,idPregunta,type,duration,date",
                tablename: "RECORDS"
            };
            this.record = {
                recording: false
            };
        }
        RecordMedia.prototype.getIcon = function(icon) {
            return '<i class="material-icons md-18">' + icon + "</i>";
        };
        RecordMedia.prototype.init = function(_a) {
            var _this = this;
            var success = _a.success, error = _a.error;
            var rec = this.recordAudio.bind(this);
            var agrs = this.arguments;
            var btn = document.querySelector(this.arguments.selector);
            btn.addEventListener("click", function(evt) {
                evt.preventDefault();
                rec(agrs);
            }, false);
            this.strings = {
                recording: btn.dataset.recording || this.strings.recording,
                stoprecord: btn.dataset.stoprecord || this.strings.stoprecord,
                mjsrecord: btn.dataset.mjsrecord || this.strings.mjsrecord,
                alertmaxrecord: btn.dataset.alertmaxrecord || this.strings.alertmaxrecord,
                dialogconfirm: btn.dataset.dialogconfirm || this.strings.dialogconfirm,
                fields: btn.dataset.fields || this.strings.fields,
                tablename: btn.dataset.tablename || this.strings.tablename
            };
            this.icons = {
                playIcon: btn.dataset.playicon || this.icons.playIcon,
                stopIcon: btn.dataset.stopicon || this.icons.stopIcon,
                deleteIcon: btn.dataset.deleteicon || this.icons.deleteIcon
            };
            this.functions = {
                success: success,
                error: error
            };
            this.DB = websql_1.SQL({
                name: "RecordMedia",
                description: "Save records media",
                size: 64 * 1024
            });
            this.DB.createTable({
                tableName: this.strings.tablename,
                fields: this.strings.fields.split(",")
            }, function(args) {
                _this.DB = args;
            }, error);
            var divMsj = document.createElement("div");
            divMsj.className = "mensaje alignAbsoluteCenter " + this.arguments.idRegistro + " " + this.arguments.idPregunta;
            divMsj.innerHTML = divMsj.innerHTML + this.strings.mjsrecord;
            btn.parentNode.insertBefore(divMsj, btn);
            this.initView.bind(this)();
        };
        RecordMedia.prototype.initView = function() {
            var _this = this;
            var medias = document.querySelector("#content-" + this.arguments.idRegistro + "_" + this.arguments.idPregunta);
            if (medias != undefined) medias.innerHTML = "";
            var idRegistro = this.arguments.idRegistro;
            var idPregunta = this.arguments.idPregunta;
            this.DB.getVal({
                idPregunta: idPregunta,
                idRegistro: idRegistro
            }, function(tx, songs) {
                if (songs.length > 0) {
                    for (var i = 0; i < songs.length; i++) {
                        songs[i].selector = _this.arguments.selector;
                        songs[i].max = _this.arguments.max;
                        _this.addAudioView(songs[i]);
                    }
                }
            }, this.functions.error);
        };
        RecordMedia.prototype.changeIconView = function(id, icon) {
            document.getElementsByClassName("play " + id)[0].innerHTML = icon;
        };
        RecordMedia.prototype.playPauseAudio = function(_a) {
            var _this = this;
            var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
            var playIcon = this.icons.playIcon;
            var stopIcon = this.icons.stopIcon;
            var element = document.getElementsByClassName("range ex1-" + id)[0];
            var dur = 100;
            var mediaTimer = function() {};
            var playStateFunc = function() {
                _this.audio.id = id;
                _this.audio.estado = "play";
                _this.audio.media.play();
                _this.changeIconView(id, stopIcon);
                mediaTimer = setInterval(function() {
                    dur = _this.audio.media.getDuration() * 100;
                    dur = dur <= 0 ? -1 * dur : dur;
                    element.max = dur;
                    _this.audio.media.getCurrentPosition(function(position) {
                        _this.audio.pos = position * 100;
                        if (_this.audio.pos <= 0) {
                            stopStateFunc(0);
                        } else if (_this.audio.estado == "pause") {
                            stopStateFunc(_this.audio.pos);
                        } else {
                            element.value = _this.audio.pos;
                        }
                    }, _this.functions.error);
                    if (dur == 0 || _this.audio.estado == "pause") {
                        stopStateFunc(0);
                    }
                }, 500);
            };
            var stopStateFunc = function(pos) {
                _this.audio.estado = "pause";
                _this.audio.media.pause();
                clearInterval(mediaTimer);
                element.value = typeof pos == "number" ? pos : _this.audio.pos;
                _this.changeIconView(id, playIcon);
            };
            if (this.audio && this.audio.id == id && this.audio.estado != "pause") {
                stopStateFunc(0);
            } else if (this.audio && this.audio.id == id && this.audio.estado == "pause") {
                playStateFunc();
            } else {
                this.audio = {};
                this.audio.media = new Media(path, function(e) {
                    console.log("Success ", e);
                    _this.changeIconView(id, stopIcon);
                }, function(err) {
                    console.log("err ", err);
                    _this.changeIconView(id, playIcon);
                }, function(e) {
                    if (e == 3) {
                        stopStateFunc(_this.audio.media._position * 100);
                    } else if (e == 4) {
                        _this.DB.update({
                            id: id
                        }, {
                            duration: _this.audio.media._duration
                        });
                        stopStateFunc(0);
                    }
                });
                playStateFunc();
            }
        };
        RecordMedia.prototype.removeAudio = function(_a) {
            var _this = this;
            var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
            if (confirm(this.strings.dialogconfirm + " " + name)) {
                resolveLocalFileSystemURL(this.cordovaDir, function(dir) {
                    dir.getFile(name, {
                        create: true
                    }, function(file) {
                        file.remove(function(files) {
                            _this.DB.deleted({
                                id: id
                            }, function(tx, res) {
                                if (res.rowsAffected > 0) {
                                    document.getElementsByClassName("MediaRecord-media " + id)[0].remove();
                                    _this.functions.success(res);
                                }
                            });
                        }, _this.functions.error);
                    });
                });
            }
        };
        RecordMedia.prototype.recordAudio = function(_a) {
            var _this = this;
            var selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
            var store = this.cordovaDir;
            var id = Date.now();
            var name = idRegistro + "_" + idPregunta + "__" + id + ".amr";
            var path = store + name;
            this.DB.getVal(null, function(tx, songs) {
                var lengthSongs = songs.length || (typeof songs == "object" ? Object.keys(songs).length : 0);
                if (lengthSongs >= max) {
                    _this.functions.error(_this.strings.alertmaxrecord);
                } else {
                    if (_this.record.recording == true) {
                        _this.record.media.stopRecord();
                        _this.record.recording = false;
                        _this.stopRecordView.bind(_this)(selector);
                    } else {
                        _this.record.recording = true;
                        _this.record.media = new Media(path, function(e) {
                            _this.functions.error("Success ", e);
                            _this.addAudio({
                                id: id,
                                path: path,
                                name: name,
                                selector: selector,
                                idRegistro: idRegistro,
                                idPregunta: idPregunta,
                                max: max
                            });
                        }, _this.functions.error);
                        _this.record.media.startRecord();
                        _this.startRecordView.bind(_this)(selector);
                    }
                }
            });
        };
        RecordMedia.prototype.addAudio = function(_a) {
            var id = _a.id, path = _a.path, name = _a.name, selector = _a.selector, idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, max = _a.max;
            var date = new Date().getTime();
            this.DB.insert({
                id: id,
                name: name,
                path: path,
                idRegistro: idRegistro,
                idPregunta: idPregunta,
                type: "audio",
                duration: "4.0",
                date: date
            });
            this.addAudioView.bind(this)({
                id: id,
                path: path,
                name: name,
                selector: selector,
                idRegistro: idRegistro,
                idPregunta: idPregunta,
                max: max,
                date: date
            });
        };
        RecordMedia.prototype.startRecordView = function(selector) {
            document.querySelector(selector + "").innerHTML = this.strings.recording;
            var doc = document.getElementsByClassName("mensaje " + this.arguments.idRegistro + " " + this.arguments.idPregunta)[0];
            doc.style.visibility = "visible";
        };
        RecordMedia.prototype.stopRecordView = function(selector) {
            document.querySelector(selector + "").innerHTML = this.strings.stoprecord;
            var doc = document.getElementsByClassName("mensaje " + this.arguments.idRegistro + " " + this.arguments.idPregunta)[0];
            doc.style.visibility = "hidden";
        };
        RecordMedia.prototype.addAudioView = function(audio) {
            var playPauseAudio = this.playPauseAudio.bind(this);
            var removeAudio = this.removeAudio.bind(this);
            var template = this.templateAudio.bind(this)(audio);
            var reg = document.querySelector("#content-" + audio.idRegistro + "_" + audio.idPregunta);
            if (reg == undefined) {
                var btnAudio = document.querySelector("" + audio.selector);
                var father = btnAudio.parentElement;
                var playList = document.createElement("div");
                playList.id = "content-" + audio.idRegistro + "_" + audio.idPregunta;
                father.insertBefore(playList, btnAudio);
            }
            document.querySelector("#content-" + audio.idRegistro + "_" + audio.idPregunta).insertAdjacentHTML("beforeend", template);
            document.getElementsByClassName("play " + audio.id)[0].addEventListener("click", function() {
                return playPauseAudio(audio);
            }, false);
            document.getElementsByClassName("remove " + audio.id)[0].addEventListener("click", function() {
                return removeAudio(audio);
            }, false);
        };
        RecordMedia.prototype.templateAudio = function(audio) {
            var date = new Date(audio.date).toISOString().split("T");
            var time = date[1].split(".")[0];
            var dateStr = date[0] + " " + time;
            return '<div class="MediaRecord-media ' + audio.id + " " + audio.idRegistro + " " + audio.idPregunta + '">\n      <div class="MediaRecord-buttons-media">\n        <button data-url="' + audio.path + '" data-name="' + audio.name + '" class="play ' + audio.id + '">' + this.icons.playIcon + '</button>\n        <input class="range ex1-' + audio.id + '" type="range" value="0" min="0" max="100"/>\n        <button class="remove ' + audio.id + '" >' + this.icons.deleteIcon + '</button>\n      </div>\n      <div class="MediaRecord-date">' + dateStr + "</div>\n    </div>";
        };
        return RecordMedia;
    }();
    window.RecordMedia = RecordMedia || {};
    if (jQuery) {
        (function($) {
            $.fn.recordMedia = function(_a) {
                var idRegistro = _a.idRegistro, idPregunta = _a.idPregunta, nameServer = _a.nameServer, max = _a.max, cordovaDir = _a.cordovaDir, _b = _a.success, success = _b === void 0 ? function(str) {
                    return console.log(str);
                } : _b, _c = _a.error, error = _c === void 0 ? function(str) {
                    return console.log(str);
                } : _c;
                var selector = this.selector;
                var app = new RecordMedia({
                    idRegistro: idRegistro,
                    idPregunta: idPregunta,
                    max: max,
                    nameServer: nameServer,
                    selector: selector,
                    cordovaDir: cordovaDir
                });
                app.init({
                    success: success,
                    error: error
                });
                return {
                    element: this,
                    app: app
                };
            };
        })(jQuery);
    }
}, function(module, exports) {
    "use strict";
    var __assign = this && this.__assign || Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
        }
        return t;
    };
    function SQL(config) {
        var dataName = config.name;
        var version = config.version || "1.0.0";
        var description = config.description || "SQL DB";
        var size = config.size || 64 * 1024;
        var tableName = null;
        var fields = "";
        var res = {
            dataName: dataName,
            version: version,
            description: description,
            size: size,
            tableName: tableName,
            fields: fields,
            db: openDatabase(dataName, version, description, size),
            createTable: function(params, success, error) {
                var _this = this;
                if (success === void 0) {
                    success = function(res) {
                        return console.log(res, "ok createTable");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log(e, "error createTable");
                    };
                }
                this.tableName = params.tableName;
                var tableName = params.tableName;
                var flds = params.fields;
                for (var i = 0; i < flds.length; i++) this.fields += i == 0 ? flds[i] : ", " + flds[i];
                this.db.transaction(function(tx) {
                    tx.executeSql("CREATE TABLE IF NOT EXISTS " + tableName + " (" + _this.fields + ")", [], function(tx, res) {
                        return success(__assign({
                            tx: tx,
                            res: res
                        }, _this));
                    }, error);
                });
            },
            insert: function(records, success, error) {
                var _this = this;
                if (success === void 0) {
                    success = function(tx, result) {
                        return console.log(result, "ok insert");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log("error insert", e);
                    };
                }
                var keysRecords = Object.keys(records || {});
                var lengthKeysRecords = keysRecords.length;
                if (lengthKeysRecords > this.fields.split(",").length && lengthKeysRecords < this.fields.split(",").length) error("Error:", "La cantidad de valores a ingresar no es la misma que los campos de la tabla.\nCampos: " + this.fields + " "); else if (!records || lengthKeysRecords <= 0) error("Error:", "Ingrese un objeto con las keys correspondientes, ej; {id:1, data1:2}"); else {
                    this.db.transaction(function(tx) {
                        var values = "";
                        var keys = [];
                        for (var i = 0; i < lengthKeysRecords; i++) {
                            values += i == 0 ? "?" : ", ?";
                            keys.push(records[keysRecords[i]]);
                        }
                        tx.executeSql("INSERT INTO " + _this.tableName + " (" + _this.fields + ") VALUES (" + values + ")", keys, success, error);
                    });
                }
            },
            insertValues: function(records, success, error) {
                var _this = this;
                if (success === void 0) {
                    success = function(tx, result) {
                        return console.log(result, "ok insert values");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log("error insert values", e);
                    };
                }
                if (records.length <= 0) error("Erro", "Inserte objetos "); else {
                    var count = 0;
                    var errors_1 = [];
                    var ress = void 0, txx = void 0;
                    var fn_1 = function(cant) {
                        _this.insert(records[cant], function(tx, res) {
                            if (cant >= records.length - 1) success(tx, res); else fn_1(cant + 1);
                        }, function(tx, err) {
                            if (cant >= records.length) {
                                errors_1.push(err);
                                error(tx, errors_1);
                            } else {
                                errors_1.push(err);
                                fn_1(cant + 1);
                            }
                        });
                    };
                    fn_1(count);
                }
            },
            generateStrings: function(a, value, key) {
                var vals = [];
                var fds = "";
                if (typeof value == "object" && value.OR && value.OR.length > 0) {
                    for (var e = 0; e < value.OR.length; ++e) {
                        fds += e == 0 ? "( " + key + " = ? " : e == value.OR.length - 1 ? " OR " + key + " = ? )" : " OR " + key + " = ? ";
                        vals.push(value.OR[e]);
                    }
                }
                if (typeof value == "object" && value.AND && value.AND.length > 0) {
                    for (var e = 0; e < value.AND.length; ++e) {
                        fds += e == 0 ? "( " + key + " = ? " : e == value.AND.length - 1 ? " AND " + key + " = ? )" : " AND " + key + " = ? ";
                        vals.push(value.AND[e]);
                    }
                }
                if (typeof value != "object") {
                    fds += a == 0 ? key + " = ? " : " AND " + key + " = ? ";
                    vals.push(value);
                }
                return {
                    vals: vals,
                    fds: fds
                };
            },
            deleted: function(values, success, error) {
                var _this = this;
                if (success === void 0) {
                    success = function(tx, result) {
                        return console.log(result, "ok deleted");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log("error deleted", e);
                    };
                }
                var keysValues = Object.keys(values || {});
                var lengthKeysValues = keysValues.length;
                if (values != null && typeof values != "object" || lengthKeysValues <= 0) {
                    error("Error:", "Ningún campo para eliminar");
                } else {
                    var vals_1 = [];
                    var fds_1 = "";
                    for (var i = 0; i < lengthKeysValues; i++) {
                        var obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);
                        fds_1 += obj.fds;
                        vals_1.push.apply(vals_1, obj.vals);
                    }
                    this.db.transaction(function(tx) {
                        return tx.executeSql("DELETE FROM " + _this.tableName + " WHERE " + fds_1, vals_1, success, error);
                    });
                }
            },
            getVal: function(values, success, error) {
                var _this = this;
                if (success === void 0) {
                    success = function(tx, result) {
                        return console.log(result, "ok getVal");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log("error getVal", e);
                    };
                }
                this.db.transaction(function(tx) {
                    var sqlString = "SELECT * FROM " + _this.tableName;
                    var fields = Object.keys(values || {});
                    if (values && typeof values == "object" && fields.length >= 0) {
                        var vals = [];
                        var fds = "";
                        for (var i = 0; i < fields.length; i++) {
                            var obj = _this.generateStrings(i, values[fields[i]], fields[i]);
                            fds += obj.fds;
                            vals.push.apply(vals, obj.vals);
                        }
                        sqlString += " WHERE " + fds;
                        tx.executeSql(sqlString, vals, function(tx, results) {
                            if (results.rows.length <= 0) success(tx, []); else {
                                var resultsArray = [];
                                for (var e = 0; e < results.rows.length; ++e) resultsArray.push(results.rows[e]);
                                success(tx, resultsArray);
                            }
                        }, error);
                    } else {
                        tx.executeSql(sqlString, [], function(tx, results) {
                            if (results.rows.length == 0) success(tx, []); else {
                                var resultsArray = [];
                                for (var e = 0; e < results.rows.length; ++e) resultsArray.push(results.rows[e]);
                                success(tx, resultsArray);
                            }
                        }, error);
                    }
                });
            },
            update: function(values, updates, success, error) {
                if (success === void 0) {
                    success = function(tx, result) {
                        return console.log(result, "ok getVal");
                    };
                }
                if (error === void 0) {
                    error = function(tx, e) {
                        return console.log("error getVal", e);
                    };
                }
                var keysValues = values == null ? "all" : Object.keys(values);
                var keysUpdates = Object.keys(updates || {});
                var lengthKeysValues = keysValues.length;
                if (typeof values == "string" && values != "all" || lengthKeysValues <= 0) {
                    error("Error:", "Ningún campo para eliminar");
                } else {
                    var vals_2 = [];
                    var fds = "";
                    var upFds = "";
                    var sqlString_1 = "UPDATE " + this.tableName;
                    for (var e = 0; e < keysUpdates.length; ++e) {
                        upFds += e == 0 ? " " + keysUpdates[e] + " = ? " : " , " + keysUpdates[e] + " = ? ";
                        vals_2.push(updates[keysUpdates[e]]);
                    }
                    sqlString_1 += " SET " + upFds;
                    if (typeof values != "string") {
                        for (var i = 0; i < lengthKeysValues; i++) {
                            var obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);
                            fds += obj.fds;
                            vals_2.push.apply(vals_2, obj.vals);
                        }
                        sqlString_1 += " WHERE " + fds;
                    }
                    this.db.transaction(function(tx) {
                        return tx.executeSql(sqlString_1, vals_2, success, error);
                    });
                }
            }
        };
        var espy = function(fn) {
            return function() {
                var arg = [];
                for (var _i = 0; _i < arguments.length; _i++) {
                    arg[_i] = arguments[_i];
                }
                return fn.apply(res, arg);
            };
        };
        res.createTable = espy(res.createTable);
        res.insert = espy(res.insert);
        res.update = espy(res.update);
        res.getVal = espy(res.getVal);
        res.deleted = espy(res.deleted);
        return res;
    }
    exports.SQL = SQL;
} ]);