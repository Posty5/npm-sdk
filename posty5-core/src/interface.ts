export interface IResponse<T> {

    message: string;
    isSuccess?: boolean;
    noMoreOfResult?: boolean;
    result?: T;
    exeption?: any;
}