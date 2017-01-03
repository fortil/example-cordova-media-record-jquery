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
    var GenerateHashS3_1 = __webpack_require__(1);
    var CalculateMD5Hash_1 = __webpack_require__(61);
    var GetMime_1 = __webpack_require__(62);
    function s3Uploader(conf, md5, successCB, errorCB) {
        if (successCB === void 0) {
            successCB = function(res) {
                console.log(res);
            };
        }
        if (errorCB === void 0) {
            errorCB = function(err) {
                console.log(err);
            };
        }
        CalculateMD5Hash_1.calculateMD5Hash(conf.imageUrl, function(hashMD5) {
            var Hash = new GenerateHashS3_1.GenerateHashS3(conf.bucket, conf.secret, conf.awsKey);
            var data = Hash.generate(conf.folder + conf.fileName, conf.folder, md5 && md5 == true ? hashMD5 : false);
            var mime = new GetMime_1.GetMime();
            var params = {
                key: conf.folder + conf.fileName,
                AWSAccessKeyId: data.awsKey,
                acl: "public-read",
                policy: data.policyBase64,
                signature: data.signature,
                "Content-Type": mime.byExt(conf.fileName)
            };
            if (md5 && md5 == true) {
                params["Content-MD5"] = hashMD5;
            }
            var options = new FileUploadOptions();
            options.fileKey = "file";
            var fileName = params.key.split("/")[1];
            options.fileName = fileName;
            options.mimeType = params["Content-Type"];
            options.chunkedMode = false;
            options.httpMethod = "POST";
            var uri = encodeURI(conf.urlServer);
            if (conf.headers) {
                var headers = conf.headers;
                options.headers = headers;
                delete params.headers;
            }
            options.params = params;
            var ft = new FileTransfer();
            ft.upload(conf.filePath, uri, successCB, errorCB, options);
        });
    }
    window.s3Uploader = s3Uploader || {};
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        "use strict";
        var CryptoS3 = __webpack_require__(6);
        var GenerateHashS3 = function() {
            function GenerateHashS3(bucket, secret, awsKey) {
                if (bucket === void 0) {
                    bucket = "bucket";
                }
                if (secret === void 0) {
                    secret = "/HKbiTbg1";
                }
                if (awsKey === void 0) {
                    awsKey = "";
                }
                this.bucket = bucket;
                this.secret = secret;
                this.awsKey = awsKey;
            }
            GenerateHashS3.prototype.generate = function(fileName, folder, md5) {
                if (folder === void 0) {
                    folder = "test/";
                }
                var expiration = new Date(new Date("2020-10-29T22:55:11.186Z").getTime() + 1e3 * 60 * 60 * 5).toISOString();
                var policy = {
                    expiration: expiration,
                    conditions: [ {
                        bucket: this.bucket
                    }, {
                        key: fileName
                    }, [ "starts-with", "$key", folder ], {
                        acl: "public-read"
                    }, [ "starts-with", "$Content-Type", "" ], [ "content-length-range", 0, 10485760 ] ]
                };
                if (md5 && md5 != false) policy.conditions.push([ "starts-with", "$Content-MD5", "" ]);
                var policyBase64 = new Buffer(JSON.stringify(policy), "utf8").toString("base64");
                var bucket = this.bucket;
                var awsKey = this.awsKey;
                var signature = CryptoS3.createHmac("sha1", this.secret).update(policyBase64).digest("base64");
                return {
                    bucket: bucket,
                    awsKey: awsKey,
                    policyBase64: policyBase64,
                    signature: signature
                };
            };
            return GenerateHashS3;
        }();
        exports.GenerateHashS3 = GenerateHashS3;
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(global) {
        "use strict";
        var base64 = __webpack_require__(3);
        var ieee754 = __webpack_require__(4);
        var isArray = __webpack_require__(5);
        exports.Buffer = Buffer;
        exports.SlowBuffer = SlowBuffer;
        exports.INSPECT_MAX_BYTES = 50;
        Buffer.TYPED_ARRAY_SUPPORT = global.TYPED_ARRAY_SUPPORT !== undefined ? global.TYPED_ARRAY_SUPPORT : typedArraySupport();
        exports.kMaxLength = kMaxLength();
        function typedArraySupport() {
            try {
                var arr = new Uint8Array(1);
                arr.__proto__ = {
                    __proto__: Uint8Array.prototype,
                    foo: function() {
                        return 42;
                    }
                };
                return arr.foo() === 42 && typeof arr.subarray === "function" && arr.subarray(1, 1).byteLength === 0;
            } catch (e) {
                return false;
            }
        }
        function kMaxLength() {
            return Buffer.TYPED_ARRAY_SUPPORT ? 2147483647 : 1073741823;
        }
        function createBuffer(that, length) {
            if (kMaxLength() < length) {
                throw new RangeError("Invalid typed array length");
            }
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                that = new Uint8Array(length);
                that.__proto__ = Buffer.prototype;
            } else {
                if (that === null) {
                    that = new Buffer(length);
                }
                that.length = length;
            }
            return that;
        }
        function Buffer(arg, encodingOrOffset, length) {
            if (!Buffer.TYPED_ARRAY_SUPPORT && !(this instanceof Buffer)) {
                return new Buffer(arg, encodingOrOffset, length);
            }
            if (typeof arg === "number") {
                if (typeof encodingOrOffset === "string") {
                    throw new Error("If encoding is specified then the first argument must be a string");
                }
                return allocUnsafe(this, arg);
            }
            return from(this, arg, encodingOrOffset, length);
        }
        Buffer.poolSize = 8192;
        Buffer._augment = function(arr) {
            arr.__proto__ = Buffer.prototype;
            return arr;
        };
        function from(that, value, encodingOrOffset, length) {
            if (typeof value === "number") {
                throw new TypeError('"value" argument must not be a number');
            }
            if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
                return fromArrayBuffer(that, value, encodingOrOffset, length);
            }
            if (typeof value === "string") {
                return fromString(that, value, encodingOrOffset);
            }
            return fromObject(that, value);
        }
        Buffer.from = function(value, encodingOrOffset, length) {
            return from(null, value, encodingOrOffset, length);
        };
        if (Buffer.TYPED_ARRAY_SUPPORT) {
            Buffer.prototype.__proto__ = Uint8Array.prototype;
            Buffer.__proto__ = Uint8Array;
            if (typeof Symbol !== "undefined" && Symbol.species && Buffer[Symbol.species] === Buffer) {
                Object.defineProperty(Buffer, Symbol.species, {
                    value: null,
                    configurable: true
                });
            }
        }
        function assertSize(size) {
            if (typeof size !== "number") {
                throw new TypeError('"size" argument must be a number');
            } else if (size < 0) {
                throw new RangeError('"size" argument must not be negative');
            }
        }
        function alloc(that, size, fill, encoding) {
            assertSize(size);
            if (size <= 0) {
                return createBuffer(that, size);
            }
            if (fill !== undefined) {
                return typeof encoding === "string" ? createBuffer(that, size).fill(fill, encoding) : createBuffer(that, size).fill(fill);
            }
            return createBuffer(that, size);
        }
        Buffer.alloc = function(size, fill, encoding) {
            return alloc(null, size, fill, encoding);
        };
        function allocUnsafe(that, size) {
            assertSize(size);
            that = createBuffer(that, size < 0 ? 0 : checked(size) | 0);
            if (!Buffer.TYPED_ARRAY_SUPPORT) {
                for (var i = 0; i < size; ++i) {
                    that[i] = 0;
                }
            }
            return that;
        }
        Buffer.allocUnsafe = function(size) {
            return allocUnsafe(null, size);
        };
        Buffer.allocUnsafeSlow = function(size) {
            return allocUnsafe(null, size);
        };
        function fromString(that, string, encoding) {
            if (typeof encoding !== "string" || encoding === "") {
                encoding = "utf8";
            }
            if (!Buffer.isEncoding(encoding)) {
                throw new TypeError('"encoding" must be a valid string encoding');
            }
            var length = byteLength(string, encoding) | 0;
            that = createBuffer(that, length);
            var actual = that.write(string, encoding);
            if (actual !== length) {
                that = that.slice(0, actual);
            }
            return that;
        }
        function fromArrayLike(that, array) {
            var length = array.length < 0 ? 0 : checked(array.length) | 0;
            that = createBuffer(that, length);
            for (var i = 0; i < length; i += 1) {
                that[i] = array[i] & 255;
            }
            return that;
        }
        function fromArrayBuffer(that, array, byteOffset, length) {
            array.byteLength;
            if (byteOffset < 0 || array.byteLength < byteOffset) {
                throw new RangeError("'offset' is out of bounds");
            }
            if (array.byteLength < byteOffset + (length || 0)) {
                throw new RangeError("'length' is out of bounds");
            }
            if (byteOffset === undefined && length === undefined) {
                array = new Uint8Array(array);
            } else if (length === undefined) {
                array = new Uint8Array(array, byteOffset);
            } else {
                array = new Uint8Array(array, byteOffset, length);
            }
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                that = array;
                that.__proto__ = Buffer.prototype;
            } else {
                that = fromArrayLike(that, array);
            }
            return that;
        }
        function fromObject(that, obj) {
            if (Buffer.isBuffer(obj)) {
                var len = checked(obj.length) | 0;
                that = createBuffer(that, len);
                if (that.length === 0) {
                    return that;
                }
                obj.copy(that, 0, 0, len);
                return that;
            }
            if (obj) {
                if (typeof ArrayBuffer !== "undefined" && obj.buffer instanceof ArrayBuffer || "length" in obj) {
                    if (typeof obj.length !== "number" || isnan(obj.length)) {
                        return createBuffer(that, 0);
                    }
                    return fromArrayLike(that, obj);
                }
                if (obj.type === "Buffer" && isArray(obj.data)) {
                    return fromArrayLike(that, obj.data);
                }
            }
            throw new TypeError("First argument must be a string, Buffer, ArrayBuffer, Array, or array-like object.");
        }
        function checked(length) {
            if (length >= kMaxLength()) {
                throw new RangeError("Attempt to allocate Buffer larger than maximum " + "size: 0x" + kMaxLength().toString(16) + " bytes");
            }
            return length | 0;
        }
        function SlowBuffer(length) {
            if (+length != length) {
                length = 0;
            }
            return Buffer.alloc(+length);
        }
        Buffer.isBuffer = function isBuffer(b) {
            return !!(b != null && b._isBuffer);
        };
        Buffer.compare = function compare(a, b) {
            if (!Buffer.isBuffer(a) || !Buffer.isBuffer(b)) {
                throw new TypeError("Arguments must be Buffers");
            }
            if (a === b) return 0;
            var x = a.length;
            var y = b.length;
            for (var i = 0, len = Math.min(x, y); i < len; ++i) {
                if (a[i] !== b[i]) {
                    x = a[i];
                    y = b[i];
                    break;
                }
            }
            if (x < y) return -1;
            if (y < x) return 1;
            return 0;
        };
        Buffer.isEncoding = function isEncoding(encoding) {
            switch (String(encoding).toLowerCase()) {
              case "hex":
              case "utf8":
              case "utf-8":
              case "ascii":
              case "latin1":
              case "binary":
              case "base64":
              case "ucs2":
              case "ucs-2":
              case "utf16le":
              case "utf-16le":
                return true;

              default:
                return false;
            }
        };
        Buffer.concat = function concat(list, length) {
            if (!isArray(list)) {
                throw new TypeError('"list" argument must be an Array of Buffers');
            }
            if (list.length === 0) {
                return Buffer.alloc(0);
            }
            var i;
            if (length === undefined) {
                length = 0;
                for (i = 0; i < list.length; ++i) {
                    length += list[i].length;
                }
            }
            var buffer = Buffer.allocUnsafe(length);
            var pos = 0;
            for (i = 0; i < list.length; ++i) {
                var buf = list[i];
                if (!Buffer.isBuffer(buf)) {
                    throw new TypeError('"list" argument must be an Array of Buffers');
                }
                buf.copy(buffer, pos);
                pos += buf.length;
            }
            return buffer;
        };
        function byteLength(string, encoding) {
            if (Buffer.isBuffer(string)) {
                return string.length;
            }
            if (typeof ArrayBuffer !== "undefined" && typeof ArrayBuffer.isView === "function" && (ArrayBuffer.isView(string) || string instanceof ArrayBuffer)) {
                return string.byteLength;
            }
            if (typeof string !== "string") {
                string = "" + string;
            }
            var len = string.length;
            if (len === 0) return 0;
            var loweredCase = false;
            for (;;) {
                switch (encoding) {
                  case "ascii":
                  case "latin1":
                  case "binary":
                    return len;

                  case "utf8":
                  case "utf-8":
                  case undefined:
                    return utf8ToBytes(string).length;

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return len * 2;

                  case "hex":
                    return len >>> 1;

                  case "base64":
                    return base64ToBytes(string).length;

                  default:
                    if (loweredCase) return utf8ToBytes(string).length;
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
            }
        }
        Buffer.byteLength = byteLength;
        function slowToString(encoding, start, end) {
            var loweredCase = false;
            if (start === undefined || start < 0) {
                start = 0;
            }
            if (start > this.length) {
                return "";
            }
            if (end === undefined || end > this.length) {
                end = this.length;
            }
            if (end <= 0) {
                return "";
            }
            end >>>= 0;
            start >>>= 0;
            if (end <= start) {
                return "";
            }
            if (!encoding) encoding = "utf8";
            while (true) {
                switch (encoding) {
                  case "hex":
                    return hexSlice(this, start, end);

                  case "utf8":
                  case "utf-8":
                    return utf8Slice(this, start, end);

                  case "ascii":
                    return asciiSlice(this, start, end);

                  case "latin1":
                  case "binary":
                    return latin1Slice(this, start, end);

                  case "base64":
                    return base64Slice(this, start, end);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return utf16leSlice(this, start, end);

                  default:
                    if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                    encoding = (encoding + "").toLowerCase();
                    loweredCase = true;
                }
            }
        }
        Buffer.prototype._isBuffer = true;
        function swap(b, n, m) {
            var i = b[n];
            b[n] = b[m];
            b[m] = i;
        }
        Buffer.prototype.swap16 = function swap16() {
            var len = this.length;
            if (len % 2 !== 0) {
                throw new RangeError("Buffer size must be a multiple of 16-bits");
            }
            for (var i = 0; i < len; i += 2) {
                swap(this, i, i + 1);
            }
            return this;
        };
        Buffer.prototype.swap32 = function swap32() {
            var len = this.length;
            if (len % 4 !== 0) {
                throw new RangeError("Buffer size must be a multiple of 32-bits");
            }
            for (var i = 0; i < len; i += 4) {
                swap(this, i, i + 3);
                swap(this, i + 1, i + 2);
            }
            return this;
        };
        Buffer.prototype.swap64 = function swap64() {
            var len = this.length;
            if (len % 8 !== 0) {
                throw new RangeError("Buffer size must be a multiple of 64-bits");
            }
            for (var i = 0; i < len; i += 8) {
                swap(this, i, i + 7);
                swap(this, i + 1, i + 6);
                swap(this, i + 2, i + 5);
                swap(this, i + 3, i + 4);
            }
            return this;
        };
        Buffer.prototype.toString = function toString() {
            var length = this.length | 0;
            if (length === 0) return "";
            if (arguments.length === 0) return utf8Slice(this, 0, length);
            return slowToString.apply(this, arguments);
        };
        Buffer.prototype.equals = function equals(b) {
            if (!Buffer.isBuffer(b)) throw new TypeError("Argument must be a Buffer");
            if (this === b) return true;
            return Buffer.compare(this, b) === 0;
        };
        Buffer.prototype.inspect = function inspect() {
            var str = "";
            var max = exports.INSPECT_MAX_BYTES;
            if (this.length > 0) {
                str = this.toString("hex", 0, max).match(/.{2}/g).join(" ");
                if (this.length > max) str += " ... ";
            }
            return "<Buffer " + str + ">";
        };
        Buffer.prototype.compare = function compare(target, start, end, thisStart, thisEnd) {
            if (!Buffer.isBuffer(target)) {
                throw new TypeError("Argument must be a Buffer");
            }
            if (start === undefined) {
                start = 0;
            }
            if (end === undefined) {
                end = target ? target.length : 0;
            }
            if (thisStart === undefined) {
                thisStart = 0;
            }
            if (thisEnd === undefined) {
                thisEnd = this.length;
            }
            if (start < 0 || end > target.length || thisStart < 0 || thisEnd > this.length) {
                throw new RangeError("out of range index");
            }
            if (thisStart >= thisEnd && start >= end) {
                return 0;
            }
            if (thisStart >= thisEnd) {
                return -1;
            }
            if (start >= end) {
                return 1;
            }
            start >>>= 0;
            end >>>= 0;
            thisStart >>>= 0;
            thisEnd >>>= 0;
            if (this === target) return 0;
            var x = thisEnd - thisStart;
            var y = end - start;
            var len = Math.min(x, y);
            var thisCopy = this.slice(thisStart, thisEnd);
            var targetCopy = target.slice(start, end);
            for (var i = 0; i < len; ++i) {
                if (thisCopy[i] !== targetCopy[i]) {
                    x = thisCopy[i];
                    y = targetCopy[i];
                    break;
                }
            }
            if (x < y) return -1;
            if (y < x) return 1;
            return 0;
        };
        function bidirectionalIndexOf(buffer, val, byteOffset, encoding, dir) {
            if (buffer.length === 0) return -1;
            if (typeof byteOffset === "string") {
                encoding = byteOffset;
                byteOffset = 0;
            } else if (byteOffset > 2147483647) {
                byteOffset = 2147483647;
            } else if (byteOffset < -2147483648) {
                byteOffset = -2147483648;
            }
            byteOffset = +byteOffset;
            if (isNaN(byteOffset)) {
                byteOffset = dir ? 0 : buffer.length - 1;
            }
            if (byteOffset < 0) byteOffset = buffer.length + byteOffset;
            if (byteOffset >= buffer.length) {
                if (dir) return -1; else byteOffset = buffer.length - 1;
            } else if (byteOffset < 0) {
                if (dir) byteOffset = 0; else return -1;
            }
            if (typeof val === "string") {
                val = Buffer.from(val, encoding);
            }
            if (Buffer.isBuffer(val)) {
                if (val.length === 0) {
                    return -1;
                }
                return arrayIndexOf(buffer, val, byteOffset, encoding, dir);
            } else if (typeof val === "number") {
                val = val & 255;
                if (Buffer.TYPED_ARRAY_SUPPORT && typeof Uint8Array.prototype.indexOf === "function") {
                    if (dir) {
                        return Uint8Array.prototype.indexOf.call(buffer, val, byteOffset);
                    } else {
                        return Uint8Array.prototype.lastIndexOf.call(buffer, val, byteOffset);
                    }
                }
                return arrayIndexOf(buffer, [ val ], byteOffset, encoding, dir);
            }
            throw new TypeError("val must be string, number or Buffer");
        }
        function arrayIndexOf(arr, val, byteOffset, encoding, dir) {
            var indexSize = 1;
            var arrLength = arr.length;
            var valLength = val.length;
            if (encoding !== undefined) {
                encoding = String(encoding).toLowerCase();
                if (encoding === "ucs2" || encoding === "ucs-2" || encoding === "utf16le" || encoding === "utf-16le") {
                    if (arr.length < 2 || val.length < 2) {
                        return -1;
                    }
                    indexSize = 2;
                    arrLength /= 2;
                    valLength /= 2;
                    byteOffset /= 2;
                }
            }
            function read(buf, i) {
                if (indexSize === 1) {
                    return buf[i];
                } else {
                    return buf.readUInt16BE(i * indexSize);
                }
            }
            var i;
            if (dir) {
                var foundIndex = -1;
                for (i = byteOffset; i < arrLength; i++) {
                    if (read(arr, i) === read(val, foundIndex === -1 ? 0 : i - foundIndex)) {
                        if (foundIndex === -1) foundIndex = i;
                        if (i - foundIndex + 1 === valLength) return foundIndex * indexSize;
                    } else {
                        if (foundIndex !== -1) i -= i - foundIndex;
                        foundIndex = -1;
                    }
                }
            } else {
                if (byteOffset + valLength > arrLength) byteOffset = arrLength - valLength;
                for (i = byteOffset; i >= 0; i--) {
                    var found = true;
                    for (var j = 0; j < valLength; j++) {
                        if (read(arr, i + j) !== read(val, j)) {
                            found = false;
                            break;
                        }
                    }
                    if (found) return i;
                }
            }
            return -1;
        }
        Buffer.prototype.includes = function includes(val, byteOffset, encoding) {
            return this.indexOf(val, byteOffset, encoding) !== -1;
        };
        Buffer.prototype.indexOf = function indexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, true);
        };
        Buffer.prototype.lastIndexOf = function lastIndexOf(val, byteOffset, encoding) {
            return bidirectionalIndexOf(this, val, byteOffset, encoding, false);
        };
        function hexWrite(buf, string, offset, length) {
            offset = Number(offset) || 0;
            var remaining = buf.length - offset;
            if (!length) {
                length = remaining;
            } else {
                length = Number(length);
                if (length > remaining) {
                    length = remaining;
                }
            }
            var strLen = string.length;
            if (strLen % 2 !== 0) throw new TypeError("Invalid hex string");
            if (length > strLen / 2) {
                length = strLen / 2;
            }
            for (var i = 0; i < length; ++i) {
                var parsed = parseInt(string.substr(i * 2, 2), 16);
                if (isNaN(parsed)) return i;
                buf[offset + i] = parsed;
            }
            return i;
        }
        function utf8Write(buf, string, offset, length) {
            return blitBuffer(utf8ToBytes(string, buf.length - offset), buf, offset, length);
        }
        function asciiWrite(buf, string, offset, length) {
            return blitBuffer(asciiToBytes(string), buf, offset, length);
        }
        function latin1Write(buf, string, offset, length) {
            return asciiWrite(buf, string, offset, length);
        }
        function base64Write(buf, string, offset, length) {
            return blitBuffer(base64ToBytes(string), buf, offset, length);
        }
        function ucs2Write(buf, string, offset, length) {
            return blitBuffer(utf16leToBytes(string, buf.length - offset), buf, offset, length);
        }
        Buffer.prototype.write = function write(string, offset, length, encoding) {
            if (offset === undefined) {
                encoding = "utf8";
                length = this.length;
                offset = 0;
            } else if (length === undefined && typeof offset === "string") {
                encoding = offset;
                length = this.length;
                offset = 0;
            } else if (isFinite(offset)) {
                offset = offset | 0;
                if (isFinite(length)) {
                    length = length | 0;
                    if (encoding === undefined) encoding = "utf8";
                } else {
                    encoding = length;
                    length = undefined;
                }
            } else {
                throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");
            }
            var remaining = this.length - offset;
            if (length === undefined || length > remaining) length = remaining;
            if (string.length > 0 && (length < 0 || offset < 0) || offset > this.length) {
                throw new RangeError("Attempt to write outside buffer bounds");
            }
            if (!encoding) encoding = "utf8";
            var loweredCase = false;
            for (;;) {
                switch (encoding) {
                  case "hex":
                    return hexWrite(this, string, offset, length);

                  case "utf8":
                  case "utf-8":
                    return utf8Write(this, string, offset, length);

                  case "ascii":
                    return asciiWrite(this, string, offset, length);

                  case "latin1":
                  case "binary":
                    return latin1Write(this, string, offset, length);

                  case "base64":
                    return base64Write(this, string, offset, length);

                  case "ucs2":
                  case "ucs-2":
                  case "utf16le":
                  case "utf-16le":
                    return ucs2Write(this, string, offset, length);

                  default:
                    if (loweredCase) throw new TypeError("Unknown encoding: " + encoding);
                    encoding = ("" + encoding).toLowerCase();
                    loweredCase = true;
                }
            }
        };
        Buffer.prototype.toJSON = function toJSON() {
            return {
                type: "Buffer",
                data: Array.prototype.slice.call(this._arr || this, 0)
            };
        };
        function base64Slice(buf, start, end) {
            if (start === 0 && end === buf.length) {
                return base64.fromByteArray(buf);
            } else {
                return base64.fromByteArray(buf.slice(start, end));
            }
        }
        function utf8Slice(buf, start, end) {
            end = Math.min(buf.length, end);
            var res = [];
            var i = start;
            while (i < end) {
                var firstByte = buf[i];
                var codePoint = null;
                var bytesPerSequence = firstByte > 239 ? 4 : firstByte > 223 ? 3 : firstByte > 191 ? 2 : 1;
                if (i + bytesPerSequence <= end) {
                    var secondByte, thirdByte, fourthByte, tempCodePoint;
                    switch (bytesPerSequence) {
                      case 1:
                        if (firstByte < 128) {
                            codePoint = firstByte;
                        }
                        break;

                      case 2:
                        secondByte = buf[i + 1];
                        if ((secondByte & 192) === 128) {
                            tempCodePoint = (firstByte & 31) << 6 | secondByte & 63;
                            if (tempCodePoint > 127) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;

                      case 3:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        if ((secondByte & 192) === 128 && (thirdByte & 192) === 128) {
                            tempCodePoint = (firstByte & 15) << 12 | (secondByte & 63) << 6 | thirdByte & 63;
                            if (tempCodePoint > 2047 && (tempCodePoint < 55296 || tempCodePoint > 57343)) {
                                codePoint = tempCodePoint;
                            }
                        }
                        break;

                      case 4:
                        secondByte = buf[i + 1];
                        thirdByte = buf[i + 2];
                        fourthByte = buf[i + 3];
                        if ((secondByte & 192) === 128 && (thirdByte & 192) === 128 && (fourthByte & 192) === 128) {
                            tempCodePoint = (firstByte & 15) << 18 | (secondByte & 63) << 12 | (thirdByte & 63) << 6 | fourthByte & 63;
                            if (tempCodePoint > 65535 && tempCodePoint < 1114112) {
                                codePoint = tempCodePoint;
                            }
                        }
                    }
                }
                if (codePoint === null) {
                    codePoint = 65533;
                    bytesPerSequence = 1;
                } else if (codePoint > 65535) {
                    codePoint -= 65536;
                    res.push(codePoint >>> 10 & 1023 | 55296);
                    codePoint = 56320 | codePoint & 1023;
                }
                res.push(codePoint);
                i += bytesPerSequence;
            }
            return decodeCodePointsArray(res);
        }
        var MAX_ARGUMENTS_LENGTH = 4096;
        function decodeCodePointsArray(codePoints) {
            var len = codePoints.length;
            if (len <= MAX_ARGUMENTS_LENGTH) {
                return String.fromCharCode.apply(String, codePoints);
            }
            var res = "";
            var i = 0;
            while (i < len) {
                res += String.fromCharCode.apply(String, codePoints.slice(i, i += MAX_ARGUMENTS_LENGTH));
            }
            return res;
        }
        function asciiSlice(buf, start, end) {
            var ret = "";
            end = Math.min(buf.length, end);
            for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i] & 127);
            }
            return ret;
        }
        function latin1Slice(buf, start, end) {
            var ret = "";
            end = Math.min(buf.length, end);
            for (var i = start; i < end; ++i) {
                ret += String.fromCharCode(buf[i]);
            }
            return ret;
        }
        function hexSlice(buf, start, end) {
            var len = buf.length;
            if (!start || start < 0) start = 0;
            if (!end || end < 0 || end > len) end = len;
            var out = "";
            for (var i = start; i < end; ++i) {
                out += toHex(buf[i]);
            }
            return out;
        }
        function utf16leSlice(buf, start, end) {
            var bytes = buf.slice(start, end);
            var res = "";
            for (var i = 0; i < bytes.length; i += 2) {
                res += String.fromCharCode(bytes[i] + bytes[i + 1] * 256);
            }
            return res;
        }
        Buffer.prototype.slice = function slice(start, end) {
            var len = this.length;
            start = ~~start;
            end = end === undefined ? len : ~~end;
            if (start < 0) {
                start += len;
                if (start < 0) start = 0;
            } else if (start > len) {
                start = len;
            }
            if (end < 0) {
                end += len;
                if (end < 0) end = 0;
            } else if (end > len) {
                end = len;
            }
            if (end < start) end = start;
            var newBuf;
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                newBuf = this.subarray(start, end);
                newBuf.__proto__ = Buffer.prototype;
            } else {
                var sliceLen = end - start;
                newBuf = new Buffer(sliceLen, undefined);
                for (var i = 0; i < sliceLen; ++i) {
                    newBuf[i] = this[i + start];
                }
            }
            return newBuf;
        };
        function checkOffset(offset, ext, length) {
            if (offset % 1 !== 0 || offset < 0) throw new RangeError("offset is not uint");
            if (offset + ext > length) throw new RangeError("Trying to access beyond buffer length");
        }
        Buffer.prototype.readUIntLE = function readUIntLE(offset, byteLength, noAssert) {
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) checkOffset(offset, byteLength, this.length);
            var val = this[offset];
            var mul = 1;
            var i = 0;
            while (++i < byteLength && (mul *= 256)) {
                val += this[offset + i] * mul;
            }
            return val;
        };
        Buffer.prototype.readUIntBE = function readUIntBE(offset, byteLength, noAssert) {
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) {
                checkOffset(offset, byteLength, this.length);
            }
            var val = this[offset + --byteLength];
            var mul = 1;
            while (byteLength > 0 && (mul *= 256)) {
                val += this[offset + --byteLength] * mul;
            }
            return val;
        };
        Buffer.prototype.readUInt8 = function readUInt8(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 1, this.length);
            return this[offset];
        };
        Buffer.prototype.readUInt16LE = function readUInt16LE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 2, this.length);
            return this[offset] | this[offset + 1] << 8;
        };
        Buffer.prototype.readUInt16BE = function readUInt16BE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 2, this.length);
            return this[offset] << 8 | this[offset + 1];
        };
        Buffer.prototype.readUInt32LE = function readUInt32LE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return (this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16) + this[offset + 3] * 16777216;
        };
        Buffer.prototype.readUInt32BE = function readUInt32BE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return this[offset] * 16777216 + (this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3]);
        };
        Buffer.prototype.readIntLE = function readIntLE(offset, byteLength, noAssert) {
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) checkOffset(offset, byteLength, this.length);
            var val = this[offset];
            var mul = 1;
            var i = 0;
            while (++i < byteLength && (mul *= 256)) {
                val += this[offset + i] * mul;
            }
            mul *= 128;
            if (val >= mul) val -= Math.pow(2, 8 * byteLength);
            return val;
        };
        Buffer.prototype.readIntBE = function readIntBE(offset, byteLength, noAssert) {
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) checkOffset(offset, byteLength, this.length);
            var i = byteLength;
            var mul = 1;
            var val = this[offset + --i];
            while (i > 0 && (mul *= 256)) {
                val += this[offset + --i] * mul;
            }
            mul *= 128;
            if (val >= mul) val -= Math.pow(2, 8 * byteLength);
            return val;
        };
        Buffer.prototype.readInt8 = function readInt8(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 1, this.length);
            if (!(this[offset] & 128)) return this[offset];
            return (255 - this[offset] + 1) * -1;
        };
        Buffer.prototype.readInt16LE = function readInt16LE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 2, this.length);
            var val = this[offset] | this[offset + 1] << 8;
            return val & 32768 ? val | 4294901760 : val;
        };
        Buffer.prototype.readInt16BE = function readInt16BE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 2, this.length);
            var val = this[offset + 1] | this[offset] << 8;
            return val & 32768 ? val | 4294901760 : val;
        };
        Buffer.prototype.readInt32LE = function readInt32LE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return this[offset] | this[offset + 1] << 8 | this[offset + 2] << 16 | this[offset + 3] << 24;
        };
        Buffer.prototype.readInt32BE = function readInt32BE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return this[offset] << 24 | this[offset + 1] << 16 | this[offset + 2] << 8 | this[offset + 3];
        };
        Buffer.prototype.readFloatLE = function readFloatLE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return ieee754.read(this, offset, true, 23, 4);
        };
        Buffer.prototype.readFloatBE = function readFloatBE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 4, this.length);
            return ieee754.read(this, offset, false, 23, 4);
        };
        Buffer.prototype.readDoubleLE = function readDoubleLE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 8, this.length);
            return ieee754.read(this, offset, true, 52, 8);
        };
        Buffer.prototype.readDoubleBE = function readDoubleBE(offset, noAssert) {
            if (!noAssert) checkOffset(offset, 8, this.length);
            return ieee754.read(this, offset, false, 52, 8);
        };
        function checkInt(buf, value, offset, ext, max, min) {
            if (!Buffer.isBuffer(buf)) throw new TypeError('"buffer" argument must be a Buffer instance');
            if (value > max || value < min) throw new RangeError('"value" argument is out of bounds');
            if (offset + ext > buf.length) throw new RangeError("Index out of range");
        }
        Buffer.prototype.writeUIntLE = function writeUIntLE(value, offset, byteLength, noAssert) {
            value = +value;
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
            }
            var mul = 1;
            var i = 0;
            this[offset] = value & 255;
            while (++i < byteLength && (mul *= 256)) {
                this[offset + i] = value / mul & 255;
            }
            return offset + byteLength;
        };
        Buffer.prototype.writeUIntBE = function writeUIntBE(value, offset, byteLength, noAssert) {
            value = +value;
            offset = offset | 0;
            byteLength = byteLength | 0;
            if (!noAssert) {
                var maxBytes = Math.pow(2, 8 * byteLength) - 1;
                checkInt(this, value, offset, byteLength, maxBytes, 0);
            }
            var i = byteLength - 1;
            var mul = 1;
            this[offset + i] = value & 255;
            while (--i >= 0 && (mul *= 256)) {
                this[offset + i] = value / mul & 255;
            }
            return offset + byteLength;
        };
        Buffer.prototype.writeUInt8 = function writeUInt8(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 1, 255, 0);
            if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
            this[offset] = value & 255;
            return offset + 1;
        };
        function objectWriteUInt16(buf, value, offset, littleEndian) {
            if (value < 0) value = 65535 + value + 1;
            for (var i = 0, j = Math.min(buf.length - offset, 2); i < j; ++i) {
                buf[offset + i] = (value & 255 << 8 * (littleEndian ? i : 1 - i)) >>> (littleEndian ? i : 1 - i) * 8;
            }
        }
        Buffer.prototype.writeUInt16LE = function writeUInt16LE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255;
                this[offset + 1] = value >>> 8;
            } else {
                objectWriteUInt16(this, value, offset, true);
            }
            return offset + 2;
        };
        Buffer.prototype.writeUInt16BE = function writeUInt16BE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 2, 65535, 0);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 8;
                this[offset + 1] = value & 255;
            } else {
                objectWriteUInt16(this, value, offset, false);
            }
            return offset + 2;
        };
        function objectWriteUInt32(buf, value, offset, littleEndian) {
            if (value < 0) value = 4294967295 + value + 1;
            for (var i = 0, j = Math.min(buf.length - offset, 4); i < j; ++i) {
                buf[offset + i] = value >>> (littleEndian ? i : 3 - i) * 8 & 255;
            }
        }
        Buffer.prototype.writeUInt32LE = function writeUInt32LE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset + 3] = value >>> 24;
                this[offset + 2] = value >>> 16;
                this[offset + 1] = value >>> 8;
                this[offset] = value & 255;
            } else {
                objectWriteUInt32(this, value, offset, true);
            }
            return offset + 4;
        };
        Buffer.prototype.writeUInt32BE = function writeUInt32BE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 4, 4294967295, 0);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 24;
                this[offset + 1] = value >>> 16;
                this[offset + 2] = value >>> 8;
                this[offset + 3] = value & 255;
            } else {
                objectWriteUInt32(this, value, offset, false);
            }
            return offset + 4;
        };
        Buffer.prototype.writeIntLE = function writeIntLE(value, offset, byteLength, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);
                checkInt(this, value, offset, byteLength, limit - 1, -limit);
            }
            var i = 0;
            var mul = 1;
            var sub = 0;
            this[offset] = value & 255;
            while (++i < byteLength && (mul *= 256)) {
                if (value < 0 && sub === 0 && this[offset + i - 1] !== 0) {
                    sub = 1;
                }
                this[offset + i] = (value / mul >> 0) - sub & 255;
            }
            return offset + byteLength;
        };
        Buffer.prototype.writeIntBE = function writeIntBE(value, offset, byteLength, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) {
                var limit = Math.pow(2, 8 * byteLength - 1);
                checkInt(this, value, offset, byteLength, limit - 1, -limit);
            }
            var i = byteLength - 1;
            var mul = 1;
            var sub = 0;
            this[offset + i] = value & 255;
            while (--i >= 0 && (mul *= 256)) {
                if (value < 0 && sub === 0 && this[offset + i + 1] !== 0) {
                    sub = 1;
                }
                this[offset + i] = (value / mul >> 0) - sub & 255;
            }
            return offset + byteLength;
        };
        Buffer.prototype.writeInt8 = function writeInt8(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 1, 127, -128);
            if (!Buffer.TYPED_ARRAY_SUPPORT) value = Math.floor(value);
            if (value < 0) value = 255 + value + 1;
            this[offset] = value & 255;
            return offset + 1;
        };
        Buffer.prototype.writeInt16LE = function writeInt16LE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255;
                this[offset + 1] = value >>> 8;
            } else {
                objectWriteUInt16(this, value, offset, true);
            }
            return offset + 2;
        };
        Buffer.prototype.writeInt16BE = function writeInt16BE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 2, 32767, -32768);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 8;
                this[offset + 1] = value & 255;
            } else {
                objectWriteUInt16(this, value, offset, false);
            }
            return offset + 2;
        };
        Buffer.prototype.writeInt32LE = function writeInt32LE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value & 255;
                this[offset + 1] = value >>> 8;
                this[offset + 2] = value >>> 16;
                this[offset + 3] = value >>> 24;
            } else {
                objectWriteUInt32(this, value, offset, true);
            }
            return offset + 4;
        };
        Buffer.prototype.writeInt32BE = function writeInt32BE(value, offset, noAssert) {
            value = +value;
            offset = offset | 0;
            if (!noAssert) checkInt(this, value, offset, 4, 2147483647, -2147483648);
            if (value < 0) value = 4294967295 + value + 1;
            if (Buffer.TYPED_ARRAY_SUPPORT) {
                this[offset] = value >>> 24;
                this[offset + 1] = value >>> 16;
                this[offset + 2] = value >>> 8;
                this[offset + 3] = value & 255;
            } else {
                objectWriteUInt32(this, value, offset, false);
            }
            return offset + 4;
        };
        function checkIEEE754(buf, value, offset, ext, max, min) {
            if (offset + ext > buf.length) throw new RangeError("Index out of range");
            if (offset < 0) throw new RangeError("Index out of range");
        }
        function writeFloat(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                checkIEEE754(buf, value, offset, 4, 3.4028234663852886e38, -3.4028234663852886e38);
            }
            ieee754.write(buf, value, offset, littleEndian, 23, 4);
            return offset + 4;
        }
        Buffer.prototype.writeFloatLE = function writeFloatLE(value, offset, noAssert) {
            return writeFloat(this, value, offset, true, noAssert);
        };
        Buffer.prototype.writeFloatBE = function writeFloatBE(value, offset, noAssert) {
            return writeFloat(this, value, offset, false, noAssert);
        };
        function writeDouble(buf, value, offset, littleEndian, noAssert) {
            if (!noAssert) {
                checkIEEE754(buf, value, offset, 8, 1.7976931348623157e308, -1.7976931348623157e308);
            }
            ieee754.write(buf, value, offset, littleEndian, 52, 8);
            return offset + 8;
        }
        Buffer.prototype.writeDoubleLE = function writeDoubleLE(value, offset, noAssert) {
            return writeDouble(this, value, offset, true, noAssert);
        };
        Buffer.prototype.writeDoubleBE = function writeDoubleBE(value, offset, noAssert) {
            return writeDouble(this, value, offset, false, noAssert);
        };
        Buffer.prototype.copy = function copy(target, targetStart, start, end) {
            if (!start) start = 0;
            if (!end && end !== 0) end = this.length;
            if (targetStart >= target.length) targetStart = target.length;
            if (!targetStart) targetStart = 0;
            if (end > 0 && end < start) end = start;
            if (end === start) return 0;
            if (target.length === 0 || this.length === 0) return 0;
            if (targetStart < 0) {
                throw new RangeError("targetStart out of bounds");
            }
            if (start < 0 || start >= this.length) throw new RangeError("sourceStart out of bounds");
            if (end < 0) throw new RangeError("sourceEnd out of bounds");
            if (end > this.length) end = this.length;
            if (target.length - targetStart < end - start) {
                end = target.length - targetStart + start;
            }
            var len = end - start;
            var i;
            if (this === target && start < targetStart && targetStart < end) {
                for (i = len - 1; i >= 0; --i) {
                    target[i + targetStart] = this[i + start];
                }
            } else if (len < 1e3 || !Buffer.TYPED_ARRAY_SUPPORT) {
                for (i = 0; i < len; ++i) {
                    target[i + targetStart] = this[i + start];
                }
            } else {
                Uint8Array.prototype.set.call(target, this.subarray(start, start + len), targetStart);
            }
            return len;
        };
        Buffer.prototype.fill = function fill(val, start, end, encoding) {
            if (typeof val === "string") {
                if (typeof start === "string") {
                    encoding = start;
                    start = 0;
                    end = this.length;
                } else if (typeof end === "string") {
                    encoding = end;
                    end = this.length;
                }
                if (val.length === 1) {
                    var code = val.charCodeAt(0);
                    if (code < 256) {
                        val = code;
                    }
                }
                if (encoding !== undefined && typeof encoding !== "string") {
                    throw new TypeError("encoding must be a string");
                }
                if (typeof encoding === "string" && !Buffer.isEncoding(encoding)) {
                    throw new TypeError("Unknown encoding: " + encoding);
                }
            } else if (typeof val === "number") {
                val = val & 255;
            }
            if (start < 0 || this.length < start || this.length < end) {
                throw new RangeError("Out of range index");
            }
            if (end <= start) {
                return this;
            }
            start = start >>> 0;
            end = end === undefined ? this.length : end >>> 0;
            if (!val) val = 0;
            var i;
            if (typeof val === "number") {
                for (i = start; i < end; ++i) {
                    this[i] = val;
                }
            } else {
                var bytes = Buffer.isBuffer(val) ? val : utf8ToBytes(new Buffer(val, encoding).toString());
                var len = bytes.length;
                for (i = 0; i < end - start; ++i) {
                    this[i + start] = bytes[i % len];
                }
            }
            return this;
        };
        var INVALID_BASE64_RE = /[^+\/0-9A-Za-z-_]/g;
        function base64clean(str) {
            str = stringtrim(str).replace(INVALID_BASE64_RE, "");
            if (str.length < 2) return "";
            while (str.length % 4 !== 0) {
                str = str + "=";
            }
            return str;
        }
        function stringtrim(str) {
            if (str.trim) return str.trim();
            return str.replace(/^\s+|\s+$/g, "");
        }
        function toHex(n) {
            if (n < 16) return "0" + n.toString(16);
            return n.toString(16);
        }
        function utf8ToBytes(string, units) {
            units = units || Infinity;
            var codePoint;
            var length = string.length;
            var leadSurrogate = null;
            var bytes = [];
            for (var i = 0; i < length; ++i) {
                codePoint = string.charCodeAt(i);
                if (codePoint > 55295 && codePoint < 57344) {
                    if (!leadSurrogate) {
                        if (codePoint > 56319) {
                            if ((units -= 3) > -1) bytes.push(239, 191, 189);
                            continue;
                        } else if (i + 1 === length) {
                            if ((units -= 3) > -1) bytes.push(239, 191, 189);
                            continue;
                        }
                        leadSurrogate = codePoint;
                        continue;
                    }
                    if (codePoint < 56320) {
                        if ((units -= 3) > -1) bytes.push(239, 191, 189);
                        leadSurrogate = codePoint;
                        continue;
                    }
                    codePoint = (leadSurrogate - 55296 << 10 | codePoint - 56320) + 65536;
                } else if (leadSurrogate) {
                    if ((units -= 3) > -1) bytes.push(239, 191, 189);
                }
                leadSurrogate = null;
                if (codePoint < 128) {
                    if ((units -= 1) < 0) break;
                    bytes.push(codePoint);
                } else if (codePoint < 2048) {
                    if ((units -= 2) < 0) break;
                    bytes.push(codePoint >> 6 | 192, codePoint & 63 | 128);
                } else if (codePoint < 65536) {
                    if ((units -= 3) < 0) break;
                    bytes.push(codePoint >> 12 | 224, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
                } else if (codePoint < 1114112) {
                    if ((units -= 4) < 0) break;
                    bytes.push(codePoint >> 18 | 240, codePoint >> 12 & 63 | 128, codePoint >> 6 & 63 | 128, codePoint & 63 | 128);
                } else {
                    throw new Error("Invalid code point");
                }
            }
            return bytes;
        }
        function asciiToBytes(str) {
            var byteArray = [];
            for (var i = 0; i < str.length; ++i) {
                byteArray.push(str.charCodeAt(i) & 255);
            }
            return byteArray;
        }
        function utf16leToBytes(str, units) {
            var c, hi, lo;
            var byteArray = [];
            for (var i = 0; i < str.length; ++i) {
                if ((units -= 2) < 0) break;
                c = str.charCodeAt(i);
                hi = c >> 8;
                lo = c % 256;
                byteArray.push(lo);
                byteArray.push(hi);
            }
            return byteArray;
        }
        function base64ToBytes(str) {
            return base64.toByteArray(base64clean(str));
        }
        function blitBuffer(src, dst, offset, length) {
            for (var i = 0; i < length; ++i) {
                if (i + offset >= dst.length || i >= src.length) break;
                dst[i + offset] = src[i];
            }
            return i;
        }
        function isnan(val) {
            return val !== val;
        }
    }).call(exports, function() {
        return this;
    }());
}, function(module, exports) {
    "use strict";
    exports.byteLength = byteLength;
    exports.toByteArray = toByteArray;
    exports.fromByteArray = fromByteArray;
    var lookup = [];
    var revLookup = [];
    var Arr = typeof Uint8Array !== "undefined" ? Uint8Array : Array;
    var code = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    for (var i = 0, len = code.length; i < len; ++i) {
        lookup[i] = code[i];
        revLookup[code.charCodeAt(i)] = i;
    }
    revLookup["-".charCodeAt(0)] = 62;
    revLookup["_".charCodeAt(0)] = 63;
    function placeHoldersCount(b64) {
        var len = b64.length;
        if (len % 4 > 0) {
            throw new Error("Invalid string. Length must be a multiple of 4");
        }
        return b64[len - 2] === "=" ? 2 : b64[len - 1] === "=" ? 1 : 0;
    }
    function byteLength(b64) {
        return b64.length * 3 / 4 - placeHoldersCount(b64);
    }
    function toByteArray(b64) {
        var i, j, l, tmp, placeHolders, arr;
        var len = b64.length;
        placeHolders = placeHoldersCount(b64);
        arr = new Arr(len * 3 / 4 - placeHolders);
        l = placeHolders > 0 ? len - 4 : len;
        var L = 0;
        for (i = 0, j = 0; i < l; i += 4, j += 3) {
            tmp = revLookup[b64.charCodeAt(i)] << 18 | revLookup[b64.charCodeAt(i + 1)] << 12 | revLookup[b64.charCodeAt(i + 2)] << 6 | revLookup[b64.charCodeAt(i + 3)];
            arr[L++] = tmp >> 16 & 255;
            arr[L++] = tmp >> 8 & 255;
            arr[L++] = tmp & 255;
        }
        if (placeHolders === 2) {
            tmp = revLookup[b64.charCodeAt(i)] << 2 | revLookup[b64.charCodeAt(i + 1)] >> 4;
            arr[L++] = tmp & 255;
        } else if (placeHolders === 1) {
            tmp = revLookup[b64.charCodeAt(i)] << 10 | revLookup[b64.charCodeAt(i + 1)] << 4 | revLookup[b64.charCodeAt(i + 2)] >> 2;
            arr[L++] = tmp >> 8 & 255;
            arr[L++] = tmp & 255;
        }
        return arr;
    }
    function tripletToBase64(num) {
        return lookup[num >> 18 & 63] + lookup[num >> 12 & 63] + lookup[num >> 6 & 63] + lookup[num & 63];
    }
    function encodeChunk(uint8, start, end) {
        var tmp;
        var output = [];
        for (var i = start; i < end; i += 3) {
            tmp = (uint8[i] << 16) + (uint8[i + 1] << 8) + uint8[i + 2];
            output.push(tripletToBase64(tmp));
        }
        return output.join("");
    }
    function fromByteArray(uint8) {
        var tmp;
        var len = uint8.length;
        var extraBytes = len % 3;
        var output = "";
        var parts = [];
        var maxChunkLength = 16383;
        for (var i = 0, len2 = len - extraBytes; i < len2; i += maxChunkLength) {
            parts.push(encodeChunk(uint8, i, i + maxChunkLength > len2 ? len2 : i + maxChunkLength));
        }
        if (extraBytes === 1) {
            tmp = uint8[len - 1];
            output += lookup[tmp >> 2];
            output += lookup[tmp << 4 & 63];
            output += "==";
        } else if (extraBytes === 2) {
            tmp = (uint8[len - 2] << 8) + uint8[len - 1];
            output += lookup[tmp >> 10];
            output += lookup[tmp >> 4 & 63];
            output += lookup[tmp << 2 & 63];
            output += "=";
        }
        parts.push(output);
        return parts.join("");
    }
}, function(module, exports) {
    exports.read = function(buffer, offset, isLE, mLen, nBytes) {
        var e, m;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var nBits = -7;
        var i = isLE ? nBytes - 1 : 0;
        var d = isLE ? -1 : 1;
        var s = buffer[offset + i];
        i += d;
        e = s & (1 << -nBits) - 1;
        s >>= -nBits;
        nBits += eLen;
        for (;nBits > 0; e = e * 256 + buffer[offset + i], i += d, nBits -= 8) {}
        m = e & (1 << -nBits) - 1;
        e >>= -nBits;
        nBits += mLen;
        for (;nBits > 0; m = m * 256 + buffer[offset + i], i += d, nBits -= 8) {}
        if (e === 0) {
            e = 1 - eBias;
        } else if (e === eMax) {
            return m ? NaN : (s ? -1 : 1) * Infinity;
        } else {
            m = m + Math.pow(2, mLen);
            e = e - eBias;
        }
        return (s ? -1 : 1) * m * Math.pow(2, e - mLen);
    };
    exports.write = function(buffer, value, offset, isLE, mLen, nBytes) {
        var e, m, c;
        var eLen = nBytes * 8 - mLen - 1;
        var eMax = (1 << eLen) - 1;
        var eBias = eMax >> 1;
        var rt = mLen === 23 ? Math.pow(2, -24) - Math.pow(2, -77) : 0;
        var i = isLE ? 0 : nBytes - 1;
        var d = isLE ? 1 : -1;
        var s = value < 0 || value === 0 && 1 / value < 0 ? 1 : 0;
        value = Math.abs(value);
        if (isNaN(value) || value === Infinity) {
            m = isNaN(value) ? 1 : 0;
            e = eMax;
        } else {
            e = Math.floor(Math.log(value) / Math.LN2);
            if (value * (c = Math.pow(2, -e)) < 1) {
                e--;
                c *= 2;
            }
            if (e + eBias >= 1) {
                value += rt / c;
            } else {
                value += rt * Math.pow(2, 1 - eBias);
            }
            if (value * c >= 2) {
                e++;
                c /= 2;
            }
            if (e + eBias >= eMax) {
                m = 0;
                e = eMax;
            } else if (e + eBias >= 1) {
                m = (value * c - 1) * Math.pow(2, mLen);
                e = e + eBias;
            } else {
                m = value * Math.pow(2, eBias - 1) * Math.pow(2, mLen);
                e = 0;
            }
        }
        for (;mLen >= 8; buffer[offset + i] = m & 255, i += d, m /= 256, mLen -= 8) {}
        e = e << mLen | m;
        eLen += mLen;
        for (;eLen > 0; buffer[offset + i] = e & 255, i += d, e /= 256, eLen -= 8) {}
        buffer[offset + i - d] |= s * 128;
    };
}, function(module, exports) {
    var toString = {}.toString;
    module.exports = Array.isArray || function(arr) {
        return toString.call(arr) == "[object Array]";
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var rng = __webpack_require__(7);
        function error() {
            var m = [].slice.call(arguments).join(" ");
            throw new Error([ m, "we accept pull requests", "http://github.com/dominictarr/crypto-browserify" ].join("\n"));
        }
        exports.createHash = __webpack_require__(9);
        exports.createHmac = __webpack_require__(22);
        exports.randomBytes = function(size, callback) {
            if (callback && callback.call) {
                try {
                    callback.call(this, undefined, new Buffer(rng(size)));
                } catch (err) {
                    callback(err);
                }
            } else {
                return new Buffer(rng(size));
            }
        };
        function each(a, f) {
            for (var i in a) f(a[i], i);
        }
        exports.getHashes = function() {
            return [ "sha1", "sha256", "sha512", "md5", "rmd160" ];
        };
        var p = __webpack_require__(23)(exports);
        exports.pbkdf2 = p.pbkdf2;
        exports.pbkdf2Sync = p.pbkdf2Sync;
        __webpack_require__(25)(exports, module.exports);
        each([ "createCredentials", "createSign", "createVerify", "createDiffieHellman" ], function(name) {
            exports[name] = function() {
                error("sorry,", name, "is not implemented yet");
            };
        });
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(global, Buffer) {
        (function() {
            var g = ("undefined" === typeof window ? global : window) || {};
            _crypto = g.crypto || g.msCrypto || __webpack_require__(8);
            module.exports = function(size) {
                if (_crypto.getRandomValues) {
                    var bytes = new Buffer(size);
                    _crypto.getRandomValues(bytes);
                    return bytes;
                } else if (_crypto.randomBytes) {
                    return _crypto.randomBytes(size);
                } else throw new Error("secure random number generation not supported by this browser\n" + "use chrome, FireFox or Internet Explorer 11");
            };
        })();
    }).call(exports, function() {
        return this;
    }(), __webpack_require__(2).Buffer);
}, function(module, exports) {}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var createHash = __webpack_require__(10);
        var md5 = toConstructor(__webpack_require__(19));
        var rmd160 = toConstructor(__webpack_require__(21));
        function toConstructor(fn) {
            return function() {
                var buffers = [];
                var m = {
                    update: function(data, enc) {
                        if (!Buffer.isBuffer(data)) data = new Buffer(data, enc);
                        buffers.push(data);
                        return this;
                    },
                    digest: function(enc) {
                        var buf = Buffer.concat(buffers);
                        var r = fn(buf);
                        buffers = null;
                        return enc ? r.toString(enc) : r;
                    }
                };
                return m;
            };
        }
        module.exports = function(alg) {
            if ("md5" === alg) return new md5();
            if ("rmd160" === alg) return new rmd160();
            return createHash(alg);
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    var exports = module.exports = function(alg) {
        var Alg = exports[alg];
        if (!Alg) throw new Error(alg + " is not supported (we accept pull requests)");
        return new Alg();
    };
    var Buffer = __webpack_require__(2).Buffer;
    var Hash = __webpack_require__(11)(Buffer);
    exports.sha1 = __webpack_require__(12)(Buffer, Hash);
    exports.sha256 = __webpack_require__(17)(Buffer, Hash);
    exports.sha512 = __webpack_require__(18)(Buffer, Hash);
}, function(module, exports) {
    module.exports = function(Buffer) {
        function Hash(blockSize, finalSize) {
            this._block = new Buffer(blockSize);
            this._finalSize = finalSize;
            this._blockSize = blockSize;
            this._len = 0;
            this._s = 0;
        }
        Hash.prototype.init = function() {
            this._s = 0;
            this._len = 0;
        };
        Hash.prototype.update = function(data, enc) {
            if ("string" === typeof data) {
                enc = enc || "utf8";
                data = new Buffer(data, enc);
            }
            var l = this._len += data.length;
            var s = this._s = this._s || 0;
            var f = 0;
            var buffer = this._block;
            while (s < l) {
                var t = Math.min(data.length, f + this._blockSize - s % this._blockSize);
                var ch = t - f;
                for (var i = 0; i < ch; i++) {
                    buffer[s % this._blockSize + i] = data[i + f];
                }
                s += ch;
                f += ch;
                if (s % this._blockSize === 0) {
                    this._update(buffer);
                }
            }
            this._s = s;
            return this;
        };
        Hash.prototype.digest = function(enc) {
            var l = this._len * 8;
            this._block[this._len % this._blockSize] = 128;
            this._block.fill(0, this._len % this._blockSize + 1);
            if (l % (this._blockSize * 8) >= this._finalSize * 8) {
                this._update(this._block);
                this._block.fill(0);
            }
            this._block.writeInt32BE(l, this._blockSize - 4);
            var hash = this._update(this._block) || this._hash();
            return enc ? hash.toString(enc) : hash;
        };
        Hash.prototype._update = function() {
            throw new Error("_update must be implemented by subclass");
        };
        return Hash;
    };
}, function(module, exports, __webpack_require__) {
    var inherits = __webpack_require__(13).inherits;
    module.exports = function(Buffer, Hash) {
        var A = 0 | 0;
        var B = 4 | 0;
        var C = 8 | 0;
        var D = 12 | 0;
        var E = 16 | 0;
        var W = new (typeof Int32Array === "undefined" ? Array : Int32Array)(80);
        var POOL = [];
        function Sha1() {
            if (POOL.length) return POOL.pop().init();
            if (!(this instanceof Sha1)) return new Sha1();
            this._w = W;
            Hash.call(this, 16 * 4, 14 * 4);
            this._h = null;
            this.init();
        }
        inherits(Sha1, Hash);
        Sha1.prototype.init = function() {
            this._a = 1732584193;
            this._b = 4023233417;
            this._c = 2562383102;
            this._d = 271733878;
            this._e = 3285377520;
            Hash.prototype.init.call(this);
            return this;
        };
        Sha1.prototype._POOL = POOL;
        Sha1.prototype._update = function(X) {
            var a, b, c, d, e, _a, _b, _c, _d, _e;
            a = _a = this._a;
            b = _b = this._b;
            c = _c = this._c;
            d = _d = this._d;
            e = _e = this._e;
            var w = this._w;
            for (var j = 0; j < 80; j++) {
                var W = w[j] = j < 16 ? X.readInt32BE(j * 4) : rol(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
                var t = add(add(rol(a, 5), sha1_ft(j, b, c, d)), add(add(e, W), sha1_kt(j)));
                e = d;
                d = c;
                c = rol(b, 30);
                b = a;
                a = t;
            }
            this._a = add(a, _a);
            this._b = add(b, _b);
            this._c = add(c, _c);
            this._d = add(d, _d);
            this._e = add(e, _e);
        };
        Sha1.prototype._hash = function() {
            if (POOL.length < 100) POOL.push(this);
            var H = new Buffer(20);
            H.writeInt32BE(this._a | 0, A);
            H.writeInt32BE(this._b | 0, B);
            H.writeInt32BE(this._c | 0, C);
            H.writeInt32BE(this._d | 0, D);
            H.writeInt32BE(this._e | 0, E);
            return H;
        };
        function sha1_ft(t, b, c, d) {
            if (t < 20) return b & c | ~b & d;
            if (t < 40) return b ^ c ^ d;
            if (t < 60) return b & c | b & d | c & d;
            return b ^ c ^ d;
        }
        function sha1_kt(t) {
            return t < 20 ? 1518500249 : t < 40 ? 1859775393 : t < 60 ? -1894007588 : -899497514;
        }
        function add(x, y) {
            return x + y | 0;
        }
        function rol(num, cnt) {
            return num << cnt | num >>> 32 - cnt;
        }
        return Sha1;
    };
}, function(module, exports, __webpack_require__) {
    (function(global, process) {
        var formatRegExp = /%[sdj%]/g;
        exports.format = function(f) {
            if (!isString(f)) {
                var objects = [];
                for (var i = 0; i < arguments.length; i++) {
                    objects.push(inspect(arguments[i]));
                }
                return objects.join(" ");
            }
            var i = 1;
            var args = arguments;
            var len = args.length;
            var str = String(f).replace(formatRegExp, function(x) {
                if (x === "%%") return "%";
                if (i >= len) return x;
                switch (x) {
                  case "%s":
                    return String(args[i++]);

                  case "%d":
                    return Number(args[i++]);

                  case "%j":
                    try {
                        return JSON.stringify(args[i++]);
                    } catch (_) {
                        return "[Circular]";
                    }

                  default:
                    return x;
                }
            });
            for (var x = args[i]; i < len; x = args[++i]) {
                if (isNull(x) || !isObject(x)) {
                    str += " " + x;
                } else {
                    str += " " + inspect(x);
                }
            }
            return str;
        };
        exports.deprecate = function(fn, msg) {
            if (isUndefined(global.process)) {
                return function() {
                    return exports.deprecate(fn, msg).apply(this, arguments);
                };
            }
            if (process.noDeprecation === true) {
                return fn;
            }
            var warned = false;
            function deprecated() {
                if (!warned) {
                    if (process.throwDeprecation) {
                        throw new Error(msg);
                    } else if (process.traceDeprecation) {
                        console.trace(msg);
                    } else {
                        console.error(msg);
                    }
                    warned = true;
                }
                return fn.apply(this, arguments);
            }
            return deprecated;
        };
        var debugs = {};
        var debugEnviron;
        exports.debuglog = function(set) {
            if (isUndefined(debugEnviron)) debugEnviron = {
                NODE_ENV: undefined
            }.NODE_DEBUG || "";
            set = set.toUpperCase();
            if (!debugs[set]) {
                if (new RegExp("\\b" + set + "\\b", "i").test(debugEnviron)) {
                    var pid = process.pid;
                    debugs[set] = function() {
                        var msg = exports.format.apply(exports, arguments);
                        console.error("%s %d: %s", set, pid, msg);
                    };
                } else {
                    debugs[set] = function() {};
                }
            }
            return debugs[set];
        };
        function inspect(obj, opts) {
            var ctx = {
                seen: [],
                stylize: stylizeNoColor
            };
            if (arguments.length >= 3) ctx.depth = arguments[2];
            if (arguments.length >= 4) ctx.colors = arguments[3];
            if (isBoolean(opts)) {
                ctx.showHidden = opts;
            } else if (opts) {
                exports._extend(ctx, opts);
            }
            if (isUndefined(ctx.showHidden)) ctx.showHidden = false;
            if (isUndefined(ctx.depth)) ctx.depth = 2;
            if (isUndefined(ctx.colors)) ctx.colors = false;
            if (isUndefined(ctx.customInspect)) ctx.customInspect = true;
            if (ctx.colors) ctx.stylize = stylizeWithColor;
            return formatValue(ctx, obj, ctx.depth);
        }
        exports.inspect = inspect;
        inspect.colors = {
            bold: [ 1, 22 ],
            italic: [ 3, 23 ],
            underline: [ 4, 24 ],
            inverse: [ 7, 27 ],
            white: [ 37, 39 ],
            grey: [ 90, 39 ],
            black: [ 30, 39 ],
            blue: [ 34, 39 ],
            cyan: [ 36, 39 ],
            green: [ 32, 39 ],
            magenta: [ 35, 39 ],
            red: [ 31, 39 ],
            yellow: [ 33, 39 ]
        };
        inspect.styles = {
            special: "cyan",
            number: "yellow",
            boolean: "yellow",
            undefined: "grey",
            null: "bold",
            string: "green",
            date: "magenta",
            regexp: "red"
        };
        function stylizeWithColor(str, styleType) {
            var style = inspect.styles[styleType];
            if (style) {
                return "[" + inspect.colors[style][0] + "m" + str + "[" + inspect.colors[style][1] + "m";
            } else {
                return str;
            }
        }
        function stylizeNoColor(str, styleType) {
            return str;
        }
        function arrayToHash(array) {
            var hash = {};
            array.forEach(function(val, idx) {
                hash[val] = true;
            });
            return hash;
        }
        function formatValue(ctx, value, recurseTimes) {
            if (ctx.customInspect && value && isFunction(value.inspect) && value.inspect !== exports.inspect && !(value.constructor && value.constructor.prototype === value)) {
                var ret = value.inspect(recurseTimes, ctx);
                if (!isString(ret)) {
                    ret = formatValue(ctx, ret, recurseTimes);
                }
                return ret;
            }
            var primitive = formatPrimitive(ctx, value);
            if (primitive) {
                return primitive;
            }
            var keys = Object.keys(value);
            var visibleKeys = arrayToHash(keys);
            if (ctx.showHidden) {
                keys = Object.getOwnPropertyNames(value);
            }
            if (isError(value) && (keys.indexOf("message") >= 0 || keys.indexOf("description") >= 0)) {
                return formatError(value);
            }
            if (keys.length === 0) {
                if (isFunction(value)) {
                    var name = value.name ? ": " + value.name : "";
                    return ctx.stylize("[Function" + name + "]", "special");
                }
                if (isRegExp(value)) {
                    return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                }
                if (isDate(value)) {
                    return ctx.stylize(Date.prototype.toString.call(value), "date");
                }
                if (isError(value)) {
                    return formatError(value);
                }
            }
            var base = "", array = false, braces = [ "{", "}" ];
            if (isArray(value)) {
                array = true;
                braces = [ "[", "]" ];
            }
            if (isFunction(value)) {
                var n = value.name ? ": " + value.name : "";
                base = " [Function" + n + "]";
            }
            if (isRegExp(value)) {
                base = " " + RegExp.prototype.toString.call(value);
            }
            if (isDate(value)) {
                base = " " + Date.prototype.toUTCString.call(value);
            }
            if (isError(value)) {
                base = " " + formatError(value);
            }
            if (keys.length === 0 && (!array || value.length == 0)) {
                return braces[0] + base + braces[1];
            }
            if (recurseTimes < 0) {
                if (isRegExp(value)) {
                    return ctx.stylize(RegExp.prototype.toString.call(value), "regexp");
                } else {
                    return ctx.stylize("[Object]", "special");
                }
            }
            ctx.seen.push(value);
            var output;
            if (array) {
                output = formatArray(ctx, value, recurseTimes, visibleKeys, keys);
            } else {
                output = keys.map(function(key) {
                    return formatProperty(ctx, value, recurseTimes, visibleKeys, key, array);
                });
            }
            ctx.seen.pop();
            return reduceToSingleString(output, base, braces);
        }
        function formatPrimitive(ctx, value) {
            if (isUndefined(value)) return ctx.stylize("undefined", "undefined");
            if (isString(value)) {
                var simple = "'" + JSON.stringify(value).replace(/^"|"$/g, "").replace(/'/g, "\\'").replace(/\\"/g, '"') + "'";
                return ctx.stylize(simple, "string");
            }
            if (isNumber(value)) return ctx.stylize("" + value, "number");
            if (isBoolean(value)) return ctx.stylize("" + value, "boolean");
            if (isNull(value)) return ctx.stylize("null", "null");
        }
        function formatError(value) {
            return "[" + Error.prototype.toString.call(value) + "]";
        }
        function formatArray(ctx, value, recurseTimes, visibleKeys, keys) {
            var output = [];
            for (var i = 0, l = value.length; i < l; ++i) {
                if (hasOwnProperty(value, String(i))) {
                    output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, String(i), true));
                } else {
                    output.push("");
                }
            }
            keys.forEach(function(key) {
                if (!key.match(/^\d+$/)) {
                    output.push(formatProperty(ctx, value, recurseTimes, visibleKeys, key, true));
                }
            });
            return output;
        }
        function formatProperty(ctx, value, recurseTimes, visibleKeys, key, array) {
            var name, str, desc;
            desc = Object.getOwnPropertyDescriptor(value, key) || {
                value: value[key]
            };
            if (desc.get) {
                if (desc.set) {
                    str = ctx.stylize("[Getter/Setter]", "special");
                } else {
                    str = ctx.stylize("[Getter]", "special");
                }
            } else {
                if (desc.set) {
                    str = ctx.stylize("[Setter]", "special");
                }
            }
            if (!hasOwnProperty(visibleKeys, key)) {
                name = "[" + key + "]";
            }
            if (!str) {
                if (ctx.seen.indexOf(desc.value) < 0) {
                    if (isNull(recurseTimes)) {
                        str = formatValue(ctx, desc.value, null);
                    } else {
                        str = formatValue(ctx, desc.value, recurseTimes - 1);
                    }
                    if (str.indexOf("\n") > -1) {
                        if (array) {
                            str = str.split("\n").map(function(line) {
                                return "  " + line;
                            }).join("\n").substr(2);
                        } else {
                            str = "\n" + str.split("\n").map(function(line) {
                                return "   " + line;
                            }).join("\n");
                        }
                    }
                } else {
                    str = ctx.stylize("[Circular]", "special");
                }
            }
            if (isUndefined(name)) {
                if (array && key.match(/^\d+$/)) {
                    return str;
                }
                name = JSON.stringify("" + key);
                if (name.match(/^"([a-zA-Z_][a-zA-Z_0-9]*)"$/)) {
                    name = name.substr(1, name.length - 2);
                    name = ctx.stylize(name, "name");
                } else {
                    name = name.replace(/'/g, "\\'").replace(/\\"/g, '"').replace(/(^"|"$)/g, "'");
                    name = ctx.stylize(name, "string");
                }
            }
            return name + ": " + str;
        }
        function reduceToSingleString(output, base, braces) {
            var numLinesEst = 0;
            var length = output.reduce(function(prev, cur) {
                numLinesEst++;
                if (cur.indexOf("\n") >= 0) numLinesEst++;
                return prev + cur.replace(/\u001b\[\d\d?m/g, "").length + 1;
            }, 0);
            if (length > 60) {
                return braces[0] + (base === "" ? "" : base + "\n ") + " " + output.join(",\n  ") + " " + braces[1];
            }
            return braces[0] + base + " " + output.join(", ") + " " + braces[1];
        }
        function isArray(ar) {
            return Array.isArray(ar);
        }
        exports.isArray = isArray;
        function isBoolean(arg) {
            return typeof arg === "boolean";
        }
        exports.isBoolean = isBoolean;
        function isNull(arg) {
            return arg === null;
        }
        exports.isNull = isNull;
        function isNullOrUndefined(arg) {
            return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;
        function isNumber(arg) {
            return typeof arg === "number";
        }
        exports.isNumber = isNumber;
        function isString(arg) {
            return typeof arg === "string";
        }
        exports.isString = isString;
        function isSymbol(arg) {
            return typeof arg === "symbol";
        }
        exports.isSymbol = isSymbol;
        function isUndefined(arg) {
            return arg === void 0;
        }
        exports.isUndefined = isUndefined;
        function isRegExp(re) {
            return isObject(re) && objectToString(re) === "[object RegExp]";
        }
        exports.isRegExp = isRegExp;
        function isObject(arg) {
            return typeof arg === "object" && arg !== null;
        }
        exports.isObject = isObject;
        function isDate(d) {
            return isObject(d) && objectToString(d) === "[object Date]";
        }
        exports.isDate = isDate;
        function isError(e) {
            return isObject(e) && (objectToString(e) === "[object Error]" || e instanceof Error);
        }
        exports.isError = isError;
        function isFunction(arg) {
            return typeof arg === "function";
        }
        exports.isFunction = isFunction;
        function isPrimitive(arg) {
            return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
        }
        exports.isPrimitive = isPrimitive;
        exports.isBuffer = __webpack_require__(15);
        function objectToString(o) {
            return Object.prototype.toString.call(o);
        }
        function pad(n) {
            return n < 10 ? "0" + n.toString(10) : n.toString(10);
        }
        var months = [ "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" ];
        function timestamp() {
            var d = new Date();
            var time = [ pad(d.getHours()), pad(d.getMinutes()), pad(d.getSeconds()) ].join(":");
            return [ d.getDate(), months[d.getMonth()], time ].join(" ");
        }
        exports.log = function() {
            console.log("%s - %s", timestamp(), exports.format.apply(exports, arguments));
        };
        exports.inherits = __webpack_require__(16);
        exports._extend = function(origin, add) {
            if (!add || !isObject(add)) return origin;
            var keys = Object.keys(add);
            var i = keys.length;
            while (i--) {
                origin[keys[i]] = add[keys[i]];
            }
            return origin;
        };
        function hasOwnProperty(obj, prop) {
            return Object.prototype.hasOwnProperty.call(obj, prop);
        }
    }).call(exports, function() {
        return this;
    }(), __webpack_require__(14));
}, function(module, exports) {
    var process = module.exports = {};
    var cachedSetTimeout;
    var cachedClearTimeout;
    function defaultSetTimout() {
        throw new Error("setTimeout has not been defined");
    }
    function defaultClearTimeout() {
        throw new Error("clearTimeout has not been defined");
    }
    (function() {
        try {
            if (typeof setTimeout === "function") {
                cachedSetTimeout = setTimeout;
            } else {
                cachedSetTimeout = defaultSetTimout;
            }
        } catch (e) {
            cachedSetTimeout = defaultSetTimout;
        }
        try {
            if (typeof clearTimeout === "function") {
                cachedClearTimeout = clearTimeout;
            } else {
                cachedClearTimeout = defaultClearTimeout;
            }
        } catch (e) {
            cachedClearTimeout = defaultClearTimeout;
        }
    })();
    function runTimeout(fun) {
        if (cachedSetTimeout === setTimeout) {
            return setTimeout(fun, 0);
        }
        if ((cachedSetTimeout === defaultSetTimout || !cachedSetTimeout) && setTimeout) {
            cachedSetTimeout = setTimeout;
            return setTimeout(fun, 0);
        }
        try {
            return cachedSetTimeout(fun, 0);
        } catch (e) {
            try {
                return cachedSetTimeout.call(null, fun, 0);
            } catch (e) {
                return cachedSetTimeout.call(this, fun, 0);
            }
        }
    }
    function runClearTimeout(marker) {
        if (cachedClearTimeout === clearTimeout) {
            return clearTimeout(marker);
        }
        if ((cachedClearTimeout === defaultClearTimeout || !cachedClearTimeout) && clearTimeout) {
            cachedClearTimeout = clearTimeout;
            return clearTimeout(marker);
        }
        try {
            return cachedClearTimeout(marker);
        } catch (e) {
            try {
                return cachedClearTimeout.call(null, marker);
            } catch (e) {
                return cachedClearTimeout.call(this, marker);
            }
        }
    }
    var queue = [];
    var draining = false;
    var currentQueue;
    var queueIndex = -1;
    function cleanUpNextTick() {
        if (!draining || !currentQueue) {
            return;
        }
        draining = false;
        if (currentQueue.length) {
            queue = currentQueue.concat(queue);
        } else {
            queueIndex = -1;
        }
        if (queue.length) {
            drainQueue();
        }
    }
    function drainQueue() {
        if (draining) {
            return;
        }
        var timeout = runTimeout(cleanUpNextTick);
        draining = true;
        var len = queue.length;
        while (len) {
            currentQueue = queue;
            queue = [];
            while (++queueIndex < len) {
                if (currentQueue) {
                    currentQueue[queueIndex].run();
                }
            }
            queueIndex = -1;
            len = queue.length;
        }
        currentQueue = null;
        draining = false;
        runClearTimeout(timeout);
    }
    process.nextTick = function(fun) {
        var args = new Array(arguments.length - 1);
        if (arguments.length > 1) {
            for (var i = 1; i < arguments.length; i++) {
                args[i - 1] = arguments[i];
            }
        }
        queue.push(new Item(fun, args));
        if (queue.length === 1 && !draining) {
            runTimeout(drainQueue);
        }
    };
    function Item(fun, array) {
        this.fun = fun;
        this.array = array;
    }
    Item.prototype.run = function() {
        this.fun.apply(null, this.array);
    };
    process.title = "browser";
    process.browser = true;
    process.env = {};
    process.argv = [];
    process.version = "";
    process.versions = {};
    function noop() {}
    process.on = noop;
    process.addListener = noop;
    process.once = noop;
    process.off = noop;
    process.removeListener = noop;
    process.removeAllListeners = noop;
    process.emit = noop;
    process.binding = function(name) {
        throw new Error("process.binding is not supported");
    };
    process.cwd = function() {
        return "/";
    };
    process.chdir = function(dir) {
        throw new Error("process.chdir is not supported");
    };
    process.umask = function() {
        return 0;
    };
}, function(module, exports) {
    module.exports = function isBuffer(arg) {
        return arg && typeof arg === "object" && typeof arg.copy === "function" && typeof arg.fill === "function" && typeof arg.readUInt8 === "function";
    };
}, function(module, exports) {
    if (typeof Object.create === "function") {
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = Object.create(superCtor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
        };
    } else {
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function() {};
            TempCtor.prototype = superCtor.prototype;
            ctor.prototype = new TempCtor();
            ctor.prototype.constructor = ctor;
        };
    }
}, function(module, exports, __webpack_require__) {
    var inherits = __webpack_require__(13).inherits;
    module.exports = function(Buffer, Hash) {
        var K = [ 1116352408, 1899447441, 3049323471, 3921009573, 961987163, 1508970993, 2453635748, 2870763221, 3624381080, 310598401, 607225278, 1426881987, 1925078388, 2162078206, 2614888103, 3248222580, 3835390401, 4022224774, 264347078, 604807628, 770255983, 1249150122, 1555081692, 1996064986, 2554220882, 2821834349, 2952996808, 3210313671, 3336571891, 3584528711, 113926993, 338241895, 666307205, 773529912, 1294757372, 1396182291, 1695183700, 1986661051, 2177026350, 2456956037, 2730485921, 2820302411, 3259730800, 3345764771, 3516065817, 3600352804, 4094571909, 275423344, 430227734, 506948616, 659060556, 883997877, 958139571, 1322822218, 1537002063, 1747873779, 1955562222, 2024104815, 2227730452, 2361852424, 2428436474, 2756734187, 3204031479, 3329325298 ];
        var W = new Array(64);
        function Sha256() {
            this.init();
            this._w = W;
            Hash.call(this, 16 * 4, 14 * 4);
        }
        inherits(Sha256, Hash);
        Sha256.prototype.init = function() {
            this._a = 1779033703 | 0;
            this._b = 3144134277 | 0;
            this._c = 1013904242 | 0;
            this._d = 2773480762 | 0;
            this._e = 1359893119 | 0;
            this._f = 2600822924 | 0;
            this._g = 528734635 | 0;
            this._h = 1541459225 | 0;
            this._len = this._s = 0;
            return this;
        };
        function S(X, n) {
            return X >>> n | X << 32 - n;
        }
        function R(X, n) {
            return X >>> n;
        }
        function Ch(x, y, z) {
            return x & y ^ ~x & z;
        }
        function Maj(x, y, z) {
            return x & y ^ x & z ^ y & z;
        }
        function Sigma0256(x) {
            return S(x, 2) ^ S(x, 13) ^ S(x, 22);
        }
        function Sigma1256(x) {
            return S(x, 6) ^ S(x, 11) ^ S(x, 25);
        }
        function Gamma0256(x) {
            return S(x, 7) ^ S(x, 18) ^ R(x, 3);
        }
        function Gamma1256(x) {
            return S(x, 17) ^ S(x, 19) ^ R(x, 10);
        }
        Sha256.prototype._update = function(M) {
            var W = this._w;
            var a, b, c, d, e, f, g, h;
            var T1, T2;
            a = this._a | 0;
            b = this._b | 0;
            c = this._c | 0;
            d = this._d | 0;
            e = this._e | 0;
            f = this._f | 0;
            g = this._g | 0;
            h = this._h | 0;
            for (var j = 0; j < 64; j++) {
                var w = W[j] = j < 16 ? M.readInt32BE(j * 4) : Gamma1256(W[j - 2]) + W[j - 7] + Gamma0256(W[j - 15]) + W[j - 16];
                T1 = h + Sigma1256(e) + Ch(e, f, g) + K[j] + w;
                T2 = Sigma0256(a) + Maj(a, b, c);
                h = g;
                g = f;
                f = e;
                e = d + T1;
                d = c;
                c = b;
                b = a;
                a = T1 + T2;
            }
            this._a = a + this._a | 0;
            this._b = b + this._b | 0;
            this._c = c + this._c | 0;
            this._d = d + this._d | 0;
            this._e = e + this._e | 0;
            this._f = f + this._f | 0;
            this._g = g + this._g | 0;
            this._h = h + this._h | 0;
        };
        Sha256.prototype._hash = function() {
            var H = new Buffer(32);
            H.writeInt32BE(this._a, 0);
            H.writeInt32BE(this._b, 4);
            H.writeInt32BE(this._c, 8);
            H.writeInt32BE(this._d, 12);
            H.writeInt32BE(this._e, 16);
            H.writeInt32BE(this._f, 20);
            H.writeInt32BE(this._g, 24);
            H.writeInt32BE(this._h, 28);
            return H;
        };
        return Sha256;
    };
}, function(module, exports, __webpack_require__) {
    var inherits = __webpack_require__(13).inherits;
    module.exports = function(Buffer, Hash) {
        var K = [ 1116352408, 3609767458, 1899447441, 602891725, 3049323471, 3964484399, 3921009573, 2173295548, 961987163, 4081628472, 1508970993, 3053834265, 2453635748, 2937671579, 2870763221, 3664609560, 3624381080, 2734883394, 310598401, 1164996542, 607225278, 1323610764, 1426881987, 3590304994, 1925078388, 4068182383, 2162078206, 991336113, 2614888103, 633803317, 3248222580, 3479774868, 3835390401, 2666613458, 4022224774, 944711139, 264347078, 2341262773, 604807628, 2007800933, 770255983, 1495990901, 1249150122, 1856431235, 1555081692, 3175218132, 1996064986, 2198950837, 2554220882, 3999719339, 2821834349, 766784016, 2952996808, 2566594879, 3210313671, 3203337956, 3336571891, 1034457026, 3584528711, 2466948901, 113926993, 3758326383, 338241895, 168717936, 666307205, 1188179964, 773529912, 1546045734, 1294757372, 1522805485, 1396182291, 2643833823, 1695183700, 2343527390, 1986661051, 1014477480, 2177026350, 1206759142, 2456956037, 344077627, 2730485921, 1290863460, 2820302411, 3158454273, 3259730800, 3505952657, 3345764771, 106217008, 3516065817, 3606008344, 3600352804, 1432725776, 4094571909, 1467031594, 275423344, 851169720, 430227734, 3100823752, 506948616, 1363258195, 659060556, 3750685593, 883997877, 3785050280, 958139571, 3318307427, 1322822218, 3812723403, 1537002063, 2003034995, 1747873779, 3602036899, 1955562222, 1575990012, 2024104815, 1125592928, 2227730452, 2716904306, 2361852424, 442776044, 2428436474, 593698344, 2756734187, 3733110249, 3204031479, 2999351573, 3329325298, 3815920427, 3391569614, 3928383900, 3515267271, 566280711, 3940187606, 3454069534, 4118630271, 4000239992, 116418474, 1914138554, 174292421, 2731055270, 289380356, 3203993006, 460393269, 320620315, 685471733, 587496836, 852142971, 1086792851, 1017036298, 365543100, 1126000580, 2618297676, 1288033470, 3409855158, 1501505948, 4234509866, 1607167915, 987167468, 1816402316, 1246189591 ];
        var W = new Array(160);
        function Sha512() {
            this.init();
            this._w = W;
            Hash.call(this, 128, 112);
        }
        inherits(Sha512, Hash);
        Sha512.prototype.init = function() {
            this._a = 1779033703 | 0;
            this._b = 3144134277 | 0;
            this._c = 1013904242 | 0;
            this._d = 2773480762 | 0;
            this._e = 1359893119 | 0;
            this._f = 2600822924 | 0;
            this._g = 528734635 | 0;
            this._h = 1541459225 | 0;
            this._al = 4089235720 | 0;
            this._bl = 2227873595 | 0;
            this._cl = 4271175723 | 0;
            this._dl = 1595750129 | 0;
            this._el = 2917565137 | 0;
            this._fl = 725511199 | 0;
            this._gl = 4215389547 | 0;
            this._hl = 327033209 | 0;
            this._len = this._s = 0;
            return this;
        };
        function S(X, Xl, n) {
            return X >>> n | Xl << 32 - n;
        }
        function Ch(x, y, z) {
            return x & y ^ ~x & z;
        }
        function Maj(x, y, z) {
            return x & y ^ x & z ^ y & z;
        }
        Sha512.prototype._update = function(M) {
            var W = this._w;
            var a, b, c, d, e, f, g, h;
            var al, bl, cl, dl, el, fl, gl, hl;
            a = this._a | 0;
            b = this._b | 0;
            c = this._c | 0;
            d = this._d | 0;
            e = this._e | 0;
            f = this._f | 0;
            g = this._g | 0;
            h = this._h | 0;
            al = this._al | 0;
            bl = this._bl | 0;
            cl = this._cl | 0;
            dl = this._dl | 0;
            el = this._el | 0;
            fl = this._fl | 0;
            gl = this._gl | 0;
            hl = this._hl | 0;
            for (var i = 0; i < 80; i++) {
                var j = i * 2;
                var Wi, Wil;
                if (i < 16) {
                    Wi = W[j] = M.readInt32BE(j * 4);
                    Wil = W[j + 1] = M.readInt32BE(j * 4 + 4);
                } else {
                    var x = W[j - 15 * 2];
                    var xl = W[j - 15 * 2 + 1];
                    var gamma0 = S(x, xl, 1) ^ S(x, xl, 8) ^ x >>> 7;
                    var gamma0l = S(xl, x, 1) ^ S(xl, x, 8) ^ S(xl, x, 7);
                    x = W[j - 2 * 2];
                    xl = W[j - 2 * 2 + 1];
                    var gamma1 = S(x, xl, 19) ^ S(xl, x, 29) ^ x >>> 6;
                    var gamma1l = S(xl, x, 19) ^ S(x, xl, 29) ^ S(xl, x, 6);
                    var Wi7 = W[j - 7 * 2];
                    var Wi7l = W[j - 7 * 2 + 1];
                    var Wi16 = W[j - 16 * 2];
                    var Wi16l = W[j - 16 * 2 + 1];
                    Wil = gamma0l + Wi7l;
                    Wi = gamma0 + Wi7 + (Wil >>> 0 < gamma0l >>> 0 ? 1 : 0);
                    Wil = Wil + gamma1l;
                    Wi = Wi + gamma1 + (Wil >>> 0 < gamma1l >>> 0 ? 1 : 0);
                    Wil = Wil + Wi16l;
                    Wi = Wi + Wi16 + (Wil >>> 0 < Wi16l >>> 0 ? 1 : 0);
                    W[j] = Wi;
                    W[j + 1] = Wil;
                }
                var maj = Maj(a, b, c);
                var majl = Maj(al, bl, cl);
                var sigma0h = S(a, al, 28) ^ S(al, a, 2) ^ S(al, a, 7);
                var sigma0l = S(al, a, 28) ^ S(a, al, 2) ^ S(a, al, 7);
                var sigma1h = S(e, el, 14) ^ S(e, el, 18) ^ S(el, e, 9);
                var sigma1l = S(el, e, 14) ^ S(el, e, 18) ^ S(e, el, 9);
                var Ki = K[j];
                var Kil = K[j + 1];
                var ch = Ch(e, f, g);
                var chl = Ch(el, fl, gl);
                var t1l = hl + sigma1l;
                var t1 = h + sigma1h + (t1l >>> 0 < hl >>> 0 ? 1 : 0);
                t1l = t1l + chl;
                t1 = t1 + ch + (t1l >>> 0 < chl >>> 0 ? 1 : 0);
                t1l = t1l + Kil;
                t1 = t1 + Ki + (t1l >>> 0 < Kil >>> 0 ? 1 : 0);
                t1l = t1l + Wil;
                t1 = t1 + Wi + (t1l >>> 0 < Wil >>> 0 ? 1 : 0);
                var t2l = sigma0l + majl;
                var t2 = sigma0h + maj + (t2l >>> 0 < sigma0l >>> 0 ? 1 : 0);
                h = g;
                hl = gl;
                g = f;
                gl = fl;
                f = e;
                fl = el;
                el = dl + t1l | 0;
                e = d + t1 + (el >>> 0 < dl >>> 0 ? 1 : 0) | 0;
                d = c;
                dl = cl;
                c = b;
                cl = bl;
                b = a;
                bl = al;
                al = t1l + t2l | 0;
                a = t1 + t2 + (al >>> 0 < t1l >>> 0 ? 1 : 0) | 0;
            }
            this._al = this._al + al | 0;
            this._bl = this._bl + bl | 0;
            this._cl = this._cl + cl | 0;
            this._dl = this._dl + dl | 0;
            this._el = this._el + el | 0;
            this._fl = this._fl + fl | 0;
            this._gl = this._gl + gl | 0;
            this._hl = this._hl + hl | 0;
            this._a = this._a + a + (this._al >>> 0 < al >>> 0 ? 1 : 0) | 0;
            this._b = this._b + b + (this._bl >>> 0 < bl >>> 0 ? 1 : 0) | 0;
            this._c = this._c + c + (this._cl >>> 0 < cl >>> 0 ? 1 : 0) | 0;
            this._d = this._d + d + (this._dl >>> 0 < dl >>> 0 ? 1 : 0) | 0;
            this._e = this._e + e + (this._el >>> 0 < el >>> 0 ? 1 : 0) | 0;
            this._f = this._f + f + (this._fl >>> 0 < fl >>> 0 ? 1 : 0) | 0;
            this._g = this._g + g + (this._gl >>> 0 < gl >>> 0 ? 1 : 0) | 0;
            this._h = this._h + h + (this._hl >>> 0 < hl >>> 0 ? 1 : 0) | 0;
        };
        Sha512.prototype._hash = function() {
            var H = new Buffer(64);
            function writeInt64BE(h, l, offset) {
                H.writeInt32BE(h, offset);
                H.writeInt32BE(l, offset + 4);
            }
            writeInt64BE(this._a, this._al, 0);
            writeInt64BE(this._b, this._bl, 8);
            writeInt64BE(this._c, this._cl, 16);
            writeInt64BE(this._d, this._dl, 24);
            writeInt64BE(this._e, this._el, 32);
            writeInt64BE(this._f, this._fl, 40);
            writeInt64BE(this._g, this._gl, 48);
            writeInt64BE(this._h, this._hl, 56);
            return H;
        };
        return Sha512;
    };
}, function(module, exports, __webpack_require__) {
    var helpers = __webpack_require__(20);
    function core_md5(x, len) {
        x[len >> 5] |= 128 << len % 32;
        x[(len + 64 >>> 9 << 4) + 14] = len;
        var a = 1732584193;
        var b = -271733879;
        var c = -1732584194;
        var d = 271733878;
        for (var i = 0; i < x.length; i += 16) {
            var olda = a;
            var oldb = b;
            var oldc = c;
            var oldd = d;
            a = md5_ff(a, b, c, d, x[i + 0], 7, -680876936);
            d = md5_ff(d, a, b, c, x[i + 1], 12, -389564586);
            c = md5_ff(c, d, a, b, x[i + 2], 17, 606105819);
            b = md5_ff(b, c, d, a, x[i + 3], 22, -1044525330);
            a = md5_ff(a, b, c, d, x[i + 4], 7, -176418897);
            d = md5_ff(d, a, b, c, x[i + 5], 12, 1200080426);
            c = md5_ff(c, d, a, b, x[i + 6], 17, -1473231341);
            b = md5_ff(b, c, d, a, x[i + 7], 22, -45705983);
            a = md5_ff(a, b, c, d, x[i + 8], 7, 1770035416);
            d = md5_ff(d, a, b, c, x[i + 9], 12, -1958414417);
            c = md5_ff(c, d, a, b, x[i + 10], 17, -42063);
            b = md5_ff(b, c, d, a, x[i + 11], 22, -1990404162);
            a = md5_ff(a, b, c, d, x[i + 12], 7, 1804603682);
            d = md5_ff(d, a, b, c, x[i + 13], 12, -40341101);
            c = md5_ff(c, d, a, b, x[i + 14], 17, -1502002290);
            b = md5_ff(b, c, d, a, x[i + 15], 22, 1236535329);
            a = md5_gg(a, b, c, d, x[i + 1], 5, -165796510);
            d = md5_gg(d, a, b, c, x[i + 6], 9, -1069501632);
            c = md5_gg(c, d, a, b, x[i + 11], 14, 643717713);
            b = md5_gg(b, c, d, a, x[i + 0], 20, -373897302);
            a = md5_gg(a, b, c, d, x[i + 5], 5, -701558691);
            d = md5_gg(d, a, b, c, x[i + 10], 9, 38016083);
            c = md5_gg(c, d, a, b, x[i + 15], 14, -660478335);
            b = md5_gg(b, c, d, a, x[i + 4], 20, -405537848);
            a = md5_gg(a, b, c, d, x[i + 9], 5, 568446438);
            d = md5_gg(d, a, b, c, x[i + 14], 9, -1019803690);
            c = md5_gg(c, d, a, b, x[i + 3], 14, -187363961);
            b = md5_gg(b, c, d, a, x[i + 8], 20, 1163531501);
            a = md5_gg(a, b, c, d, x[i + 13], 5, -1444681467);
            d = md5_gg(d, a, b, c, x[i + 2], 9, -51403784);
            c = md5_gg(c, d, a, b, x[i + 7], 14, 1735328473);
            b = md5_gg(b, c, d, a, x[i + 12], 20, -1926607734);
            a = md5_hh(a, b, c, d, x[i + 5], 4, -378558);
            d = md5_hh(d, a, b, c, x[i + 8], 11, -2022574463);
            c = md5_hh(c, d, a, b, x[i + 11], 16, 1839030562);
            b = md5_hh(b, c, d, a, x[i + 14], 23, -35309556);
            a = md5_hh(a, b, c, d, x[i + 1], 4, -1530992060);
            d = md5_hh(d, a, b, c, x[i + 4], 11, 1272893353);
            c = md5_hh(c, d, a, b, x[i + 7], 16, -155497632);
            b = md5_hh(b, c, d, a, x[i + 10], 23, -1094730640);
            a = md5_hh(a, b, c, d, x[i + 13], 4, 681279174);
            d = md5_hh(d, a, b, c, x[i + 0], 11, -358537222);
            c = md5_hh(c, d, a, b, x[i + 3], 16, -722521979);
            b = md5_hh(b, c, d, a, x[i + 6], 23, 76029189);
            a = md5_hh(a, b, c, d, x[i + 9], 4, -640364487);
            d = md5_hh(d, a, b, c, x[i + 12], 11, -421815835);
            c = md5_hh(c, d, a, b, x[i + 15], 16, 530742520);
            b = md5_hh(b, c, d, a, x[i + 2], 23, -995338651);
            a = md5_ii(a, b, c, d, x[i + 0], 6, -198630844);
            d = md5_ii(d, a, b, c, x[i + 7], 10, 1126891415);
            c = md5_ii(c, d, a, b, x[i + 14], 15, -1416354905);
            b = md5_ii(b, c, d, a, x[i + 5], 21, -57434055);
            a = md5_ii(a, b, c, d, x[i + 12], 6, 1700485571);
            d = md5_ii(d, a, b, c, x[i + 3], 10, -1894986606);
            c = md5_ii(c, d, a, b, x[i + 10], 15, -1051523);
            b = md5_ii(b, c, d, a, x[i + 1], 21, -2054922799);
            a = md5_ii(a, b, c, d, x[i + 8], 6, 1873313359);
            d = md5_ii(d, a, b, c, x[i + 15], 10, -30611744);
            c = md5_ii(c, d, a, b, x[i + 6], 15, -1560198380);
            b = md5_ii(b, c, d, a, x[i + 13], 21, 1309151649);
            a = md5_ii(a, b, c, d, x[i + 4], 6, -145523070);
            d = md5_ii(d, a, b, c, x[i + 11], 10, -1120210379);
            c = md5_ii(c, d, a, b, x[i + 2], 15, 718787259);
            b = md5_ii(b, c, d, a, x[i + 9], 21, -343485551);
            a = safe_add(a, olda);
            b = safe_add(b, oldb);
            c = safe_add(c, oldc);
            d = safe_add(d, oldd);
        }
        return Array(a, b, c, d);
    }
    function md5_cmn(q, a, b, x, s, t) {
        return safe_add(bit_rol(safe_add(safe_add(a, q), safe_add(x, t)), s), b);
    }
    function md5_ff(a, b, c, d, x, s, t) {
        return md5_cmn(b & c | ~b & d, a, b, x, s, t);
    }
    function md5_gg(a, b, c, d, x, s, t) {
        return md5_cmn(b & d | c & ~d, a, b, x, s, t);
    }
    function md5_hh(a, b, c, d, x, s, t) {
        return md5_cmn(b ^ c ^ d, a, b, x, s, t);
    }
    function md5_ii(a, b, c, d, x, s, t) {
        return md5_cmn(c ^ (b | ~d), a, b, x, s, t);
    }
    function safe_add(x, y) {
        var lsw = (x & 65535) + (y & 65535);
        var msw = (x >> 16) + (y >> 16) + (lsw >> 16);
        return msw << 16 | lsw & 65535;
    }
    function bit_rol(num, cnt) {
        return num << cnt | num >>> 32 - cnt;
    }
    module.exports = function md5(buf) {
        return helpers.hash(buf, core_md5, 16);
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var intSize = 4;
        var zeroBuffer = new Buffer(intSize);
        zeroBuffer.fill(0);
        var chrsz = 8;
        function toArray(buf, bigEndian) {
            if (buf.length % intSize !== 0) {
                var len = buf.length + (intSize - buf.length % intSize);
                buf = Buffer.concat([ buf, zeroBuffer ], len);
            }
            var arr = [];
            var fn = bigEndian ? buf.readInt32BE : buf.readInt32LE;
            for (var i = 0; i < buf.length; i += intSize) {
                arr.push(fn.call(buf, i));
            }
            return arr;
        }
        function toBuffer(arr, size, bigEndian) {
            var buf = new Buffer(size);
            var fn = bigEndian ? buf.writeInt32BE : buf.writeInt32LE;
            for (var i = 0; i < arr.length; i++) {
                fn.call(buf, arr[i], i * 4, true);
            }
            return buf;
        }
        function hash(buf, fn, hashSize, bigEndian) {
            if (!Buffer.isBuffer(buf)) buf = new Buffer(buf);
            var arr = fn(toArray(buf, bigEndian), buf.length * chrsz);
            return toBuffer(arr, hashSize, bigEndian);
        }
        module.exports = {
            hash: hash
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        module.exports = ripemd160;
        var zl = [ 0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 7, 4, 13, 1, 10, 6, 15, 3, 12, 0, 9, 5, 2, 14, 11, 8, 3, 10, 14, 4, 9, 15, 8, 1, 2, 7, 0, 6, 13, 11, 5, 12, 1, 9, 11, 10, 0, 8, 12, 4, 13, 3, 7, 15, 14, 5, 6, 2, 4, 0, 5, 9, 7, 12, 2, 10, 14, 1, 3, 8, 11, 6, 15, 13 ];
        var zr = [ 5, 14, 7, 0, 9, 2, 11, 4, 13, 6, 15, 8, 1, 10, 3, 12, 6, 11, 3, 7, 0, 13, 5, 10, 14, 15, 8, 12, 4, 9, 1, 2, 15, 5, 1, 3, 7, 14, 6, 9, 11, 8, 12, 2, 10, 0, 4, 13, 8, 6, 4, 1, 3, 11, 15, 0, 5, 12, 2, 13, 9, 7, 10, 14, 12, 15, 10, 4, 1, 5, 8, 7, 6, 2, 13, 14, 0, 3, 9, 11 ];
        var sl = [ 11, 14, 15, 12, 5, 8, 7, 9, 11, 13, 14, 15, 6, 7, 9, 8, 7, 6, 8, 13, 11, 9, 7, 15, 7, 12, 15, 9, 11, 7, 13, 12, 11, 13, 6, 7, 14, 9, 13, 15, 14, 8, 13, 6, 5, 12, 7, 5, 11, 12, 14, 15, 14, 15, 9, 8, 9, 14, 5, 6, 8, 6, 5, 12, 9, 15, 5, 11, 6, 8, 13, 12, 5, 12, 13, 14, 11, 8, 5, 6 ];
        var sr = [ 8, 9, 9, 11, 13, 15, 15, 5, 7, 7, 8, 11, 14, 14, 12, 6, 9, 13, 15, 7, 12, 8, 9, 11, 7, 7, 12, 7, 6, 15, 13, 11, 9, 7, 15, 11, 8, 6, 6, 14, 12, 13, 5, 14, 13, 13, 7, 5, 15, 5, 8, 11, 14, 14, 6, 14, 6, 9, 12, 9, 12, 5, 15, 8, 8, 5, 12, 9, 12, 5, 14, 6, 8, 13, 6, 5, 15, 13, 11, 11 ];
        var hl = [ 0, 1518500249, 1859775393, 2400959708, 2840853838 ];
        var hr = [ 1352829926, 1548603684, 1836072691, 2053994217, 0 ];
        var bytesToWords = function(bytes) {
            var words = [];
            for (var i = 0, b = 0; i < bytes.length; i++, b += 8) {
                words[b >>> 5] |= bytes[i] << 24 - b % 32;
            }
            return words;
        };
        var wordsToBytes = function(words) {
            var bytes = [];
            for (var b = 0; b < words.length * 32; b += 8) {
                bytes.push(words[b >>> 5] >>> 24 - b % 32 & 255);
            }
            return bytes;
        };
        var processBlock = function(H, M, offset) {
            for (var i = 0; i < 16; i++) {
                var offset_i = offset + i;
                var M_offset_i = M[offset_i];
                M[offset_i] = (M_offset_i << 8 | M_offset_i >>> 24) & 16711935 | (M_offset_i << 24 | M_offset_i >>> 8) & 4278255360;
            }
            var al, bl, cl, dl, el;
            var ar, br, cr, dr, er;
            ar = al = H[0];
            br = bl = H[1];
            cr = cl = H[2];
            dr = dl = H[3];
            er = el = H[4];
            var t;
            for (var i = 0; i < 80; i += 1) {
                t = al + M[offset + zl[i]] | 0;
                if (i < 16) {
                    t += f1(bl, cl, dl) + hl[0];
                } else if (i < 32) {
                    t += f2(bl, cl, dl) + hl[1];
                } else if (i < 48) {
                    t += f3(bl, cl, dl) + hl[2];
                } else if (i < 64) {
                    t += f4(bl, cl, dl) + hl[3];
                } else {
                    t += f5(bl, cl, dl) + hl[4];
                }
                t = t | 0;
                t = rotl(t, sl[i]);
                t = t + el | 0;
                al = el;
                el = dl;
                dl = rotl(cl, 10);
                cl = bl;
                bl = t;
                t = ar + M[offset + zr[i]] | 0;
                if (i < 16) {
                    t += f5(br, cr, dr) + hr[0];
                } else if (i < 32) {
                    t += f4(br, cr, dr) + hr[1];
                } else if (i < 48) {
                    t += f3(br, cr, dr) + hr[2];
                } else if (i < 64) {
                    t += f2(br, cr, dr) + hr[3];
                } else {
                    t += f1(br, cr, dr) + hr[4];
                }
                t = t | 0;
                t = rotl(t, sr[i]);
                t = t + er | 0;
                ar = er;
                er = dr;
                dr = rotl(cr, 10);
                cr = br;
                br = t;
            }
            t = H[1] + cl + dr | 0;
            H[1] = H[2] + dl + er | 0;
            H[2] = H[3] + el + ar | 0;
            H[3] = H[4] + al + br | 0;
            H[4] = H[0] + bl + cr | 0;
            H[0] = t;
        };
        function f1(x, y, z) {
            return x ^ y ^ z;
        }
        function f2(x, y, z) {
            return x & y | ~x & z;
        }
        function f3(x, y, z) {
            return (x | ~y) ^ z;
        }
        function f4(x, y, z) {
            return x & z | y & ~z;
        }
        function f5(x, y, z) {
            return x ^ (y | ~z);
        }
        function rotl(x, n) {
            return x << n | x >>> 32 - n;
        }
        function ripemd160(message) {
            var H = [ 1732584193, 4023233417, 2562383102, 271733878, 3285377520 ];
            if (typeof message == "string") message = new Buffer(message, "utf8");
            var m = bytesToWords(message);
            var nBitsLeft = message.length * 8;
            var nBitsTotal = message.length * 8;
            m[nBitsLeft >>> 5] |= 128 << 24 - nBitsLeft % 32;
            m[(nBitsLeft + 64 >>> 9 << 4) + 14] = (nBitsTotal << 8 | nBitsTotal >>> 24) & 16711935 | (nBitsTotal << 24 | nBitsTotal >>> 8) & 4278255360;
            for (var i = 0; i < m.length; i += 16) {
                processBlock(H, m, i);
            }
            for (var i = 0; i < 5; i++) {
                var H_i = H[i];
                H[i] = (H_i << 8 | H_i >>> 24) & 16711935 | (H_i << 24 | H_i >>> 8) & 4278255360;
            }
            var digestbytes = wordsToBytes(H);
            return new Buffer(digestbytes);
        }
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var createHash = __webpack_require__(9);
        var zeroBuffer = new Buffer(128);
        zeroBuffer.fill(0);
        module.exports = Hmac;
        function Hmac(alg, key) {
            if (!(this instanceof Hmac)) return new Hmac(alg, key);
            this._opad = opad;
            this._alg = alg;
            var blocksize = alg === "sha512" ? 128 : 64;
            key = this._key = !Buffer.isBuffer(key) ? new Buffer(key) : key;
            if (key.length > blocksize) {
                key = createHash(alg).update(key).digest();
            } else if (key.length < blocksize) {
                key = Buffer.concat([ key, zeroBuffer ], blocksize);
            }
            var ipad = this._ipad = new Buffer(blocksize);
            var opad = this._opad = new Buffer(blocksize);
            for (var i = 0; i < blocksize; i++) {
                ipad[i] = key[i] ^ 54;
                opad[i] = key[i] ^ 92;
            }
            this._hash = createHash(alg).update(ipad);
        }
        Hmac.prototype.update = function(data, enc) {
            this._hash.update(data, enc);
            return this;
        };
        Hmac.prototype.digest = function(enc) {
            var h = this._hash.digest();
            return createHash(this._alg).update(this._opad).update(h).digest(enc);
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    var pbkdf2Export = __webpack_require__(24);
    module.exports = function(crypto, exports) {
        exports = exports || {};
        var exported = pbkdf2Export(crypto);
        exports.pbkdf2 = exported.pbkdf2;
        exports.pbkdf2Sync = exported.pbkdf2Sync;
        return exports;
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        module.exports = function(crypto) {
            function pbkdf2(password, salt, iterations, keylen, digest, callback) {
                if ("function" === typeof digest) {
                    callback = digest;
                    digest = undefined;
                }
                if ("function" !== typeof callback) throw new Error("No callback provided to pbkdf2");
                setTimeout(function() {
                    var result;
                    try {
                        result = pbkdf2Sync(password, salt, iterations, keylen, digest);
                    } catch (e) {
                        return callback(e);
                    }
                    callback(undefined, result);
                });
            }
            function pbkdf2Sync(password, salt, iterations, keylen, digest) {
                if ("number" !== typeof iterations) throw new TypeError("Iterations not a number");
                if (iterations < 0) throw new TypeError("Bad iterations");
                if ("number" !== typeof keylen) throw new TypeError("Key length not a number");
                if (keylen < 0) throw new TypeError("Bad key length");
                digest = digest || "sha1";
                if (!Buffer.isBuffer(password)) password = new Buffer(password);
                if (!Buffer.isBuffer(salt)) salt = new Buffer(salt);
                var hLen, l = 1, r, T;
                var DK = new Buffer(keylen);
                var block1 = new Buffer(salt.length + 4);
                salt.copy(block1, 0, 0, salt.length);
                for (var i = 1; i <= l; i++) {
                    block1.writeUInt32BE(i, salt.length);
                    var U = crypto.createHmac(digest, password).update(block1).digest();
                    if (!hLen) {
                        hLen = U.length;
                        T = new Buffer(hLen);
                        l = Math.ceil(keylen / hLen);
                        r = keylen - (l - 1) * hLen;
                        if (keylen > (Math.pow(2, 32) - 1) * hLen) throw new TypeError("keylen exceeds maximum length");
                    }
                    U.copy(T, 0, 0, hLen);
                    for (var j = 1; j < iterations; j++) {
                        U = crypto.createHmac(digest, password).update(U).digest();
                        for (var k = 0; k < hLen; k++) {
                            T[k] ^= U[k];
                        }
                    }
                    var destPos = (i - 1) * hLen;
                    var len = i == l ? r : hLen;
                    T.copy(DK, destPos, 0, len);
                }
                return DK;
            }
            return {
                pbkdf2: pbkdf2,
                pbkdf2Sync: pbkdf2Sync
            };
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    module.exports = function(crypto, exports) {
        exports = exports || {};
        var ciphers = __webpack_require__(26)(crypto);
        exports.createCipher = ciphers.createCipher;
        exports.createCipheriv = ciphers.createCipheriv;
        var deciphers = __webpack_require__(60)(crypto);
        exports.createDecipher = deciphers.createDecipher;
        exports.createDecipheriv = deciphers.createDecipheriv;
        var modes = __webpack_require__(51);
        function listCiphers() {
            return Object.keys(modes);
        }
        exports.listCiphers = listCiphers;
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var aes = __webpack_require__(27);
        var Transform = __webpack_require__(28);
        var inherits = __webpack_require__(31);
        var modes = __webpack_require__(51);
        var ebtk = __webpack_require__(52);
        var StreamCipher = __webpack_require__(53);
        inherits(Cipher, Transform);
        function Cipher(mode, key, iv) {
            if (!(this instanceof Cipher)) {
                return new Cipher(mode, key, iv);
            }
            Transform.call(this);
            this._cache = new Splitter();
            this._cipher = new aes.AES(key);
            this._prev = new Buffer(iv.length);
            iv.copy(this._prev);
            this._mode = mode;
        }
        Cipher.prototype._transform = function(data, _, next) {
            this._cache.add(data);
            var chunk;
            var thing;
            while (chunk = this._cache.get()) {
                thing = this._mode.encrypt(this, chunk);
                this.push(thing);
            }
            next();
        };
        Cipher.prototype._flush = function(next) {
            var chunk = this._cache.flush();
            this.push(this._mode.encrypt(this, chunk));
            this._cipher.scrub();
            next();
        };
        function Splitter() {
            if (!(this instanceof Splitter)) {
                return new Splitter();
            }
            this.cache = new Buffer("");
        }
        Splitter.prototype.add = function(data) {
            this.cache = Buffer.concat([ this.cache, data ]);
        };
        Splitter.prototype.get = function() {
            if (this.cache.length > 15) {
                var out = this.cache.slice(0, 16);
                this.cache = this.cache.slice(16);
                return out;
            }
            return null;
        };
        Splitter.prototype.flush = function() {
            var len = 16 - this.cache.length;
            var padBuff = new Buffer(len);
            var i = -1;
            while (++i < len) {
                padBuff.writeUInt8(len, i);
            }
            var out = Buffer.concat([ this.cache, padBuff ]);
            return out;
        };
        var modelist = {
            ECB: __webpack_require__(54),
            CBC: __webpack_require__(55),
            CFB: __webpack_require__(57),
            OFB: __webpack_require__(58),
            CTR: __webpack_require__(59)
        };
        module.exports = function(crypto) {
            function createCipheriv(suite, password, iv) {
                var config = modes[suite];
                if (!config) {
                    throw new TypeError("invalid suite type");
                }
                if (typeof iv === "string") {
                    iv = new Buffer(iv);
                }
                if (typeof password === "string") {
                    password = new Buffer(password);
                }
                if (password.length !== config.key / 8) {
                    throw new TypeError("invalid key length " + password.length);
                }
                if (iv.length !== config.iv) {
                    throw new TypeError("invalid iv length " + iv.length);
                }
                if (config.type === "stream") {
                    return new StreamCipher(modelist[config.mode], password, iv);
                }
                return new Cipher(modelist[config.mode], password, iv);
            }
            function createCipher(suite, password) {
                var config = modes[suite];
                if (!config) {
                    throw new TypeError("invalid suite type");
                }
                var keys = ebtk(crypto, password, config.key, config.iv);
                return createCipheriv(suite, keys.key, keys.iv);
            }
            return {
                createCipher: createCipher,
                createCipheriv: createCipheriv
            };
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var uint_max = Math.pow(2, 32);
        function fixup_uint32(x) {
            var ret, x_pos;
            ret = x > uint_max || x < 0 ? (x_pos = Math.abs(x) % uint_max, x < 0 ? uint_max - x_pos : x_pos) : x;
            return ret;
        }
        function scrub_vec(v) {
            var i, _i, _ref;
            for (i = _i = 0, _ref = v.length; 0 <= _ref ? _i < _ref : _i > _ref; i = 0 <= _ref ? ++_i : --_i) {
                v[i] = 0;
            }
            return false;
        }
        function Global() {
            var i;
            this.SBOX = [];
            this.INV_SBOX = [];
            this.SUB_MIX = function() {
                var _i, _results;
                _results = [];
                for (i = _i = 0; _i < 4; i = ++_i) {
                    _results.push([]);
                }
                return _results;
            }();
            this.INV_SUB_MIX = function() {
                var _i, _results;
                _results = [];
                for (i = _i = 0; _i < 4; i = ++_i) {
                    _results.push([]);
                }
                return _results;
            }();
            this.init();
            this.RCON = [ 0, 1, 2, 4, 8, 16, 32, 64, 128, 27, 54 ];
        }
        Global.prototype.init = function() {
            var d, i, sx, t, x, x2, x4, x8, xi, _i;
            d = function() {
                var _i, _results;
                _results = [];
                for (i = _i = 0; _i < 256; i = ++_i) {
                    if (i < 128) {
                        _results.push(i << 1);
                    } else {
                        _results.push(i << 1 ^ 283);
                    }
                }
                return _results;
            }();
            x = 0;
            xi = 0;
            for (i = _i = 0; _i < 256; i = ++_i) {
                sx = xi ^ xi << 1 ^ xi << 2 ^ xi << 3 ^ xi << 4;
                sx = sx >>> 8 ^ sx & 255 ^ 99;
                this.SBOX[x] = sx;
                this.INV_SBOX[sx] = x;
                x2 = d[x];
                x4 = d[x2];
                x8 = d[x4];
                t = d[sx] * 257 ^ sx * 16843008;
                this.SUB_MIX[0][x] = t << 24 | t >>> 8;
                this.SUB_MIX[1][x] = t << 16 | t >>> 16;
                this.SUB_MIX[2][x] = t << 8 | t >>> 24;
                this.SUB_MIX[3][x] = t;
                t = x8 * 16843009 ^ x4 * 65537 ^ x2 * 257 ^ x * 16843008;
                this.INV_SUB_MIX[0][sx] = t << 24 | t >>> 8;
                this.INV_SUB_MIX[1][sx] = t << 16 | t >>> 16;
                this.INV_SUB_MIX[2][sx] = t << 8 | t >>> 24;
                this.INV_SUB_MIX[3][sx] = t;
                if (x === 0) {
                    x = xi = 1;
                } else {
                    x = x2 ^ d[d[d[x8 ^ x2]]];
                    xi ^= d[d[xi]];
                }
            }
            return true;
        };
        var G = new Global();
        AES.blockSize = 4 * 4;
        AES.prototype.blockSize = AES.blockSize;
        AES.keySize = 256 / 8;
        AES.prototype.keySize = AES.keySize;
        AES.ivSize = AES.blockSize;
        AES.prototype.ivSize = AES.ivSize;
        function bufferToArray(buf) {
            var len = buf.length / 4;
            var out = new Array(len);
            var i = -1;
            while (++i < len) {
                out[i] = buf.readUInt32BE(i * 4);
            }
            return out;
        }
        function AES(key) {
            this._key = bufferToArray(key);
            this._doReset();
        }
        AES.prototype._doReset = function() {
            var invKsRow, keySize, keyWords, ksRow, ksRows, t, _i, _j;
            keyWords = this._key;
            keySize = keyWords.length;
            this._nRounds = keySize + 6;
            ksRows = (this._nRounds + 1) * 4;
            this._keySchedule = [];
            for (ksRow = _i = 0; 0 <= ksRows ? _i < ksRows : _i > ksRows; ksRow = 0 <= ksRows ? ++_i : --_i) {
                this._keySchedule[ksRow] = ksRow < keySize ? keyWords[ksRow] : (t = this._keySchedule[ksRow - 1], 
                ksRow % keySize === 0 ? (t = t << 8 | t >>> 24, t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 255] << 16 | G.SBOX[t >>> 8 & 255] << 8 | G.SBOX[t & 255], 
                t ^= G.RCON[ksRow / keySize | 0] << 24) : keySize > 6 && ksRow % keySize === 4 ? t = G.SBOX[t >>> 24] << 24 | G.SBOX[t >>> 16 & 255] << 16 | G.SBOX[t >>> 8 & 255] << 8 | G.SBOX[t & 255] : void 0, 
                this._keySchedule[ksRow - keySize] ^ t);
            }
            this._invKeySchedule = [];
            for (invKsRow = _j = 0; 0 <= ksRows ? _j < ksRows : _j > ksRows; invKsRow = 0 <= ksRows ? ++_j : --_j) {
                ksRow = ksRows - invKsRow;
                t = this._keySchedule[ksRow - (invKsRow % 4 ? 0 : 4)];
                this._invKeySchedule[invKsRow] = invKsRow < 4 || ksRow <= 4 ? t : G.INV_SUB_MIX[0][G.SBOX[t >>> 24]] ^ G.INV_SUB_MIX[1][G.SBOX[t >>> 16 & 255]] ^ G.INV_SUB_MIX[2][G.SBOX[t >>> 8 & 255]] ^ G.INV_SUB_MIX[3][G.SBOX[t & 255]];
            }
            return true;
        };
        AES.prototype.encryptBlock = function(M) {
            M = bufferToArray(new Buffer(M));
            var out = this._doCryptBlock(M, this._keySchedule, G.SUB_MIX, G.SBOX);
            var buf = new Buffer(16);
            buf.writeUInt32BE(out[0], 0);
            buf.writeUInt32BE(out[1], 4);
            buf.writeUInt32BE(out[2], 8);
            buf.writeUInt32BE(out[3], 12);
            return buf;
        };
        AES.prototype.decryptBlock = function(M) {
            M = bufferToArray(new Buffer(M));
            var temp = [ M[3], M[1] ];
            M[1] = temp[0];
            M[3] = temp[1];
            var out = this._doCryptBlock(M, this._invKeySchedule, G.INV_SUB_MIX, G.INV_SBOX);
            var buf = new Buffer(16);
            buf.writeUInt32BE(out[0], 0);
            buf.writeUInt32BE(out[3], 4);
            buf.writeUInt32BE(out[2], 8);
            buf.writeUInt32BE(out[1], 12);
            return buf;
        };
        AES.prototype.scrub = function() {
            scrub_vec(this._keySchedule);
            scrub_vec(this._invKeySchedule);
            scrub_vec(this._key);
        };
        AES.prototype._doCryptBlock = function(M, keySchedule, SUB_MIX, SBOX) {
            var ksRow, round, s0, s1, s2, s3, t0, t1, t2, t3, _i, _ref;
            s0 = M[0] ^ keySchedule[0];
            s1 = M[1] ^ keySchedule[1];
            s2 = M[2] ^ keySchedule[2];
            s3 = M[3] ^ keySchedule[3];
            ksRow = 4;
            for (round = _i = 1, _ref = this._nRounds; 1 <= _ref ? _i < _ref : _i > _ref; round = 1 <= _ref ? ++_i : --_i) {
                t0 = SUB_MIX[0][s0 >>> 24] ^ SUB_MIX[1][s1 >>> 16 & 255] ^ SUB_MIX[2][s2 >>> 8 & 255] ^ SUB_MIX[3][s3 & 255] ^ keySchedule[ksRow++];
                t1 = SUB_MIX[0][s1 >>> 24] ^ SUB_MIX[1][s2 >>> 16 & 255] ^ SUB_MIX[2][s3 >>> 8 & 255] ^ SUB_MIX[3][s0 & 255] ^ keySchedule[ksRow++];
                t2 = SUB_MIX[0][s2 >>> 24] ^ SUB_MIX[1][s3 >>> 16 & 255] ^ SUB_MIX[2][s0 >>> 8 & 255] ^ SUB_MIX[3][s1 & 255] ^ keySchedule[ksRow++];
                t3 = SUB_MIX[0][s3 >>> 24] ^ SUB_MIX[1][s0 >>> 16 & 255] ^ SUB_MIX[2][s1 >>> 8 & 255] ^ SUB_MIX[3][s2 & 255] ^ keySchedule[ksRow++];
                s0 = t0;
                s1 = t1;
                s2 = t2;
                s3 = t3;
            }
            t0 = (SBOX[s0 >>> 24] << 24 | SBOX[s1 >>> 16 & 255] << 16 | SBOX[s2 >>> 8 & 255] << 8 | SBOX[s3 & 255]) ^ keySchedule[ksRow++];
            t1 = (SBOX[s1 >>> 24] << 24 | SBOX[s2 >>> 16 & 255] << 16 | SBOX[s3 >>> 8 & 255] << 8 | SBOX[s0 & 255]) ^ keySchedule[ksRow++];
            t2 = (SBOX[s2 >>> 24] << 24 | SBOX[s3 >>> 16 & 255] << 16 | SBOX[s0 >>> 8 & 255] << 8 | SBOX[s1 & 255]) ^ keySchedule[ksRow++];
            t3 = (SBOX[s3 >>> 24] << 24 | SBOX[s0 >>> 16 & 255] << 16 | SBOX[s1 >>> 8 & 255] << 8 | SBOX[s2 & 255]) ^ keySchedule[ksRow++];
            return [ fixup_uint32(t0), fixup_uint32(t1), fixup_uint32(t2), fixup_uint32(t3) ];
        };
        exports.AES = AES;
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var Transform = __webpack_require__(29).Transform;
        var inherits = __webpack_require__(31);
        module.exports = CipherBase;
        inherits(CipherBase, Transform);
        function CipherBase() {
            Transform.call(this);
        }
        CipherBase.prototype.update = function(data, inputEnd, outputEnc) {
            this.write(data, inputEnd);
            var outData = new Buffer("");
            var chunk;
            while (chunk = this.read()) {
                outData = Buffer.concat([ outData, chunk ]);
            }
            if (outputEnc) {
                outData = outData.toString(outputEnc);
            }
            return outData;
        };
        CipherBase.prototype.final = function(outputEnc) {
            this.end();
            var outData = new Buffer("");
            var chunk;
            while (chunk = this.read()) {
                outData = Buffer.concat([ outData, chunk ]);
            }
            if (outputEnc) {
                outData = outData.toString(outputEnc);
            }
            return outData;
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    module.exports = Stream;
    var EE = __webpack_require__(30).EventEmitter;
    var inherits = __webpack_require__(31);
    inherits(Stream, EE);
    Stream.Readable = __webpack_require__(32);
    Stream.Writable = __webpack_require__(47);
    Stream.Duplex = __webpack_require__(48);
    Stream.Transform = __webpack_require__(49);
    Stream.PassThrough = __webpack_require__(50);
    Stream.Stream = Stream;
    function Stream() {
        EE.call(this);
    }
    Stream.prototype.pipe = function(dest, options) {
        var source = this;
        function ondata(chunk) {
            if (dest.writable) {
                if (false === dest.write(chunk) && source.pause) {
                    source.pause();
                }
            }
        }
        source.on("data", ondata);
        function ondrain() {
            if (source.readable && source.resume) {
                source.resume();
            }
        }
        dest.on("drain", ondrain);
        if (!dest._isStdio && (!options || options.end !== false)) {
            source.on("end", onend);
            source.on("close", onclose);
        }
        var didOnEnd = false;
        function onend() {
            if (didOnEnd) return;
            didOnEnd = true;
            dest.end();
        }
        function onclose() {
            if (didOnEnd) return;
            didOnEnd = true;
            if (typeof dest.destroy === "function") dest.destroy();
        }
        function onerror(er) {
            cleanup();
            if (EE.listenerCount(this, "error") === 0) {
                throw er;
            }
        }
        source.on("error", onerror);
        dest.on("error", onerror);
        function cleanup() {
            source.removeListener("data", ondata);
            dest.removeListener("drain", ondrain);
            source.removeListener("end", onend);
            source.removeListener("close", onclose);
            source.removeListener("error", onerror);
            dest.removeListener("error", onerror);
            source.removeListener("end", cleanup);
            source.removeListener("close", cleanup);
            dest.removeListener("close", cleanup);
        }
        source.on("end", cleanup);
        source.on("close", cleanup);
        dest.on("close", cleanup);
        dest.emit("pipe", source);
        return dest;
    };
}, function(module, exports) {
    function EventEmitter() {
        this._events = this._events || {};
        this._maxListeners = this._maxListeners || undefined;
    }
    module.exports = EventEmitter;
    EventEmitter.EventEmitter = EventEmitter;
    EventEmitter.prototype._events = undefined;
    EventEmitter.prototype._maxListeners = undefined;
    EventEmitter.defaultMaxListeners = 10;
    EventEmitter.prototype.setMaxListeners = function(n) {
        if (!isNumber(n) || n < 0 || isNaN(n)) throw TypeError("n must be a positive number");
        this._maxListeners = n;
        return this;
    };
    EventEmitter.prototype.emit = function(type) {
        var er, handler, len, args, i, listeners;
        if (!this._events) this._events = {};
        if (type === "error") {
            if (!this._events.error || isObject(this._events.error) && !this._events.error.length) {
                er = arguments[1];
                if (er instanceof Error) {
                    throw er;
                } else {
                    var err = new Error('Uncaught, unspecified "error" event. (' + er + ")");
                    err.context = er;
                    throw err;
                }
            }
        }
        handler = this._events[type];
        if (isUndefined(handler)) return false;
        if (isFunction(handler)) {
            switch (arguments.length) {
              case 1:
                handler.call(this);
                break;

              case 2:
                handler.call(this, arguments[1]);
                break;

              case 3:
                handler.call(this, arguments[1], arguments[2]);
                break;

              default:
                args = Array.prototype.slice.call(arguments, 1);
                handler.apply(this, args);
            }
        } else if (isObject(handler)) {
            args = Array.prototype.slice.call(arguments, 1);
            listeners = handler.slice();
            len = listeners.length;
            for (i = 0; i < len; i++) listeners[i].apply(this, args);
        }
        return true;
    };
    EventEmitter.prototype.addListener = function(type, listener) {
        var m;
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        if (!this._events) this._events = {};
        if (this._events.newListener) this.emit("newListener", type, isFunction(listener.listener) ? listener.listener : listener);
        if (!this._events[type]) this._events[type] = listener; else if (isObject(this._events[type])) this._events[type].push(listener); else this._events[type] = [ this._events[type], listener ];
        if (isObject(this._events[type]) && !this._events[type].warned) {
            if (!isUndefined(this._maxListeners)) {
                m = this._maxListeners;
            } else {
                m = EventEmitter.defaultMaxListeners;
            }
            if (m && m > 0 && this._events[type].length > m) {
                this._events[type].warned = true;
                console.error("(node) warning: possible EventEmitter memory " + "leak detected. %d listeners added. " + "Use emitter.setMaxListeners() to increase limit.", this._events[type].length);
                if (typeof console.trace === "function") {
                    console.trace();
                }
            }
        }
        return this;
    };
    EventEmitter.prototype.on = EventEmitter.prototype.addListener;
    EventEmitter.prototype.once = function(type, listener) {
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        var fired = false;
        function g() {
            this.removeListener(type, g);
            if (!fired) {
                fired = true;
                listener.apply(this, arguments);
            }
        }
        g.listener = listener;
        this.on(type, g);
        return this;
    };
    EventEmitter.prototype.removeListener = function(type, listener) {
        var list, position, length, i;
        if (!isFunction(listener)) throw TypeError("listener must be a function");
        if (!this._events || !this._events[type]) return this;
        list = this._events[type];
        length = list.length;
        position = -1;
        if (list === listener || isFunction(list.listener) && list.listener === listener) {
            delete this._events[type];
            if (this._events.removeListener) this.emit("removeListener", type, listener);
        } else if (isObject(list)) {
            for (i = length; i-- > 0; ) {
                if (list[i] === listener || list[i].listener && list[i].listener === listener) {
                    position = i;
                    break;
                }
            }
            if (position < 0) return this;
            if (list.length === 1) {
                list.length = 0;
                delete this._events[type];
            } else {
                list.splice(position, 1);
            }
            if (this._events.removeListener) this.emit("removeListener", type, listener);
        }
        return this;
    };
    EventEmitter.prototype.removeAllListeners = function(type) {
        var key, listeners;
        if (!this._events) return this;
        if (!this._events.removeListener) {
            if (arguments.length === 0) this._events = {}; else if (this._events[type]) delete this._events[type];
            return this;
        }
        if (arguments.length === 0) {
            for (key in this._events) {
                if (key === "removeListener") continue;
                this.removeAllListeners(key);
            }
            this.removeAllListeners("removeListener");
            this._events = {};
            return this;
        }
        listeners = this._events[type];
        if (isFunction(listeners)) {
            this.removeListener(type, listeners);
        } else if (listeners) {
            while (listeners.length) this.removeListener(type, listeners[listeners.length - 1]);
        }
        delete this._events[type];
        return this;
    };
    EventEmitter.prototype.listeners = function(type) {
        var ret;
        if (!this._events || !this._events[type]) ret = []; else if (isFunction(this._events[type])) ret = [ this._events[type] ]; else ret = this._events[type].slice();
        return ret;
    };
    EventEmitter.prototype.listenerCount = function(type) {
        if (this._events) {
            var evlistener = this._events[type];
            if (isFunction(evlistener)) return 1; else if (evlistener) return evlistener.length;
        }
        return 0;
    };
    EventEmitter.listenerCount = function(emitter, type) {
        return emitter.listenerCount(type);
    };
    function isFunction(arg) {
        return typeof arg === "function";
    }
    function isNumber(arg) {
        return typeof arg === "number";
    }
    function isObject(arg) {
        return typeof arg === "object" && arg !== null;
    }
    function isUndefined(arg) {
        return arg === void 0;
    }
}, function(module, exports) {
    if (typeof Object.create === "function") {
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            ctor.prototype = Object.create(superCtor.prototype, {
                constructor: {
                    value: ctor,
                    enumerable: false,
                    writable: true,
                    configurable: true
                }
            });
        };
    } else {
        module.exports = function inherits(ctor, superCtor) {
            ctor.super_ = superCtor;
            var TempCtor = function() {};
            TempCtor.prototype = superCtor.prototype;
            ctor.prototype = new TempCtor();
            ctor.prototype.constructor = ctor;
        };
    }
}, function(module, exports, __webpack_require__) {
    (function(process) {
        var Stream = function() {
            try {
                return __webpack_require__(29);
            } catch (_) {}
        }();
        exports = module.exports = __webpack_require__(33);
        exports.Stream = Stream || exports;
        exports.Readable = exports;
        exports.Writable = __webpack_require__(40);
        exports.Duplex = __webpack_require__(39);
        exports.Transform = __webpack_require__(45);
        exports.PassThrough = __webpack_require__(46);
        if (!process.browser && {
            NODE_ENV: undefined
        }.READABLE_STREAM === "disable" && Stream) {
            module.exports = Stream;
        }
    }).call(exports, __webpack_require__(14));
}, function(module, exports, __webpack_require__) {
    (function(process) {
        "use strict";
        module.exports = Readable;
        var processNextTick = __webpack_require__(34);
        var isArray = __webpack_require__(5);
        var Duplex;
        Readable.ReadableState = ReadableState;
        var EE = __webpack_require__(30).EventEmitter;
        var EElistenerCount = function(emitter, type) {
            return emitter.listeners(type).length;
        };
        var Stream;
        (function() {
            try {
                Stream = __webpack_require__(29);
            } catch (_) {} finally {
                if (!Stream) Stream = __webpack_require__(30).EventEmitter;
            }
        })();
        var Buffer = __webpack_require__(2).Buffer;
        var bufferShim = __webpack_require__(35);
        var util = __webpack_require__(36);
        util.inherits = __webpack_require__(31);
        var debugUtil = __webpack_require__(37);
        var debug = void 0;
        if (debugUtil && debugUtil.debuglog) {
            debug = debugUtil.debuglog("stream");
        } else {
            debug = function() {};
        }
        var BufferList = __webpack_require__(38);
        var StringDecoder;
        util.inherits(Readable, Stream);
        function prependListener(emitter, event, fn) {
            if (typeof emitter.prependListener === "function") {
                return emitter.prependListener(event, fn);
            } else {
                if (!emitter._events || !emitter._events[event]) emitter.on(event, fn); else if (isArray(emitter._events[event])) emitter._events[event].unshift(fn); else emitter._events[event] = [ fn, emitter._events[event] ];
            }
        }
        function ReadableState(options, stream) {
            Duplex = Duplex || __webpack_require__(39);
            options = options || {};
            this.objectMode = !!options.objectMode;
            if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.readableObjectMode;
            var hwm = options.highWaterMark;
            var defaultHwm = this.objectMode ? 16 : 16 * 1024;
            this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
            this.highWaterMark = ~~this.highWaterMark;
            this.buffer = new BufferList();
            this.length = 0;
            this.pipes = null;
            this.pipesCount = 0;
            this.flowing = null;
            this.ended = false;
            this.endEmitted = false;
            this.reading = false;
            this.sync = true;
            this.needReadable = false;
            this.emittedReadable = false;
            this.readableListening = false;
            this.resumeScheduled = false;
            this.defaultEncoding = options.defaultEncoding || "utf8";
            this.ranOut = false;
            this.awaitDrain = 0;
            this.readingMore = false;
            this.decoder = null;
            this.encoding = null;
            if (options.encoding) {
                if (!StringDecoder) StringDecoder = __webpack_require__(44).StringDecoder;
                this.decoder = new StringDecoder(options.encoding);
                this.encoding = options.encoding;
            }
        }
        function Readable(options) {
            Duplex = Duplex || __webpack_require__(39);
            if (!(this instanceof Readable)) return new Readable(options);
            this._readableState = new ReadableState(options, this);
            this.readable = true;
            if (options && typeof options.read === "function") this._read = options.read;
            Stream.call(this);
        }
        Readable.prototype.push = function(chunk, encoding) {
            var state = this._readableState;
            if (!state.objectMode && typeof chunk === "string") {
                encoding = encoding || state.defaultEncoding;
                if (encoding !== state.encoding) {
                    chunk = bufferShim.from(chunk, encoding);
                    encoding = "";
                }
            }
            return readableAddChunk(this, state, chunk, encoding, false);
        };
        Readable.prototype.unshift = function(chunk) {
            var state = this._readableState;
            return readableAddChunk(this, state, chunk, "", true);
        };
        Readable.prototype.isPaused = function() {
            return this._readableState.flowing === false;
        };
        function readableAddChunk(stream, state, chunk, encoding, addToFront) {
            var er = chunkInvalid(state, chunk);
            if (er) {
                stream.emit("error", er);
            } else if (chunk === null) {
                state.reading = false;
                onEofChunk(stream, state);
            } else if (state.objectMode || chunk && chunk.length > 0) {
                if (state.ended && !addToFront) {
                    var e = new Error("stream.push() after EOF");
                    stream.emit("error", e);
                } else if (state.endEmitted && addToFront) {
                    var _e = new Error("stream.unshift() after end event");
                    stream.emit("error", _e);
                } else {
                    var skipAdd;
                    if (state.decoder && !addToFront && !encoding) {
                        chunk = state.decoder.write(chunk);
                        skipAdd = !state.objectMode && chunk.length === 0;
                    }
                    if (!addToFront) state.reading = false;
                    if (!skipAdd) {
                        if (state.flowing && state.length === 0 && !state.sync) {
                            stream.emit("data", chunk);
                            stream.read(0);
                        } else {
                            state.length += state.objectMode ? 1 : chunk.length;
                            if (addToFront) state.buffer.unshift(chunk); else state.buffer.push(chunk);
                            if (state.needReadable) emitReadable(stream);
                        }
                    }
                    maybeReadMore(stream, state);
                }
            } else if (!addToFront) {
                state.reading = false;
            }
            return needMoreData(state);
        }
        function needMoreData(state) {
            return !state.ended && (state.needReadable || state.length < state.highWaterMark || state.length === 0);
        }
        Readable.prototype.setEncoding = function(enc) {
            if (!StringDecoder) StringDecoder = __webpack_require__(44).StringDecoder;
            this._readableState.decoder = new StringDecoder(enc);
            this._readableState.encoding = enc;
            return this;
        };
        var MAX_HWM = 8388608;
        function computeNewHighWaterMark(n) {
            if (n >= MAX_HWM) {
                n = MAX_HWM;
            } else {
                n--;
                n |= n >>> 1;
                n |= n >>> 2;
                n |= n >>> 4;
                n |= n >>> 8;
                n |= n >>> 16;
                n++;
            }
            return n;
        }
        function howMuchToRead(n, state) {
            if (n <= 0 || state.length === 0 && state.ended) return 0;
            if (state.objectMode) return 1;
            if (n !== n) {
                if (state.flowing && state.length) return state.buffer.head.data.length; else return state.length;
            }
            if (n > state.highWaterMark) state.highWaterMark = computeNewHighWaterMark(n);
            if (n <= state.length) return n;
            if (!state.ended) {
                state.needReadable = true;
                return 0;
            }
            return state.length;
        }
        Readable.prototype.read = function(n) {
            debug("read", n);
            n = parseInt(n, 10);
            var state = this._readableState;
            var nOrig = n;
            if (n !== 0) state.emittedReadable = false;
            if (n === 0 && state.needReadable && (state.length >= state.highWaterMark || state.ended)) {
                debug("read: emitReadable", state.length, state.ended);
                if (state.length === 0 && state.ended) endReadable(this); else emitReadable(this);
                return null;
            }
            n = howMuchToRead(n, state);
            if (n === 0 && state.ended) {
                if (state.length === 0) endReadable(this);
                return null;
            }
            var doRead = state.needReadable;
            debug("need readable", doRead);
            if (state.length === 0 || state.length - n < state.highWaterMark) {
                doRead = true;
                debug("length less than watermark", doRead);
            }
            if (state.ended || state.reading) {
                doRead = false;
                debug("reading or ended", doRead);
            } else if (doRead) {
                debug("do read");
                state.reading = true;
                state.sync = true;
                if (state.length === 0) state.needReadable = true;
                this._read(state.highWaterMark);
                state.sync = false;
                if (!state.reading) n = howMuchToRead(nOrig, state);
            }
            var ret;
            if (n > 0) ret = fromList(n, state); else ret = null;
            if (ret === null) {
                state.needReadable = true;
                n = 0;
            } else {
                state.length -= n;
            }
            if (state.length === 0) {
                if (!state.ended) state.needReadable = true;
                if (nOrig !== n && state.ended) endReadable(this);
            }
            if (ret !== null) this.emit("data", ret);
            return ret;
        };
        function chunkInvalid(state, chunk) {
            var er = null;
            if (!Buffer.isBuffer(chunk) && typeof chunk !== "string" && chunk !== null && chunk !== undefined && !state.objectMode) {
                er = new TypeError("Invalid non-string/buffer chunk");
            }
            return er;
        }
        function onEofChunk(stream, state) {
            if (state.ended) return;
            if (state.decoder) {
                var chunk = state.decoder.end();
                if (chunk && chunk.length) {
                    state.buffer.push(chunk);
                    state.length += state.objectMode ? 1 : chunk.length;
                }
            }
            state.ended = true;
            emitReadable(stream);
        }
        function emitReadable(stream) {
            var state = stream._readableState;
            state.needReadable = false;
            if (!state.emittedReadable) {
                debug("emitReadable", state.flowing);
                state.emittedReadable = true;
                if (state.sync) processNextTick(emitReadable_, stream); else emitReadable_(stream);
            }
        }
        function emitReadable_(stream) {
            debug("emit readable");
            stream.emit("readable");
            flow(stream);
        }
        function maybeReadMore(stream, state) {
            if (!state.readingMore) {
                state.readingMore = true;
                processNextTick(maybeReadMore_, stream, state);
            }
        }
        function maybeReadMore_(stream, state) {
            var len = state.length;
            while (!state.reading && !state.flowing && !state.ended && state.length < state.highWaterMark) {
                debug("maybeReadMore read 0");
                stream.read(0);
                if (len === state.length) break; else len = state.length;
            }
            state.readingMore = false;
        }
        Readable.prototype._read = function(n) {
            this.emit("error", new Error("_read() is not implemented"));
        };
        Readable.prototype.pipe = function(dest, pipeOpts) {
            var src = this;
            var state = this._readableState;
            switch (state.pipesCount) {
              case 0:
                state.pipes = dest;
                break;

              case 1:
                state.pipes = [ state.pipes, dest ];
                break;

              default:
                state.pipes.push(dest);
                break;
            }
            state.pipesCount += 1;
            debug("pipe count=%d opts=%j", state.pipesCount, pipeOpts);
            var doEnd = (!pipeOpts || pipeOpts.end !== false) && dest !== process.stdout && dest !== process.stderr;
            var endFn = doEnd ? onend : cleanup;
            if (state.endEmitted) processNextTick(endFn); else src.once("end", endFn);
            dest.on("unpipe", onunpipe);
            function onunpipe(readable) {
                debug("onunpipe");
                if (readable === src) {
                    cleanup();
                }
            }
            function onend() {
                debug("onend");
                dest.end();
            }
            var ondrain = pipeOnDrain(src);
            dest.on("drain", ondrain);
            var cleanedUp = false;
            function cleanup() {
                debug("cleanup");
                dest.removeListener("close", onclose);
                dest.removeListener("finish", onfinish);
                dest.removeListener("drain", ondrain);
                dest.removeListener("error", onerror);
                dest.removeListener("unpipe", onunpipe);
                src.removeListener("end", onend);
                src.removeListener("end", cleanup);
                src.removeListener("data", ondata);
                cleanedUp = true;
                if (state.awaitDrain && (!dest._writableState || dest._writableState.needDrain)) ondrain();
            }
            var increasedAwaitDrain = false;
            src.on("data", ondata);
            function ondata(chunk) {
                debug("ondata");
                increasedAwaitDrain = false;
                var ret = dest.write(chunk);
                if (false === ret && !increasedAwaitDrain) {
                    if ((state.pipesCount === 1 && state.pipes === dest || state.pipesCount > 1 && indexOf(state.pipes, dest) !== -1) && !cleanedUp) {
                        debug("false write response, pause", src._readableState.awaitDrain);
                        src._readableState.awaitDrain++;
                        increasedAwaitDrain = true;
                    }
                    src.pause();
                }
            }
            function onerror(er) {
                debug("onerror", er);
                unpipe();
                dest.removeListener("error", onerror);
                if (EElistenerCount(dest, "error") === 0) dest.emit("error", er);
            }
            prependListener(dest, "error", onerror);
            function onclose() {
                dest.removeListener("finish", onfinish);
                unpipe();
            }
            dest.once("close", onclose);
            function onfinish() {
                debug("onfinish");
                dest.removeListener("close", onclose);
                unpipe();
            }
            dest.once("finish", onfinish);
            function unpipe() {
                debug("unpipe");
                src.unpipe(dest);
            }
            dest.emit("pipe", src);
            if (!state.flowing) {
                debug("pipe resume");
                src.resume();
            }
            return dest;
        };
        function pipeOnDrain(src) {
            return function() {
                var state = src._readableState;
                debug("pipeOnDrain", state.awaitDrain);
                if (state.awaitDrain) state.awaitDrain--;
                if (state.awaitDrain === 0 && EElistenerCount(src, "data")) {
                    state.flowing = true;
                    flow(src);
                }
            };
        }
        Readable.prototype.unpipe = function(dest) {
            var state = this._readableState;
            if (state.pipesCount === 0) return this;
            if (state.pipesCount === 1) {
                if (dest && dest !== state.pipes) return this;
                if (!dest) dest = state.pipes;
                state.pipes = null;
                state.pipesCount = 0;
                state.flowing = false;
                if (dest) dest.emit("unpipe", this);
                return this;
            }
            if (!dest) {
                var dests = state.pipes;
                var len = state.pipesCount;
                state.pipes = null;
                state.pipesCount = 0;
                state.flowing = false;
                for (var i = 0; i < len; i++) {
                    dests[i].emit("unpipe", this);
                }
                return this;
            }
            var index = indexOf(state.pipes, dest);
            if (index === -1) return this;
            state.pipes.splice(index, 1);
            state.pipesCount -= 1;
            if (state.pipesCount === 1) state.pipes = state.pipes[0];
            dest.emit("unpipe", this);
            return this;
        };
        Readable.prototype.on = function(ev, fn) {
            var res = Stream.prototype.on.call(this, ev, fn);
            if (ev === "data") {
                if (this._readableState.flowing !== false) this.resume();
            } else if (ev === "readable") {
                var state = this._readableState;
                if (!state.endEmitted && !state.readableListening) {
                    state.readableListening = state.needReadable = true;
                    state.emittedReadable = false;
                    if (!state.reading) {
                        processNextTick(nReadingNextTick, this);
                    } else if (state.length) {
                        emitReadable(this, state);
                    }
                }
            }
            return res;
        };
        Readable.prototype.addListener = Readable.prototype.on;
        function nReadingNextTick(self) {
            debug("readable nexttick read 0");
            self.read(0);
        }
        Readable.prototype.resume = function() {
            var state = this._readableState;
            if (!state.flowing) {
                debug("resume");
                state.flowing = true;
                resume(this, state);
            }
            return this;
        };
        function resume(stream, state) {
            if (!state.resumeScheduled) {
                state.resumeScheduled = true;
                processNextTick(resume_, stream, state);
            }
        }
        function resume_(stream, state) {
            if (!state.reading) {
                debug("resume read 0");
                stream.read(0);
            }
            state.resumeScheduled = false;
            state.awaitDrain = 0;
            stream.emit("resume");
            flow(stream);
            if (state.flowing && !state.reading) stream.read(0);
        }
        Readable.prototype.pause = function() {
            debug("call pause flowing=%j", this._readableState.flowing);
            if (false !== this._readableState.flowing) {
                debug("pause");
                this._readableState.flowing = false;
                this.emit("pause");
            }
            return this;
        };
        function flow(stream) {
            var state = stream._readableState;
            debug("flow", state.flowing);
            while (state.flowing && stream.read() !== null) {}
        }
        Readable.prototype.wrap = function(stream) {
            var state = this._readableState;
            var paused = false;
            var self = this;
            stream.on("end", function() {
                debug("wrapped end");
                if (state.decoder && !state.ended) {
                    var chunk = state.decoder.end();
                    if (chunk && chunk.length) self.push(chunk);
                }
                self.push(null);
            });
            stream.on("data", function(chunk) {
                debug("wrapped data");
                if (state.decoder) chunk = state.decoder.write(chunk);
                if (state.objectMode && (chunk === null || chunk === undefined)) return; else if (!state.objectMode && (!chunk || !chunk.length)) return;
                var ret = self.push(chunk);
                if (!ret) {
                    paused = true;
                    stream.pause();
                }
            });
            for (var i in stream) {
                if (this[i] === undefined && typeof stream[i] === "function") {
                    this[i] = function(method) {
                        return function() {
                            return stream[method].apply(stream, arguments);
                        };
                    }(i);
                }
            }
            var events = [ "error", "close", "destroy", "pause", "resume" ];
            forEach(events, function(ev) {
                stream.on(ev, self.emit.bind(self, ev));
            });
            self._read = function(n) {
                debug("wrapped _read", n);
                if (paused) {
                    paused = false;
                    stream.resume();
                }
            };
            return self;
        };
        Readable._fromList = fromList;
        function fromList(n, state) {
            if (state.length === 0) return null;
            var ret;
            if (state.objectMode) ret = state.buffer.shift(); else if (!n || n >= state.length) {
                if (state.decoder) ret = state.buffer.join(""); else if (state.buffer.length === 1) ret = state.buffer.head.data; else ret = state.buffer.concat(state.length);
                state.buffer.clear();
            } else {
                ret = fromListPartial(n, state.buffer, state.decoder);
            }
            return ret;
        }
        function fromListPartial(n, list, hasStrings) {
            var ret;
            if (n < list.head.data.length) {
                ret = list.head.data.slice(0, n);
                list.head.data = list.head.data.slice(n);
            } else if (n === list.head.data.length) {
                ret = list.shift();
            } else {
                ret = hasStrings ? copyFromBufferString(n, list) : copyFromBuffer(n, list);
            }
            return ret;
        }
        function copyFromBufferString(n, list) {
            var p = list.head;
            var c = 1;
            var ret = p.data;
            n -= ret.length;
            while (p = p.next) {
                var str = p.data;
                var nb = n > str.length ? str.length : n;
                if (nb === str.length) ret += str; else ret += str.slice(0, n);
                n -= nb;
                if (n === 0) {
                    if (nb === str.length) {
                        ++c;
                        if (p.next) list.head = p.next; else list.head = list.tail = null;
                    } else {
                        list.head = p;
                        p.data = str.slice(nb);
                    }
                    break;
                }
                ++c;
            }
            list.length -= c;
            return ret;
        }
        function copyFromBuffer(n, list) {
            var ret = bufferShim.allocUnsafe(n);
            var p = list.head;
            var c = 1;
            p.data.copy(ret);
            n -= p.data.length;
            while (p = p.next) {
                var buf = p.data;
                var nb = n > buf.length ? buf.length : n;
                buf.copy(ret, ret.length - n, 0, nb);
                n -= nb;
                if (n === 0) {
                    if (nb === buf.length) {
                        ++c;
                        if (p.next) list.head = p.next; else list.head = list.tail = null;
                    } else {
                        list.head = p;
                        p.data = buf.slice(nb);
                    }
                    break;
                }
                ++c;
            }
            list.length -= c;
            return ret;
        }
        function endReadable(stream) {
            var state = stream._readableState;
            if (state.length > 0) throw new Error('"endReadable()" called on non-empty stream');
            if (!state.endEmitted) {
                state.ended = true;
                processNextTick(endReadableNT, state, stream);
            }
        }
        function endReadableNT(state, stream) {
            if (!state.endEmitted && state.length === 0) {
                state.endEmitted = true;
                stream.readable = false;
                stream.emit("end");
            }
        }
        function forEach(xs, f) {
            for (var i = 0, l = xs.length; i < l; i++) {
                f(xs[i], i);
            }
        }
        function indexOf(xs, x) {
            for (var i = 0, l = xs.length; i < l; i++) {
                if (xs[i] === x) return i;
            }
            return -1;
        }
    }).call(exports, __webpack_require__(14));
}, function(module, exports, __webpack_require__) {
    (function(process) {
        "use strict";
        if (!process.version || process.version.indexOf("v0.") === 0 || process.version.indexOf("v1.") === 0 && process.version.indexOf("v1.8.") !== 0) {
            module.exports = nextTick;
        } else {
            module.exports = process.nextTick;
        }
        function nextTick(fn, arg1, arg2, arg3) {
            if (typeof fn !== "function") {
                throw new TypeError('"callback" argument must be a function');
            }
            var len = arguments.length;
            var args, i;
            switch (len) {
              case 0:
              case 1:
                return process.nextTick(fn);

              case 2:
                return process.nextTick(function afterTickOne() {
                    fn.call(null, arg1);
                });

              case 3:
                return process.nextTick(function afterTickTwo() {
                    fn.call(null, arg1, arg2);
                });

              case 4:
                return process.nextTick(function afterTickThree() {
                    fn.call(null, arg1, arg2, arg3);
                });

              default:
                args = new Array(len - 1);
                i = 0;
                while (i < args.length) {
                    args[i++] = arguments[i];
                }
                return process.nextTick(function afterTick() {
                    fn.apply(null, args);
                });
            }
        }
    }).call(exports, __webpack_require__(14));
}, function(module, exports, __webpack_require__) {
    (function(global) {
        "use strict";
        var buffer = __webpack_require__(2);
        var Buffer = buffer.Buffer;
        var SlowBuffer = buffer.SlowBuffer;
        var MAX_LEN = buffer.kMaxLength || 2147483647;
        exports.alloc = function alloc(size, fill, encoding) {
            if (typeof Buffer.alloc === "function") {
                return Buffer.alloc(size, fill, encoding);
            }
            if (typeof encoding === "number") {
                throw new TypeError("encoding must not be number");
            }
            if (typeof size !== "number") {
                throw new TypeError("size must be a number");
            }
            if (size > MAX_LEN) {
                throw new RangeError("size is too large");
            }
            var enc = encoding;
            var _fill = fill;
            if (_fill === undefined) {
                enc = undefined;
                _fill = 0;
            }
            var buf = new Buffer(size);
            if (typeof _fill === "string") {
                var fillBuf = new Buffer(_fill, enc);
                var flen = fillBuf.length;
                var i = -1;
                while (++i < size) {
                    buf[i] = fillBuf[i % flen];
                }
            } else {
                buf.fill(_fill);
            }
            return buf;
        };
        exports.allocUnsafe = function allocUnsafe(size) {
            if (typeof Buffer.allocUnsafe === "function") {
                return Buffer.allocUnsafe(size);
            }
            if (typeof size !== "number") {
                throw new TypeError("size must be a number");
            }
            if (size > MAX_LEN) {
                throw new RangeError("size is too large");
            }
            return new Buffer(size);
        };
        exports.from = function from(value, encodingOrOffset, length) {
            if (typeof Buffer.from === "function" && (!global.Uint8Array || Uint8Array.from !== Buffer.from)) {
                return Buffer.from(value, encodingOrOffset, length);
            }
            if (typeof value === "number") {
                throw new TypeError('"value" argument must not be a number');
            }
            if (typeof value === "string") {
                return new Buffer(value, encodingOrOffset);
            }
            if (typeof ArrayBuffer !== "undefined" && value instanceof ArrayBuffer) {
                var offset = encodingOrOffset;
                if (arguments.length === 1) {
                    return new Buffer(value);
                }
                if (typeof offset === "undefined") {
                    offset = 0;
                }
                var len = length;
                if (typeof len === "undefined") {
                    len = value.byteLength - offset;
                }
                if (offset >= value.byteLength) {
                    throw new RangeError("'offset' is out of bounds");
                }
                if (len > value.byteLength - offset) {
                    throw new RangeError("'length' is out of bounds");
                }
                return new Buffer(value.slice(offset, offset + len));
            }
            if (Buffer.isBuffer(value)) {
                var out = new Buffer(value.length);
                value.copy(out, 0, 0, value.length);
                return out;
            }
            if (value) {
                if (Array.isArray(value) || typeof ArrayBuffer !== "undefined" && value.buffer instanceof ArrayBuffer || "length" in value) {
                    return new Buffer(value);
                }
                if (value.type === "Buffer" && Array.isArray(value.data)) {
                    return new Buffer(value.data);
                }
            }
            throw new TypeError("First argument must be a string, Buffer, " + "ArrayBuffer, Array, or array-like object.");
        };
        exports.allocUnsafeSlow = function allocUnsafeSlow(size) {
            if (typeof Buffer.allocUnsafeSlow === "function") {
                return Buffer.allocUnsafeSlow(size);
            }
            if (typeof size !== "number") {
                throw new TypeError("size must be a number");
            }
            if (size >= MAX_LEN) {
                throw new RangeError("size is too large");
            }
            return new SlowBuffer(size);
        };
    }).call(exports, function() {
        return this;
    }());
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        function isArray(arg) {
            if (Array.isArray) {
                return Array.isArray(arg);
            }
            return objectToString(arg) === "[object Array]";
        }
        exports.isArray = isArray;
        function isBoolean(arg) {
            return typeof arg === "boolean";
        }
        exports.isBoolean = isBoolean;
        function isNull(arg) {
            return arg === null;
        }
        exports.isNull = isNull;
        function isNullOrUndefined(arg) {
            return arg == null;
        }
        exports.isNullOrUndefined = isNullOrUndefined;
        function isNumber(arg) {
            return typeof arg === "number";
        }
        exports.isNumber = isNumber;
        function isString(arg) {
            return typeof arg === "string";
        }
        exports.isString = isString;
        function isSymbol(arg) {
            return typeof arg === "symbol";
        }
        exports.isSymbol = isSymbol;
        function isUndefined(arg) {
            return arg === void 0;
        }
        exports.isUndefined = isUndefined;
        function isRegExp(re) {
            return objectToString(re) === "[object RegExp]";
        }
        exports.isRegExp = isRegExp;
        function isObject(arg) {
            return typeof arg === "object" && arg !== null;
        }
        exports.isObject = isObject;
        function isDate(d) {
            return objectToString(d) === "[object Date]";
        }
        exports.isDate = isDate;
        function isError(e) {
            return objectToString(e) === "[object Error]" || e instanceof Error;
        }
        exports.isError = isError;
        function isFunction(arg) {
            return typeof arg === "function";
        }
        exports.isFunction = isFunction;
        function isPrimitive(arg) {
            return arg === null || typeof arg === "boolean" || typeof arg === "number" || typeof arg === "string" || typeof arg === "symbol" || typeof arg === "undefined";
        }
        exports.isPrimitive = isPrimitive;
        exports.isBuffer = Buffer.isBuffer;
        function objectToString(o) {
            return Object.prototype.toString.call(o);
        }
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports) {}, function(module, exports, __webpack_require__) {
    "use strict";
    var Buffer = __webpack_require__(2).Buffer;
    var bufferShim = __webpack_require__(35);
    module.exports = BufferList;
    function BufferList() {
        this.head = null;
        this.tail = null;
        this.length = 0;
    }
    BufferList.prototype.push = function(v) {
        var entry = {
            data: v,
            next: null
        };
        if (this.length > 0) this.tail.next = entry; else this.head = entry;
        this.tail = entry;
        ++this.length;
    };
    BufferList.prototype.unshift = function(v) {
        var entry = {
            data: v,
            next: this.head
        };
        if (this.length === 0) this.tail = entry;
        this.head = entry;
        ++this.length;
    };
    BufferList.prototype.shift = function() {
        if (this.length === 0) return;
        var ret = this.head.data;
        if (this.length === 1) this.head = this.tail = null; else this.head = this.head.next;
        --this.length;
        return ret;
    };
    BufferList.prototype.clear = function() {
        this.head = this.tail = null;
        this.length = 0;
    };
    BufferList.prototype.join = function(s) {
        if (this.length === 0) return "";
        var p = this.head;
        var ret = "" + p.data;
        while (p = p.next) {
            ret += s + p.data;
        }
        return ret;
    };
    BufferList.prototype.concat = function(n) {
        if (this.length === 0) return bufferShim.alloc(0);
        if (this.length === 1) return this.head.data;
        var ret = bufferShim.allocUnsafe(n >>> 0);
        var p = this.head;
        var i = 0;
        while (p) {
            p.data.copy(ret, i);
            i += p.data.length;
            p = p.next;
        }
        return ret;
    };
}, function(module, exports, __webpack_require__) {
    "use strict";
    var objectKeys = Object.keys || function(obj) {
        var keys = [];
        for (var key in obj) {
            keys.push(key);
        }
        return keys;
    };
    module.exports = Duplex;
    var processNextTick = __webpack_require__(34);
    var util = __webpack_require__(36);
    util.inherits = __webpack_require__(31);
    var Readable = __webpack_require__(33);
    var Writable = __webpack_require__(40);
    util.inherits(Duplex, Readable);
    var keys = objectKeys(Writable.prototype);
    for (var v = 0; v < keys.length; v++) {
        var method = keys[v];
        if (!Duplex.prototype[method]) Duplex.prototype[method] = Writable.prototype[method];
    }
    function Duplex(options) {
        if (!(this instanceof Duplex)) return new Duplex(options);
        Readable.call(this, options);
        Writable.call(this, options);
        if (options && options.readable === false) this.readable = false;
        if (options && options.writable === false) this.writable = false;
        this.allowHalfOpen = true;
        if (options && options.allowHalfOpen === false) this.allowHalfOpen = false;
        this.once("end", onend);
    }
    function onend() {
        if (this.allowHalfOpen || this._writableState.ended) return;
        processNextTick(onEndNT, this);
    }
    function onEndNT(self) {
        self.end();
    }
    function forEach(xs, f) {
        for (var i = 0, l = xs.length; i < l; i++) {
            f(xs[i], i);
        }
    }
}, function(module, exports, __webpack_require__) {
    (function(process, setImmediate) {
        "use strict";
        module.exports = Writable;
        var processNextTick = __webpack_require__(34);
        var asyncWrite = !process.browser && [ "v0.10", "v0.9." ].indexOf(process.version.slice(0, 5)) > -1 ? setImmediate : processNextTick;
        var Duplex;
        Writable.WritableState = WritableState;
        var util = __webpack_require__(36);
        util.inherits = __webpack_require__(31);
        var internalUtil = {
            deprecate: __webpack_require__(43)
        };
        var Stream;
        (function() {
            try {
                Stream = __webpack_require__(29);
            } catch (_) {} finally {
                if (!Stream) Stream = __webpack_require__(30).EventEmitter;
            }
        })();
        var Buffer = __webpack_require__(2).Buffer;
        var bufferShim = __webpack_require__(35);
        util.inherits(Writable, Stream);
        function nop() {}
        function WriteReq(chunk, encoding, cb) {
            this.chunk = chunk;
            this.encoding = encoding;
            this.callback = cb;
            this.next = null;
        }
        function WritableState(options, stream) {
            Duplex = Duplex || __webpack_require__(39);
            options = options || {};
            this.objectMode = !!options.objectMode;
            if (stream instanceof Duplex) this.objectMode = this.objectMode || !!options.writableObjectMode;
            var hwm = options.highWaterMark;
            var defaultHwm = this.objectMode ? 16 : 16 * 1024;
            this.highWaterMark = hwm || hwm === 0 ? hwm : defaultHwm;
            this.highWaterMark = ~~this.highWaterMark;
            this.needDrain = false;
            this.ending = false;
            this.ended = false;
            this.finished = false;
            var noDecode = options.decodeStrings === false;
            this.decodeStrings = !noDecode;
            this.defaultEncoding = options.defaultEncoding || "utf8";
            this.length = 0;
            this.writing = false;
            this.corked = 0;
            this.sync = true;
            this.bufferProcessing = false;
            this.onwrite = function(er) {
                onwrite(stream, er);
            };
            this.writecb = null;
            this.writelen = 0;
            this.bufferedRequest = null;
            this.lastBufferedRequest = null;
            this.pendingcb = 0;
            this.prefinished = false;
            this.errorEmitted = false;
            this.bufferedRequestCount = 0;
            this.corkedRequestsFree = new CorkedRequest(this);
        }
        WritableState.prototype.getBuffer = function getBuffer() {
            var current = this.bufferedRequest;
            var out = [];
            while (current) {
                out.push(current);
                current = current.next;
            }
            return out;
        };
        (function() {
            try {
                Object.defineProperty(WritableState.prototype, "buffer", {
                    get: internalUtil.deprecate(function() {
                        return this.getBuffer();
                    }, "_writableState.buffer is deprecated. Use _writableState.getBuffer " + "instead.")
                });
            } catch (_) {}
        })();
        var realHasInstance;
        if (typeof Symbol === "function" && Symbol.hasInstance && typeof Function.prototype[Symbol.hasInstance] === "function") {
            realHasInstance = Function.prototype[Symbol.hasInstance];
            Object.defineProperty(Writable, Symbol.hasInstance, {
                value: function(object) {
                    if (realHasInstance.call(this, object)) return true;
                    return object && object._writableState instanceof WritableState;
                }
            });
        } else {
            realHasInstance = function(object) {
                return object instanceof this;
            };
        }
        function Writable(options) {
            Duplex = Duplex || __webpack_require__(39);
            if (!realHasInstance.call(Writable, this) && !(this instanceof Duplex)) {
                return new Writable(options);
            }
            this._writableState = new WritableState(options, this);
            this.writable = true;
            if (options) {
                if (typeof options.write === "function") this._write = options.write;
                if (typeof options.writev === "function") this._writev = options.writev;
            }
            Stream.call(this);
        }
        Writable.prototype.pipe = function() {
            this.emit("error", new Error("Cannot pipe, not readable"));
        };
        function writeAfterEnd(stream, cb) {
            var er = new Error("write after end");
            stream.emit("error", er);
            processNextTick(cb, er);
        }
        function validChunk(stream, state, chunk, cb) {
            var valid = true;
            var er = false;
            if (chunk === null) {
                er = new TypeError("May not write null values to stream");
            } else if (!Buffer.isBuffer(chunk) && typeof chunk !== "string" && chunk !== undefined && !state.objectMode) {
                er = new TypeError("Invalid non-string/buffer chunk");
            }
            if (er) {
                stream.emit("error", er);
                processNextTick(cb, er);
                valid = false;
            }
            return valid;
        }
        Writable.prototype.write = function(chunk, encoding, cb) {
            var state = this._writableState;
            var ret = false;
            if (typeof encoding === "function") {
                cb = encoding;
                encoding = null;
            }
            if (Buffer.isBuffer(chunk)) encoding = "buffer"; else if (!encoding) encoding = state.defaultEncoding;
            if (typeof cb !== "function") cb = nop;
            if (state.ended) writeAfterEnd(this, cb); else if (validChunk(this, state, chunk, cb)) {
                state.pendingcb++;
                ret = writeOrBuffer(this, state, chunk, encoding, cb);
            }
            return ret;
        };
        Writable.prototype.cork = function() {
            var state = this._writableState;
            state.corked++;
        };
        Writable.prototype.uncork = function() {
            var state = this._writableState;
            if (state.corked) {
                state.corked--;
                if (!state.writing && !state.corked && !state.finished && !state.bufferProcessing && state.bufferedRequest) clearBuffer(this, state);
            }
        };
        Writable.prototype.setDefaultEncoding = function setDefaultEncoding(encoding) {
            if (typeof encoding === "string") encoding = encoding.toLowerCase();
            if (!([ "hex", "utf8", "utf-8", "ascii", "binary", "base64", "ucs2", "ucs-2", "utf16le", "utf-16le", "raw" ].indexOf((encoding + "").toLowerCase()) > -1)) throw new TypeError("Unknown encoding: " + encoding);
            this._writableState.defaultEncoding = encoding;
            return this;
        };
        function decodeChunk(state, chunk, encoding) {
            if (!state.objectMode && state.decodeStrings !== false && typeof chunk === "string") {
                chunk = bufferShim.from(chunk, encoding);
            }
            return chunk;
        }
        function writeOrBuffer(stream, state, chunk, encoding, cb) {
            chunk = decodeChunk(state, chunk, encoding);
            if (Buffer.isBuffer(chunk)) encoding = "buffer";
            var len = state.objectMode ? 1 : chunk.length;
            state.length += len;
            var ret = state.length < state.highWaterMark;
            if (!ret) state.needDrain = true;
            if (state.writing || state.corked) {
                var last = state.lastBufferedRequest;
                state.lastBufferedRequest = new WriteReq(chunk, encoding, cb);
                if (last) {
                    last.next = state.lastBufferedRequest;
                } else {
                    state.bufferedRequest = state.lastBufferedRequest;
                }
                state.bufferedRequestCount += 1;
            } else {
                doWrite(stream, state, false, len, chunk, encoding, cb);
            }
            return ret;
        }
        function doWrite(stream, state, writev, len, chunk, encoding, cb) {
            state.writelen = len;
            state.writecb = cb;
            state.writing = true;
            state.sync = true;
            if (writev) stream._writev(chunk, state.onwrite); else stream._write(chunk, encoding, state.onwrite);
            state.sync = false;
        }
        function onwriteError(stream, state, sync, er, cb) {
            --state.pendingcb;
            if (sync) processNextTick(cb, er); else cb(er);
            stream._writableState.errorEmitted = true;
            stream.emit("error", er);
        }
        function onwriteStateUpdate(state) {
            state.writing = false;
            state.writecb = null;
            state.length -= state.writelen;
            state.writelen = 0;
        }
        function onwrite(stream, er) {
            var state = stream._writableState;
            var sync = state.sync;
            var cb = state.writecb;
            onwriteStateUpdate(state);
            if (er) onwriteError(stream, state, sync, er, cb); else {
                var finished = needFinish(state);
                if (!finished && !state.corked && !state.bufferProcessing && state.bufferedRequest) {
                    clearBuffer(stream, state);
                }
                if (sync) {
                    asyncWrite(afterWrite, stream, state, finished, cb);
                } else {
                    afterWrite(stream, state, finished, cb);
                }
            }
        }
        function afterWrite(stream, state, finished, cb) {
            if (!finished) onwriteDrain(stream, state);
            state.pendingcb--;
            cb();
            finishMaybe(stream, state);
        }
        function onwriteDrain(stream, state) {
            if (state.length === 0 && state.needDrain) {
                state.needDrain = false;
                stream.emit("drain");
            }
        }
        function clearBuffer(stream, state) {
            state.bufferProcessing = true;
            var entry = state.bufferedRequest;
            if (stream._writev && entry && entry.next) {
                var l = state.bufferedRequestCount;
                var buffer = new Array(l);
                var holder = state.corkedRequestsFree;
                holder.entry = entry;
                var count = 0;
                while (entry) {
                    buffer[count] = entry;
                    entry = entry.next;
                    count += 1;
                }
                doWrite(stream, state, true, state.length, buffer, "", holder.finish);
                state.pendingcb++;
                state.lastBufferedRequest = null;
                if (holder.next) {
                    state.corkedRequestsFree = holder.next;
                    holder.next = null;
                } else {
                    state.corkedRequestsFree = new CorkedRequest(state);
                }
            } else {
                while (entry) {
                    var chunk = entry.chunk;
                    var encoding = entry.encoding;
                    var cb = entry.callback;
                    var len = state.objectMode ? 1 : chunk.length;
                    doWrite(stream, state, false, len, chunk, encoding, cb);
                    entry = entry.next;
                    if (state.writing) {
                        break;
                    }
                }
                if (entry === null) state.lastBufferedRequest = null;
            }
            state.bufferedRequestCount = 0;
            state.bufferedRequest = entry;
            state.bufferProcessing = false;
        }
        Writable.prototype._write = function(chunk, encoding, cb) {
            cb(new Error("_write() is not implemented"));
        };
        Writable.prototype._writev = null;
        Writable.prototype.end = function(chunk, encoding, cb) {
            var state = this._writableState;
            if (typeof chunk === "function") {
                cb = chunk;
                chunk = null;
                encoding = null;
            } else if (typeof encoding === "function") {
                cb = encoding;
                encoding = null;
            }
            if (chunk !== null && chunk !== undefined) this.write(chunk, encoding);
            if (state.corked) {
                state.corked = 1;
                this.uncork();
            }
            if (!state.ending && !state.finished) endWritable(this, state, cb);
        };
        function needFinish(state) {
            return state.ending && state.length === 0 && state.bufferedRequest === null && !state.finished && !state.writing;
        }
        function prefinish(stream, state) {
            if (!state.prefinished) {
                state.prefinished = true;
                stream.emit("prefinish");
            }
        }
        function finishMaybe(stream, state) {
            var need = needFinish(state);
            if (need) {
                if (state.pendingcb === 0) {
                    prefinish(stream, state);
                    state.finished = true;
                    stream.emit("finish");
                } else {
                    prefinish(stream, state);
                }
            }
            return need;
        }
        function endWritable(stream, state, cb) {
            state.ending = true;
            finishMaybe(stream, state);
            if (cb) {
                if (state.finished) processNextTick(cb); else stream.once("finish", cb);
            }
            state.ended = true;
            stream.writable = false;
        }
        function CorkedRequest(state) {
            var _this = this;
            this.next = null;
            this.entry = null;
            this.finish = function(err) {
                var entry = _this.entry;
                _this.entry = null;
                while (entry) {
                    var cb = entry.callback;
                    state.pendingcb--;
                    cb(err);
                    entry = entry.next;
                }
                if (state.corkedRequestsFree) {
                    state.corkedRequestsFree.next = _this;
                } else {
                    state.corkedRequestsFree = _this;
                }
            };
        }
    }).call(exports, __webpack_require__(14), __webpack_require__(41).setImmediate);
}, function(module, exports, __webpack_require__) {
    var apply = Function.prototype.apply;
    exports.setTimeout = function() {
        return new Timeout(apply.call(setTimeout, window, arguments), clearTimeout);
    };
    exports.setInterval = function() {
        return new Timeout(apply.call(setInterval, window, arguments), clearInterval);
    };
    exports.clearTimeout = exports.clearInterval = function(timeout) {
        if (timeout) {
            timeout.close();
        }
    };
    function Timeout(id, clearFn) {
        this._id = id;
        this._clearFn = clearFn;
    }
    Timeout.prototype.unref = Timeout.prototype.ref = function() {};
    Timeout.prototype.close = function() {
        this._clearFn.call(window, this._id);
    };
    exports.enroll = function(item, msecs) {
        clearTimeout(item._idleTimeoutId);
        item._idleTimeout = msecs;
    };
    exports.unenroll = function(item) {
        clearTimeout(item._idleTimeoutId);
        item._idleTimeout = -1;
    };
    exports._unrefActive = exports.active = function(item) {
        clearTimeout(item._idleTimeoutId);
        var msecs = item._idleTimeout;
        if (msecs >= 0) {
            item._idleTimeoutId = setTimeout(function onTimeout() {
                if (item._onTimeout) item._onTimeout();
            }, msecs);
        }
    };
    __webpack_require__(42);
    exports.setImmediate = setImmediate;
    exports.clearImmediate = clearImmediate;
}, function(module, exports, __webpack_require__) {
    (function(global, process) {
        (function(global, undefined) {
            "use strict";
            if (global.setImmediate) {
                return;
            }
            var nextHandle = 1;
            var tasksByHandle = {};
            var currentlyRunningATask = false;
            var doc = global.document;
            var registerImmediate;
            function setImmediate(callback) {
                if (typeof callback !== "function") {
                    callback = new Function("" + callback);
                }
                var args = new Array(arguments.length - 1);
                for (var i = 0; i < args.length; i++) {
                    args[i] = arguments[i + 1];
                }
                var task = {
                    callback: callback,
                    args: args
                };
                tasksByHandle[nextHandle] = task;
                registerImmediate(nextHandle);
                return nextHandle++;
            }
            function clearImmediate(handle) {
                delete tasksByHandle[handle];
            }
            function run(task) {
                var callback = task.callback;
                var args = task.args;
                switch (args.length) {
                  case 0:
                    callback();
                    break;

                  case 1:
                    callback(args[0]);
                    break;

                  case 2:
                    callback(args[0], args[1]);
                    break;

                  case 3:
                    callback(args[0], args[1], args[2]);
                    break;

                  default:
                    callback.apply(undefined, args);
                    break;
                }
            }
            function runIfPresent(handle) {
                if (currentlyRunningATask) {
                    setTimeout(runIfPresent, 0, handle);
                } else {
                    var task = tasksByHandle[handle];
                    if (task) {
                        currentlyRunningATask = true;
                        try {
                            run(task);
                        } finally {
                            clearImmediate(handle);
                            currentlyRunningATask = false;
                        }
                    }
                }
            }
            function installNextTickImplementation() {
                registerImmediate = function(handle) {
                    process.nextTick(function() {
                        runIfPresent(handle);
                    });
                };
            }
            function canUsePostMessage() {
                if (global.postMessage && !global.importScripts) {
                    var postMessageIsAsynchronous = true;
                    var oldOnMessage = global.onmessage;
                    global.onmessage = function() {
                        postMessageIsAsynchronous = false;
                    };
                    global.postMessage("", "*");
                    global.onmessage = oldOnMessage;
                    return postMessageIsAsynchronous;
                }
            }
            function installPostMessageImplementation() {
                var messagePrefix = "setImmediate$" + Math.random() + "$";
                var onGlobalMessage = function(event) {
                    if (event.source === global && typeof event.data === "string" && event.data.indexOf(messagePrefix) === 0) {
                        runIfPresent(+event.data.slice(messagePrefix.length));
                    }
                };
                if (global.addEventListener) {
                    global.addEventListener("message", onGlobalMessage, false);
                } else {
                    global.attachEvent("onmessage", onGlobalMessage);
                }
                registerImmediate = function(handle) {
                    global.postMessage(messagePrefix + handle, "*");
                };
            }
            function installMessageChannelImplementation() {
                var channel = new MessageChannel();
                channel.port1.onmessage = function(event) {
                    var handle = event.data;
                    runIfPresent(handle);
                };
                registerImmediate = function(handle) {
                    channel.port2.postMessage(handle);
                };
            }
            function installReadyStateChangeImplementation() {
                var html = doc.documentElement;
                registerImmediate = function(handle) {
                    var script = doc.createElement("script");
                    script.onreadystatechange = function() {
                        runIfPresent(handle);
                        script.onreadystatechange = null;
                        html.removeChild(script);
                        script = null;
                    };
                    html.appendChild(script);
                };
            }
            function installSetTimeoutImplementation() {
                registerImmediate = function(handle) {
                    setTimeout(runIfPresent, 0, handle);
                };
            }
            var attachTo = Object.getPrototypeOf && Object.getPrototypeOf(global);
            attachTo = attachTo && attachTo.setTimeout ? attachTo : global;
            if ({}.toString.call(global.process) === "[object process]") {
                installNextTickImplementation();
            } else if (canUsePostMessage()) {
                installPostMessageImplementation();
            } else if (global.MessageChannel) {
                installMessageChannelImplementation();
            } else if (doc && "onreadystatechange" in doc.createElement("script")) {
                installReadyStateChangeImplementation();
            } else {
                installSetTimeoutImplementation();
            }
            attachTo.setImmediate = setImmediate;
            attachTo.clearImmediate = clearImmediate;
        })(typeof self === "undefined" ? typeof global === "undefined" ? this : global : self);
    }).call(exports, function() {
        return this;
    }(), __webpack_require__(14));
}, function(module, exports) {
    (function(global) {
        module.exports = deprecate;
        function deprecate(fn, msg) {
            if (config("noDeprecation")) {
                return fn;
            }
            var warned = false;
            function deprecated() {
                if (!warned) {
                    if (config("throwDeprecation")) {
                        throw new Error(msg);
                    } else if (config("traceDeprecation")) {
                        console.trace(msg);
                    } else {
                        console.warn(msg);
                    }
                    warned = true;
                }
                return fn.apply(this, arguments);
            }
            return deprecated;
        }
        function config(name) {
            try {
                if (!global.localStorage) return false;
            } catch (_) {
                return false;
            }
            var val = global.localStorage[name];
            if (null == val) return false;
            return String(val).toLowerCase() === "true";
        }
    }).call(exports, function() {
        return this;
    }());
}, function(module, exports, __webpack_require__) {
    var Buffer = __webpack_require__(2).Buffer;
    var isBufferEncoding = Buffer.isEncoding || function(encoding) {
        switch (encoding && encoding.toLowerCase()) {
          case "hex":
          case "utf8":
          case "utf-8":
          case "ascii":
          case "binary":
          case "base64":
          case "ucs2":
          case "ucs-2":
          case "utf16le":
          case "utf-16le":
          case "raw":
            return true;

          default:
            return false;
        }
    };
    function assertEncoding(encoding) {
        if (encoding && !isBufferEncoding(encoding)) {
            throw new Error("Unknown encoding: " + encoding);
        }
    }
    var StringDecoder = exports.StringDecoder = function(encoding) {
        this.encoding = (encoding || "utf8").toLowerCase().replace(/[-_]/, "");
        assertEncoding(encoding);
        switch (this.encoding) {
          case "utf8":
            this.surrogateSize = 3;
            break;

          case "ucs2":
          case "utf16le":
            this.surrogateSize = 2;
            this.detectIncompleteChar = utf16DetectIncompleteChar;
            break;

          case "base64":
            this.surrogateSize = 3;
            this.detectIncompleteChar = base64DetectIncompleteChar;
            break;

          default:
            this.write = passThroughWrite;
            return;
        }
        this.charBuffer = new Buffer(6);
        this.charReceived = 0;
        this.charLength = 0;
    };
    StringDecoder.prototype.write = function(buffer) {
        var charStr = "";
        while (this.charLength) {
            var available = buffer.length >= this.charLength - this.charReceived ? this.charLength - this.charReceived : buffer.length;
            buffer.copy(this.charBuffer, this.charReceived, 0, available);
            this.charReceived += available;
            if (this.charReceived < this.charLength) {
                return "";
            }
            buffer = buffer.slice(available, buffer.length);
            charStr = this.charBuffer.slice(0, this.charLength).toString(this.encoding);
            var charCode = charStr.charCodeAt(charStr.length - 1);
            if (charCode >= 55296 && charCode <= 56319) {
                this.charLength += this.surrogateSize;
                charStr = "";
                continue;
            }
            this.charReceived = this.charLength = 0;
            if (buffer.length === 0) {
                return charStr;
            }
            break;
        }
        this.detectIncompleteChar(buffer);
        var end = buffer.length;
        if (this.charLength) {
            buffer.copy(this.charBuffer, 0, buffer.length - this.charReceived, end);
            end -= this.charReceived;
        }
        charStr += buffer.toString(this.encoding, 0, end);
        var end = charStr.length - 1;
        var charCode = charStr.charCodeAt(end);
        if (charCode >= 55296 && charCode <= 56319) {
            var size = this.surrogateSize;
            this.charLength += size;
            this.charReceived += size;
            this.charBuffer.copy(this.charBuffer, size, 0, size);
            buffer.copy(this.charBuffer, 0, 0, size);
            return charStr.substring(0, end);
        }
        return charStr;
    };
    StringDecoder.prototype.detectIncompleteChar = function(buffer) {
        var i = buffer.length >= 3 ? 3 : buffer.length;
        for (;i > 0; i--) {
            var c = buffer[buffer.length - i];
            if (i == 1 && c >> 5 == 6) {
                this.charLength = 2;
                break;
            }
            if (i <= 2 && c >> 4 == 14) {
                this.charLength = 3;
                break;
            }
            if (i <= 3 && c >> 3 == 30) {
                this.charLength = 4;
                break;
            }
        }
        this.charReceived = i;
    };
    StringDecoder.prototype.end = function(buffer) {
        var res = "";
        if (buffer && buffer.length) res = this.write(buffer);
        if (this.charReceived) {
            var cr = this.charReceived;
            var buf = this.charBuffer;
            var enc = this.encoding;
            res += buf.slice(0, cr).toString(enc);
        }
        return res;
    };
    function passThroughWrite(buffer) {
        return buffer.toString(this.encoding);
    }
    function utf16DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 2;
        this.charLength = this.charReceived ? 2 : 0;
    }
    function base64DetectIncompleteChar(buffer) {
        this.charReceived = buffer.length % 3;
        this.charLength = this.charReceived ? 3 : 0;
    }
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = Transform;
    var Duplex = __webpack_require__(39);
    var util = __webpack_require__(36);
    util.inherits = __webpack_require__(31);
    util.inherits(Transform, Duplex);
    function TransformState(stream) {
        this.afterTransform = function(er, data) {
            return afterTransform(stream, er, data);
        };
        this.needTransform = false;
        this.transforming = false;
        this.writecb = null;
        this.writechunk = null;
        this.writeencoding = null;
    }
    function afterTransform(stream, er, data) {
        var ts = stream._transformState;
        ts.transforming = false;
        var cb = ts.writecb;
        if (!cb) return stream.emit("error", new Error("no writecb in Transform class"));
        ts.writechunk = null;
        ts.writecb = null;
        if (data !== null && data !== undefined) stream.push(data);
        cb(er);
        var rs = stream._readableState;
        rs.reading = false;
        if (rs.needReadable || rs.length < rs.highWaterMark) {
            stream._read(rs.highWaterMark);
        }
    }
    function Transform(options) {
        if (!(this instanceof Transform)) return new Transform(options);
        Duplex.call(this, options);
        this._transformState = new TransformState(this);
        var stream = this;
        this._readableState.needReadable = true;
        this._readableState.sync = false;
        if (options) {
            if (typeof options.transform === "function") this._transform = options.transform;
            if (typeof options.flush === "function") this._flush = options.flush;
        }
        this.once("prefinish", function() {
            if (typeof this._flush === "function") this._flush(function(er, data) {
                done(stream, er, data);
            }); else done(stream);
        });
    }
    Transform.prototype.push = function(chunk, encoding) {
        this._transformState.needTransform = false;
        return Duplex.prototype.push.call(this, chunk, encoding);
    };
    Transform.prototype._transform = function(chunk, encoding, cb) {
        throw new Error("_transform() is not implemented");
    };
    Transform.prototype._write = function(chunk, encoding, cb) {
        var ts = this._transformState;
        ts.writecb = cb;
        ts.writechunk = chunk;
        ts.writeencoding = encoding;
        if (!ts.transforming) {
            var rs = this._readableState;
            if (ts.needTransform || rs.needReadable || rs.length < rs.highWaterMark) this._read(rs.highWaterMark);
        }
    };
    Transform.prototype._read = function(n) {
        var ts = this._transformState;
        if (ts.writechunk !== null && ts.writecb && !ts.transforming) {
            ts.transforming = true;
            this._transform(ts.writechunk, ts.writeencoding, ts.afterTransform);
        } else {
            ts.needTransform = true;
        }
    };
    function done(stream, er, data) {
        if (er) return stream.emit("error", er);
        if (data !== null && data !== undefined) stream.push(data);
        var ws = stream._writableState;
        var ts = stream._transformState;
        if (ws.length) throw new Error("Calling transform done when ws.length != 0");
        if (ts.transforming) throw new Error("Calling transform done when still transforming");
        return stream.push(null);
    }
}, function(module, exports, __webpack_require__) {
    "use strict";
    module.exports = PassThrough;
    var Transform = __webpack_require__(45);
    var util = __webpack_require__(36);
    util.inherits = __webpack_require__(31);
    util.inherits(PassThrough, Transform);
    function PassThrough(options) {
        if (!(this instanceof PassThrough)) return new PassThrough(options);
        Transform.call(this, options);
    }
    PassThrough.prototype._transform = function(chunk, encoding, cb) {
        cb(null, chunk);
    };
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(40);
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(39);
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(45);
}, function(module, exports, __webpack_require__) {
    module.exports = __webpack_require__(46);
}, function(module, exports) {
    exports["aes-128-ecb"] = {
        cipher: "AES",
        key: 128,
        iv: 0,
        mode: "ECB",
        type: "block"
    };
    exports["aes-192-ecb"] = {
        cipher: "AES",
        key: 192,
        iv: 0,
        mode: "ECB",
        type: "block"
    };
    exports["aes-256-ecb"] = {
        cipher: "AES",
        key: 256,
        iv: 0,
        mode: "ECB",
        type: "block"
    };
    exports["aes-128-cbc"] = {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CBC",
        type: "block"
    };
    exports["aes-192-cbc"] = {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CBC",
        type: "block"
    };
    exports["aes-256-cbc"] = {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CBC",
        type: "block"
    };
    exports["aes128"] = exports["aes-128-cbc"];
    exports["aes192"] = exports["aes-192-cbc"];
    exports["aes256"] = exports["aes-256-cbc"];
    exports["aes-128-cfb"] = {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CFB",
        type: "stream"
    };
    exports["aes-192-cfb"] = {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CFB",
        type: "stream"
    };
    exports["aes-256-cfb"] = {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CFB",
        type: "stream"
    };
    exports["aes-128-ofb"] = {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "OFB",
        type: "stream"
    };
    exports["aes-192-ofb"] = {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "OFB",
        type: "stream"
    };
    exports["aes-256-ofb"] = {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "OFB",
        type: "stream"
    };
    exports["aes-128-ctr"] = {
        cipher: "AES",
        key: 128,
        iv: 16,
        mode: "CTR",
        type: "stream"
    };
    exports["aes-192-ctr"] = {
        cipher: "AES",
        key: 192,
        iv: 16,
        mode: "CTR",
        type: "stream"
    };
    exports["aes-256-ctr"] = {
        cipher: "AES",
        key: 256,
        iv: 16,
        mode: "CTR",
        type: "stream"
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        module.exports = function(crypto, password, keyLen, ivLen) {
            keyLen = keyLen / 8;
            ivLen = ivLen || 0;
            var ki = 0;
            var ii = 0;
            var key = new Buffer(keyLen);
            var iv = new Buffer(ivLen);
            var addmd = 0;
            var md, md_buf;
            var i;
            while (true) {
                md = crypto.createHash("md5");
                if (addmd++ > 0) {
                    md.update(md_buf);
                }
                md.update(password);
                md_buf = md.digest();
                i = 0;
                if (keyLen > 0) {
                    while (true) {
                        if (keyLen === 0) {
                            break;
                        }
                        if (i === md_buf.length) {
                            break;
                        }
                        key[ki++] = md_buf[i];
                        keyLen--;
                        i++;
                    }
                }
                if (ivLen > 0 && i !== md_buf.length) {
                    while (true) {
                        if (ivLen === 0) {
                            break;
                        }
                        if (i === md_buf.length) {
                            break;
                        }
                        iv[ii++] = md_buf[i];
                        ivLen--;
                        i++;
                    }
                }
                if (keyLen === 0 && ivLen === 0) {
                    break;
                }
            }
            for (i = 0; i < md_buf.length; i++) {
                md_buf[i] = 0;
            }
            return {
                key: key,
                iv: iv
            };
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var aes = __webpack_require__(27);
        var Transform = __webpack_require__(28);
        var inherits = __webpack_require__(31);
        inherits(StreamCipher, Transform);
        module.exports = StreamCipher;
        function StreamCipher(mode, key, iv, decrypt) {
            if (!(this instanceof StreamCipher)) {
                return new StreamCipher(mode, key, iv);
            }
            Transform.call(this);
            this._cipher = new aes.AES(key);
            this._prev = new Buffer(iv.length);
            this._cache = new Buffer("");
            this._secCache = new Buffer("");
            this._decrypt = decrypt;
            iv.copy(this._prev);
            this._mode = mode;
        }
        StreamCipher.prototype._transform = function(chunk, _, next) {
            next(null, this._mode.encrypt(this, chunk, this._decrypt));
        };
        StreamCipher.prototype._flush = function(next) {
            this._cipher.scrub();
            next();
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports) {
    exports.encrypt = function(self, block) {
        return self._cipher.encryptBlock(block);
    };
    exports.decrypt = function(self, block) {
        return self._cipher.decryptBlock(block);
    };
}, function(module, exports, __webpack_require__) {
    var xor = __webpack_require__(56);
    exports.encrypt = function(self, block) {
        var data = xor(block, self._prev);
        self._prev = self._cipher.encryptBlock(data);
        return self._prev;
    };
    exports.decrypt = function(self, block) {
        var pad = self._prev;
        self._prev = block;
        var out = self._cipher.decryptBlock(block);
        return xor(out, pad);
    };
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        module.exports = xor;
        function xor(a, b) {
            var len = Math.min(a.length, b.length);
            var out = new Buffer(len);
            var i = -1;
            while (++i < len) {
                out.writeUInt8(a[i] ^ b[i], i);
            }
            return out;
        }
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var xor = __webpack_require__(56);
        exports.encrypt = function(self, data, decrypt) {
            var out = new Buffer("");
            var len;
            while (data.length) {
                if (self._cache.length === 0) {
                    self._cache = self._cipher.encryptBlock(self._prev);
                    self._prev = new Buffer("");
                }
                if (self._cache.length <= data.length) {
                    len = self._cache.length;
                    out = Buffer.concat([ out, encryptStart(self, data.slice(0, len), decrypt) ]);
                    data = data.slice(len);
                } else {
                    out = Buffer.concat([ out, encryptStart(self, data, decrypt) ]);
                    break;
                }
            }
            return out;
        };
        function encryptStart(self, data, decrypt) {
            var len = data.length;
            var out = xor(data, self._cache);
            self._cache = self._cache.slice(len);
            self._prev = Buffer.concat([ self._prev, decrypt ? data : out ]);
            return out;
        }
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var xor = __webpack_require__(56);
        function getBlock(self) {
            self._prev = self._cipher.encryptBlock(self._prev);
            return self._prev;
        }
        exports.encrypt = function(self, chunk) {
            while (self._cache.length < chunk.length) {
                self._cache = Buffer.concat([ self._cache, getBlock(self) ]);
            }
            var pad = self._cache.slice(0, chunk.length);
            self._cache = self._cache.slice(chunk.length);
            return xor(chunk, pad);
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var xor = __webpack_require__(56);
        function getBlock(self) {
            var out = self._cipher.encryptBlock(self._prev);
            incr32(self._prev);
            return out;
        }
        exports.encrypt = function(self, chunk) {
            while (self._cache.length < chunk.length) {
                self._cache = Buffer.concat([ self._cache, getBlock(self) ]);
            }
            var pad = self._cache.slice(0, chunk.length);
            self._cache = self._cache.slice(chunk.length);
            return xor(chunk, pad);
        };
        function incr32(iv) {
            var len = iv.length;
            var item;
            while (len--) {
                item = iv.readUInt8(len);
                if (item === 255) {
                    iv.writeUInt8(0, len);
                } else {
                    item++;
                    iv.writeUInt8(item, len);
                    break;
                }
            }
        }
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    (function(Buffer) {
        var aes = __webpack_require__(27);
        var Transform = __webpack_require__(28);
        var inherits = __webpack_require__(31);
        var modes = __webpack_require__(51);
        var StreamCipher = __webpack_require__(53);
        var ebtk = __webpack_require__(52);
        inherits(Decipher, Transform);
        function Decipher(mode, key, iv) {
            if (!(this instanceof Decipher)) {
                return new Decipher(mode, key, iv);
            }
            Transform.call(this);
            this._cache = new Splitter();
            this._last = void 0;
            this._cipher = new aes.AES(key);
            this._prev = new Buffer(iv.length);
            iv.copy(this._prev);
            this._mode = mode;
        }
        Decipher.prototype._transform = function(data, _, next) {
            this._cache.add(data);
            var chunk;
            var thing;
            while (chunk = this._cache.get()) {
                thing = this._mode.decrypt(this, chunk);
                this.push(thing);
            }
            next();
        };
        Decipher.prototype._flush = function(next) {
            var chunk = this._cache.flush();
            if (!chunk) {
                return next;
            }
            this.push(unpad(this._mode.decrypt(this, chunk)));
            next();
        };
        function Splitter() {
            if (!(this instanceof Splitter)) {
                return new Splitter();
            }
            this.cache = new Buffer("");
        }
        Splitter.prototype.add = function(data) {
            this.cache = Buffer.concat([ this.cache, data ]);
        };
        Splitter.prototype.get = function() {
            if (this.cache.length > 16) {
                var out = this.cache.slice(0, 16);
                this.cache = this.cache.slice(16);
                return out;
            }
            return null;
        };
        Splitter.prototype.flush = function() {
            if (this.cache.length) {
                return this.cache;
            }
        };
        function unpad(last) {
            var padded = last[15];
            if (padded === 16) {
                return;
            }
            return last.slice(0, 16 - padded);
        }
        var modelist = {
            ECB: __webpack_require__(54),
            CBC: __webpack_require__(55),
            CFB: __webpack_require__(57),
            OFB: __webpack_require__(58),
            CTR: __webpack_require__(59)
        };
        module.exports = function(crypto) {
            function createDecipheriv(suite, password, iv) {
                var config = modes[suite];
                if (!config) {
                    throw new TypeError("invalid suite type");
                }
                if (typeof iv === "string") {
                    iv = new Buffer(iv);
                }
                if (typeof password === "string") {
                    password = new Buffer(password);
                }
                if (password.length !== config.key / 8) {
                    throw new TypeError("invalid key length " + password.length);
                }
                if (iv.length !== config.iv) {
                    throw new TypeError("invalid iv length " + iv.length);
                }
                if (config.type === "stream") {
                    return new StreamCipher(modelist[config.mode], password, iv, true);
                }
                return new Decipher(modelist[config.mode], password, iv);
            }
            function createDecipher(suite, password) {
                var config = modes[suite];
                if (!config) {
                    throw new TypeError("invalid suite type");
                }
                var keys = ebtk(crypto, password, config.key, config.iv);
                return createDecipheriv(suite, keys.key, keys.iv);
            }
            return {
                createDecipher: createDecipher,
                createDecipheriv: createDecipheriv
            };
        };
    }).call(exports, __webpack_require__(2).Buffer);
}, function(module, exports, __webpack_require__) {
    "use strict";
    var CryptoS3 = __webpack_require__(6);
    function calculateMD5Hash(file, successCB, errorCB) {
        if (successCB === void 0) {
            successCB = function(res) {
                return console.log(res);
            };
        }
        if (errorCB === void 0) {
            errorCB = function(err) {
                return console.log(err);
            };
        }
        resolveLocalFileSystemURL(file, gotFile, errorCB);
        function gotFile(entry) {
            md5chksum.file(entry, function(md5) {
                var hexArray = md5.replace(/\r|\n/g, "").replace(/([\da-fA-F]{2}) ?/g, "0x$1 ").replace(/ +$/, "").split(" ");
                var byteString = String.fromCharCode.apply(null, hexArray);
                var base64string = btoa(byteString);
                successCB(base64string);
            }, errorCB);
        }
    }
    exports.calculateMD5Hash = calculateMD5Hash;
}, function(module, exports) {
    "use strict";
    var GetMime = function() {
        function GetMime() {
            this.ext = {
                png: "image/png",
                jpg: "image/jpeg",
                jpeg: "image/jpeg",
                jpe: "image/jpeg",
                wav: "audio/x-wav",
                mpeg: "video/mpeg",
                mpe: "video/mpeg",
                mpg: "video/mpeg",
                amr: "application/octet-stream",
                mp3: "audio/mp3"
            };
            this.mime = {
                "image/png": "png",
                "image/jpeg": "jpg",
                "audio/x-wav": "wav",
                "video/mpeg": "mpeg ",
                "application/octet-stream": "amr",
                "audio/mp3": "mp3"
            };
        }
        GetMime.prototype.byExt = function(str) {
            var nameArr = str.split(".");
            var ext = nameArr[nameArr.length - 1];
            return this.ext[ext];
        };
        GetMime.prototype.byMime = function(mime) {
            return this.mime[mime];
        };
        return GetMime;
    }();
    exports.GetMime = GetMime;
} ]);