// provide any required polyfills here that will be used client-side
import "core-js/features/array/find-last";
import "core-js/stable/structured-clone";

if (!Array.prototype.at) {
  Array.prototype.at = function (n: number) {
    const len = this.length >>> 0;
    let i = Math.trunc(n) || 0;
    if (i < 0) i += len;
    return i < 0 || i >= len ? undefined : this[i];
  };
}

if (!String.prototype.at) {
  String.prototype.at = function (n: number) {
    const s = String(this);
    const len = s.length;
    let i = Math.trunc(n) || 0;
    if (i < 0) i += len;
    return i < 0 || i >= len ? undefined : s.charAt(i);
  };
}
