"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.S3Regions = exports.S3AuthTypes = exports.StatusCode = exports.generateId = exports.S3Base = void 0;
var S3Base = (function () {
    function S3Base() {
    }
    return S3Base;
}());
exports.S3Base = S3Base;
function generateId() {
    return 'xxxxxxxx-xxxx-xxxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = (Math.random() * 16) | 0, v = c === 'x' ? r : (r & 0x3) | 0x8;
        return v.toString(16);
    });
}
exports.generateId = generateId;
var StatusCode;
(function (StatusCode) {
    StatusCode["PENDING"] = "pending";
    StatusCode["PAUSED"] = "paused";
    StatusCode["DOWNLOADING"] = "downloading";
    StatusCode["UPLOADING"] = "uploading";
    StatusCode["COMPLETED"] = "completed";
    StatusCode["ERROR"] = "error";
})(StatusCode = exports.StatusCode || (exports.StatusCode = {}));
var S3AuthTypes;
(function (S3AuthTypes) {
    S3AuthTypes["static"] = "static";
    S3AuthTypes["cognito"] = "cognito";
    S3AuthTypes["session"] = "session";
})(S3AuthTypes = exports.S3AuthTypes || (exports.S3AuthTypes = {}));
var S3Regions;
(function (S3Regions) {
    S3Regions["US_EAST_1"] = "us-east-1";
    S3Regions["US_EAST_2"] = "us-east-2";
    S3Regions["US_WEST_1"] = "us-west-1";
    S3Regions["US_WEST_2"] = "us-west-2";
    S3Regions["AP_SOUTH_1"] = "ap-south-1";
    S3Regions["AP_NORTHEAST_1"] = "ap-northeast-1";
    S3Regions["AP_NORTHEAST_2"] = "ap-northeast-2";
    S3Regions["AP_NORTHEAST_3"] = "ap-northeast-3";
    S3Regions["AP_SOUTHEAST_1"] = "ap-southeast-1";
    S3Regions["AP_SOUTHEAST_2"] = "ap-southeast-2";
    S3Regions["CA_CENTRAL_1"] = "ca-central-1";
    S3Regions["CN_NORTH_1"] = "cn-north-1";
    S3Regions["CN_NORTHWEST_1"] = "cn-northwest-1";
    S3Regions["EU_CENTRAL_1"] = "eu-central-1";
    S3Regions["EU_WEST_1"] = "eu-west-1";
    S3Regions["EU_WEST_2"] = "eu-west-2";
    S3Regions["EU_WEST_3"] = "eu-west-3";
    S3Regions["SA_EAST_1"] = "sa-east-1";
})(S3Regions = exports.S3Regions || (exports.S3Regions = {}));
//# sourceMappingURL=s3-common.js.map