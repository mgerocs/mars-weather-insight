export function debounce(func: () => void) {
  let timer: ReturnType<typeof setTimeout>;

  return function () {
    clearTimeout(timer);
    timer = setTimeout(() => {
      func();
    }, 500);
  };
}
