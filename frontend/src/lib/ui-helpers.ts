/**
 * Helpers for base-ui component type compatibility.
 * base-ui Select gives onValueChange(value: string | null)
 * base-ui Slider gives onValueChange(value: number | readonly number[])
 */

/** Wraps a string setter to handle null from base-ui Select */
export function selectHandler(setter: (v: string) => void) {
  return (value: string | null) => {
    if (value !== null) setter(value);
  };
}

/** Extracts first number from base-ui Slider onValueChange */
export function sliderHandler(setter: (v: number) => void) {
  return (value: number | readonly number[]) => {
    const n = Array.isArray(value) ? value[0] : value;
    setter(n);
  };
}
