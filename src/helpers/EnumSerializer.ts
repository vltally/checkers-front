// export function serializeEnum<T>(enumType: T, value: T[keyof T]): string {
//     return enumType[value as keyof T];
// }

export function deserializeEnum<T>(enumType: T, value: keyof T): T[keyof T] {
  return enumType[value];
}
