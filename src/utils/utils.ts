export const createArguments = <T extends (...args: any[]) => any>(
  _: T,
  ...args: Parameters<T>
): Parameters<T> => {
  return args;
};
