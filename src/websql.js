"use strict";
var __assign = (this && this.__assign) || Object.assign || function(t) {
    for (var s, i = 1, n = arguments.length; i < n; i++) {
        s = arguments[i];
        for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
            t[p] = s[p];
    }
    return t;
};
// Data contructor (FP pattern)
function SQL(config) {
    var dataName = config.name;
    var version = config.version || '1.0.0';
    var description = config.description || 'SQL DB';
    var size = config.size || (64 * 1024);
    var tableName = null;
    var fields = '';
    var res = {
        dataName: dataName,
        version: version,
        description: description,
        size: size,
        tableName: tableName,
        fields: fields,
        db: openDatabase(dataName, version, description, size),
        /*
        * Recive un objeto "params" donde este tiene
        * name: el nombre de la tabla y
        * fields: un array de los campos que la tabla tendrá
        * Opcionalmente recibe un callback de un resultado positivo
        * y una función de un posible error
        */
        createTable: function (params, success, error) {
            var _this = this;
            if (success === void 0) { success = function (res) { return console.log(res, 'ok createTable'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log(e, 'error createTable'); }; }
            this.tableName = params.tableName;
            var tableName = params.tableName;
            var flds = params.fields;
            for (var i = 0; i < flds.length; i++)
                this.fields += (i == 0 ? flds[i] : ", " + flds[i]);
            this.db.transaction(function (tx) {
                tx.executeSql("CREATE TABLE IF NOT EXISTS " + tableName + " (" + _this.fields + ")", [], function (tx, res) { return success(__assign({ tx: tx, res: res }, _this)); }, error);
            });
        },
        /*
        * Recive un objeto "records" en el cual se especifica
        * la key es el campo a ingresar y el valor de la key el valor del campo
        * Ej: { id: 1, data1: 2, data2: 3 }
        */
        insert: function (records, success, error) {
            var _this = this;
            if (success === void 0) { success = function (tx, result) { return console.log(result, 'ok insert'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log("error insert", e); }; }
            var keysRecords = Object.keys(records || {});
            var lengthKeysRecords = keysRecords.length;
            if (lengthKeysRecords > this.fields.split(',').length && lengthKeysRecords < this.fields.split(',').length)
                error('Error:', "La cantidad de valores a ingresar no es la misma que los campos de la tabla.\nCampos: " + this.fields + " ");
            else if (!records || lengthKeysRecords <= 0)
                error('Error:', 'Ingrese un objeto con las keys correspondientes, ej; {id:1, data1:2}');
            else {
                this.db.transaction(function (tx) {
                    var values = "";
                    var keys = [];
                    for (var i = 0; i < lengthKeysRecords; i++) {
                        values += (i == 0 ? "?" : ", ?");
                        keys.push(records[keysRecords[i]]);
                    }
                    tx.executeSql("INSERT INTO " + _this.tableName + " (" + _this.fields + ") VALUES (" + values + ")", keys, success, error);
                });
            }
        },
        /*
        * Recive un array con los objetos del insert
        */
        insertValues: function (records, success, error) {
            var _this = this;
            if (success === void 0) { success = function (tx, result) { return console.log(result, 'ok insert values'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log("error insert values", e); }; }
            if (records.length <= 0)
                error('Erro', 'Inserte objetos ');
            else {
                var count = 0;
                var errors_1 = [];
                var ress = void 0, txx = void 0;
                var fn_1 = function (cant) {
                    _this.insert(records[cant], function (tx, res) {
                        if (cant >= (records.length - 1))
                            success(tx, res);
                        else
                            fn_1(cant + 1);
                    }, function (tx, err) {
                        if (cant >= records.length) {
                            errors_1.push(err);
                            error(tx, errors_1);
                        }
                        else {
                            errors_1.push(err);
                            fn_1(cant + 1);
                        }
                    });
                };
                fn_1(count);
            }
        },
        generateStrings: function (a, value, key) {
            var vals = [];
            var fds = '';
            if (typeof value == 'object' && value.OR && value.OR.length > 0) {
                for (var e = 0; e < value.OR.length; ++e) {
                    fds += (e == 0 ? "( " + key + " = ? " : e == (value.OR.length - 1) ? " OR " + key + " = ? )" : " OR " + key + " = ? ");
                    vals.push(value.OR[e]);
                }
            }
            if (typeof value == 'object' && value.AND && value.AND.length > 0) {
                for (var e = 0; e < value.AND.length; ++e) {
                    fds += (e == 0 ? "( " + key + " = ? " : e == (value.AND.length - 1) ? " AND " + key + " = ? )" : " AND " + key + " = ? ");
                    vals.push(value.AND[e]);
                }
            }
            if (typeof value != 'object') {
                fds += (a == 0 ? key + " = ? " : " AND " + key + " = ? ");
                vals.push(value);
            }
            return { vals: vals, fds: fds };
        },
        /*
        * Recive un objeto "records" en el cual se especifica
        * la key es el campo por el cual se eliminará la data y el valor es
        * al que tendrá que hacer referencia del campo guardado
        * Ej: { id: 1, data1: 2} = 'WHERE id = 1 AND data1 = 2' o { id: { AND:[1, 2] } } = 'WHERE id = 1 AND id = 2'
        * { id: { OR: [1, 2] }, data2: 2 } = 'WHERE id = 1 OR id = 2 AND data2 = 2'
        */
        deleted: function (values, success, error) {
            var _this = this;
            if (success === void 0) { success = function (tx, result) { return console.log(result, 'ok deleted'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log("error deleted", e); }; }
            var keysValues = Object.keys(values || {});
            var lengthKeysValues = keysValues.length;
            if ((values != null && typeof values != 'object') || lengthKeysValues <= 0) {
                error('Error:', 'Ningún campo para eliminar');
            }
            else {
                var vals_1 = [];
                var fds_1 = '';
                for (var i = 0; i < lengthKeysValues; i++) {
                    var obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);
                    fds_1 += obj.fds;
                    vals_1.push.apply(vals_1, obj.vals);
                }
                this.db.transaction(function (tx) { return tx.executeSql("DELETE FROM " + _this.tableName + " WHERE " + fds_1, vals_1, success, error); });
            }
        },
        /*
        * Recive un objeto "records" en el cual se especifica
        * la key es el campo por el cual se obtendrá la data y el valor es
        * al que tendrá que hacer referencia del campo guardado, si no se especifica nada se optienen todos los valores
        * Ej: { id: 1, data1: 2} = 'WHERE id = 1 AND data1 = 2' o { id: { AND:[1, 2] } } = 'WHERE id = 1 AND id = 2'
        * { id: { OR: [1, 2] }, data2: 2 } = 'WHERE id = 1 OR id = 2 AND data2 = 2'
        * * return a Array for the function success calback
        */
        getVal: function (values, success, error) {
            var _this = this;
            if (success === void 0) { success = function (tx, result) { return console.log(result, 'ok getVal'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log("error getVal", e); }; }
            this.db.transaction(function (tx) {
                var sqlString = "SELECT * FROM " + _this.tableName;
                var fields = Object.keys(values || {});
                if (values && typeof values == 'object' && fields.length >= 0) {
                    var vals = [];
                    var fds = '';
                    for (var i = 0; i < fields.length; i++) {
                        var obj = _this.generateStrings(i, values[fields[i]], fields[i]);
                        fds += obj.fds;
                        vals.push.apply(vals, obj.vals);
                    }
                    sqlString += " WHERE " + fds;
                    tx.executeSql(sqlString, vals, function (tx, results) {
                        if (results.rows.length <= 0)
                            success(tx, []);
                        else {
                            var resultsArray = [];
                            for (var e = 0; e < results.rows.length; ++e)
                                resultsArray.push(results.rows[e]);
                            success(tx, resultsArray);
                        }
                    }, error);
                }
                else {
                    tx.executeSql(sqlString, [], function (tx, results) {
                        if (results.rows.length == 0)
                            success(tx, []);
                        else {
                            var resultsArray = [];
                            for (var e = 0; e < results.rows.length; ++e)
                                resultsArray.push(results.rows[e]);
                            success(tx, resultsArray);
                        }
                    }, error);
                }
            });
        },
        update: function (values, updates, success, error) {
            if (success === void 0) { success = function (tx, result) { return console.log(result, 'ok getVal'); }; }
            if (error === void 0) { error = function (tx, e) { return console.log("error getVal", e); }; }
            //`UPDATE FILES SET name = ?, fullPath = ?, version = ?, date = ? WHERE id = ?`  
            var keysValues = values == null ? 'all' : Object.keys(values);
            var keysUpdates = Object.keys(updates || {});
            var lengthKeysValues = keysValues.length;
            if ((typeof values == 'string' && values != 'all') || lengthKeysValues <= 0) {
                error('Error:', 'Ningún campo para eliminar');
            }
            else {
                var vals_2 = [];
                var fds = '';
                var upFds = '';
                var sqlString_1 = "UPDATE " + this.tableName;
                for (var e = 0; e < keysUpdates.length; ++e) {
                    upFds += (e == 0 ? " " + keysUpdates[e] + " = ? " : " , " + keysUpdates[e] + " = ? ");
                    vals_2.push(updates[keysUpdates[e]]);
                }
                sqlString_1 += " SET " + upFds;
                if (typeof values != 'string') {
                    for (var i = 0; i < lengthKeysValues; i++) {
                        var obj = this.generateStrings(i, values[keysValues[i]], keysValues[i]);
                        fds += obj.fds;
                        vals_2.push.apply(vals_2, obj.vals);
                    }
                    sqlString_1 += " WHERE " + fds;
                }
                this.db.transaction(function (tx) { return tx.executeSql(sqlString_1, vals_2, success, error); });
            }
        }
    };
    var espy = function (fn) { return function () {
        var arg = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            arg[_i] = arguments[_i];
        }
        return fn.apply(res, arg);
    }; };
    res.createTable = espy(res.createTable);
    res.insert = espy(res.insert);
    res.update = espy(res.update);
    res.getVal = espy(res.getVal);
    res.deleted = espy(res.deleted);
    return res;
}
exports.SQL = SQL;
