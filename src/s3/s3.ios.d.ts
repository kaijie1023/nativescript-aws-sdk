import { S3AuthOptions, S3Base, S3DownloadOptions, S3UploadOptions } from './s3-common';
export declare class S3 extends S3Base {
    private static Options;
    private static Operations;
    private static OperationsData;
    static init(options: S3AuthOptions): void;
    private static getRegion;
    createUpload(options: S3UploadOptions): number;
    createDownload(options: S3DownloadOptions): number;
    resume(id: number): void;
    pause(id: number): void;
    cancel(id: number): void;
}
