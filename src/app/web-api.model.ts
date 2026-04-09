export type ErrorResponse = {
  message: string;
}

export type WebApiResponse<T> = {
  data: T | null;
  error?: ErrorResponse[];
};