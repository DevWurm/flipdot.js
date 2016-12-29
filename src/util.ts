export function groupArray<T>(arr: Array<T>, groupLength: number): Array<Array<T>> {
  return arr.reduce((acc, curr) => {
    if (acc[acc.length - 1].length >= groupLength) return acc.concat([[curr]]);

    // return an array which consists of the init of the acc and the last element of acc concatenated with curr
    return acc.slice(0, acc.length - 1).concat([acc[acc.length - 1].concat(curr)]);
  }, [[]]);
}

export function sum(arr: number[]): number {
  return arr.reduce((acc, curr) => acc + curr, 0);
}

export function promisify(func: Function, ...args: any[]): Promise<any> {
 return new Promise((resolve, reject) => {
   func(...args, (err, data) => {
     if (err) return reject(err);
     resolve(data);
   });
 });
}