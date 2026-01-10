export interface IResponse<T> {
    responseType: number;
    message: string;
    isSuccess?: boolean;
    noMoreOfResult?: boolean;
    result?: T;
    exeption?: any;
}