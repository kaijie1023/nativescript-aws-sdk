"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
var s3_common_1 = require("./s3-common");
var utils = require("@nativescript/core/utils");
var fs = require("@nativescript/core/file-system");
var S3 = exports.S3 = (function (_super) {
    __extends(S3, _super);
    function S3() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    S3.init = function (options) {
        if (!S3.Options) {
            S3.Options = options;
            var credentials = void 0;
            switch (options.type) {
                case s3_common_1.S3AuthTypes.static:
                    credentials = new com.amazonaws.auth.BasicAWSCredentials(S3.Options.accessKey, S3.Options.secretKey);
                    break;
                case s3_common_1.S3AuthTypes.session:
                    credentials = new com.amazonaws.auth.BasicSessionCredentials(S3.Options.accessKey, S3.Options.secretKey, S3.Options.sessionToken);
                    break;
                case s3_common_1.S3AuthTypes.cognito:
                    break;
                default:
                    throw new Error('Invalid S3AuthType');
            }
            S3.Client = new com.amazonaws.services.s3.AmazonS3Client(credentials);
            if (S3.Options.endPoint) {
                S3.Client.setEndpoint(S3.Options.endPoint);
            }
            S3.TransferUtility = new com.amazonaws.mobileconnectors.s3.transferutility.TransferUtility.builder()
                .s3Client(S3.Client)
                .context(utils.ad.getApplicationContext())
                .build();
        }
    };
    S3.prototype.createDownload = function (options) {
        var appRoot = fs.knownFolders.currentApp().path;
        var file;
        if (options.file && options.file.startsWith('~/')) {
            file = fs.File.fromPath(fs.path.join(appRoot, options.file.replace('~/', '')));
        }
        else if (options.file && options.file.startsWith('/')) {
            file = fs.File.fromPath(options.file);
        }
        else if (options.file && options.file.startsWith('file:')) {
            file = fs.File.fromPath(NSURL.URLWithString(options.file).path);
        }
        var fileDownload = S3.TransferUtility.download(options.bucketName, options.key, new java.io.File(file.path));
        S3.OperationsData.set(fileDownload.getId(), {
            status: s3_common_1.StatusCode.PENDING,
            path: file.path,
            completed: options.completed,
            progress: options.progress,
            bucketName: options.bucketName,
            key: options.key
        });
        fileDownload.setTransferListener(new com.amazonaws.mobileconnectors.s3.transferutility.TransferListener({
            onStateChanged: function (id, state) {
                switch (state) {
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.WAITING:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PAUSED:
                        if (S3.OperationsData.has(id)) {
                            var data = S3.OperationsData.get(id);
                            if (data) {
                                S3.OperationsData.set(id, Object.assign({}, data, {
                                    status: s3_common_1.StatusCode.PAUSED
                                }));
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.IN_PROGRESS:
                        if (S3.OperationsData.has(id)) {
                            var data = S3.OperationsData.get(id);
                            if (data) {
                                if (data.status && data.status !== s3_common_1.StatusCode.DOWNLOADING) {
                                    S3.OperationsData.set(id, Object.assign({}, data, {
                                        status: s3_common_1.StatusCode.DOWNLOADING
                                    }));
                                }
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.FAILED:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.RESUMED_WAITING:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.COMPLETED:
                        if (S3.OperationsData.has(id)) {
                            var currentData = S3.OperationsData.get(id);
                            if (currentData && currentData.completed) {
                                currentData.completed(null, {
                                    status: s3_common_1.StatusCode.COMPLETED, path: currentData.path
                                });
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.WAITING_FOR_NETWORK:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PART_COMPLETED:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_CANCEL:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_PAUSE:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_NETWORK_DISCONNECT:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.UNKNOWN:
                        break;
                }
            }, onProgressChanged: function (id, bytesCurrent, bytesTotal) {
                var p = Math.round(bytesCurrent / bytesTotal * 100);
                var current = p ? p : 0;
                if (S3.OperationsData.has(id)) {
                    var data = S3.OperationsData.get(id);
                    if (data) {
                        if (data.status && data.status !== s3_common_1.StatusCode.DOWNLOADING) {
                            S3.OperationsData.set(id, Object.assign({}, data, {
                                status: s3_common_1.StatusCode.DOWNLOADING
                            }));
                        }
                        if (data.progress) {
                            data.progress({
                                value: current, currentSize: bytesCurrent, totalSize: bytesCurrent, speed: 0
                            });
                        }
                    }
                }
            }, onError: function (id, ex) {
                if (S3.OperationsData.has(id)) {
                    var currentData = S3.OperationsData.get(id);
                    if (currentData && currentData.completed) {
                        currentData.completed({
                            status: s3_common_1.StatusCode.ERROR, message: ex.getMessage()
                        }, null);
                    }
                }
            }
        }));
        return fileDownload.getId();
    };
    S3.prototype.createUpload = function (options) {
        var appRoot = fs.knownFolders.currentApp().path;
        var file;
        if (options.file && options.file.startsWith('~/')) {
            file = fs.File.fromPath(fs.path.join(appRoot, options.file.replace('~/', '')));
        }
        else if (options.file && options.file.startsWith('/')) {
            file = fs.File.fromPath(options.file);
        }
        else if (options.file && options.file.startsWith('file:')) {
            file = fs.File.fromPath(NSURL.URLWithString(options.file).path);
        }
        var acl;
        switch (options.acl) {
            case 'private':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.Private;
                break;
            case 'public-read':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.PublicRead;
                break;
            case 'public-read-write':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.PublicReadWrite;
                break;
            case 'aws-exec-read':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.AwsExecRead;
                break;
            case 'authenticated-read':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.AuthenticatedRead;
                break;
            case 'bucket-owner-read':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.BucketOwnerRead;
                break;
            case 'bucket-owner-full-control':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.BucketOwnerFullControl;
                break;
            case 'log-delivery-write':
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.LogDeliveryWrite;
                break;
            default:
                acl = com.amazonaws.services.s3.model.CannedAccessControlList.Private;
                break;
        }
        var fileUpload = S3.TransferUtility.upload(options.bucketName, options.key, new java.io.File(file.path), acl);
        S3.OperationsData.set(fileUpload.getId(), {
            status: s3_common_1.StatusCode.PENDING,
            path: file.path,
            completed: options.completed,
            progress: options.progress,
            bucketName: options.bucketName,
            key: options.key,
            endPoint: ''
        });
        fileUpload.setTransferListener(new com.amazonaws.mobileconnectors.s3.transferutility.TransferListener({
            onStateChanged: function (id, state) {
                switch (state) {
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.WAITING:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PAUSED:
                        if (S3.OperationsData.has(id)) {
                            var data = S3.OperationsData.get(id);
                            if (data) {
                                S3.OperationsData.set(id, Object.assign({}, data, {
                                    status: s3_common_1.StatusCode.PAUSED
                                }));
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.IN_PROGRESS:
                        if (S3.OperationsData.has(id)) {
                            var data = S3.OperationsData.get(id);
                            if (data) {
                                if (data.status && data.status !== s3_common_1.StatusCode.DOWNLOADING) {
                                    S3.OperationsData.set(id, Object.assign({}, data, {
                                        status: s3_common_1.StatusCode.DOWNLOADING
                                    }));
                                }
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.FAILED:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.RESUMED_WAITING:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.COMPLETED:
                        if (S3.OperationsData.has(id)) {
                            var currentData = S3.OperationsData.get(id);
                            if (currentData && currentData.completed) {
                                currentData.completed(null, {
                                    status: s3_common_1.StatusCode.COMPLETED,
                                    path: S3.Client.getResourceUrl(currentData.bucketName, currentData.key)
                                });
                            }
                        }
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.WAITING_FOR_NETWORK:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PART_COMPLETED:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_CANCEL:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_PAUSE:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.PENDING_NETWORK_DISCONNECT:
                        break;
                    case com.amazonaws.mobileconnectors.s3.transferutility.TransferState.UNKNOWN:
                        break;
                }
            }, onProgressChanged: function (id, bytesCurrent, bytesTotal) {
                var current = Math.round(bytesCurrent / bytesTotal * 100);
                if (S3.OperationsData.has(id)) {
                    var data = S3.OperationsData.get(id);
                    if (data) {
                        if (data.status && data.status !== s3_common_1.StatusCode.DOWNLOADING) {
                            S3.OperationsData.set(id, Object.assign({}, data, {
                                status: s3_common_1.StatusCode.DOWNLOADING
                            }));
                        }
                        if (data.progress) {
                            data.progress({
                                value: current, currentSize: bytesCurrent, totalSize: bytesCurrent, speed: 0
                            });
                        }
                    }
                }
            }, onError: function (id, ex) {
                if (S3.OperationsData.has(id)) {
                    var currentData = S3.OperationsData.get(id);
                    if (currentData && currentData.completed) {
                        currentData.completed({
                            status: s3_common_1.StatusCode.ERROR, message: ex.getMessage()
                        }, null);
                    }
                }
            }
        }));
        return fileUpload.getId();
    };
    S3.prototype.resume = function (id) {
        if (id) {
            S3.TransferUtility.resume(id);
        }
    };
    S3.prototype.pause = function (id) {
        if (id) {
            S3.TransferUtility.pause(id);
        }
    };
    S3.prototype.cancel = function (id) {
        if (id) {
            S3.TransferUtility.cancel(id);
        }
    };
    S3.Operations = new Map();
    S3.OperationsData = new Map();
    return S3;
}(s3_common_1.S3Base));
//# sourceMappingURL=s3.android.js.map