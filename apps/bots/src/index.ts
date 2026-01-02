// import { Glob } from 'bun';
// // scan Files
// const scanner = new Glob('*.ts');
// const modulesPath: string[] = [];
// for await (const f of scanner.scan('/src/functions')) {
//   modulesPath.push(f);
// }

// // import all modules
// const moduleFunctions = await Promise.all(
//   modulesPath.map(async (modulePath) => {
//     const module = await import(modulePath);
//     return module.default;
//   }),
// );

// const intervals: NodeJS.Timeout[] = [];

// for (const getBotFn of moduleFunctions) {
//   const { interval, fn } = getBotFn();
//   if (!Number(interval) || isNaN(Number(interval)) || !fn) continue;
//   if (typeof fn !== 'function') continue;
//   const intervalId = setInterval(async () => {
//     try {
//       await fn();
//     } catch (error) {
//       console.error('Error executing bot function:', error);
//     }
//   }, interval);
//   intervals.push(intervalId);
// }

// process.on('SIGINT', async () => {
//   console.log('Gracefully shutting down bots...');
//   for (const intervalId of intervals) {
//     clearInterval(intervalId);
//   }
//   process.exit();
// });
