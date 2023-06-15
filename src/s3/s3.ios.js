"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3 = void 0;
var s3_common_1 = require("./s3-common");
var fs = require("@nativescript/core/file-system");
var main_queue = dispatch_get_current_queue();
var S3 = exports.S3 = (function (_super) {
    __extends(S3, _super);
    function S3() {
        return _super !== null && _super.apply(this, arguments) || this;
    }
    S3.init = function (options) {
        if (!options)
            return;
        if (options && !options.type) {
            throw new Error('S3AuthType missing');
        }
        S3.Options = options;
        var credentialsProvider;
        var config;
        var credentialsRegion;
        var endPoint;
        if (!options.endPoint) {
            endPoint = AWSEndpoint.alloc().initWithURLString('https://s3.amazonaws.com');
        }
        else {
            endPoint = AWSEndpoint.alloc().initWithURLString(options.endPoint);
        }
        switch (options.type) {
            case s3_common_1.S3AuthTypes.static:
                credentialsProvider = AWSStaticCredentialsProvider.alloc().initWithAccessKeySecretKey(options.accessKey, options.secretKey);
                break;
            case s3_common_1.S3AuthTypes.session:
                credentialsProvider = AWSBasicSessionCredentialsProvider.alloc().initWithAccessKeySecretKeySessionToken(options.accessKey, options.secretKey, options.sessionToken);
                break;
            case s3_common_1.S3AuthTypes.cognito:
                break;
            default:
                throw new Error('Invalid S3AuthType');
        }
        var manager = AWSServiceManager || AWSServiceManager.defaultServiceManager;
        config = AWSServiceConfiguration.alloc().initWithRegionEndpointCredentialsProvider(S3.getRegion(options.region), endPoint, credentialsProvider);
        config.maxRetryCount = 5;
        config.timeoutIntervalForRequest = 30;
        manager.defaultServiceConfiguration = config;
    };
    S3.getRegion = function (r) {
        var serviceRegion;
        switch (r) {
            case s3_common_1.S3Regions.US_WEST_1:
                serviceRegion = AWSRegionType.USWest1;
                break;
            case s3_common_1.S3Regions.US_WEST_2:
                serviceRegion = AWSRegionType.USWest2;
                break;
            case s3_common_1.S3Regions.US_EAST_1:
                serviceRegion = AWSRegionType.USEast1;
                break;
            case s3_common_1.S3Regions.US_EAST_2:
                serviceRegion = AWSRegionType.USEast2;
                break;
            case s3_common_1.S3Regions.AP_SOUTH_1:
                serviceRegion = AWSRegionType.APSouth1;
                break;
            case s3_common_1.S3Regions.AP_NORTHEAST_1:
                serviceRegion = AWSRegionType.APNortheast1;
                break;
            case s3_common_1.S3Regions.AP_NORTHEAST_2:
                serviceRegion = AWSRegionType.APNortheast2;
                break;
            case s3_common_1.S3Regions.AP_NORTHEAST_3:
                serviceRegion = AWSRegionType.Unknown;
                break;
            case s3_common_1.S3Regions.AP_SOUTHEAST_1:
                serviceRegion = AWSRegionType.APSoutheast1;
                break;
            case s3_common_1.S3Regions.AP_SOUTHEAST_2:
                serviceRegion = AWSRegionType.APSoutheast2;
                break;
            case s3_common_1.S3Regions.CA_CENTRAL_1:
                serviceRegion = AWSRegionType.CACentral1;
                break;
            case s3_common_1.S3Regions.CN_NORTH_1:
                serviceRegion = AWSRegionType.CNNorth1;
                break;
            case s3_common_1.S3Regions.CN_NORTHWEST_1:
                serviceRegion = AWSRegionType.CNNorthWest1;
                break;
            case s3_common_1.S3Regions.EU_CENTRAL_1:
                serviceRegion = AWSRegionType.EUCentral1;
                break;
            case s3_common_1.S3Regions.EU_WEST_1:
                serviceRegion = AWSRegionType.EUWest1;
                break;
            case s3_common_1.S3Regions.EU_WEST_2:
                serviceRegion = AWSRegionType.EUWest2;
                break;
            case s3_common_1.S3Regions.EU_WEST_3:
                serviceRegion = AWSRegionType.EUWest3;
                break;
            case s3_common_1.S3Regions.SA_EAST_1:
                serviceRegion = AWSRegionType.SAEast1;
                break;
            default:
                serviceRegion = AWSRegionType.USEast1;
                break;
        }
        return serviceRegion;
    };
    S3.prototype.createUpload = function (options) {
        var transferUtility = AWSS3TransferUtility || AWSS3TransferUtility.defaultS3TransferUtility;
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
        var nativeFile = NSURL.fileURLWithPath(file.path);
        var UTIRef = UTTypeCreatePreferredIdentifierForTag(kUTTagClassFilenameExtension, nativeFile.pathExtension, null);
        var UTI = UTIRef.takeUnretainedValue();
        var mimeType = options && options.mimeType ? options.mimeType : UTTypeCopyPreferredTagWithClass(UTI, kUTTagClassMIMEType);
        if (typeof mimeType !== 'string') {
            mimeType = mimeType.takeUnretainedValue();
        }
        if (!mimeType) {
            mimeType = 'application/octet-stream';
        }
        var expression = AWSS3TransferUtilityUploadExpression.new();
        if (options.acl) {
            expression.setValueForRequestHeader(options.acl, 'x-amz-acl');
        }
        expression.progressBlock = function (task, progress) {
            var sessionTask = task.sessionTask;
            dispatch_async(main_queue, function () {
                if (sessionTask.state === 0) {
                    var current = Math.floor(Math.round(progress.fractionCompleted * 100));
                    if (S3.Operations.has(task.taskIdentifier)) {
                        var data = S3.OperationsData.get(task.taskIdentifier);
                        if (data) {
                            if (data.status && data.status !== s3_common_1.StatusCode.UPLOADING) {
                                S3.OperationsData.set(task.taskIdentifier, Object.assign({}, data, {
                                    status: s3_common_1.StatusCode.UPLOADING
                                }));
                            }
                            if (data.progress) {
                                data.progress({
                                    value: current,
                                    currentSize: sessionTask.countOfBytesSent,
                                    totalSize: progress.totalUnitCount,
                                    speed: 0
                                });
                            }
                        }
                    }
                }
                else if (sessionTask.state === 1) {
                    if (S3.Operations.has(task.taskIdentifier)) {
                        var data = S3.OperationsData.get(task.taskIdentifier);
                        if (data) {
                            S3.OperationsData.set(id, Object.assign({}, data, {
                                status: s3_common_1.StatusCode.PAUSED
                            }));
                        }
                    }
                }
                else if (sessionTask.state === 2) {
                }
            });
        };
        var id;
        var uploadTask = transferUtility.uploadFileBucketKeyContentTypeExpressionCompletionHandler(NSURL.fileURLWithPath(file.path), options.bucketName, options.key, mimeType, expression, function (task, error) {
            if (error) {
                dispatch_async(main_queue, function () {
                    if (S3.OperationsData.has(task.taskIdentifier)) {
                        var currentData = S3.OperationsData.get(task.taskIdentifier);
                        if (currentData && currentData.completed) {
                            currentData.completed({
                                status: s3_common_1.StatusCode.ERROR, message: error.localizedDescription
                            }, null);
                        }
                    }
                });
                return null;
            }
            dispatch_async(main_queue, function () {
                if (S3.OperationsData.has(task.taskIdentifier)) {
                    var currentData = S3.OperationsData.get(task.taskIdentifier);
                    if (currentData && currentData.completed) {
                        currentData.completed(null, {
                            status: s3_common_1.StatusCode.COMPLETED, path: "".concat(currentData.endPoint, "/").concat(currentData.bucketName, "/").concat(currentData.key)
                        });
                    }
                }
            });
            return null;
        });
        uploadTask.continueWithBlock(function (awsTask) {
            if (awsTask.error) {
                console.log(awsTask.error.localizedDescription);
                return null;
            }
            if (awsTask.result) {
                id = awsTask.result.taskIdentifier;
                S3.Operations.set(id, awsTask.result);
            }
            return null;
        });
        var manager = AWSServiceManager || AWSServiceManager.defaultServiceManager;
        S3.OperationsData.set(id, {
            status: s3_common_1.StatusCode.PENDING,
            path: file.path,
            completed: options.completed,
            progress: options.progress,
            bucketName: options.bucketName,
            key: options.key,
            endPoint: manager.defaultServiceConfiguration.endpoint.URL.absoluteString
        });
        return id;
    };
    S3.prototype.createDownload = function (options) {
        var transferUtility = AWSS3TransferUtility || AWSS3TransferUtility.defaultS3TransferUtility;
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
        var nativeFile = NSURL.URLWithString("file://".concat(file.path));
        var expression = AWSS3TransferUtilityUploadExpression.new();
        expression.progressBlock = function (task, progress) {
            var sessionTask = task.sessionTask;
            dispatch_async(main_queue, function () {
                if (sessionTask.state === 0) {
                    var current = Math.floor(Math.round(progress.fractionCompleted * 100));
                    if (S3.Operations.has(task.taskIdentifier)) {
                        var data = S3.OperationsData.get(task.taskIdentifier);
                        if (data) {
                            if (data.status && data.status !== s3_common_1.StatusCode.DOWNLOADING) {
                                S3.OperationsData.set(task.taskIdentifier, Object.assign({}, data, {
                                    status: s3_common_1.StatusCode.DOWNLOADING
                                }));
                            }
                            if (data.progress) {
                                data.progress({
                                    value: current,
                                    currentSize: sessionTask.countOfBytesReceived,
                                    totalSize: progress.totalUnitCount,
                                    speed: 0
                                });
                            }
                        }
                    }
                }
                else if (sessionTask.state === 1) {
                    if (S3.Operations.has(task.taskIdentifier)) {
                        var data = S3.OperationsData.get(task.taskIdentifier);
                        if (data) {
                            S3.OperationsData.set(id, Object.assign({}, data, {
                                status: s3_common_1.StatusCode.PAUSED
                            }));
                        }
                    }
                }
                else if (sessionTask.state === 2) {
                }
            });
        };
        var id;
        var downloadTask = transferUtility.downloadToURLBucketKeyExpressionCompletionHandler(null, options.bucketName, options.key, expression, function (task, _file, _fileData, error) {
            if (error) {
                dispatch_async(main_queue, function () {
                    if (S3.OperationsData.has(task.taskIdentifier)) {
                        var currentData = S3.OperationsData.get(task.taskIdentifier);
                        if (currentData && currentData.completed) {
                            currentData.completed({
                                status: s3_common_1.StatusCode.ERROR, message: error.localizedDescription
                            }, null);
                        }
                    }
                });
                return null;
            }
            var f = _fileData.writeToURLAtomically(nativeFile, true);
            dispatch_async(main_queue, function () {
                var current = Math.floor(Math.round(task.progress.fractionCompleted * 100));
                if (S3.OperationsData.has(task.taskIdentifier)) {
                    var currentData = S3.OperationsData.get(task.taskIdentifier);
                    if (currentData.progress) {
                        currentData.progress({
                            value: current,
                            currentSize: task.sessionTask.countOfBytesReceived,
                            totalSize: task.progress.totalUnitCount,
                            speed: 0
                        });
                    }
                    if (currentData && currentData.completed) {
                        if (f) {
                            currentData.completed(null, {
                                status: s3_common_1.StatusCode.COMPLETED, path: nativeFile.path
                            });
                        }
                    }
                }
            });
            return null;
        });
        downloadTask.continueWithBlock(function (awsTask) {
            if (awsTask.error) {
                var error_1 = awsTask.error;
                dispatch_async(main_queue, function () {
                    var _id = awsTask.result ? awsTask.result.taskIdentifier : id;
                    if (S3.OperationsData.has(_id)) {
                        var currentData = S3.OperationsData.get(_id);
                        if (currentData && currentData.completed) {
                            currentData.completed({
                                status: s3_common_1.StatusCode.ERROR, message: error_1.localizedDescription
                            }, null);
                        }
                    }
                });
                return null;
            }
            if (awsTask.result) {
                id = awsTask.result.taskIdentifier;
                S3.Operations.set(id, awsTask.result);
            }
            return null;
        });
        S3.OperationsData.set(id, {
            status: s3_common_1.StatusCode.PENDING,
            path: file.path,
            completed: options.completed,
            progress: options.progress,
            bucketName: options.bucketName,
            key: options.key
        });
        return id;
    };
    S3.prototype.resume = function (id) {
        if (id && S3.Operations.has(id)) {
            var task = S3.Operations.get(id);
            task.resume();
        }
    };
    S3.prototype.pause = function (id) {
        if (id && S3.Operations.has(id)) {
            var task = S3.Operations.get(id);
            task.suspend();
        }
    };
    S3.prototype.cancel = function (id) {
        if (id && S3.Operations.has(id)) {
            var task = S3.Operations.get(id);
            task.cancel();
        }
    };
    S3.Operations = new Map();
    S3.OperationsData = new Map();
    return S3;
}(s3_common_1.S3Base));
//# sourceMappingURL=s3.ios.js.map